import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.mjs';

async function start(t, databasePath = ':memory:') {
  const instance = createApp({ databasePath, serveClient: false });
  const server = await new Promise(resolve => { const server = instance.app.listen(0, '127.0.0.1', () => resolve(server)); });
  let stopped = false;
  async function stop() {
    if (stopped) return;
    stopped = true;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    instance.close();
  }
  t.after(stop);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  return { request, stop, base };
}

test('carrega conteúdo inicial real sem expor o gabarito dos desafios', async t => {
  const { request } = await start(t);
  assert.deepEqual((await request('/health')).body, { status: 'ok', mode: 'demo' });
  const { body } = await request('/bootstrap');
  assert.equal(body.tracks.length, 3);
  assert.equal(body.tracks.flatMap(track => track.lessons).length, 8);
  assert.equal(body.challenges.length, 3);
  assert.equal(body.xp, 0);
  assert.equal('answer' in body.challenges[0], false);
  assert.equal('explanation' in body.challenges[0], false);
  assert.match(body.tracks[0].lessons[0].code, /<main>/);
});

test('conclusão de aulas é idempotente e rejeita IDs desconhecidos', async t => {
  const { request } = await start(t);
  assert.equal((await request('/lessons/web-1/complete', 'POST')).status, 200);
  assert.equal((await request('/lessons/web-1/complete', 'POST')).status, 200);
  const { body } = await request('/bootstrap');
  assert.deepEqual(body.completed, ['web-1']);
  assert.equal(body.xp, 30);
  assert.equal((await request('/lessons/unknown/complete', 'POST')).status, 404);
});

test('desafios são corrigidos no servidor, sem XP para erro ou duplicação por repetição', async t => {
  const { request } = await start(t);
  const wrong = await request('/challenges/semantic/answer', 'POST', { answer: 0 });
  assert.equal(wrong.body.correct, false);
  assert.equal((await request('/bootstrap')).body.xp, 0);
  const right = await request('/challenges/semantic/answer', 'POST', { answer: 1 });
  assert.equal(right.body.correct, true);
  assert.match(right.body.explanation, /teclado/);
  await request('/challenges/semantic/answer', 'POST', { answer: 1 });
  const { body } = await request('/bootstrap');
  assert.equal(body.xp, 60);
  assert.deepEqual(body.solved, ['semantic']);
  for (const answer of [-1, 4, '1', null, 1.5]) assert.equal((await request('/challenges/semantic/answer', 'POST', { answer })).status, 400);
  assert.equal((await request('/challenges/unknown/answer', 'POST', { answer: 0 })).status, 404);
});

test('perfil valida dados e URLs antes de salvar', async t => {
  const { request } = await start(t);
  const profile = { name: 'Maria Dev', headline: 'Estudante de front-end', bio: 'Construindo meu primeiro site.', github: 'https://github.com/example', skills: 'HTML, CSS, HTML' };
  assert.equal((await request('/profile', 'PUT', profile)).status, 200);
  const saved = (await request('/bootstrap')).body.profile;
  assert.equal(saved.name, 'Maria Dev');
  assert.deepEqual(saved.skills, ['HTML', 'CSS']);
  for (const github of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.com']) assert.equal((await request('/profile', 'PUT', { ...profile, github })).status, 400);
  assert.equal((await request('/profile', 'PUT', { ...profile, name: ' ' })).status, 400);
  assert.equal((await request('/bootstrap')).body.profile.github, profile.github);
});

test('projetos podem ser criados e removidos com validação de link', async t => {
  const { request } = await start(t);
  const project = { title: 'Página pessoal', description: 'Minha apresentação com HTML.', url: 'https://example.com/projeto', technologies: 'HTML, CSS' };
  assert.equal((await request('/projects', 'POST', { ...project, url: 'javascript:alert(1)' })).status, 400);
  const created = await request('/projects', 'POST', project);
  assert.equal(created.status, 201);
  assert.equal((await request('/bootstrap')).body.projects[0].title, project.title);
  assert.equal((await request(`/projects/${created.body.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/projects/${created.body.id}`, 'DELETE')).status, 404);
  assert.equal((await request('/bootstrap')).body.projects.length, 0);
});

test('publicações usam o perfil local e curtidas não acumulam artificialmente', async t => {
  const { request } = await start(t);
  assert.equal((await request('/posts', 'POST', { body: 'oi', tag: 'Projeto' })).status, 400);
  assert.equal((await request('/posts', 'POST', { body: 'Meu primeiro projeto!', tag: 'spam' })).status, 400);
  const post = await request('/posts', 'POST', { body: 'Aprendi a usar elementos semânticos.', tag: 'Aprendizado', author: 'Outra pessoa' });
  assert.equal(post.status, 201);
  await request(`/posts/${post.body.id}/like`, 'PUT', { liked: true });
  await request(`/posts/${post.body.id}/like`, 'PUT', { liked: true });
  const saved = (await request('/bootstrap')).body.posts.find(item => item.id === post.body.id);
  assert.equal(saved.author, 'Dev');
  assert.equal(saved.liked, true);
  assert.equal(saved.seed, false);
  assert.equal((await request('/posts/missing/like', 'PUT', { liked: true })).status, 404);
});

test('oportunidades podem ser salvas e removidas, com IDs e estados validados', async t => {
  const { request } = await start(t);
  assert.equal((await request('/jobs/job-1/save', 'PUT', { saved: 'yes' })).status, 400);
  assert.equal((await request('/jobs/missing/save', 'PUT', { saved: true })).status, 404);
  await request('/jobs/job-1/save', 'PUT', { saved: true });
  await request('/jobs/job-1/save', 'PUT', { saved: true });
  assert.deepEqual((await request('/bootstrap')).body.savedJobs, ['job-1']);
  await request('/jobs/job-1/save', 'PUT', { saved: false });
  assert.deepEqual((await request('/bootstrap')).body.savedJobs, []);
});

test('SQLite preserva progresso, desafios, perfil, projetos e publicações após reiniciar', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'educadev-persistence-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const databasePath = join(directory, 'test.sqlite');
  const first = await start(t, databasePath);
  await first.request('/lessons/logic-1/complete', 'POST');
  await first.request('/challenges/logic-sum/answer', 'POST', { answer: 2 });
  await first.request('/profile', 'PUT', { name: 'Ana', headline: '', bio: '', github: '', skills: 'Git' });
  await first.request('/projects', 'POST', { title: 'Meu projeto', description: 'Um projeto de prática', url: 'https://example.com', technologies: 'HTML' });
  await first.request('/posts', 'POST', { body: 'Hoje eu aprendi a versionar código.', tag: 'Aprendizado' });
  await first.request('/jobs/job-1/save', 'PUT', { saved: true });
  await first.stop();
  const second = await start(t, databasePath);
  const { body } = await second.request('/bootstrap');
  assert.deepEqual(body.completed, ['logic-1']);
  assert.deepEqual(body.solved, ['logic-sum']);
  assert.equal(body.xp, 90);
  assert.equal(body.profile.name, 'Ana');
  assert.equal(body.projects.length, 1);
  assert.equal(body.posts.length, 3);
  assert.deepEqual(body.savedJobs, ['job-1']);
  await second.stop();
});

test('erros de rota e JSON inválido retornam respostas de API consistentes', async t => {
  const { request, base } = await start(t);
  assert.equal((await request('/not-found')).status, 404);
  assert.equal((await request('/profile', 'PUT')).status, 400);
  assert.equal((await request('/challenges/semantic/answer', 'POST')).status, 400);
  const malformed = await fetch(`${base}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'JSON inválido.' });
});
