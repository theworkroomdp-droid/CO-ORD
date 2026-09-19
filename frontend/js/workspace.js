/**
 * CO-ORD — Workspace Controller (Overview, Kanban/List Tasks, Real-time Team Chat, Team, Resources)
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let currentTab = "overview";
let currentViewMode = "kanban"; // "kanban" or "list"
let activeTasks = [];
let activeTeam = [];
let activeProjectId = null;

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("workspace");
  await renderTopbar("Project Workspace");
  setupModal("createTaskModal");
  setupModal("taskDetailModal");
  setupModal("addMemberModal");

  // Check URL params for initial tab
  const params = new URLSearchParams(window.location.search);
  activeProjectId = params.get("id");
  if (params.get("tab")) currentTab = params.get("tab");

  if (!activeProjectId) {
    await renderWorkspaceHub();
    return;
  }

  const accessGranted = await ensureWorkspaceAccess(activeProjectId);
  if (!accessGranted) return;

  await loadWorkspaceData();
  initWorkspaceTabs();
  initChatEngine();
  initTaskInteractions();
});

async function renderWorkspaceHub() {
  const page = document.querySelector(".page-body");
  if (!page) return;
  const projects = await api.fetchProjects();
  const today = new Date(); today.setHours(0,0,0,0);
  const isExpired = project => {
    if (project.archived || project.status === "archived") return false;
    const d = new Date(project.dueDate);
    return !Number.isNaN(d.getTime()) && d < today;
  };
  const allActiveProjects = projects.filter(p => !p.archived && p.status !== "archived");
  const expiredProjects = allActiveProjects.filter(isExpired);
  const activeProjects = allActiveProjects.filter(p => !isExpired(p));
  const archivedProjects = projects.filter(p => p.archived || p.status === "archived");
  const team = await api.fetchTeamMembers();

  const memberOptions = team.map(m => `
    <label class="workspace-member-option">
      <input type="checkbox" name="workspaceMembers" value="${m.id}" ${m.id === "user-1" ? "checked disabled" : ""}>
      <span class="member-mini-avatar">${m.avatar}</span>
      <span class="member-option-info"><strong>${m.name}</strong><small>${m.email} · ${m.role}</small></span>
      ${m.id === "user-1" ? '<span class="member-you">You</span>' : ''}
    </label>`).join("");

  const card = (project, archived = false) => {
    const expired = isExpired(project);
    return `<div class="workspace-card ${expired ? 'is-expired' : ''} ${archived ? 'is-archived' : ''}">
      <a href="workspace.html?id=${encodeURIComponent(project.id)}" class="workspace-card-main">
        <div class="workspace-card-top"><span class="workspace-status ${archived ? 'archived' : expired ? 'expired' : project.status}">${archived ? 'Archived' : expired ? 'Expired' : project.status}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
        <h3>${project.name}</h3>
        <p>${project.tagline || project.description || "Project workspace"}</p>
        <div class="workspace-card-meta"><span>${project.tasksCount || 0} tasks</span><span>${project.progress || 0}% complete</span></div>
        <div class="progress-bar-linear"><div class="progress-fill" style="width:${project.progress || 0}%"></div></div>
      </a>
      ${!archived && expired ? `<button class="btn btn-silver btn-sm archive-workspace-btn" data-project-id="${project.id}"><i class="fa-solid fa-box-archive"></i> Move to Archive</button>` : ''}
      ${archived ? `<button class="btn btn-silver btn-sm restore-workspace-btn" data-project-id="${project.id}"><i class="fa-solid fa-rotate-left"></i> Restore</button>` : ''}
    </div>`;
  };

  page.innerHTML = `
    <section class="workspace-hub techflux-panel">
      <div class="workspace-hub-header">
        <div><span class="hub-eyebrow">WORKSPACE CONTROL</span><h1>Your Workspaces</h1><p>Create focused project spaces, add members by account, and keep finished work safely archived.</p></div>
        <button class="btn btn-primary" id="openCreateWorkspaceBtn"><i class="fa-solid fa-plus"></i><span>Create New Workspace</span></button>
      </div>
      <div class="workspace-create-first">
        <div class="create-first-icon"><i class="fa-solid fa-plus"></i></div>
        <div><h2>Start a new workspace</h2><p>Add the project details and choose which registered accounts belong to it.</p></div>
        <button class="btn btn-silver btn-sm" id="openCreateWorkspaceBtn2">Create Workspace</button>
      </div>

      <div class="workspace-section-heading"><div><span class="hub-eyebrow">ACTIVE</span><h2>Current Workspaces</h2></div><span class="workspace-count">${activeProjects.length}</span></div>
      <div class="workspace-card-grid">${activeProjects.length ? activeProjects.map(p => card(p)).join("") : '<div class="workspace-empty">No active workspaces yet. Create your first one above.</div>'}</div>

      ${expiredProjects.length ? `<div class="workspace-section-heading archive-heading"><div><span class="hub-eyebrow">EXPIRED</span><h2>Needs Attention</h2></div><span class="workspace-count expired-count">${expiredProjects.length}</span></div><div class="workspace-card-grid">${expiredProjects.map(p => card(p)).join("")}</div>` : ''}

      <div class="workspace-archive-panel">
        <div class="workspace-section-heading"><div><span class="hub-eyebrow">ARCHIVE</span><h2>Archived Workspaces</h2></div><span class="workspace-count">${archivedProjects.length}</span></div>
        ${archivedProjects.length ? `<div class="workspace-card-grid">${archivedProjects.map(p => card(p, true)).join("")}</div>` : '<div class="workspace-empty archive-empty"><i class="fa-solid fa-box-archive"></i><span>Archived workspaces will appear here.</span></div>'}
      </div>
    </section>

    <div class="modal-backdrop" id="createWorkspaceModal">
      <div class="modal workspace-create-modal">
        <div class="modal-header"><div class="modal-title"><i class="fa-solid fa-layer-group" style="color:var(--deep-blue-400)"></i><span>Create New Workspace</span></div><button class="modal-close" id="closeWorkspaceModal">&times;</button></div>
        <form id="createWorkspaceForm">
          <div class="modal-body">
            <div class="form-group"><label class="form-label" for="workspaceName">Workspace Name</label><input class="input-control" id="workspaceName" required placeholder="e.g. Final Year Project"></div>
            <div class="form-group"><label class="form-label" for="workspaceTagline">Short Description</label><input class="input-control" id="workspaceTagline" placeholder="e.g. AI-powered project for college team"></div>
            <div class="form-group"><label class="form-label" for="workspaceDescription">Workspace Details</label><textarea class="input-control" id="workspaceDescription" placeholder="What is this workspace for?"></textarea></div>
            <div class="form-group"><label class="form-label" for="workspaceDueDate">Deadline</label><input class="input-control" id="workspaceDueDate" type="date"></div>
            <div class="form-group"><label class="form-label" for="workspaceRoomCode">Room Code</label><div class="roomcode-create-row"><input class="input-control" id="workspaceRoomCode" required minlength="4" maxlength="16" pattern="[A-Za-z0-9-]+" placeholder="e.g. COORD-26"><button type="button" class="btn btn-silver btn-sm" id="generateRoomCode"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate</button></div><p class="form-hint">Set a private code and share it only with the members you selected below.</p></div>
            <div class="form-group"><label class="form-label">Add Team Members</label><p class="form-hint">Select registered accounts that should belong to this workspace.</p><div class="workspace-member-picker">${memberOptions}</div></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-ghost btn-sm" id="cancelWorkspaceModal">Cancel</button><button class="btn btn-primary btn-sm" type="submit">Create Workspace</button></div>
        </form>
      </div>
    </div>`;

  const modal = document.getElementById("createWorkspaceModal");
  const open = () => modal.classList.add("active");
  document.getElementById("openCreateWorkspaceBtn").onclick = open;
  document.getElementById("openCreateWorkspaceBtn2").onclick = open;
  const close = () => modal.classList.remove("active");
  document.getElementById("closeWorkspaceModal").onclick = close;
  document.getElementById("cancelWorkspaceModal").onclick = close;
  modal.addEventListener("click", e => { if (e.target === modal) close(); });

  document.querySelectorAll('.archive-workspace-btn').forEach(btn => btn.addEventListener('click', async () => {
    await api.updateProject(btn.dataset.projectId, { archived: true, status: 'archived' });
    showToast('Workspace Archived', 'The expired workspace was moved to your archive.', 'success');
    renderWorkspaceHub();
  }));
  document.querySelectorAll('.restore-workspace-btn').forEach(btn => btn.addEventListener('click', async () => {
    await api.updateProject(btn.dataset.projectId, { archived: false, status: 'active' });
    showToast('Workspace Restored', 'The workspace is back in your active list.', 'success');
    renderWorkspaceHub();
  }));

  const roomCodeInput = document.getElementById("workspaceRoomCode");
  document.getElementById("generateRoomCode").addEventListener("click", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    roomCodeInput.value = `CO-${code}`;
  });

  document.getElementById("createWorkspaceForm").addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("workspaceName").value.trim();
    if (!name) return;
    const memberIds = [...document.querySelectorAll('input[name="workspaceMembers"]:checked')].map(i => i.value);
    const due = document.getElementById("workspaceDueDate").value;
    const project = await api.createProject({
      name,
      tagline: document.getElementById("workspaceTagline").value.trim(),
      description: document.getElementById("workspaceDescription").value.trim(),
      dueDate: due || "No deadline",
      memberIds,
      ownerId: api.getCurrentUser().id,
      roomCode: roomCodeInput.value.trim().toUpperCase()
    });
    window.location.href = `workspace.html?id=${encodeURIComponent(project.id)}`;
  });
}

async function ensureWorkspaceAccess(projectId) {
  const info = await api.getWorkspaceAccessInfo(projectId);
  if (info.allowed) return true;

  const modal = document.getElementById("workspaceAccessModal");
  if (!modal) return false;
  modal.classList.add("active");

  const message = document.getElementById("workspaceAccessMessage");
  const form = document.getElementById("workspaceAccessForm");
  const error = document.getElementById("workspaceAccessError");
  const input = document.getElementById("workspaceRoomCodeInput");
  const codeGroup = document.getElementById("workspaceRoomCodeGroup");

  if (info.reason === "not_a_member") {
    message.textContent = "Your account is not a member of this workspace. Ask the workspace admin to add your account before trying the room code.";
    codeGroup.style.display = "none";
    error.hidden = false;
    error.textContent = "Access denied: this account was not selected for this workspace.";
    form.querySelector('button[type="submit"]').disabled = true;
    return false;
  }
  if (info.reason === "workspace_archived") {
    message.textContent = "This workspace is archived and cannot currently be entered.";
    codeGroup.style.display = "none";
    error.hidden = false;
    error.textContent = "Restore the workspace first from the Workspace page.";
    form.querySelector('button[type="submit"]').disabled = true;
    return false;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    error.hidden = true;
    const result = await api.validateWorkspaceAccess(projectId, input.value);
    if (!result.success) {
      error.hidden = false;
      error.textContent = result.reason === "invalid_code" ? "That room code is incorrect. Check the code shared by the workspace admin." : "Access denied. Only selected workspace members can enter.";
      input.focus();
      return;
    }
    await api.grantWorkspaceSession(projectId);
    modal.classList.remove("active");
    await loadWorkspaceData();
    initWorkspaceTabs();
    initChatEngine();
    initTaskInteractions();
  }, { once: true });
  return false;
}

async function loadWorkspaceData() {
  const project = await api.fetchProject(activeProjectId);
  activeTasks = await api.fetchTasks(activeProjectId);
  const allTeam = await api.fetchTeamMembers();
  activeTeam = allTeam.filter(member => (project.members || []).includes(member.id));

  // Populate Header
  document.getElementById("workspaceProjectName").innerText = project.name;
  document.getElementById("workspaceProjectDesc").innerText = project.description;
  const roomOwner = document.getElementById("workspaceRoomCodeOwner");
  const roomValue = document.getElementById("workspaceRoomCodeValue");
  const currentUser = api.getCurrentUser();
  if (roomOwner && roomValue && project.ownerId === currentUser?.id && project.roomCode) {
    roomOwner.hidden = false;
    roomValue.textContent = project.roomCode;
    const copyBtn = document.getElementById("copyWorkspaceRoomCode");
    copyBtn?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(project.roomCode); showToast("Room Code Copied", "Share this code only with selected workspace members.", "success"); } catch (e) { showToast("Room Code", project.roomCode, "info"); }
    }, { once: true });
  }

  // Render Tab Content
  switchTab(currentTab);
}

function initWorkspaceTabs() {
  const tabs = document.querySelectorAll(".workspace-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      switchTab(tab.dataset.tab);
    });
  });

  // View mode toggles (Kanban vs List)
  const viewBtns = document.querySelectorAll(".view-btn");
  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentViewMode = btn.dataset.view;
      renderTasksTab();
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;
  const sections = document.querySelectorAll(".workspace-section");
  sections.forEach(s => s.style.display = "none");

  const target = document.getElementById(`tabSection_${tabId}`);
  if (target) target.style.display = "block";

  if (tabId === "overview") renderOverviewTab();
  else if (tabId === "tasks") renderTasksTab();
  else if (tabId === "chat") renderChatTab();
  else if (tabId === "team") renderTeamTab();
  else if (tabId === "resources") renderResourcesTab();
  else if (tabId === "activity") renderActivityTab();
}

// 1. Overview Tab
function renderOverviewTab() {
  const completed = activeTasks.filter(t => t.status === "completed").length;
  const total = activeTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById("overviewPct").innerText = `${pct}%`;
  document.getElementById("overviewPctBar").style.width = `${pct}%`;
  document.getElementById("overviewTasksSummary").innerText = `${completed} completed out of ${total} tasks`;

  // Render deadlines list
  const deadlinesList = document.getElementById("overviewDeadlinesList");
  if (deadlinesList) {
    deadlinesList.innerHTML = activeTasks.slice(0, 3).map(t => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-surface-active); border: 1px solid var(--border-subtle); border-radius: 6px;">
        <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-silver-bright);">${t.title}</span>
        <span class="badge ${t.priority === 'urgent' ? 'badge-priority-urgent' : 'badge-priority-medium'}">${t.dueDate}</span>
      </div>
    `).join('');
  }
}

// 2. Tasks Tab (Kanban vs List)
function renderTasksTab() {
  const kanbanContainer = document.getElementById("tasksKanbanView");
  const listContainer = document.getElementById("tasksListView");

  if (currentViewMode === "kanban") {
    kanbanContainer.style.display = "grid";
    listContainer.style.display = "none";
    renderKanbanColumns();
  } else {
    kanbanContainer.style.display = "none";
    listContainer.style.display = "block";
    renderListTable();
  }
}

function renderKanbanColumns() {
  const columns = ["backlog", "todo", "inprogress", "review", "completed"];

  columns.forEach(col => {
    const area = document.getElementById(`kanbanCol_${col}`);
    const countEl = document.getElementById(`kanbanCount_${col}`);
    if (!area) return;

    const colTasks = activeTasks.filter(t => t.status === col);
    if (countEl) countEl.innerText = colTasks.length;

    area.innerHTML = colTasks.map(t => `
      <div class="task-card" data-task-id="${t.id}">
        <div class="task-card-header">
          <span class="badge badge-priority-${t.priority}">${t.priority}</span>
          <div class="task-assignee-avatar" title="Assignee: ${t.assigneeName || 'Unassigned'}">
            ${(t.assigneeName || 'U').substring(0, 2).toUpperCase()}
          </div>
        </div>
        <div class="task-card-title">${t.title}</div>
        <div class="task-card-tags">
          ${(t.requiredSkills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
        <div class="task-card-footer">
          <div class="task-card-date">
            <i class="fa-regular fa-clock"></i>
            <span>${t.dueDate}</span>
          </div>
          <!-- Quick Status Advance dropdown trigger -->
          <button class="btn btn-ghost btn-sm move-status-btn" data-task-id="${t.id}" data-current="${t.status}" title="Move status">
            <i class="fa-solid fa-arrows-left-right" style="font-size: 0.72rem; color: var(--deep-blue-400);"></i>
          </button>
        </div>
      </div>
    `).join('');
  });

  // Attach card click handlers for details modal
  document.querySelectorAll(".task-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".move-status-btn")) return;
      const taskId = card.dataset.taskId;
      openTaskDetail(taskId);
    });
  });

  // Attach move status button handler
  document.querySelectorAll(".move-status-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      const current = btn.dataset.current;
      const statusCycle = ["backlog", "todo", "inprogress", "review", "completed"];
      const nextIdx = (statusCycle.indexOf(current) + 1) % statusCycle.length;
      const nextStatus = statusCycle[nextIdx];

      await api.updateTask(taskId, { status: nextStatus });
      activeTasks = await api.fetchTasks(activeProjectId);
      renderTasksTab();
      showToast("Status Updated", `Task moved to ${nextStatus.toUpperCase()}`, "info");
    });
  });
}

function renderListTable() {
  const tbody = document.getElementById("tasksTableBody");
  if (!tbody) return;

  tbody.innerHTML = activeTasks.map(t => `
    <tr style="cursor: pointer;" onclick="window.workspaceOpenTask('${t.id}')">
      <td>
        <div style="font-weight: 600; color: var(--text-silver-bright);">${t.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-silver-muted);">${(t.requiredSkills || []).join(' • ')}</div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="task-assignee-avatar">${(t.assigneeName || 'U').substring(0, 2).toUpperCase()}</div>
          <span style="font-size: 0.85rem;">${t.assigneeName || 'Unassigned'}</span>
        </div>
      </td>
      <td><span class="badge badge-priority-${t.priority}">${t.priority}</span></td>
      <td><span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #60a5fa; text-transform: uppercase;">${t.status}</span></td>
      <td><span style="font-size: 0.82rem; color: var(--text-silver-secondary);">${t.dueDate}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="progress-bar-linear" style="width: 60px; height: 6px;">
            <div class="progress-fill" style="width: ${t.progress || (t.status === 'completed' ? 100 : 30)}%;"></div>
          </div>
          <span style="font-size: 0.74rem;">${t.progress || (t.status === 'completed' ? 100 : 30)}%</span>
        </div>
      </td>
    </tr>
  `).join('');
}

window.workspaceOpenTask = function(taskId) {
  openTaskDetail(taskId);
};

// 3. Collaborative Team Chat Module
async function renderChatTab() {
  const stream = document.getElementById("chatMessagesStream");
  if (!stream) return;

  const messages = await api.fetchWorkspaceMessages(activeProjectId);
  const user = api.getCurrentUser();

  stream.innerHTML = messages.map(msg => {
    const isSelf = msg.senderId === user.id || msg.senderName === user.name;
    return `
      <div class="chat-message-row ${isSelf ? 'self' : ''}">
        <div class="chat-msg-avatar ${msg.avatarClass || 'avatar-self'}">
          ${msg.avatar || 'U'}
        </div>
        <div class="chat-msg-bubble-wrap">
          <div class="chat-msg-meta">
            <span class="chat-msg-sender">${msg.senderName}</span>
            ${msg.role ? `<span class="chat-msg-role">• ${msg.role}</span>` : ''}
            <span class="chat-msg-time">${msg.time}</span>
          </div>
          <div class="chat-bubble">
            ${msg.text}
            ${msg.taskMention ? `
              <div>
                <span class="chat-task-chip">
                  <i class="fa-solid fa-link" style="color: #38bdf8;"></i>
                  Mentioned Task: ${msg.taskMention}
                </span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Scroll to bottom
  stream.scrollTop = stream.scrollHeight;
}

function initChatEngine() {
  const chatForm = document.getElementById("chatInputForm");
  const chatInput = document.getElementById("chatTextInput");
  const typingIndicator = document.getElementById("chatTypingIndicator");

  if (!chatForm || !chatInput) return;

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    await api.sendWorkspaceMessage(activeProjectId, text);
    await renderChatTab();

    // Check if user mentions help or AI
    if (text.toLowerCase().includes("@ai") || text.toLowerCase().includes("help")) {
      showTypingIndicator("CO-ORD AI is analyzing team request...");
      setTimeout(async () => {
        hideTypingIndicator();
        await api.sendWorkspaceMessage(activeProjectId, `🤖 [CO-ORD AI]: Based on current project workload, Anu and Rahul have the highest skill alignment for this sprint. Check the AI Assistant tab for one-click task allocation.`);
        await renderChatTab();
      }, 1500);
    } else {
      // Teammate friendly interaction
      setTimeout(() => {
        showTypingIndicator("Rahul is typing...");
        setTimeout(async () => {
          hideTypingIndicator();
          await api.sendWorkspaceMessage(activeProjectId, "Got it! Adding this to our API integration checklist.");
          await renderChatTab();
        }, 2000);
      }, 1000);
    }
  });

  // Quick Action chips in chat
  document.querySelectorAll(".chat-quick-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chatInput.value = chip.dataset.prompt || chip.innerText;
      chatInput.focus();
    });
  });

  function showTypingIndicator(text) {
    if (!typingIndicator) return;
    typingIndicator.style.display = "flex";
    typingIndicator.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
      <span>${text}</span>
    `;
  }

  function hideTypingIndicator() {
    if (!typingIndicator) return;
    typingIndicator.style.display = "none";
  }
}

// 4. Team & Workload Tab
function renderTeamTab() {
  const container = document.getElementById("workspaceTeamList");
  if (!container) return;

  container.innerHTML = activeTeam.map(m => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="member-avatar-ring" style="width: 44px; height: 44px; font-size: 1.05rem;">${m.avatar}</div>
            <div>
              <div style="font-size: 1rem; font-weight: 700; color: var(--text-silver-bright);">${m.name}</div>
              <div style="font-size: 0.76rem; color: var(--text-silver-secondary);">${m.role}</div>
            </div>
          </div>
          <span class="badge badge-workload-${m.workload}">${m.workload} workload</span>
        </div>

        <div style="margin-bottom: 12px;">
          <div class="text-xs text-muted" style="margin-bottom: 6px;">Skills:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-silver-secondary); margin-bottom: 16px;">
          <span>Active Tasks: <strong>${m.activeTasks}</strong></span>
          <span>Completed: <strong>${m.completedTasks}</strong></span>
        </div>
      </div>

      <button class="btn btn-silver btn-sm" onclick="window.location.href='team.html?ask=${m.id}'" style="width: 100%;">
        <i class="fa-regular fa-paper-plane" style="color: #38bdf8;"></i>
        <span>Ask ${m.name} for Help</span>
      </button>
    </div>
  `).join('');
}

// 5. Resources Tab
async function renderResourcesTab() {
  const container = document.getElementById("workspaceResourcesList");
  if (!container) return;

  const resources = await api.fetchResources(activeProjectId);
  container.innerHTML = resources.map(r => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #60a5fa;">${r.category}</span>
          ${r.savedViaExtension ? `<span class="chrome-badge"><i class="fa-solid fa-bolt"></i> Chrome Extension</span>` : ''}
        </div>
        <div style="font-size: 1rem; font-weight: 700; color: var(--text-silver-bright); margin-bottom: 6px;">
          ${r.title}
        </div>
        <p style="font-size: 0.82rem; color: var(--text-silver-secondary); line-height: 1.4; margin-bottom: 12px;">
          ${r.description}
        </p>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
        <span class="text-xs text-muted">Added by ${r.addedBy}</span>
        <a href="${r.url}" target="_blank" class="btn btn-primary btn-sm">Open Link &rarr;</a>
      </div>
    </div>
  `).join('');
}

// 6. Activity Tab
function renderActivityTab() {
  const container = document.getElementById("workspaceActivityStream");
  if (!container) return;

  const activities = [
    { user: "Rahul", action: "pushed FastAPI authentication endpoints to repository", time: "15m ago", icon: "fa-solid fa-code" },
    { user: "AI Engine", action: "suggested reallocating async db queries to Rahul (94% match)", time: "40m ago", icon: "fa-solid fa-wand-magic-sparkles" },
    { user: "Arjun", action: "marked task 'Design dashboard UI' as Completed", time: "1h ago", icon: "fa-solid fa-check" },
    { user: "Anu", action: "saved MDN WebSocket resource via CO-ORD Chrome Extension", time: "2h ago", icon: "fa-brands fa-chrome" },
    { user: "Meera", action: "joined project 'CO-ORD Hackathon'", time: "4h ago", icon: "fa-solid fa-user-plus" }
  ];

  container.innerHTML = activities.map(act => `
    <div style="display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px; background: var(--bg-surface); border: 1px solid var(--border-silver); border-radius: 8px;">
      <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.3); color: var(--deep-blue-400); display: flex; align-items: center; justify-content: center;">
        <i class="${act.icon}"></i>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 0.88rem; color: var(--text-silver-bright);">
          <strong>${act.user}</strong> ${act.action}
        </div>
        <span class="text-xs text-muted">${act.time}</span>
      </div>
    </div>
  `).join('');
}

// Task Details Drawer & "Ask AI for Help"
function openTaskDetail(taskId) {
  const task = activeTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById("detailTaskTitle").innerText = task.title;
  document.getElementById("detailTaskDesc").innerText = task.description || "No description provided.";
  document.getElementById("detailTaskStatus").innerText = task.status.toUpperCase();
  document.getElementById("detailTaskPriority").innerText = task.priority.toUpperCase();
  document.getElementById("detailTaskAssignee").innerText = task.assigneeName || "Unassigned";
  document.getElementById("detailTaskDueDate").innerText = task.dueDate;
  
  const skillsContainer = document.getElementById("detailTaskSkills");
  skillsContainer.innerHTML = (task.requiredSkills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');

  // Ask AI For Help Button forwards to AI page with pre-populated prompt
  const askAiBtn = document.getElementById("detailAskAiBtn");
  if (askAiBtn) {
    askAiBtn.onclick = () => {
      window.location.href = `ai.html?query=${encodeURIComponent(`I am stuck on task "${task.title}". Who can help me?`)}`;
    };
  }

  // Delete Task Button
  const deleteBtn = document.getElementById("detailDeleteTaskBtn");
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (confirm(`Delete task "${task.title}"?`)) {
        await api.deleteTask(task.id);
        closeModal("taskDetailModal");
        activeTasks = await api.fetchTasks(activeProjectId);
        renderTasksTab();
        showToast("Task Deleted", "Task removed from project.", "info");
      }
    };
  }

  openModal("taskDetailModal");
}

function initTaskInteractions() {
  // Create task modal submit
  const form = document.getElementById("workspaceCreateTaskForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("wsTaskTitle").value.trim();
      const desc = document.getElementById("wsTaskDesc").value.trim();
      const status = document.getElementById("wsTaskStatus").value;
      const priority = document.getElementById("wsTaskPriority").value;
      const skillsStr = document.getElementById("wsTaskSkills").value;

      if (!title) return;

      const skills = skillsStr ? skillsStr.split(",").map(s => s.trim()) : ["General"];
      await api.createTask({
        title,
        description: desc,
        status,
        priority,
        requiredSkills: skills
      });

      closeModal("createTaskModal");
      form.reset();
      activeTasks = await api.fetchTasks(activeProjectId);
      renderTasksTab();
      showToast("Task Created", `"${title}" added to workspace.`, "success");
    });
  }
}
