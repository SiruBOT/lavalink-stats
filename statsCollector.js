const axios = require('axios');
const config = require('./config');

class StatsCollector {
  constructor() {
    this.requestTimeout = config.requestTimeout;
  }

  /**
   * Fetches stats from a single Lavalink host
   * @param {string} host - Host in format "host:port"
   * @param {string} password - Authentication password
   * @returns {Promise<Object>} Stats object
   */
  async fetchStats(host, password) {
    try {
      const url = `http://${host}/v3/stats`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': password
        },
        timeout: this.requestTimeout
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching stats from ${host}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetches stats from all configured hosts
   * @returns {Promise<Array>} Array of {host, stats, error} objects
   */
  async fetchAllStats() {
    const results = [];

    for (const [host, password, name] of config.hosts) {
      try {
        console.log(`Fetching stats from ${host}...`);
        const stats = await this.fetchStats(host, password);
        results.push({
          host,
          name,
          stats,
          error: null
        });
        console.log(`✓ Successfully fetched stats from ${host}`);
      } catch (error) {
        results.push({
          host,
          name,
          stats: null,
          error: error.message
        });
        console.log(`✗ Failed to fetch stats from ${host}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Validates the stats object structure
   * @param {Object} stats - Stats object to validate
   * @returns {boolean} True if valid
   */
  validateStats(stats) {
    return stats &&
           typeof stats.players === 'number' &&
           typeof stats.playingPlayers === 'number' &&
           typeof stats.uptime === 'number' &&
           stats.memory &&
           typeof stats.memory.free === 'number' &&
           typeof stats.memory.used === 'number' &&
           typeof stats.memory.allocated === 'number' &&
           typeof stats.memory.reservable === 'number' &&
           stats.cpu &&
           typeof stats.cpu.cores === 'number' &&
           typeof stats.cpu.systemLoad === 'number' &&
           typeof stats.cpu.lavalinkLoad === 'number';
  }
}

module.exports = StatsCollector;