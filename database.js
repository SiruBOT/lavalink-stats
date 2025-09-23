const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS lavalink_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          host TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          players INTEGER,
          playing_players INTEGER,
          uptime INTEGER,
          memory_free INTEGER,
          memory_used INTEGER,
          memory_allocated INTEGER,
          memory_reservable INTEGER,
          cpu_cores INTEGER,
          cpu_system_load REAL,
          cpu_lavalink_load REAL
        )
      `;

      this.db.run(createTableSQL, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  async insertStats(host, stats) {
    return new Promise((resolve, reject) => {
      const insertSQL = `
        INSERT INTO lavalink_stats (
          host, players, playing_players, uptime,
          memory_free, memory_used, memory_allocated, memory_reservable,
          cpu_cores, cpu_system_load, cpu_lavalink_load
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        host,
        stats.players,
        stats.playingPlayers,
        stats.uptime,
        stats.memory.free,
        stats.memory.used,
        stats.memory.allocated,
        stats.memory.reservable,
        stats.cpu.cores,
        stats.cpu.systemLoad,
        stats.cpu.lavalinkLoad
      ];

      this.db.run(insertSQL, values, function(err) {
        if (err) {
          console.error('Error inserting stats:', err.message);
          reject(err);
        } else {
          console.log(`Stats inserted for ${host} with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;