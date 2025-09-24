import axios from 'axios';
import { config } from './config';
import { LavalinkStats } from './types';
import getLogger from './logger';

export class StatsCollector {
  private readonly requestTimeout: number;
  private logger = getLogger('StatsCollector');

  constructor() {
    this.requestTimeout = config.requestTimeout;
  }

  async fetchStats(host: string, password: string): Promise<LavalinkStats> {
    const url = `http://${host}/v3/stats`;
    const response = await axios.get(url, {
      headers: { Authorization: password },
      timeout: this.requestTimeout,
    });
    return response.data as LavalinkStats;
  }

  async fetchAllStats(): Promise<Array<{ host: string; name: string; stats: LavalinkStats | null; error: string | null }>> {
    const results: Array<{ host: string; name: string; stats: LavalinkStats | null; error: string | null }> = [];
    for (const [host, password, name] of config.hosts) {
      try {
        this.logger.info(`Fetching stats from ${host}...`);
        const stats = await this.fetchStats(host, password);
        results.push({ host, name, stats, error: null });
        this.logger.info(`✓ Successfully fetched stats from ${host}`);
      } catch (error: any) {
        results.push({ host, name, stats: null, error: error?.message ?? 'Unknown error' });
        this.logger.warn(`✗ Failed to fetch stats from ${host}: ${error?.message ?? 'Unknown error'}`);
      }
    }
    return results;
  }

  validateStats(stats: LavalinkStats | null): stats is LavalinkStats {
    return !!(
      stats &&
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
      typeof stats.cpu.lavalinkLoad === 'number'
    );
  }
}

export default StatsCollector;


