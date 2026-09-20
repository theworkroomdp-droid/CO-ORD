/** CO-ORD — Dashboard Controller (with time-aware greeting, AI Allocation modal, Sprint widget) */
import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("dashboard");
  await renderTopbar("Dashboard");
  setupModal("createTaskModal");
  setupModal("aiAllocationModal");
  await loadDashboardData();
  initDashboardEvents();
  await loadAISuggestion();
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

async function loadDashboardData() {
  const user = api.getCurrentUser();
  const tasks = await api.fetchTasks("proj-1");
  const project = await api.fetchProject("proj-1");
  const sprints = await api.fetchSprints("proj-1");
  const activeSprint = sprints.find(s => s.status === "active");

  const completed = tasks.filter(t => t.status === "completed").length;
  const active = tasks.filter(t => t.status !== "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  // Time-aware greeting
  const greetEl = document.getElementById("dashboardGreeting");
  if (greetEl) greetEl.textContent = getGreeting();

  const nameEl = document.getElementById("userGreetingName");
  if (nameEl) nameEl.textContent = user.name.split(" ")[0];

  document.getElementById("statTotalTasks").textContent = active;
  document.getElementById("statCompleted").textContent = completed;
  document.getElementById("statTeamProgress").textContent = `${progress}%`;

  document.getElementById("dashboardProjectName").textContent = project.name;
  document.getElementById("dashboardProjectDesc").textContent = project.tagline || project.description || "Your active project workspace.";
  document.getElementById("projectProgressPercent").textContent = `${progress}%`;
  document.getElementById("projectProgressFill").style.width = `${progress}%`;
  document.getElementById("projectTasksRatio").textContent = `${completed} of ${tasks.length} tasks completed`;
  document.getElementById("dashboardProjectDue").textContent = project.dueDate ? `Due ${project.dueDate}` : "No deadline set";

  const list = document.getElementById("dashboardUpcomingTasks");
  const upcoming = tasks.filter(t => t.status !== "completed").slice(0, 4);
  list.innerHTML = upcoming.length ? upcoming.map(t => `
    <a class="upcoming-task" href="tasks.html?id=${t.id}">
      <div><strong>${t.title}</strong><span>${t.assigneeName || "Unassigned"} · ${t.dueDate}</span></div>
      <span class="task-status">${t.status.replace("inprogress", "in progress")}</span>
    </a>`).join("") : `<div class="empty-dashboard-state">No upcoming tasks. You're all caught up!</div>`;

  // Sprint widget
  const sprintEl = document.getElementById("dashboardSprintWidget");
  if (sprintEl && activeSprint) {
    const sprintTasks = tasks.filter(t => activeSprint.taskIds.includes(t.id));
    const sprintDone = sprintTasks.filter(t => t.status === "completed").length;
    const sprintPct = sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0;
    sprintEl.innerHTML = `
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-rocket" style="color:#38bdf8"></i><span>Active Sprint</span></div>
        <a href="sprints.html" class="btn btn-ghost btn-sm">Sprint Board →</a>
      </div>
      <div style="font-size:1rem;font-weight:700;color:var(--text-silver-bright);margin-bottom:4px">${activeSprint.name}</div>
      <div style="font-size:0.8rem;color:var(--text-silver-secondary);margin-bottom:12px">${activeSprint.goal}</div>
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:6px">
        <span class="text-muted">Progress</span>
        <strong style="color:#38bdf8">${sprintPct}%</strong>
      </div>
      <div class="progress-bar-linear"><div class="progress-fill" style="width:${sprintPct}%"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-silver-muted);margin-top:8px">
        <span>${sprintDone} of ${sprintTasks.length} tasks done</span>
        <span>Ends ${activeSprint.endDate}</span>
      </div>`;
  }
}

async function loadAISuggestion() {
  const suggestions = await api.getAISuggestions();
  if (!suggestions.length) return;

  const s = suggestions[0];
  const el = document.getElementById("dashboardAISuggestionCard");
  if (!el) return;
  el.style.display = "block";
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px">
        <i class="fa-solid fa-wand-magic-sparkles" style="color:#38bdf8"></i>
        <span style="font-size:0.82rem;font-weight:700;color:var(--text-silver-bright)">AI Allocation Suggestion</span>
      </div>
      <span class="badge" style="background:rgba(16,185,129,0.2);color:#34d399">${s.matchScore}% Match</span>
    </div>
    <div style="font-size:0.85rem;color:var(--text-silver-secondary);margin-bottom:10px">
      Assign <strong style="color:#fff">${s.taskTitle}</strong> to <strong style="color:#34d399">${s.suggestedMemberName}</strong>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-silver btn-sm" id="dashDismissAI">Dismiss</button>
      <button class="btn btn-primary btn-sm" id="dashAcceptAI" data-task-id="${s.taskId}" data-member-id="${s.suggestedMemberId}" data-member-name="${s.suggestedMemberName}">
        <i class="fa-solid fa-check"></i><span>Accept & Assign</span>
      </button>
    </div>`;

  document.getElementById("dashDismissAI").onclick = () => { el.style.display = "none"; };
  document.getElementById("dashAcceptAI").onclick = async (e) => {
    const btn = e.currentTarget;
    await api.assignTask(btn.dataset.taskId, btn.dataset.memberId);
    el.style.display = "none";
    showToast("Task Assigned", `${btn.dataset.memberName} assigned successfully!`, "success");
    await loadDashboardData();
  };
}

function initDashboardEvents() {
  const form = document.getElementById("quickCreateTaskForm");
  if (!form) return;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const title = document.getElementById("quickTaskTitle").value.trim();
    if (!title) return;
    const skillsValue = document.getElementById("quickTaskSkills").value.trim();
    await api.createTask({
      projectId: "proj-1",
      title,
      priority: document.getElementById("quickTaskPriority").value,
      requiredSkills: skillsValue ? skillsValue.split(",").map(s => s.trim()).filter(Boolean) : ["General"],
      status: "todo"
    });
    closeModal("createTaskModal");
    form.reset();
    showToast("Task Created", `"${title}" added to the workspace.`, "success");
    await loadDashboardData();
  });
}
