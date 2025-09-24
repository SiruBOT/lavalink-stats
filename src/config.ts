function parseHosts(): [string, string, string][] {
  const raw = process.env.LL_HOSTS?.trim();
  if (!raw) {
    return [];
  }
  // Format: host:port:password[:name];host:port:password[:name]
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      const parts = item.split(':');
      if (parts.length < 3) throw new Error(`Invalid LL_HOSTS entry: ${item}`);
      const host = `${parts[0]}:${parts[1]}`;
      const password = parts[2];
      const name = parts[3] ?? host;
      return [host, password, name] as [string, string, string];
    });
}

export const config = {
  hosts: parseHosts(),
  database: {
    path: process.env.DB_PATH ?? './lavalink_stats.db',
  },
  collectionInterval: Number(process.env.COLLECTION_INTERVAL_MS ?? 60000),
  requestTimeout: Number(process.env.REQUEST_TIMEOUT_MS ?? 10000),
};

export type AppConfig = typeof config;


