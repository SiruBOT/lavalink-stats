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
  // Lavalink hosts configuration: [host:port, password]
  hosts: [
    ["10.0.0.201:2333", "youshallnotpass"],
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
npm start
```

The application will:
1. Initialize the SQLite database and create necessary tables
2. Begin collecting stats from configured Lavalink servers every minute
3. Store the collected data in the database
4. Continue running until stopped with Ctrl+C

## Database Schema

The application creates a `lavalink_stats` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-increment) |
| host | TEXT | Lavalink host address |
| timestamp | DATETIME | When the stats were collected |
| players | INTEGER | Total number of players |
| playing_players | INTEGER | Number of currently playing players |
| uptime | INTEGER | Server uptime in milliseconds |
| memory_free | INTEGER | Free memory in bytes |
| memory_used | INTEGER | Used memory in bytes |
| memory_allocated | INTEGER | Allocated memory in bytes |
| memory_reservable | INTEGER | Reservable memory in bytes |
| cpu_cores | INTEGER | Number of CPU cores |
| cpu_system_load | REAL | System CPU load (0.0-1.0) |
| cpu_lavalink_load | REAL | Lavalink CPU load (0.0-1.0) |

## API Response Format

The application expects Lavalink stats to be returned in the following format:

```json
{
    "players": 10,
    "playingPlayers": 8,
    "uptime": 201989379,
    "memory": {
        "free": 31083912,
        "used": 130396792,
        "allocated": 161480704,
        "reservable": 520093696
    },
    "cpu": {
        "cores": 2,
        "systemLoad": 0.12895927601809956,
        "lavalinkLoad": 0.6443410570969799
    }
}
```

## Error Handling

- Network errors are logged and the application continues running
- Invalid response formats are detected and logged
- Database errors are handled gracefully
- The application supports graceful shutdown on SIGINT/SIGTERM

## License

MIT