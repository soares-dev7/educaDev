import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { tracks, challenges, jobs, resources } from './content.mjs';

const lessonIds = new Set(tracks.flatMap(track => track.lessons.map(lesson => lesson.id)));
const jobIds = new Set(jobs.map(job => job.id));
function fail(status, message) { return Object.assign(new Error(message), { status }); }
function text(value, name, max, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw fail(400, `${name}: informe entre ${min} e ${max} caracteres.`);
  }
  return value.trim();
}
function url(value, name, required = false) {
  const input = text(value ?? '', name, 500, required ? 1 : 0);
  if (!input) return '';
  try {
    const parsed = new URL(input);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    return parsed.href;
  } catch { throw fail(400, `${name}: use um endereço http:// ou https:// válido, sem credenciais.`); }
}

export function createApp({ databasePath = resolve('.data/educadev.sqlite'), serveClient = true } = {}) {
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS progress (lesson_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS solved (challenge_id TEXT PRIMARY KEY, solved_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS saved_jobs (job_id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL, headline TEXT NOT NULL, bio TEXT NOT NULL, github TEXT NOT NULL, skills TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, url TEXT NOT NULL, technologies TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author TEXT NOT NULL, tag TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, liked INTEGER NOT NULL DEFAULT 0, seed INTEGER NOT NULL DEFAULT 0);
  `);
  db.prepare('INSERT OR IGNORE INTO profile VALUES (1, ?, ?, ?, ?, ?)').run('Dev', 'Construindo meu caminho em tecnologia', '', '', '[]');
  const seedPost = db.prepare('INSERT OR IGNORE INTO posts (id, author, tag, body, created_at, seed) VALUES (?, ?, ?, ?, ?, 1)');
  seedPost.run('welcome', 'Equipe educaDev', 'Boas-vindas', 'Seu primeiro projeto não precisa ser perfeito. Compartilhe o que está construindo, conte o que aprendeu e registre seu próximo passo. Este é um espaço de demonstração, com publicações salvas apenas neste ambiente.', '2026-01-01T12:00:00.000Z');
  seedPost.run('tip', 'Equipe educaDev', 'Dica de estudo', 'Uma ideia para começar: faça uma página de apresentação com HTML e CSS. Depois, adicione uma interação com JavaScript. Você encontra esse caminho na trilha de front-end!', '2026-01-02T12:00:00.000Z');

  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use('/api', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use(express.json({ limit: '20kb' }));
  app.get('/api/health', (_req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', mode: 'demo' });
  });
  app.get('/api/bootstrap', (_req, res) => {
    const profile = db.prepare('SELECT name, headline, bio, github, skills FROM profile WHERE id=1').get();
    const completed = db.prepare('SELECT lesson_id FROM progress ORDER BY completed_at').all().map(row => row.lesson_id);
    const solved = db.prepare('SELECT challenge_id FROM solved ORDER BY solved_at').all().map(row => row.challenge_id);
    res.json({
      mode: 'demo', tracks, challenges: challenges.map(({ answer, explanation, ...challenge }) => challenge), jobs, resources,
      completed, solved, xp: completed.length * 30 + solved.length * 60,
      savedJobs: db.prepare('SELECT job_id FROM saved_jobs').all().map(row => row.job_id),
      profile: { ...profile, skills: JSON.parse(profile.skills) },
      projects: db.prepare('SELECT * FROM projects ORDER BY rowid DESC').all().map(row => ({ ...row, technologies: JSON.parse(row.technologies) })),
      posts: db.prepare('SELECT * FROM posts ORDER BY seed ASC, created_at DESC').all().map(row => ({ ...row, liked: Boolean(row.liked), seed: Boolean(row.seed) })),
    });
  });
  app.post('/api/lessons/:id/complete', (req, res) => {
    if (!lessonIds.has(req.params.id)) throw fail(404, 'Aula não encontrada.');
    db.prepare('INSERT OR IGNORE INTO progress VALUES (?, ?)').run(req.params.id, new Date().toISOString());
    res.json({ completed: true });
  });
  app.post('/api/challenges/:id/answer', (req, res) => {
    const challenge = challenges.find(item => item.id === req.params.id);
    if (!challenge) throw fail(404, 'Desafio não encontrado.');
    if (!Number.isInteger(req.body?.answer) || req.body.answer < 0 || req.body.answer >= challenge.options.length) throw fail(400, 'Selecione uma das alternativas.');
    const correct = req.body.answer === challenge.answer;
    if (correct) db.prepare('INSERT OR IGNORE INTO solved VALUES (?, ?)').run(challenge.id, new Date().toISOString());
    res.json({ correct, explanation: correct ? challenge.explanation : 'Ainda não é essa. Releia o enunciado e tente outra alternativa. Você pode consultar as trilhas para revisar o conceito.' });
  });
  app.put('/api/profile', (req, res) => {
    const name = text(req.body?.name, 'Nome', 60);
    const headline = text(req.body?.headline, 'Título', 100, 0);
    const bio = text(req.body?.bio, 'Sobre você', 600, 0);
    const github = url(req.body?.github, 'GitHub');
    const skills = text(req.body?.skills, 'Tecnologias', 200, 0).split(',').map(item => item.trim()).filter(Boolean);
    if (skills.length > 12 || skills.some(skill => skill.length > 30)) throw fail(400, 'Use até 12 tecnologias, com até 30 caracteres cada.');
    db.prepare('UPDATE profile SET name=?, headline=?, bio=?, github=?, skills=? WHERE id=1').run(name, headline, bio, github, JSON.stringify([...new Set(skills)]));
    res.json({ saved: true });
  });
  app.post('/api/projects', (req, res) => {
    const title = text(req.body?.title, 'Título', 80);
    const description = text(req.body?.description, 'Descrição', 500);
    const projectUrl = url(req.body?.url, 'Link do projeto', true);
    const technologies = text(req.body?.technologies, 'Tecnologias', 150, 0).split(',').map(item => item.trim()).filter(Boolean);
    const id = randomUUID();
    db.prepare('INSERT INTO projects VALUES (?, ?, ?, ?, ?)').run(id, title, description, projectUrl, JSON.stringify(technologies));
    res.status(201).json({ id });
  });
  app.delete('/api/projects/:id', (req, res) => {
    const result = db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id);
    if (!result.changes) throw fail(404, 'Projeto não encontrado.');
    res.status(204).end();
  });
  app.put('/api/jobs/:id/save', (req, res) => {
    if (!jobIds.has(req.params.id)) throw fail(404, 'Oportunidade não encontrada.');
    if (typeof req.body?.saved !== 'boolean') throw fail(400, 'Informe se deseja salvar a oportunidade.');
    if (req.body.saved) db.prepare('INSERT OR IGNORE INTO saved_jobs VALUES (?)').run(req.params.id);
    else db.prepare('DELETE FROM saved_jobs WHERE job_id=?').run(req.params.id);
    res.json({ saved: req.body.saved });
  });
  app.post('/api/posts', (req, res) => {
    const body = text(req.body?.body, 'Publicação', 1000, 5);
    const tag = text(req.body?.tag, 'Categoria', 30);
    if (!['Dúvida', 'Projeto', 'Aprendizado'].includes(tag)) throw fail(400, 'Categoria inválida.');
    const { name } = db.prepare('SELECT name FROM profile WHERE id=1').get();
    const id = randomUUID();
    db.prepare('INSERT INTO posts (id, author, tag, body, created_at) VALUES (?, ?, ?, ?, ?)').run(id, name, tag, body, new Date().toISOString());
    res.status(201).json({ id });
  });
  app.put('/api/posts/:id/like', (req, res) => {
    if (typeof req.body?.liked !== 'boolean') throw fail(400, 'Informe se deseja curtir a publicação.');
    const result = db.prepare('UPDATE posts SET liked=? WHERE id=?').run(Number(req.body.liked), req.params.id);
    if (!result.changes) throw fail(404, 'Publicação não encontrada.');
    res.json({ liked: req.body.liked });
  });
  app.use('/api', (_req, _res, next) => next(fail(404, 'Rota não encontrada.')));
  if (serveClient) {
    const dist = resolve('dist');
    app.use(express.static(dist));
    app.get('/{*path}', (_req, res) => res.sendFile(resolve(dist, 'index.html')));
  }
  app.use((error, _req, res, _next) => {
    const status = error.type === 'entity.parse.failed' ? 400 : error.status ?? 500;
    if (status >= 500) console.error('Falha na API:', error.message);
    res.status(status).json({ error: status >= 500 ? 'Não foi possível concluir a operação. Tente novamente.' : error.type === 'entity.parse.failed' ? 'JSON inválido.' : error.message });
  });
  return { app, close: () => db.close() };
}
