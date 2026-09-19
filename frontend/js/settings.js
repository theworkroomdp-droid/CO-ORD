/**
 * CO-ORD — Settings Page Controller
 */

import { renderSidebar, renderTopbar, showToast } from "./components.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("settings");
  await renderTopbar("Settings");

  initSettingsTabs();
  initSettingsActions();
});

function initSettingsTabs() {
  const tabs = document.querySelectorAll(".settings-tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.section;
      document.querySelectorAll(".settings-section").forEach(s => s.style.display = "none");
      const section = document.getElementById(`section_${target}`);
      if (section) section.style.display = "block";
    });
  });
}

function initSettingsActions() {
  const saveBtn = document.getElementById("saveSettingsBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      showToast("Settings Saved", "Preferences updated successfully.", "success");
    });
  }

  const resetBtn = document.getElementById("resetDemoDataBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset demo data to initial hackathon defaults?")) {
        localStorage.removeItem("coord_store");
        showToast("Demo Data Reset", "Local data restored to clean state.", "info");
        setTimeout(() => window.location.reload(), 700);
      }
    });
  }
}
