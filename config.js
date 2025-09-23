module.exports = {
  // Lavalink hosts configuration: [host:port, password]
  hosts: [
    ["10.0.0.201:2333", "youshallnotpass"],
    ["10.0.0.202:2333", "youshallnotpass"],
    ["10.0.0.203:2333", "youshallnotpass"],
    ["10.0.0.204:2333", "youshallnotpass"],
    ["10.0.0.205:2333", "youshallnotpass"],
    ["10.0.0.206:2333", "youshallnotpass"],
    ["10.0.0.207:2333", "youshallnotpass"],
    ["10.0.0.208:2333", "youshallnotpass"]
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