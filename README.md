# lavalink-stats

A Node.js application that collects Lavalink server statistics and stores them in a SQLite database every minute.

## Features

- Fetches stats from multiple Lavalink servers
- Stores data in SQLite database with structured schema
- Configurable collection intervals
- Authentication support for Lavalink servers
- Error handling and logging
- Graceful shutdown handling

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SiruBOT/lavalink-stats.git
cd lavalink-stats
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Edit the `config.js` file to configure your Lavalink hosts:

```javascript
module.exports = {
  // Lavalink hosts configuration: [host:port, password, name]
  hosts: [
    ["10.0.0.201:2333", "youshallnotpass", "My awesome Lavalink server"],
    // Add more hosts as needed
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
```

## Usage

Start the application:

```bash
yarn build && yarn start
```

## License

WTFPL