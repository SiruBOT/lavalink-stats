import { Logger } from 'tslog';

let singletonLogger: Logger<unknown> | null = null;

export function getLogger(name?: string): Logger<unknown> {
  if (!singletonLogger) {
    singletonLogger = new Logger({
      name: 'lavalink-stats',
      minLevel: process.env.NODE_ENV === 'production' ? 2 : 0,
      type: 'pretty',
      hideLogPositionForProduction: true,
    });
  }
  return name ? singletonLogger.getSubLogger({ name }) : singletonLogger;
}

export default getLogger;
