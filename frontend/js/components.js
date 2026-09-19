/**
 * CO-ORD — Reusable Shell Components (Sidebar, Topbar, Modals, Toasts)
 */

import { api } from "./api.js";

export function renderSidebar(activeTab = "dashboard") {
  const sidebarContainer = document.getElementById("sidebar-container");
  if (!sidebarContainer) return;

  const user = api.getCurrentUser();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-pie", url: "dashboard.html" },
    { id: "workspace", label: "Workspace", icon: "fa-solid fa-layer-group", url: "workspace.html", badge: "Live", badgeClass: "blue" },
    { id: "tasks", label: "My Tasks", icon: "fa-solid fa-list-check", url: "tasks.html", badge: "7" },
    { id: "projects", label: "Projects", icon: "fa-solid fa-folder-tree", url: "projects.html" },
    { id: "team", label: "Team", icon: "fa-solid fa-users", url: "team.html" },
    { id: "ai", label: "AI Assistant", icon: "fa-solid fa-wand-magic-sparkles", url: "ai.html", badge: "AI", badgeClass: "ai" },
    { id: "resources", label: "Resources", icon: "fa-solid fa-bookmark", url: "resources.html" }
  ];

  const html = `
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-brand">
        <a href="dashboard.html" class="brand-logo">
          <div class="logo-mark"><img class="brand-mascot-logo" src="assets/coord-mascot.png" alt="CO-ORD mascot"></div>
          <div class="logo-text-wrap">
            <span class="brand-title">CO-ORD</span>
            <span class="brand-tagline">Coordinate • Complete</span>
          </div>
        </a>
      </div>

      <div class="sidebar-nav">
        <div class="nav-section-label">Main Menu</div>
        ${navItems.map(item => `
          <a href="${item.url}" class="nav-item ${activeTab === item.id ? 'active' : ''}">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge ${item.badgeClass || ''}">${item.badge}</span>` : ''}
          </a>
        `).join('')}

        <div class="nav-section-label" style="margin-top: 14px;">Preferences</div>
        <a href="settings.html" class="nav-item ${activeTab === 'settings' ? 'active' : ''}">
          <i class="fa-solid fa-gear"></i>
          <span>Settings</span>
        </a>
      </div>

      <div class="sidebar-footer">
        <a href="profile.html" class="sidebar-user" title="View Profile">
          <div class="user-avatar">
            ${user.avatar || 'U'}
            <span class="status-dot"></span>
          </div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-role">${user.role}</div>
          </div>
          <i class="fa-solid fa-chevron-right" style="color: var(--text-silver-muted); font-size: 0.75rem;"></i>
        </a>
      </div>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay"></div>
  `;

  sidebarContainer.innerHTML = html;

  // Mobile drawer bindings
  const overlay = document.getElementById("sidebarOverlay");
  const sidebar = document.getElementById("appSidebar");
  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("active");
    });
  }
}

export async function renderTopbar(pageTitle = "Dashboard") {
  const topbarContainer = document.getElementById("topbar-container");
  if (!topbarContainer) return;

  const notifications = await api.fetchNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const html = `
    <header class="topbar">
      <div class="topbar-left">
        <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">
          <i class="fa-solid fa-bars"></i>
        </button>

        <!-- Project Selector Dropdown -->
        <div class="project-selector" id="projectSelectorBtn" title="Switch active project">
          <div class="project-indicator"></div>
          <span class="project-name-display">CO-ORD Hackathon</span>
          <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem; color: var(--text-silver-muted);"></i>
        </div>

        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" class="search-input" id="globalSearchInput" placeholder="Search tasks, members, resources...">
          <span class="search-shortcut">⌘K</span>
        </div>
      </div>

      <div class="topbar-right">
        <a href="ai.html" class="btn btn-ai btn-sm" style="gap: 7px;">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span>Ask AI</span>
        </a>

        <!-- Notifications Dropdown Trigger -->
        <div style="position: relative;">
          <button class="icon-btn" id="notifBtn" aria-label="Notifications">
            <i class="fa-regular fa-bell"></i>
            ${unreadCount > 0 ? `<span class="icon-badge" id="notifBadge">${unreadCount}</span>` : ''}
          </button>
          
          <div class="dropdown-menu" id="notifDropdown" style="width: 320px; right: 0;">
            <div style="padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; font-size: 0.88rem; color: var(--text-silver-bright);">Notifications</span>
              <button id="markAllReadBtn" style="font-size: 0.75rem; color: var(--deep-blue-400); font-weight: 600;">Mark all read</button>
            </div>
            <div id="notifList" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding: 6px;">
              ${notifications.map(n => `
                <div class="dropdown-item ${!n.read ? 'unread-item' : ''}" style="flex-direction: column; align-items: flex-start; gap: 3px; padding: 8px 10px; background: ${!n.read ? 'rgba(37, 99, 235, 0.08)' : 'transparent'}; border-radius: 6px;">
                  <div style="font-size: 0.82rem; color: var(--text-silver-primary); font-weight: ${!n.read ? '600' : '400'};">${n.message}</div>
                  <span style="font-size: 0.7rem; color: var(--text-silver-muted);">${n.time}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- User profile link -->
        <a href="profile.html" class="icon-btn" title="View Profile">
          <i class="fa-regular fa-user"></i>
        </a>
      </div>
    </header>
  `;

  topbarContainer.innerHTML = html;

  // Toggle mobile drawer
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const sidebar = document.getElementById("appSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener("click", () => {
      sidebar.classList.add("mobile-open");
      overlay.classList.add("active");
    });
  }

  // Toggle notifications
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove("active");
      }
    });

    const markAllReadBtn = document.getElementById("markAllReadBtn");
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener("click", async () => {
        await api.markAllNotificationsRead();
        const badge = document.getElementById("notifBadge");
        if (badge) badge.style.display = "none";
        document.querySelectorAll(".unread-item").forEach(el => {
          el.style.background = "transparent";
          el.querySelector("div").style.fontWeight = "400";
        });
        showToast("Notifications", "All notifications marked as read.", "info");
      });
    }
  }

  // Global search mock
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && searchInput.value.trim()) {
        window.location.href = `tasks.html?search=${encodeURIComponent(searchInput.value.trim())}`;
      }
    });
  }
}

// Toast Notification Engine
export function showToast(title, desc, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const iconMap = {
    success: "fa-solid fa-check",
    info: "fa-solid fa-bell",
    warning: "fa-solid fa-triangle-exclamation"
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${iconMap[type] || 'fa-solid fa-bell'}"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${desc}</div>
    </div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

// Modal helper
export function setupModal(modalId) {
  const backdrop = document.getElementById(modalId);
  if (!backdrop) return;

  const closeBtns = backdrop.querySelectorAll(".modal-close, [data-modal-close]");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      backdrop.classList.remove("active");
    });
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      backdrop.classList.remove("active");
    }
  });
}

export function openModal(modalId) {
  const backdrop = document.getElementById(modalId);
  if (backdrop) backdrop.classList.add("active");
}

export function closeModal(modalId) {
  const backdrop = document.getElementById(modalId);
  if (backdrop) backdrop.classList.remove("active");
}
