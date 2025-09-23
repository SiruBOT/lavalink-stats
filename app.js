const Database = require('./database');
const StatsCollector = require('./statsCollector');
const config = require('./config');

class LavalinkStatsApp {
  constructor() {
    this.database = new Database();
    this.statsCollector = new StatsCollector();
    this.intervalId = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      console.log('Initializing Lavalink Stats Application...');
      await this.database.initialize();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error.message);
      throw error;
    }
  }

  async collectAndStore() {
    console.log('\n--- Starting stats collection cycle ---');
    console.log(new Date().toISOString());

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
          console.error(`Invalid stats format from ${result.host}`);
          errorCount++;
          continue;
        }

        try {
          await this.database.insertStats(result.host, result.stats);
          successCount++;
        } catch (dbError) {
          console.error(`Failed to store stats for ${result.host}:`, dbError.message);
          errorCount++;
        }
      }

      console.log(`Collection cycle completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      console.error('Error during collection cycle:', error.message);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('Application is already running');
      return;
    }

    console.log(`Starting stats collection every ${config.collectionInterval / 1000} seconds`);
    
    // Run initial collection
    this.collectAndStore();
    
    // Set up interval for subsequent collections
    this.intervalId = setInterval(() => {
      this.collectAndStore();
    }, config.collectionInterval);

    this.isRunning = true;
    console.log('Stats collection started');
  }

  stop() {
    if (!this.isRunning) {
      console.log('Application is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Stats collection stopped');
  }

  async shutdown() {
    console.log('Shutting down application...');
    this.stop();
    await this.database.close();
    console.log('Application shut down complete');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.app) {
    await global.app.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  if (global.app) {
    await global.app.shutdown();
  }
  process.exit(0);
});

module.exports = LavalinkStatsApp;