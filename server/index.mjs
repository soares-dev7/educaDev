import { createApp } from './app.mjs';

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
const { app, close } = createApp({ databasePath: process.env.DATABASE_PATH });
const server = app.listen(port, host, () => console.log(`educaDev · API disponível na porta ${port} · modo demonstração`));
function stop() { server.close(() => { close(); process.exit(0); }); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
