import sqlite3pkg from 'sqlite3';
import { config } from './config';
import { LavalinkStats } from './types';
import getLogger from './logger';

const sqlite3 = sqlite3pkg.verbose();

export class Database {
  private db: sqlite3pkg.Database | null = null;
  private logger = getLogger('Database');

  async initialize(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(config.database.path, (err: Error | null) => {
        if (err) {
          this.logger.error(`Error opening database: ${(err as any).message}`);
          reject(err);
        } else {
          this.logger.info('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await new Promise<void>((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS lavalink_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          host TEXT NOT NULL,
          name TEXT,
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
        );

        CREATE TABLE IF NOT EXISTS lavalink_errors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          host TEXT NOT NULL,
          name TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          error TEXT
        );
      `;

      this.db!.run(createTableSQL, (err: Error | null) => {
        if (err) {
          this.logger.error(`Error creating table: ${(err as any).message}`);
          reject(err);
        } else {
          this.ensureColumnExists('lavalink_stats', 'name', 'TEXT')
            .then(() => {
              this.logger.info('Database tables created/updated successfully');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  }

  private async ensureColumnExists(tableName: string, columnName: string, columnType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await new Promise<void>((resolve, reject) => {
      const pragmaSql = `PRAGMA table_info(${tableName})`;
      this.db!.all(pragmaSql, (err: Error | null, rows: any[]) => {
        if (err) return reject(err);
        const exists = rows.some((row) => row.name === columnName);
        if (exists) return resolve();
        const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
        this.db!.run(alterSql, (alterErr: Error | null) => {
          if (alterErr) return reject(alterErr);
          resolve();
        });
      });
    });
  }

  async insertError(host: string, name: string, error: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const insertSQL = `
      INSERT INTO lavalink_errors (host, name, error) VALUES (?, ?, ?)
    `;
    const values = [host, name, error];
    return await new Promise<number>((resolve, reject) => {
      this.db!.run(insertSQL, values, function (this: sqlite3pkg.RunResult, err: Error | null) {
        if (err) {
          getLogger().error(`Error inserting error: ${(err as any).message}`);
          reject(err);
        } else {
          getLogger().info(`Error inserted for ${host} with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async getErrors(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = 'SELECT * FROM lavalink_errors ORDER BY timestamp DESC';
    return await new Promise<any[]>((resolve, reject) => {
      this.db!.all(sql, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async insertStats(host: string, name: string, stats: LavalinkStats): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');
    const insertSQL = `
      INSERT INTO lavalink_stats (
        host, name, players, playing_players, uptime,
        memory_free, memory_used, memory_allocated, memory_reservable,
        cpu_cores, cpu_system_load, cpu_lavalink_load
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      host,
      name,
      stats.players,
      stats.playingPlayers,
      stats.uptime,
      stats.memory.free,
      stats.memory.used,
      stats.memory.allocated,
      stats.memory.reservable,
      stats.cpu.cores,
      stats.cpu.systemLoad,
      stats.cpu.lavalinkLoad,
    ];

    return await new Promise<number>((resolve, reject) => {
      this.db!.run(insertSQL, values, function (this: sqlite3pkg.RunResult, err: Error | null) {
        if (err) {
          getLogger().error(`Error inserting stats: ${(err as any).message}`);
          reject(err);
        } else {
          getLogger().info(`Stats inserted for ${host} with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  async getLatestStats(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = `
      SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY host ORDER BY timestamp DESC) as rn
        FROM lavalink_stats
      ) WHERE rn = 1
      ORDER BY host
    `;
    return await new Promise<any[]>((resolve, reject) => {
      this.db!.all(sql, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getStatsHistory(host: string | null = null, hours: number = 24): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    let sql = `
      SELECT * FROM lavalink_stats 
      WHERE timestamp > datetime('now', '-${hours} hours')
    `;
    const params: any[] = [];
    if (host) {
      sql += ' AND host = ?';
      params.push(host);
    }
    sql += ' ORDER BY timestamp ASC';
    return await new Promise<any[]>((resolve, reject) => {
      this.db!.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getHosts(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');
    const sql = 'SELECT DISTINCT host FROM lavalink_stats ORDER BY host';
    return await new Promise<string[]>((resolve, reject) => {
      this.db!.all(sql, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows.map((row) => row.host));
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;
    await new Promise<void>((resolve) => {
      this.db!.close((err: Error | null) => {
        if (err) {
          this.logger.error(`Error closing database: ${(err as any).message}`);
        } else {
          this.logger.info('Database connection closed');
        }
        resolve();
      });
    });
  }
}

export default Database;


