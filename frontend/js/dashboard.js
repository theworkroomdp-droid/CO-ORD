/** CO-ORD — Minimal Dashboard Controller */
import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, closeModal } from "./components.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("dashboard");
  await renderTopbar("Dashboard");
  setupModal("createTaskModal");
  await loadDashboardData();
  initDashboardEvents();
});

async function loadDashboardData() {
  const user = api.getCurrentUser();
  const tasks = await api.fetchTasks("proj-1");
  const project = await api.fetchProject("proj-1");
  const completed = tasks.filter(t => t.status === "completed").length;
  const active = tasks.filter(t => t.status !== "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

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
    </a>`).join("") : `<div class="empty-dashboard-state">No upcoming tasks.</div>`;
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
