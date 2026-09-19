/**
 * CO-ORD — Projects Page Controller
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let projects = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("projects");
  await renderTopbar("Projects");
  setupModal("newProjectModal");

  await loadProjects();
  initProjectForm();
});

async function loadProjects() {
  projects = await api.fetchProjects();
  renderProjectsGrid();
}

function renderProjectsGrid() {
  const container = document.getElementById("projectsGridContainer");
  if (!container) return;

  container.innerHTML = projects.map(p => `
    <div class="card card-interactive" onclick="window.location.href='workspace.html?id=${p.id}'" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span class="badge ${p.status === 'active' ? 'badge-workload-balanced' : 'badge-workload-low'}">${p.status}</span>
          <span class="text-xs text-muted"><i class="fa-regular fa-clock"></i> Due ${p.dueDate}</span>
        </div>

        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-silver-bright); margin-bottom: 6px;">${p.name}</h3>
        <p style="font-size: 0.86rem; color: var(--text-silver-secondary); line-height: 1.45; margin-bottom: 16px;">
          ${p.description}
        </p>

        <!-- Progress Bar -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 6px;">
            <span class="text-muted">Progress</span>
            <span style="font-weight: 700; color: #38bdf8;">${p.progress}%</span>
          </div>
          <div class="progress-bar-linear" style="height: 6px;">
            <div class="progress-fill" style="width: ${p.progress}%;"></div>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid var(--border-subtle);">
        <div class="avatar-stack">
          <div class="avatar-stack-item">A</div>
          <div class="avatar-stack-item">R</div>
          <div class="avatar-stack-item">M</div>
          <div class="avatar-stack-item">Ar</div>
        </div>
        <span style="font-size: 0.8rem; color: var(--text-silver-muted);">${p.tasksCount} Tasks</span>
      </div>
    </div>
  `).join('');
}

function initProjectForm() {
  const form = document.getElementById("newProjectForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("newProjName").value.trim();
    const desc = document.getElementById("newProjDesc").value.trim();
    const dueDate = document.getElementById("newProjDueDate").value.trim();

    if (!name) return;

    await api.createProject({
      name,
      description: desc,
      dueDate: dueDate || "Nov 2026"
    });

    closeModal("newProjectModal");
    form.reset();
    await loadProjects();
    showToast("Project Created", `"${name}" added to your workspace.`, "success");
  });
}
