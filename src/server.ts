import Fastify from 'fastify';
import path from 'path';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Database from './database';
import getLogger from './logger';

// Disable Fastify internal logger; we'll log via tslog
const fastify = Fastify({ logger: false });
const database = new Database();
const logger = getLogger('Server');

export async function start() {
  try {
    await fastify.register(fastifyCors, { origin: true });
    await fastify.register(fastifyStatic, {
      root: path.join(process.cwd(), 'public'),
      prefix: '/',
    });

    // tslog request/response hooks
    fastify.addHook('onRequest', async (request) => {
      logger.trace(`${request.id}: ${request.method} ${request.url}`, 'incoming request');
    });

    fastify.addHook('onResponse', async (request, reply) => {
      logger.trace(`${request.id}: ${reply.statusCode} ${reply.elapsedTime}ms`, 'request completed');
    });

    fastify.setErrorHandler(async (error, request, reply) => {
      logger.trace(`${request.id}: ${request.method} ${request.url} - ${error.message}`, 'request error');
      reply.status(500).send({ success: false, error: 'Internal Server Error' });
    });

    await database.initialize();

    fastify.get('/api/stats/latest', async (_request, reply) => {
      try {
        const stats = await database.getLatestStats();
        return { success: true, data: stats };
      } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    fastify.get('/api/stats/history', async (request, reply) => {
      try {
        const { host, hours = 24 } = request.query as { host?: string; hours?: string | number };
        const stats = await database.getStatsHistory(host ?? null, parseInt(String(hours)));
        return { success: true, data: stats };
      } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    fastify.get('/api/hosts', async (_request, reply) => {
      try {
        const hosts = await database.getHosts();
        return { success: true, data: hosts };
      } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
      }
    });

    fastify.get('/api/health', async () => {
      return { success: true, status: 'OK', timestamp: new Date().toISOString() };
    });

    fastify.get('/', async (_request, reply) => {
      return reply.sendFile('index.html');
    });

    const port = Number(process.env.PORT ?? 3000);
    await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`🚀 Server is running on port ${port}`);
    logger.info(`🔗 Dashboard URL: http://localhost:${port}`);
  } catch (err) {
    logger.error(err as any, 'server start error');
    process.exit(1);
  }
}


const gracefulExit = async () => {
  logger.info('Gracefully shutting down server...');
  await database.close();
  await fastify.close();
  process.exit(0);
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

export { fastify, database };


