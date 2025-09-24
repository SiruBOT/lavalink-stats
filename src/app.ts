import Database from './database';
import StatsCollector from './statsCollector';
import { config } from './config';
import getLogger from './logger';

export class LavalinkStatsApp {
  private database: Database;
  private statsCollector: StatsCollector;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private logger = getLogger('App');

  constructor() {
    this.database = new Database();
    this.statsCollector = new StatsCollector();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Lavalink Stats Application...');
    await this.database.initialize();
    this.logger.info('Application initialized successfully');
  }

  private async collectAndStore(): Promise<void> {
    this.logger.info('--- Starting stats collection cycle ---');
    this.logger.info(new Date().toISOString());

    try {
      const results = await this.statsCollector.fetchAllStats();

      let successCount = 0;
      let errorCount = 0;

      for (const result of results) {
        if (result.error) {
          errorCount++;
          continue;
        }

        if (!this.statsCollector.validateStats(result.stats)) {
          this.logger.error(`Invalid stats format from ${result.host}`);
          errorCount++;
          continue;
        }

        try {
          await this.database.insertStats(result.host, result.name, result.stats);
          successCount++;
        } catch (dbError: any) {
          this.logger.error(`Failed to store stats for ${result.host}: ${dbError.message}`);
          errorCount++;
        }
      }

      this.logger.info(`Collection cycle completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error: any) {
      this.logger.error(`Error during collection cycle: ${error.message}`);
    }
  }

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Application is already running');
      return;
    }

    this.logger.info(`Starting stats collection every ${config.collectionInterval / 1000} seconds`);

    this.collectAndStore();
    this.intervalId = setInterval(() => {
      void this.collectAndStore();
    }, config.collectionInterval);

    this.isRunning = true;
    this.logger.info('Stats collection started');
  }

  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Application is not running');
      return;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.logger.info('Stats collection stopped');
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');
    this.stop();
    await this.database.close();
    this.logger.info('Application shut down complete');
  }
}

export default LavalinkStatsApp;


