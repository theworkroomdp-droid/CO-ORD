/**
 * CO-ORD — Team Directory Controller ("Ask for Help", Profile Modal, Workload Visualization)
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let teamMembers = [];
let selectedProject = null;
let allProjects = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("team");
  await renderTopbar("Team Directory");
  setupModal("memberDetailModal");
  setupModal("askHelpModal");

  // Check URL params for direct help trigger
  const params = new URLSearchParams(window.location.search);
  const askMemberId = params.get("ask");

  await loadProjectSelector();

  if (askMemberId) {
    setTimeout(() => openAskHelpModal(askMemberId), 300);
  }

  initHelpForm();
});

async function loadProjectSelector() {
  allProjects = await api.fetchProjects();
  const select = document.getElementById("teamProjectSelect");
  if (!select) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("project");
  select.innerHTML = `<option value="">Choose a project...</option>` + allProjects.filter(p => !p.archived && p.status !== "archived").map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  select.addEventListener("change", () => selectTeamProject(select.value));
  if (requested && allProjects.some(p => p.id === requested)) { select.value = requested; selectTeamProject(requested); }
}

async function selectTeamProject(projectId) {
  const grid = document.getElementById("teamGridContainer");
  const strip = document.getElementById("selectedTeamProject");
  if (!projectId) { selectedProject = null; teamMembers = []; grid.innerHTML = `<div class="workspace-empty"><i class="fa-solid fa-users"></i><span>Select a project to view its team.</span></div>`; strip.style.display = "none"; const actions = document.getElementById("teamHeaderActions"); if (actions) actions.style.display = "none"; return; }
  selectedProject = allProjects.find(p => p.id === projectId);
  const allTeam = await api.fetchTeamMembers();
  teamMembers = allTeam.filter(m => (selectedProject.members || []).includes(m.id));
  strip.style.display = "flex";
  const actions = document.getElementById("teamHeaderActions"); if (actions) actions.style.display = "flex";
  strip.innerHTML = `<div><span class="hub-eyebrow">SELECTED PROJECT</span><strong>${selectedProject.name}</strong></div><span>${teamMembers.length} member${teamMembers.length === 1 ? "" : "s"}</span>`;
  renderTeamGrid();
}

async function loadTeam() {
  teamMembers = await api.fetchTeamMembers();
  renderTeamGrid();
}

function renderTeamGrid() {
  const container = document.getElementById("teamGridContainer");
  if (!container) return;

  container.innerHTML = teamMembers.map(m => {
    const workloadClass = `badge-workload-${m.workload}`;
    return `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="member-avatar-ring" style="width: 48px; height: 48px; font-size: 1.15rem;">
                ${m.avatar}
              </div>
              <div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-silver-bright);">${m.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-silver-secondary);">${m.role}</div>
              </div>
            </div>
            <span class="badge ${workloadClass}">${m.workload}</span>
          </div>

          <!-- Skills Row -->
          <div style="margin-bottom: 16px;">
            <div class="text-xs text-muted" style="margin-bottom: 6px; text-transform: uppercase;">Skills &amp; Strengths</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${m.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
          </div>

          <!-- Workload & Task Counts -->
          <div style="background: var(--bg-surface-active); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 8px;">
              <span class="text-muted">Workload Capacity:</span>
              <span style="font-weight: 700; color: var(--text-silver-primary); text-transform: capitalize;">${m.workload}</span>
            </div>
            <div class="workload-meter" style="width: 100%; height: 6px;">
              <div class="workload-meter-fill ${m.workload}"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-silver-muted); margin-top: 8px;">
              <span>Active Tasks: <strong>${m.activeTasks}</strong></span>
              <span>Completed: <strong>${m.completedTasks}</strong></span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button class="btn btn-silver btn-sm" onclick="window.viewMemberDetail('${m.id}')">
            <span>View Profile</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.openAskHelpModal('${m.id}')">
            <i class="fa-regular fa-paper-plane"></i>
            <span>Ask for Help</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.viewMemberDetail = function(memberId) {
  const member = teamMembers.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById("profileDetailName").innerText = member.name;
  document.getElementById("profileDetailRole").innerText = member.role;
  document.getElementById("profileDetailAvatar").innerText = member.avatar;
  document.getElementById("profileDetailWorkload").innerText = `${member.workload.toUpperCase()} WORKLOAD`;
  document.getElementById("profileDetailActiveTasks").innerText = member.activeTasks;
  document.getElementById("profileDetailCompletedTasks").innerText = member.completedTasks;
  
  document.getElementById("profileDetailSkills").innerHTML = 
    member.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');

  const askBtn = document.getElementById("profileAskHelpBtn");
  if (askBtn) {
    askBtn.onclick = () => {
      closeModal("memberDetailModal");
      openAskHelpModal(member.id);
    };
  }

  openModal("memberDetailModal");
};

window.openAskHelpModal = function(memberId) {
  const member = teamMembers.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById("helpTargetMemberName").innerText = member.name;
  document.getElementById("helpTargetMemberRole").innerText = member.role;
  document.getElementById("helpTargetMemberId").value = member.id;
  document.getElementById("helpMessageInput").value = `Hey ${member.name}, could you help me with task coordination on the hackathon project?`;

  openModal("askHelpModal");
};

function initHelpForm() {
  const form = document.getElementById("askHelpForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const memberId = document.getElementById("helpTargetMemberId").value;
    const msg = document.getElementById("helpMessageInput").value.trim();
    const member = teamMembers.find(m => m.id === memberId);

    if (!member || !msg) return;

    closeModal("askHelpModal");
    showToast("Help Request Sent", `Your message was sent to ${member.name}. They will be notified in workspace chat.`, "success");

    // Also send a simulated notification into workspace chat
    await api.sendWorkspaceMessage(selectedProject?.id || "proj-1", `[Help Request to @${member.name}]: ${msg}`);
  });
}
