/**
 * CO-ORD — Profile Page Controller (Editable Skills, Workload Display, Bio Updates)
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast } from "./components.js";

let currentUser;
let userSkills = new Set();

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("profile");
  await renderTopbar("User Profile");

  currentUser = api.getCurrentUser();
  userSkills = new Set(currentUser.skills || ["HTML", "JavaScript"]);

  renderProfileData();
  initSkillTagger();
  initProfileForm();
});

function renderProfileData() {
  document.getElementById("profileName").value = currentUser.name;
  document.getElementById("profileEmail").value = currentUser.email;
  document.getElementById("profileRole").value = currentUser.role;
  document.getElementById("profileBio").value = currentUser.bio || "";
  document.getElementById("profileAvatarDisplay").innerText = currentUser.avatar || "U";
  document.getElementById("profileWorkloadBadge").innerText = `${(currentUser.workload || 'balanced').toUpperCase()} WORKLOAD`;

  renderSkillChips();
}

function renderSkillChips() {
  const container = document.getElementById("profileSkillsContainer");
  if (!container) return;

  container.innerHTML = Array.from(userSkills).map(s => `
    <span class="skills-tag-pill">
      ${s}
      <span class="remove-skill" data-skill="${s}">&times;</span>
    </span>
  `).join('');

  container.querySelectorAll(".remove-skill").forEach(btn => {
    btn.addEventListener("click", () => {
      userSkills.delete(btn.dataset.skill);
      renderSkillChips();
    });
  });
}

function initSkillTagger() {
  const input = document.getElementById("profileSkillInput");
  if (!input) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.value.trim().replace(",", "");
      if (val && !userSkills.has(val)) {
        userSkills.add(val);
        input.value = "";
        renderSkillChips();
      }
    }
  });

  document.querySelectorAll(".profile-preset-skill").forEach(preset => {
    preset.addEventListener("click", () => {
      const s = preset.dataset.skill || preset.innerText.replace("+", "").trim();
      if (!userSkills.has(s)) {
        userSkills.add(s);
        renderSkillChips();
      }
    });
  });
}

function initProfileForm() {
  const form = document.getElementById("profileEditForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const role = document.getElementById("profileRole").value.trim();
    const bio = document.getElementById("profileBio").value.trim();

    currentUser.name = name;
    currentUser.role = role;
    currentUser.bio = bio;
    currentUser.skills = Array.from(userSkills);

    // Save to local store
    const store = JSON.parse(localStorage.getItem("coord_store"));
    if (store) {
      store.currentUser = currentUser;
      const tIdx = store.team.findIndex(m => m.id === currentUser.id || m.email === currentUser.email);
      if (tIdx !== -1) {
        store.team[tIdx].name = name;
        store.team[tIdx].role = role;
        store.team[tIdx].skills = currentUser.skills;
      }
      localStorage.setItem("coord_store", JSON.stringify(store));
    }

    showToast("Profile Updated", "Your skills and role were saved for AI coordination matching.", "success");
    renderSidebar("profile");
  });
}
