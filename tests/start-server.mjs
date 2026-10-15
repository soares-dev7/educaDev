import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/app.mjs';

const directory = mkdtempSync(join(tmpdir(), 'educadev-e2e-'));
const { app, close } = createApp({ databasePath: join(directory, 'test.sqlite') });
const server = app.listen(3101, '127.0.0.1');
function stop() { server.close(() => { close(); rmSync(directory, { recursive: true, force: true }); process.exit(0); }); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
