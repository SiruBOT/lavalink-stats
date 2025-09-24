class LavalinkDashboard {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.countdownInterval = null;
        this.autoRefreshEnabled = true;
        this.currentTimeRange = 24;
        this.refreshPeriodMs = 30000;
        this.remainingSeconds = Math.floor(this.refreshPeriodMs / 1000);
        this.TIMEZONE = 'Asia/Seoul';
        this.KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeCharts();
        this.setupResizeObservers();
        await this.loadData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // 자동 새로고침 토글
        const autoRefreshToggle = document.getElementById('autoRefresh');
        autoRefreshToggle.addEventListener('change', (e) => {
            this.autoRefreshEnabled = e.target.checked;
            if (this.autoRefreshEnabled) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });

        // 시간 범위 선택
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.currentTimeRange = parseInt(e.target.value);
            this.loadHistoryData();
        });
    }

    initializeCharts() {
        // 기존 차트가 있으면 파괴 후 재생성
        if (this.charts.players && typeof this.charts.players.destroy === 'function') {
            this.charts.players.destroy();
        }
        if (this.charts.cpu && typeof this.charts.cpu.destroy === 'function') {
            this.charts.cpu.destroy();
        }
        // 플레이어 차트 초기화
        const playersCtx = document.getElementById('playersChart').getContext('2d');
        this.charts.players = new Chart(playersCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '총 플레이어',
                        data: [],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '재생 중',
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    x: {
                        grid: {
                            color: '#e5e7eb'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                }
            }
        });

        // CPU 차트 초기화
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        this.charts.cpu = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '시스템 CPU (%)',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Lavalink CPU (%)',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: '#e5e7eb'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: '#e5e7eb'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    setupResizeObservers() {
        const debounce = (fn, delay = 100) => {
            let t = null;
            return (...args) => {
                if (t) clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), delay);
            };
        };

        const resizeAll = () => {
            const canvasWrap = document.getElementsByClassName('chart-canvas');
            if (this.charts.players && typeof this.charts.players.resize === 'function') {
                this.charts.players.resize(0,0);
                this.charts.players.resize(canvasWrap[0].clientWidth, canvasWrap[0].clientHeight);
            }
            if (this.charts.cpu && typeof this.charts.cpu.resize === 'function') {
                this.charts.cpu.resize(0,0);
                this.charts.cpu.resize(canvasWrap[1].clientWidth, canvasWrap[1].clientHeight);
            }
        };

        const debouncedResizeAll = debounce(resizeAll, 100);

        // Window resize fallback
        window.addEventListener('resize', debouncedResizeAll);

        // Observe chart containers for layout changes
        const playersCanvas = document.getElementById('playersChart');
        const cpuCanvas = document.getElementById('cpuChart');
        const targets = [playersCanvas?.parentElement, cpuCanvas?.parentElement].filter(Boolean);
        if (targets.length > 0 && 'ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                debouncedResizeAll();
            });
            targets.forEach(el => ro.observe(el));
            this._resizeObserver = ro;
        }
    }

    dispose() {
        this.stopAutoRefresh();
        if (this.charts) {
            Object.values(this.charts).forEach((chart) => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        }
        this.charts = {};
    }

    async loadData() {
        this.showLoading(true);
        
        try {
            await Promise.all([
                this.loadLatestStats(),
                this.loadHistoryData()
            ]);
            
            this.updateLastUpdatedTime();
        } catch (error) {
            console.error('데이터 로딩 중 오류 발생:', error);
            this.showError('데이터를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadLatestStats() {
        try {
            const response = await fetch('/api/stats/latest');
            const result = await response.json();
            
            if (result.success) {
                this.updateOverviewStats(result.data);
                this.updateServerCards(result.data);
            }
        } catch (error) {
            console.error('최신 통계 로딩 실패:', error);
        }
    }

    async loadHistoryData() {
        try {
            const response = await fetch(`/api/stats/history?hours=${this.currentTimeRange}`);
            const result = await response.json();
            
            if (result.success) {
                this.updateCharts(result.data);
            }
        } catch (error) {
            console.error('히스토리 데이터 로딩 실패:', error);
        }
    }

    updateOverviewStats(data) {
        const totalServers = data.length;
        const onlineServers = data.filter(server => server.players !== null).length;
        const totalPlayers = data.reduce((sum, server) => sum + (server.players || 0), 0);
        const playingPlayers = data.reduce((sum, server) => sum + (server.playing_players || 0), 0);
        
        // 평균 메모리 사용률 계산
        const memoryUsages = data
            .filter(server => server.memory_used && server.memory_allocated)
            .map(server => (server.memory_used / server.memory_allocated) * 100);
        
        const avgMemoryUsage = memoryUsages.length > 0 
            ? memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length 
            : 0;

        document.getElementById('totalServers').textContent = `${onlineServers}/${totalServers}`;
        document.getElementById('totalPlayers').textContent = totalPlayers.toLocaleString();
        document.getElementById('playingPlayers').textContent = playingPlayers.toLocaleString();
        document.getElementById('avgMemoryUsage').textContent = `${avgMemoryUsage.toFixed(1)}%`;
    }

    updateServerCards(data) {
        const serversGrid = document.getElementById('serversGrid');
        serversGrid.innerHTML = '';

        if (data.length === 0) {
            serversGrid.style.display = 'flex';
            serversGrid.style.justifyContent = 'center';
            serversGrid.style.alignItems = 'center';
            serversGrid.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 20px;">서버가 없습니다</div>';
            return;
        } else {
            serversGrid.style.display = 'grid';
            serversGrid.style.justifyContent = '';
            serversGrid.style.alignItems = '';
        }

        data.forEach(server => {
            const serverCard = this.createServerCard(server);
            serversGrid.appendChild(serverCard);
        });
    }

    createServerCard(server) {
        const isOnline = server.players !== null;
        const memoryUsagePercent = server.memory_used && server.memory_allocated 
            ? (server.memory_used / server.memory_allocated) * 100 
            : 0;
        
        const cpuSystemPercent = (server.cpu_system_load || 0) * 100;

        const card = document.createElement('div');
        card.className = `server-card ${isOnline ? 'online' : 'offline'}`;
        
        card.innerHTML = `
            <div class="server-header">
                <div class="server-name">${server.name || server.host}</div>
                <div class="server-status ${isOnline ? 'online' : 'offline'}">
                    ${isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
            </div>
            ${server.name ? `<div style="margin-top: -6px; color: #6b7280; font-size: 12px;">${server.host}</div>` : ''}
            
            ${isOnline ? `
                <div class="server-metrics">
                    <div class="metric">
                        <div class="metric-label">플레이어</div>
                        <div class="metric-number">${server.players || 0}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">재생 중</div>
                        <div class="metric-number">${server.playing_players || 0}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">메모리</div>
                        <div class="metric-number metric-small">${memoryUsagePercent.toFixed(1)}%</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">CPU</div>
                        <div class="metric-number metric-small">${cpuSystemPercent.toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill ${this.getProgressColor(memoryUsagePercent)}" 
                         style="width: ${memoryUsagePercent}%"></div>
                </div>
                
                <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                    업타임: ${this.formatUptime(server.uptime || 0)}
                </div>
            ` : `
                <div style="text-align: center; color: #6b7280; padding: 20px;">
                    서버에 연결할 수 없습니다
                </div>
            `}
        `;

        return card;
    }

    updateCharts(historyData) {
        // 시간별로 데이터 그룹화
        const groupedData = this.groupDataByTime(historyData);
        
        const labels = Object.keys(groupedData).sort();
        const playersData = labels.map(time => {
            const timeData = groupedData[time];
            return timeData.reduce((sum, item) => sum + (item.players || 0), 0);
        });
        
        const playingPlayersData = labels.map(time => {
            const timeData = groupedData[time];
            return timeData.reduce((sum, item) => sum + (item.playing_players || 0), 0);
        });

        const systemCpuData = labels.map(time => {
            const timeData = groupedData[time];
            const validData = timeData.filter(item => item.cpu_system_load !== null);
            if (validData.length === 0) return 0;
            const avg = validData.reduce((sum, item) => sum + (item.cpu_system_load || 0), 0) / validData.length;
            return avg * 100;
        });

        const lavalinkCpuData = labels.map(time => {
            const timeData = groupedData[time];
            const validData = timeData.filter(item => item.cpu_lavalink_load !== null);
            if (validData.length === 0) return 0;
            const avg = validData.reduce((sum, item) => sum + (item.cpu_lavalink_load || 0), 0) / validData.length;
            return avg * 100;
        });

        // 플레이어 차트 업데이트
        this.charts.players.data.labels = labels.map(time => this.formatChartTime(time));
        this.charts.players.data.datasets[0].data = playersData;
        this.charts.players.data.datasets[1].data = playingPlayersData;
        this.charts.players.options.scales.y.max = Math.ceil(Math.max(...playersData, ...playingPlayersData));
        this.charts.players.update('none');

        // CPU 차트 업데이트
        this.charts.cpu.data.labels = labels.map(time => this.formatChartTime(time));
        this.charts.cpu.data.datasets[0].data = systemCpuData;
        this.charts.cpu.data.datasets[1].data = lavalinkCpuData;
        this.charts.cpu.options.scales.y.max = Math.ceil(Math.max(...systemCpuData, ...lavalinkCpuData));
        this.charts.cpu.update('none');
    }

    groupDataByTime(data) {
        const grouped = {};
        
        data.forEach(item => {
            // 시간을 분 단위로 반올림
            const time = new Date(item.timestamp);
            time.setSeconds(0, 0);
            const kst = new Date(time.getTime() + this.KST_OFFSET_MS);
            const timeKey = kst.toISOString();
            
            if (!grouped[timeKey]) {
                grouped[timeKey] = [];
            }
            grouped[timeKey].push(item);
        });

        return grouped;
    }

    formatChartTime(timeString) {
        const date = new Date(timeString);
        if (this.currentTimeRange <= 24) {
            return date.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
            });
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}일 ${hours}시간`;
        } else if (hours > 0) {
            return `${hours}시간 ${minutes}분`;
        } else {
            return `${minutes}분`;
        }
    }

    getProgressColor(percentage) {
        if (percentage > 80) return 'danger';
        if (percentage > 60) return 'warning';
        return '';
    }

    updateLastUpdatedTime() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleString('ko-KR');
    }

    startCountdown() {
        this.remainingSeconds = Math.floor(this.refreshPeriodMs / 1000);
        this.updateCountdownLabel();
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = setInterval(() => {
            if (!this.autoRefreshEnabled) {
                this.updateCountdownLabel('--');
                return;
            }
            this.remainingSeconds -= 1;
            if (this.remainingSeconds <= 0) {
                this.remainingSeconds = 0;
            }
            this.updateCountdownLabel();
        }, 1000);
    }

    resetCountdown() {
        if (!this.autoRefreshEnabled) return;
        this.remainingSeconds = Math.floor(this.refreshPeriodMs / 1000);
        this.updateCountdownLabel();
    }

    updateCountdownLabel(forceText) {
        const el = document.getElementById('refreshCountdown');
        if (!el) return;
        if (typeof forceText === 'string') {
            el.textContent = forceText;
        } else {
            el.textContent = `${this.remainingSeconds}`;
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.loadData();
                this.resetCountdown();
            }, this.refreshPeriodMs);
            this.startCountdown();
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        // 간단한 에러 표시 (실제로는 토스트나 모달을 사용할 수 있음)
        console.error(message);
        alert(message);
    }
}

// 페이지 로드 시 대시보드 초기화 (싱글톤 보장)
document.addEventListener('DOMContentLoaded', () => {
    if (window.__lavalinkDashboard && typeof window.__lavalinkDashboard.dispose === 'function') {
        window.__lavalinkDashboard.dispose();
    }
    window.__lavalinkDashboard = new LavalinkDashboard();
});
