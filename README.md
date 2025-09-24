# lavalink-stats

A Node.js application that collects Lavalink server statistics and stores them in a SQLite database every minute.

## Features

- Fetches stats from multiple Lavalink servers
- Stores data in SQLite database with structured schema
- Configurable collection intervals
- Authentication support for Lavalink servers
- Error handling and logging
- Graceful shutdown handling

## Screenshot
![Image](/public/image.png)

## Prerequisites
- Node.js 20.x
- Yarn 4.x
- This application is only compatible with Lavalink 3.x (SiruBOT production using legacy Lavalink 3.x), in future support for Lavalink 4.x will be added


## Installation

1. Clone the repository:
```bash
git clone https://github.com/SiruBOT/lavalink-stats.git
cd lavalink-stats
```

2. Install dependencies:
```bash
yarn install
```

3. Build the application:

```bash
yarn build
```

4. Start the application:

```bash
yarn start
```


## Configuration
Edit the `.env` file to configure your Lavalink hosts:

```
# host:port:password[:name];host:port:password[:name]
LL_HOSTS=10.0.0.201:2333:youshallnotpass:KOR 1;10.0.0.202:2333:youshallnotpass:KOR 2;

# Collection interval
COLLECTION_INTERVAL_MS=60000

# Request timeout
REQUEST_TIMEOUT_MS=10000

# Database path
DB_PATH=/app/data/lavalink_stats.db

# Dashboard port
PORT=3000
```

## Usage

Start the application:

```bash
yarn build && yarn start
```