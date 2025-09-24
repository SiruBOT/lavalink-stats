export interface LavalinkMemoryStats {
  free: number;
  used: number;
  allocated: number;
  reservable: number;
}

export interface LavalinkCpuStats {
  cores: number;
  systemLoad: number;
  lavalinkLoad: number;
}

export interface LavalinkStats {
  players: number;
  playingPlayers: number;
  uptime: number;
  memory: LavalinkMemoryStats;
  cpu: LavalinkCpuStats;
}

export interface HostConfigItem {
  0: string; // host:port
  1: string; // password
  2: string; // name
}


