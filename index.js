const LavalinkStatsApp = require('./app');

async function main() {
  try {
    const app = new LavalinkStatsApp();
    global.app = app;
    
    await app.initialize();
    app.start();
    
    console.log('Lavalink Stats Application is running...');
    console.log('Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

// Start the application
main();