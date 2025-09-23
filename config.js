module.exports = {
  // Lavalink hosts configuration: [host:port, password]
  hosts: [
    ["10.0.0.201:2333", "youshallnotpass"],
  ],
  
  // Database configuration
  database: {
    path: "./lavalink_stats.db"
  },
  
  // Collection interval in milliseconds (1 minute = 60000ms)
  collectionInterval: 60000,
  
  // Request timeout in milliseconds
  requestTimeout: 10000
};