task.js
/**
 * CO-ORD — Tasks Page Controller (Kanban, List, Filtering, Task Details, AI Help Trigger)
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let allTasks = [];
let filteredTasks = [];
let currentFilter = "all";
let currentView = "kanban";

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("tasks");
  await renderTopbar("Tasks");
  setupModal("createTaskModal");
  setupModal("taskDetailModal");

  // Check URL params for search or task ID
  const params = new URLSearchParams(window.location.search);
  const searchParam = params.get("search");
  const taskIdParam = params.get("id");

  await loadTasks();

  if (searchParam) {
    document.getElementById("taskSearchInput").value = searchParam;
    filterTasks(searchParam);
  }

  if (taskIdParam) {
    setTimeout(() => openTaskDetail(taskIdParam), 300);
  }

  initEventListeners();
});

async function loadTasks() {
  allTasks = await api.fetchTasks("proj-1");
  filteredTasks = [...allTasks];
  renderView();
}

function renderView() {
  const kanban = document.getElementById("kanbanContainer");
  const list = document.getElementById("listContainer");

  if (currentView === "kanban") {
    kanban.style.display = "grid";
    list.style.display = "none";
    renderKanban();
  } else {
    kanban.style.display = "none";
    list.style.display = "block";
    renderList();
  }
}

function renderKanban() {
  const columns = ["backlog", "todo", "inprogress", "review", "completed"];

  columns.forEach(col => {
    const area = document.getElementById(`kCol_${col}`);
    const countEl = document.getElementById(`kCount_${col}`);
    if (!area) return;

    const colTasks = filteredTasks.filter(t => t.status === col);
    if (countEl) countEl.innerText = colTasks.length;

    area.innerHTML = colTasks.map(t => `
      <div class="task-card" data-task-id="${t.id}">
        <div class="task-card-header">
          <span class="badge badge-priority-${t.priority}">${t.priority}</span>
          <div class="task-assignee-avatar" title="${t.assigneeName || 'Unassigned'}">
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
          <button class="btn btn-ghost btn-sm move-status-btn" data-task-id="${t.id}" data-current="${t.status}" title="Advance status">
            <i class="fa-solid fa-arrows-left-right" style="color: var(--deep-blue-400);"></i>
          </button>
        </div>
      </div>
    `).join('');
  });

  attachCardEvents();
}

function renderList() {
  const tbody = document.getElementById("taskListTbody");
  if (!tbody) return;

  tbody.innerHTML = filteredTasks.map(t => `
    <tr style="cursor: pointer;" onclick="window.tasksOpenDetail('${t.id}')">
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

window.tasksOpenDetail = function(id) {
  openTaskDetail(id);
};

function attachCardEvents() {
  document.querySelectorAll(".task-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".move-status-btn")) return;
      openTaskDetail(card.dataset.taskId);
    });
  });

  document.querySelectorAll(".move-status-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const taskId = btn.dataset.taskId;
      const current = btn.dataset.current;
      const statusCycle = ["backlog", "todo", "inprogress", "review", "completed"];
      const nextIdx = (statusCycle.indexOf(current) + 1) % statusCycle.length;
      const nextStatus = statusCycle[nextIdx];

      await api.updateTask(taskId, { status: nextStatus });
      await loadTasks();
      showToast("Status Updated", `Task moved to ${nextStatus.toUpperCase()}`, "info");
    });
  });
}

function openTaskDetail(taskId) {
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById("modalDetailTitle").innerText = task.title;
  document.getElementById("modalDetailDesc").innerText = task.description || "No description provided.";
  document.getElementById("modalDetailStatus").innerText = task.status.toUpperCase();
  document.getElementById("modalDetailPriority").innerText = task.priority.toUpperCase();
  document.getElementById("modalDetailAssignee").innerText = task.assigneeName || "Unassigned";
  document.getElementById("modalDetailDueDate").innerText = task.dueDate;
  
  document.getElementById("modalDetailSkills").innerHTML = 
    (task.requiredSkills || []).map(s => `<span class="skill-tag">${s}</span>`).join('');

  document.getElementById("modalAskAiBtn").onclick = () => {
    window.location.href = `ai.html?query=${encodeURIComponent(`I am stuck on "${task.title}". Who has the right skills to help me?`)}`;
  };

  document.getElementById("modalDeleteTaskBtn").onclick = async () => {
    if (confirm(`Delete "${task.title}"?`)) {
      await api.deleteTask(task.id);
      closeModal("taskDetailModal");
      await loadTasks();
      showToast("Task Deleted", "Task removed.", "info");
    }
  };

  openModal("taskDetailModal");
}

function filterTasks(query) {
  const q = query.toLowerCase();
  filteredTasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(q) ||
    (t.description && t.description.toLowerCase().includes(q)) ||
    (t.assigneeName && t.assigneeName.toLowerCase().includes(q)) ||
    (t.requiredSkills && t.requiredSkills.some(s => s.toLowerCase().includes(q)))
  );
  renderView();
}

function initEventListeners() {
  // Search input
  const searchInput = document.getElementById("taskSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => filterTasks(e.target.value));
  }

  // Priority filter dropdown
  const priorityFilter = document.getElementById("priorityFilterSelect");
  if (priorityFilter) {
    priorityFilter.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "all") filteredTasks = [...allTasks];
      else filteredTasks = allTasks.filter(t => t.priority === val);
      renderView();
    });
  }

  // View switchers
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentView = btn.dataset.view;
      renderView();
    });
  });

  // Create task modal submit
  const form = document.getElementById("tasksPageCreateForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("newTaskTitle").value.trim();
      const desc = document.getElementById("newTaskDesc").value.trim();
      const priority = document.getElementById("newTaskPriority").value;
      const status = document.getElementById("newTaskStatus").value;
      const skillsStr = document.getElementById("newTaskSkills").value;

      if (!title) return;

      const skills = skillsStr ? skillsStr.split(",").map(s => s.trim()) : ["General"];
      await api.createTask({
        title,
        description: desc,
        priority,
        status,
        requiredSkills: skills
      });

      closeModal("createTaskModal");
      form.reset();
      await loadTasks();
      showToast("Task Created", `"${title}" added.`, "success");
    });
  }
}
