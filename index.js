const LavalinkStatsApp = require('./app');
const { start: startWebServer } = require('./server');

async function main() {
  try {
    const app = new LavalinkStatsApp();
    global.app = app;
    
    await app.initialize();
    app.start();
    // 웹 서버 시작 (Fastify)
    await startWebServer();
    
    console.log('Lavalink Stats Application is running with Web Dashboard...');
    console.log('Press Ctrl+C to stop');
    
  } catch (error) {
    console.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

// Start the application
main();