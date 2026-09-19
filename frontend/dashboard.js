/**
 * Dashboard.js - Hub Metrics & Live vLLM AI Terminal Simulation
 */

document.addEventListener('DOMContentLoaded', () => {
    updateHubMetrics();
    initTerminalEngine();
});

function updateHubMetrics() {
    // 1. Update Active Tasks Count
    const tasks = CoordStore.getTasks();
    const activeTasks = tasks.filter(t => t.status !== 'completed');
    const taskCountEl = document.getElementById('dash-active-count');
    if (taskCountEl) {
        taskCountEl.innerText = `${activeTasks.length} Active`;
    }

    // 2. Update Team Nodes Count
    const team = CoordStore.getTeam();
    const teamCountEl = document.getElementById('dash-team-nodes');
    if (teamCountEl) {
        teamCountEl.innerText = `${team.length} Nodes`;
    }
}

// --- Live vLLM Terminal Simulation ---
const terminalTarget = document.getElementById("terminal-typing");
const terminalOutput = document.getElementById("terminal-output");
let isTyping = false;

const initialLogs = [
    { type: 'SYS', msg: 'Cluster vLLM initialization complete. Model: meta-llama/Llama-3.3-70B-Instruct.' },
    { type: 'KV',  msg: 'KV-Cache allocated: 18.4GB / 24GB (76.6% optimal paging).' },
    { type: 'NET', msg: 'ZeroMQ task dispatcher subscribed to 5 cluster nodes.' },
    { type: 'OK',  msg: 'Token Vault synched: Autonomous bounty settlement enabled.' }
];

function getTimestamp() {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function appendLogLine(type, text) {
    if (!terminalOutput) return;
    const line = document.createElement('div');
    line.className = "flex items-start gap-2 text-[11px] leading-tight";
    
    let badgeClass = "text-slate-500";
    if (type === 'OK') badgeClass = "text-emerald-400";
    if (type === 'WARN') badgeClass = "text-amber-400";
    if (type === 'AI') badgeClass = "text-indigo-400 font-bold";

    line.innerHTML = `
        <span class="text-slate-600 font-mono">[${getTimestamp()}]</span>
        <span class="${badgeClass} font-mono font-bold">[${type}]</span>
        <span class="text-slate-300 font-mono">${text}</span>
    `;
    
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function initTerminalEngine() {
    if (!terminalOutput) return;
    terminalOutput.innerHTML = "";
    initialLogs.forEach(log => appendLogLine(log.type, log.msg));

    // Simulated background heartbeat events
    const heartbeatMessages = [
        { type: 'METRIC', msg: 'vLLM inference throughput: 148.6 tokens/sec across 2 tensor-parallel GPUs.' },
        { type: 'AI',     msg: 'Semantic vector similarity check: No skill bottlenecks identified.' },
        { type: 'KV',     msg: 'Continuous batching queue: 0 pending requests. Ready for sprint intake.' },
        { type: 'NODE',   msg: 'Node heartbeat received: Rahul M (node-2) bandwidth at 45%.' }
    ];

    let hIndex = 0;
    setInterval(() => {
        if (Math.random() > 0.4) {
            const h = heartbeatMessages[hIndex % heartbeatMessages.length];
            appendLogLine(h.type, h.msg);
            hIndex++;
        }
    }, 8000);
}

function typeTerminal(text, callback) {
    if (!terminalTarget) return;
    isTyping = true;
    let i = 0;
    terminalTarget.textContent = "";
    
    function step() {
        if (i < text.length) {
            terminalTarget.textContent += text.charAt(i);
            i++;
            setTimeout(step, 18);
        } else {
            isTyping = false;
            if (callback) setTimeout(callback, 800);
        }
    }
    step();
}

function triggerVllmRebalance() {
    if (isTyping) return;
    
    appendLogLine('AI', 'Triggering autonomous cluster rebalancing routine...');
    
    typeTerminal("Ingesting active tasks and node skill matrices into vLLM context...", () => {
        appendLogLine('AI', 'Parsed 4 task vectors. Calculating cosine similarity matrix...');
        
        typeTerminal("Evaluating node bandwidth thresholds and token efficiencies...", () => {
            CoordStore.recalculateMemberCapacities();
            appendLogLine('OK', 'Node capacities calibrated. Workload evenly distributed.');
            typeTerminal("Rebalance complete. Optimal task routing confirmed.");
            updateHubMetrics();
        });
    });
}

function clearTerminal() {
    if (terminalOutput) {
        terminalOutput.innerHTML = "";
        appendLogLine('SYS', 'Terminal cleared by operator. Continuous telemetry active.');
    }
}