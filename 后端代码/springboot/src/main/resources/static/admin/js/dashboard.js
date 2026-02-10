document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    loadDashboard();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');

            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            pageViews.forEach(v => v.style.display = 'none');

            if (page === 'dashboard') {
                document.getElementById('dashboardView').style.display = 'block';
                loadDashboard();
            } else if (page === 'herbs') {
                document.getElementById('herbsView').style.display = 'block';
                loadHerbList();
            } else if (page === 'trace') {
                document.getElementById('traceView').style.display = 'block';
                loadTraceStats();
            } else {
                document.getElementById('placeholderView').style.display = 'block';
            }
        });
    });
}

async function loadDashboard() {
    try {
        const response = await fetch('/api/v1/dashboard/stats');
        const result = await response.json();
        if (result.code === 200) {
            updateDashboardStats(result.data);
            initOriginChart(result.data.originDist);
            initProcessChart(result.data.processTypeDist);
        }
    } catch (error) { console.error(error); }
}

async function loadTraceStats() {
    try {
        const response = await fetch('/api/v1/dashboard/stats');
        const result = await response.json();
        if (result.code === 200) {
            document.getElementById('overallTraceRate').textContent =
                (result.data.overallTraceabilityRate || 0).toFixed(1) + '%';
            initIntegrityRadar(result.data.integrityStats);
            renderBlockchainFeed(result.data.recentBlockchainRecords);
        }
    } catch (error) { console.error(error); }
}

function initIntegrityRadar(stats) {
    const container = document.getElementById('integrityRadar');
    if (!container) return;
    const chart = echarts.init(container, 'dark', { backgroundColor: 'transparent' });
    const option = {
        radar: {
            indicator: [
                { name: '种植记录', max: 20 },
                { name: '加工过程', max: 20 },
                { name: '质检报告', max: 20 },
                { name: '上链存证', max: 20 }
            ],
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
        },
        series: [{
            type: 'radar',
            data: [{
                value: [
                    stats.planting || 0,
                    stats.processing || 0,
                    stats.inspection || 0,
                    stats.blockchain || 0
                ],
                name: '数据完整度',
                areaStyle: { color: 'rgba(79, 70, 229, 0.4)' },
                lineStyle: { color: '#4f46e5' },
                itemStyle: { color: '#4f46e5' }
            }]
        }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function renderBlockchainFeed(recs) {
    const feed = document.getElementById('blockchainFeed');
    if (!feed) return;
    if (!recs || recs.length === 0) {
        feed.innerHTML = '<p style="color: var(--text-secondary); text-align:center;">暂无上链数据</p>';
        return;
    }
    feed.innerHTML = recs.map(r => `
        <div class="feed-item">
            <div class="tx-header">
                <span class="batch-no">${r.batchNo}</span>
                <span style="color: var(--text-secondary); font-size: 0.7rem;">${new Date(r.time).toLocaleString()}</span>
            </div>
            <span class="tx-hash">Hash: ${r.txHash}</span>
            ${r.url ? `<a href="${r.url}" target="_blank" class="tx-link">在区块链浏览器上查看 →</a>` : '<span class="tx-link" style="color: #666">区块确认中...</span>'}
        </div>
    `).join('');
}

async function loadHerbList() {
    try {
        const response = await fetch('/api/v1/batches');
        const result = await response.json();
        if (result.code === 200) {
            const tbody = document.getElementById('herbTableBody');
            tbody.innerHTML = (result.data || []).map(h => `
                <tr>
                    <td><code>${h.batchNo}</code></td>
                    <td><strong>${h.name}</strong></td>
                    <td>${h.category || '-'}</td>
                    <td>${h.origin || '-'}</td>
                    <td>${h.quantity || 0} ${h.unit || ''}</td>
                    <td><span class="status-badge status-${h.status}">${h.status}</span></td>
                </tr>
            `).join('');
        }
    } catch (error) { console.error(error); }
}

function updateDashboardStats(data) {
    document.getElementById('totalHerbTypes').textContent = data.totalHerbTypes;
    document.getElementById('totalBatches').textContent = data.totalBatches;
    document.getElementById('totalProcessing').textContent = data.totalProcessingRecords;
}

function initOriginChart(data) {
    const container = document.getElementById('originChart');
    if (!container) return;
    const chart = echarts.init(container, 'dark', { backgroundColor: 'transparent' });
    const option = {
        tooltip: { trigger: 'item' },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: 'rgba(0,0,0,0)', borderWidth: 2 },
            label: {
                show: true,
                position: 'outside',
                formatter: '{b}',
                color: '#a1a1aa',
                fontSize: 12
            },
            labelLine: {
                show: true,
                lineStyle: { color: 'rgba(255,255,255,0.3)' }
            },
            emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
            data: data || []
        }],
        color: ['#4f46e5', '#7c3aed', '#db2777', '#f59e0b', '#10b981']
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}

function initProcessChart(data) {
    const container = document.getElementById('processChart');
    if (!container) return;
    const chart = echarts.init(container, 'dark', { backgroundColor: 'transparent' });
    const option = {
        tooltip: { trigger: 'axis' },
        xAxis: [{ type: 'category', data: (data || []).map(d => d.name) }],
        yAxis: [{ type: 'value' }],
        series: [{
            name: '工序频次',
            type: 'bar',
            data: (data || []).map(d => d.value),
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#6366f1' }, { offset: 1, color: '#a855f7' }
                ]),
                borderRadius: [8, 8, 0, 0]
            }
        }]
    };
    chart.setOption(option);
    window.addEventListener('resize', () => chart.resize());
}
