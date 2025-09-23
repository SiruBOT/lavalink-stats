module.exports = {
  // Lavalink hosts configuration: [host:port, password, name]
  hosts: [
    ["10.0.0.201:2333", "youshallnotpass", "Kor 1"],
    ["10.0.0.202:2333", "youshallnotpass", "Kor 2"],
    ["10.0.0.203:2333", "youshallnotpass", "Kor 3"],
    ["10.0.0.204:2333", "youshallnotpass", "Kor 4"],
    ["10.0.0.205:2333", "youshallnotpass", "Kor 5"],
    ["10.0.0.206:2333", "youshallnotpass", "Kor 6"],
    ["10.0.0.207:2333", "youshallnotpass", "Kor 7"],
    ["10.0.0.208:2333", "youshallnotpass", "Kor 8"]
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