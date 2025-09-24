import LavalinkStatsApp from './app';
import { start as startWebServer } from './server';
import getLogger from './logger';

const logger = getLogger('Main');

async function main() {
  try {
    const app = new LavalinkStatsApp();
    (global as any).app = app;

    await app.initialize();
    app.start();
    await startWebServer();

    logger.info('Lavalink Stats Application is running with Web Dashboard...');
    logger.info('Press Ctrl+C to stop');
  } catch (error: any) {
    logger.error(`Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

main();
