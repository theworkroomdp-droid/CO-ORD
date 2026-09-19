/**
 * CO-ORD Data Store & vLLM Orchestration Layer
 * Central reactive storage using localStorage for tokens, team members, tasks, and telemetry.
 * Scales dynamically to any number of team members and tasks.
 */

const CoordStore = (function() {
    const STORAGE_KEYS = {
        TOKENS: 'coord_tokens',
        TEAM: 'coord_team',
        TASKS: 'coord_tasks',
        USER: 'coord_user',
        PROJECT: 'coord_project',
        LOGS: 'coord_terminal_logs'
    };

    // Default Seed Data
    const DEFAULT_USER = {
        name: 'Anisha S',
        role: 'Frontend Lead',
        email: 'anisha@coord.app',
        avatarGradient: 'from-indigo-500 to-purple-500'
    };

    const DEFAULT_TEAM = [
        {
            id: 'node-1',
            name: 'Anisha S',
            role: 'Frontend Lead',
            email: 'anisha@coord.app',
            avatarGradient: 'from-indigo-500 to-purple-500',
            capacity: 85,
            maxTasks: 4,
            skills: ['React', 'Tailwind', 'TypeScript', 'Next.js', 'UI/UX Design', 'Framer Motion'],
            status: 'High Load'
        },
        {
            id: 'node-2',
            name: 'Rahul M',
            role: 'Backend Architect',
            email: 'rahul@coord.app',
            avatarGradient: 'from-orange-400 to-rose-400',
            capacity: 45,
            maxTasks: 5,
            skills: ['FastAPI', 'Python', 'vLLM', 'PostgreSQL', 'Docker', 'Redis', 'PyTorch'],
            status: 'Optimal'
        },
        {
            id: 'node-3',
            name: 'Deepak K',
            role: 'UI/UX & Testing',
            email: 'deepak@coord.app',
            avatarGradient: 'from-pink-400 to-rose-400',
            capacity: 25,
            maxTasks: 4,
            skills: ['Figma', 'User Research', 'Design Systems', 'Jest', 'Cypress', 'Wireframing'],
            status: 'Free'
        },
        {
            id: 'node-4',
            name: 'Priya V',
            role: 'AI / LLM Engineer',
            email: 'priya@coord.app',
            avatarGradient: 'from-emerald-400 to-teal-500',
            capacity: 60,
            maxTasks: 4,
            skills: ['PyTorch', 'vLLM Serving', 'LangChain', 'Embeddings', 'CUDA', 'Python', 'HuggingFace'],
            status: 'Optimal'
        },
        {
            id: 'node-5',
            name: 'Carlos R',
            role: 'DevOps & Cloud',
            email: 'carlos@coord.app',
            avatarGradient: 'from-cyan-400 to-blue-500',
            capacity: 35,
            maxTasks: 4,
            skills: ['Kubernetes', 'AWS', 'CI/CD Pipelines', 'Linux', 'Terraform', 'Prometheus'],
            status: 'Optimal'
        }
    ];

    const DEFAULT_TASKS = [
        {
            id: 'task-101',
            title: 'Build Complaint Routing Logic via Vector Cosine Similarity',
            project: 'AI Community Complaint Prioritizer',
            domain: 'Backend',
            bounty: 40,
            status: 'pending',
            assignedTo: 'node-2', // Rahul
            subtasks: [
                { text: 'Set up Qdrant / FAISS embedding vector space', done: true },
                { text: 'Write FastAPI endpoint for automated batch scoring', done: false },
                { text: 'Benchmark against vLLM tokenizer throughput', done: false }
            ],
            vllmRationale: 'vLLM Engine: 97.4% skill match with Python & FastAPI. Assigned to Rahul M (node-2) with low bandwidth contention.',
            createdAt: '2026-09-18T10:00:00Z'
        },
        {
            id: 'task-102',
            title: 'Design Tactile 3D Igloo Bento Mockups & Components',
            project: 'AI Community Complaint Prioritizer',
            domain: 'UI/UX',
            bounty: 25,
            status: 'pending',
            assignedTo: 'node-3', // Deepak
            subtasks: [
                { text: 'Draft high-fidelity pillow cards in Figma', done: true },
                { text: 'Export SVG elevation shadows and glass tokens', done: false },
                { text: 'Conduct accessibility contrast verification', done: false }
            ],
            vllmRationale: 'vLLM Engine: Deepak K is currently at 25% capacity. Optimal routing for design fidelity and rapid turnaround.',
            createdAt: '2026-09-18T11:30:00Z'
        },
        {
            id: 'task-103',
            title: 'Construct Reactive 3D Bento Kanban Interface',
            project: 'AI Community Complaint Prioritizer',
            domain: 'Frontend',
            bounty: 50,
            status: 'in-progress',
            assignedTo: 'node-1', // Anisha
            subtasks: [
                { text: 'Implement CSS soft pillow shadows and multi-layered inset highlights', done: true },
                { text: 'Bind reactive drag & column shift buttons', done: true },
                { text: 'Sync state with Token Vault & localStorage', done: false }
            ],
            vllmRationale: 'vLLM Engine: High priority frontend deliverable. Routed to Anisha S based on React & Tailwind seniority.',
            createdAt: '2026-09-18T12:00:00Z'
        },
        {
            id: 'task-104',
            title: 'Deploy vLLM Llama-3.3-70B Instance on Tensor-Parallel Nodes',
            project: 'AI Community Complaint Prioritizer',
            domain: 'AI/ML',
            bounty: 60,
            status: 'completed',
            assignedTo: 'node-4', // Priya
            subtasks: [
                { text: 'Provision GPU node with FP8 quantization', done: true },
                { text: 'Configure vLLM OpenAI-compatible REST server', done: true },
                { text: 'Achieve >120 tokens/sec streaming response', done: true }
            ],
            vllmRationale: 'vLLM Engine: PyTorch & CUDA specialization match. Completed ahead of schedule by Priya V.',
            createdAt: '2026-09-17T09:00:00Z'
        }
    ];

    const DEFAULT_PROJECT = {
        title: 'AI Community Complaint Prioritizer',
        objective: 'Analyze and prioritize municipal community complaints using vLLM semantic decomposition, routing urgent civil and infrastructural tasks to optimal departmental nodes.',
        deadline: '2026-09-28',
        requiredInfo: 'Integration with municipal telemetry APIs and open vector database.',
        activeSprint: 'Sprint 04 - Alpha Orchestration'
    };

    // Initialize Store
    function init() {
        if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
            localStorage.setItem(STORAGE_KEYS.TOKENS, '150');
        }
        if (!localStorage.getItem(STORAGE_KEYS.TEAM)) {
            localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(DEFAULT_TEAM));
        }
        if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USER)) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
        }
        if (!localStorage.getItem(STORAGE_KEYS.PROJECT)) {
            localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(DEFAULT_PROJECT));
        }
    }

    // --- Token Vault API ---
    function getTokens() {
        init();
        return parseInt(localStorage.getItem(STORAGE_KEYS.TOKENS) || '150', 10);
    }

    function addTokens(amount) {
        init();
        const current = getTokens();
        const updated = current + parseInt(amount, 10);
        localStorage.setItem(STORAGE_KEYS.TOKENS, updated.toString());
        dispatchStoreEvent('tokens_updated', { tokens: updated, delta: amount });
        return updated;
    }

    function deductTokens(amount) {
        init();
        const current = getTokens();
        const updated = Math.max(0, current - parseInt(amount, 10));
        localStorage.setItem(STORAGE_KEYS.TOKENS, updated.toString());
        dispatchStoreEvent('tokens_updated', { tokens: updated, delta: -amount });
        return updated;
    }

    // --- User Profile API ---
    function getUser() {
        init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || DEFAULT_USER;
        } catch(e) {
            return DEFAULT_USER;
        }
    }

    function setUser(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        dispatchStoreEvent('user_updated', user);
    }

    // --- Team Registry API ---
    function getTeam() {
        init();
        try {
            const team = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAM));
            return Array.isArray(team) ? team : DEFAULT_TEAM;
        } catch(e) {
            return DEFAULT_TEAM;
        }
    }

    function setTeam(teamArray) {
        localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(teamArray));
        dispatchStoreEvent('team_updated', teamArray);
    }

    function addMember(memberData) {
        const team = getTeam();
        const newMember = {
            id: 'node-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            name: memberData.name.trim(),
            role: memberData.role.trim() || 'Software Engineer',
            email: memberData.email ? memberData.email.trim() : `${memberData.name.toLowerCase().replace(/\s+/g, '.')}@coord.app`,
            avatarGradient: memberData.avatarGradient || 'from-indigo-500 to-purple-500',
            capacity: parseInt(memberData.capacity, 10) || 30,
            maxTasks: parseInt(memberData.maxTasks, 10) || 4,
            skills: Array.isArray(memberData.skills) 
                ? memberData.skills 
                : memberData.skills.split(',').map(s => s.trim()).filter(Boolean),
            status: memberData.status || 'Available'
        };
        team.push(newMember);
        setTeam(team);
        return newMember;
    }

    function updateMember(id, updates) {
        const team = getTeam();
        const idx = team.findIndex(m => m.id === id);
        if (idx !== -1) {
            team[idx] = { ...team[idx], ...updates };
            setTeam(team);
            return team[idx];
        }
        return null;
    }

    function deleteMember(id) {
        let team = getTeam();
        team = team.filter(m => m.id !== id);
        setTeam(team);
        return team;
    }

    function resetTeam() {
        setTeam(DEFAULT_TEAM);
        return DEFAULT_TEAM;
    }

    function getMemberById(id) {
        const team = getTeam();
        return team.find(m => m.id === id) || null;
    }

    // --- Task Pipeline API ---
    function getTasks() {
        init();
        try {
            const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS));
            return Array.isArray(tasks) ? tasks : DEFAULT_TASKS;
        } catch(e) {
            return DEFAULT_TASKS;
        }
    }

    function setTasks(tasksArray) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasksArray));
        dispatchStoreEvent('tasks_updated', tasksArray);
    }

    function addTask(taskData) {
        const tasks = getTasks();
        const newTask = {
            id: 'task-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            title: taskData.title.trim(),
            project: taskData.project || getCurrentProject().title,
            domain: taskData.domain || 'General',
            bounty: parseInt(taskData.bounty, 10) || 30,
            status: taskData.status || 'pending',
            assignedTo: taskData.assignedTo || (getTeam()[0] ? getTeam()[0].id : null),
            subtasks: taskData.subtasks || [
                { text: 'Analyze technical specifications', done: false },
                { text: 'Execute core implementation', done: false },
                { text: 'Review and verify deployment', done: false }
            ],
            vllmRationale: taskData.vllmRationale || 'vLLM Engine: Automated routing based on skill matrix correlation.',
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        setTasks(tasks);
        recalculateMemberCapacities();
        return newTask;
    }

    function updateTaskStatus(taskId, newStatus) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            const oldStatus = task.status;
            task.status = newStatus;
            setTasks(tasks);
            recalculateMemberCapacities();
            dispatchStoreEvent('task_moved', { task, oldStatus, newStatus });
            return task;
        }
        return null;
    }

    function toggleSubtask(taskId, subtaskIndex) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task && task.subtasks && task.subtasks[subtaskIndex]) {
            task.subtasks[subtaskIndex].done = !task.subtasks[subtaskIndex].done;
            setTasks(tasks);
            return task;
        }
        return null;
    }

    function deleteTask(taskId) {
        let tasks = getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        setTasks(tasks);
        recalculateMemberCapacities();
        return tasks;
    }

    // --- Dynamic Capacity Calculation ---
    function recalculateMemberCapacities() {
        const team = getTeam();
        const tasks = getTasks();

        team.forEach(member => {
            const activeTasks = tasks.filter(t => t.assignedTo === member.id && t.status !== 'completed');
            const loadPercent = Math.min(100, Math.round((activeTasks.length / (member.maxTasks || 4)) * 100));
            member.capacity = loadPercent;
            if (loadPercent >= 80) {
                member.status = 'High Load';
            } else if (loadPercent >= 40) {
                member.status = 'Optimal';
            } else {
                member.status = 'Available';
            }
        });

        localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
    }

    // --- Current Project API ---
    function getCurrentProject() {
        init();
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECT)) || DEFAULT_PROJECT;
        } catch(e) {
            return DEFAULT_PROJECT;
        }
    }

    function setCurrentProject(proj) {
        localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(proj));
        dispatchStoreEvent('project_updated', proj);
    }

    // --- vLLM Intelligent Task Routing Simulation ---
    function recommendMemberForTask(skillsRequired, domain) {
        const team = getTeam();
        if (!team.length) return null;

        let bestMember = team[0];
        let highestScore = -1;

        const skillList = Array.isArray(skillsRequired) 
            ? skillsRequired.map(s => s.toLowerCase().trim())
            : skillsRequired.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

        team.forEach(member => {
            let score = 0;
            const memberSkills = member.skills.map(s => s.toLowerCase());

            // 1. Skill overlap score
            skillList.forEach(reqSkill => {
                if (memberSkills.some(ms => ms.includes(reqSkill) || reqSkill.includes(ms))) {
                    score += 35;
                }
            });

            // 2. Role match score
            if (domain && member.role.toLowerCase().includes(domain.toLowerCase())) {
                score += 25;
            }

            // 3. Workload bandwidth penalty (prefer members with low capacity)
            const capacityPenalty = (member.capacity || 0) * 0.4;
            const finalScore = score - capacityPenalty;

            if (finalScore > highestScore) {
                highestScore = finalScore;
                bestMember = member;
            }
        });

        return {
            member: bestMember,
            score: Math.max(72, Math.min(99, Math.round(75 + highestScore * 0.25)))
        };
    }

    // --- Event Dispatcher for Cross-Page Reactive Sync ---
    function dispatchStoreEvent(eventName, detail) {
        try {
            window.dispatchEvent(new CustomEvent('coord:' + eventName, { detail }));
        } catch(e) {}
    }

    // --- Global HUD Updater ---
    function syncGlobalHUD() {
        init();
        const tokens = getTokens();
        const user = getUser();

        // Update token badge
        document.querySelectorAll('.hud-tokens').forEach(el => {
            el.innerText = `${tokens} Tokens`;
        });

        // Update user badge
        document.querySelectorAll('.hud-user-name').forEach(el => {
            el.innerText = user.name;
        });
        document.querySelectorAll('.hud-user-role').forEach(el => {
            el.innerText = user.role;
        });
        document.querySelectorAll('.hud-user-avatar').forEach(el => {
            el.className = `w-12 h-12 bg-gradient-to-tr ${user.avatarGradient || 'from-indigo-500 to-purple-500'} rounded-[1.25rem] border-4 border-white shadow-lg hud-user-avatar`;
        });
    }

    // Auto-init on load
    init();

    return {
        init,
        getTokens,
        addTokens,
        deductTokens,
        getUser,
        setUser,
        getTeam,
        setTeam,
        addMember,
        updateMember,
        deleteMember,
        resetTeam,
        getMemberById,
        getTasks,
        setTasks,
        addTask,
        updateTaskStatus,
        toggleSubtask,
        deleteTask,
        getCurrentProject,
        setCurrentProject,
        recommendMemberForTask,
        recalculateMemberCapacities,
        syncGlobalHUD
    };
})();

// Auto-run HUD sync on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    CoordStore.syncGlobalHUD();
});
