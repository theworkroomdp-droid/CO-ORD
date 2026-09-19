/**
 * CO-ORD — Resources Page Controller (Knowledge Library, Filtering, Chrome Extension Integration)
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let allResources = [];
let filteredResources = [];
let currentCategory = "all";
let selectedProject = null;
let allProjects = [];

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("resources");
  await renderTopbar("Project Resources");
  setupModal("addResourceModal");
  setupModal("chromeExtensionModal");

  await loadProjectSelector();
  initCategoryFilter();
  initSearch();
  initAddResourceForm();
});

async function loadProjectSelector() {
  allProjects = await api.fetchProjects();
  const select = document.getElementById("resourceProjectSelect");
  if (!select) return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("project");
  select.innerHTML = `<option value="">Choose a project...</option>` + allProjects.filter(p => !p.archived && p.status !== "archived").map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  select.addEventListener("change", () => selectResourceProject(select.value));
  if (requested && allProjects.some(p => p.id === requested)) { select.value = requested; selectResourceProject(requested); }
}

async function selectResourceProject(projectId) {
  const grid = document.getElementById("resourcesGridContainer");
  const strip = document.getElementById("selectedResourceProject");
  if (!projectId) { selectedProject = null; allResources = []; filteredResources = []; strip.style.display = "none"; document.getElementById("resourceProjectContent").style.display = "none"; grid.innerHTML = `<div style="grid-column:1/-1"><div class="workspace-empty"><i class="fa-solid fa-bookmark"></i><span>Select a project to view its resources.</span></div></div>`; return; }
  selectedProject = allProjects.find(p => p.id === projectId);
  strip.style.display = "flex";
  document.getElementById("resourceProjectContent").style.display = "block";
  strip.innerHTML = `<div><span class="hub-eyebrow">SELECTED PROJECT</span><strong>${selectedProject.name}</strong></div><span>Project Resource Library</span>`;
  await loadResources();
}

async function loadResources() {
  allResources = await api.fetchResources(selectedProject?.id || "proj-1");
  filteredResources = [...allResources];
  renderResourcesGrid();
}

function renderResourcesGrid() {
  const container = document.getElementById("resourcesGridContainer");
  if (!container) return;

  if (filteredResources.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-silver-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: var(--deep-blue-400);"></i>
        <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-silver-bright);">No resources found</div>
        <p style="font-size: 0.85rem; margin-top: 4px;">Try a different search query or add a new resource.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredResources.map(r => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span class="badge" style="background: rgba(37, 99, 235, 0.15); color: #60a5fa;">${r.category}</span>
          ${r.savedViaExtension ? `
            <span class="chrome-badge" title="Saved via CO-ORD Chrome Extension">
              <i class="fa-brands fa-chrome"></i>
              <span>Chrome Extension</span>
            </span>
          ` : ''}
        </div>

        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-silver-bright); margin-bottom: 6px; line-height: 1.35;">
          ${r.title}
        </h3>

        <a href="${r.url}" target="_blank" style="font-size: 0.78rem; color: #38bdf8; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 10px;">
          <span>${r.domain}</span>
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.68rem;"></i>
        </a>

        <p style="font-size: 0.84rem; color: var(--text-silver-secondary); line-height: 1.45; margin-bottom: 14px;">
          ${r.description}
        </p>

        <!-- Tags -->
        <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px;">
          ${(r.tags || []).map(t => `<span class="skill-tag">${t}</span>`).join('')}
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
        <span class="text-xs text-muted">Added by <strong>${r.addedBy}</strong> • ${r.date}</span>
        <a href="${r.url}" target="_blank" class="btn btn-silver btn-sm">
          <span>Open Link</span>
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.72rem;"></i>
        </a>
      </div>
    </div>
  `).join('');
}

function initCategoryFilter() {
  const pills = document.querySelectorAll(".category-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.dataset.category;

      if (currentCategory === "all") {
        filteredResources = [...allResources];
      } else {
        filteredResources = allResources.filter(r => r.category.toLowerCase() === currentCategory.toLowerCase());
      }
      renderResourcesGrid();
    });
  });
}

function initSearch() {
  const input = document.getElementById("resourceSearchInput");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    filteredResources = allResources.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.domain.toLowerCase().includes(q) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(q)))
    );
    renderResourcesGrid();
  });
}

function initAddResourceForm() {
  const form = document.getElementById("addResourceForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!selectedProject) { showToast("Select a Project", "Choose a project before adding a resource.", "error"); return; }
    const title = document.getElementById("newResTitle").value.trim();
    const url = document.getElementById("newResUrl").value.trim();
    const category = document.getElementById("newResCategory").value;
    const desc = document.getElementById("newResDesc").value.trim();
    const tagsStr = document.getElementById("newResTags").value.trim();

    if (!title || !url) return;

    let domain = "web";
    try {
      domain = new URL(url).hostname;
    } catch (e) {
      domain = url;
    }

    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()) : ["Reference"];

    await api.saveResource({
      title,
      url,
      domain,
      category,
      description: desc,
      projectId: selectedProject.id,
      tags,
      savedViaExtension: false
    });

    closeModal("addResourceModal");
    form.reset();
    await loadResources();
    showToast("Resource Added", `"${title}" added to knowledge library.`, "success");
  });
}
