/**
 * CO-ORD — AI Assistant Workspace Controller
 * Interactive chat, quick prompts, recommendation cards, and AI task allocation engine.
 */

import { api } from "./api.js";
import { renderSidebar, renderTopbar, showToast, setupModal, openModal, closeModal } from "./components.js";

let chatHistory = [
  {
    sender: "ai",
    text: "Hello Alex! I am **CO-ORD AI**, your intelligent project coordinator. I analyze task dependencies, team member skills, and workload distribution to keep your hackathon team on track.",
    recommendation: null
  },
  {
    sender: "user",
    text: "I am stuck on implementing the authentication API. Who can help me?",
    recommendation: null
  },
  {
    sender: "ai",
    text: "Based on team skills and current workload, **Rahul** and **Anu** are your top matches. Rahul has 65% of the FastAPI auth structure ready and has a balanced workload with capacity to collaborate.",
    recommendation: {
      collaborator: "Rahul",
      role: "Backend Developer",
      skills: ["Python", "FastAPI", "PostgreSQL"],
      workload: "Balanced (3 tasks)",
      matchScore: "94%",
      reason: "Directly owns the auth endpoints in FastAPI and currently has open capacity.",
      actionText: "Ask Rahul",
      actionTarget: "mem-2"
    }
  }
];

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar("ai");
  await renderTopbar("AI Assistant");
  setupModal("aiAllocationModal");

  // Check URL query for forwarded prompt (e.g. from "Ask AI for Help" buttons)
  const params = new URLSearchParams(window.location.search);
  const forwardedQuery = params.get("query");

  renderChatStream();
  initChatInput();
  initQuickActions();

  if (forwardedQuery) {
    handleUserMessage(forwardedQuery);
  }
});

function renderChatStream() {
  const stream = document.getElementById("aiChatStream");
  if (!stream) return;

  const user = api.getCurrentUser();

  stream.innerHTML = chatHistory.map(msg => {
    const isAi = msg.sender === "ai";
    return `
      <div class="ai-message ${isAi ? 'ai' : 'user'}">
        <div class="ai-msg-avatar ${isAi ? 'ai' : 'user'}">
          ${isAi ? '<i class="fa-solid fa-wand-magic-sparkles"></i>' : (user.avatar || 'U')}
        </div>
        <div class="ai-msg-content" style="${isAi ? 'max-width: 680px;' : 'max-width: 580px;'}">
          <div class="ai-msg-bubble">
            ${formatMarkdown(msg.text)}
          </div>

          ${msg.recommendation ? renderRecommendationCard(msg.recommendation) : ''}
        </div>
      </div>
    `;
  }).join('');

  stream.scrollTop = stream.scrollHeight;
}

function renderRecommendationCard(rec) {
  return `
    <div class="ai-recommendation-card">
      <div class="rec-header">
        <div class="rec-collab-badge">
          <i class="fa-solid fa-brain"></i>
          <span>Recommended Collaborator</span>
        </div>
        <span class="rec-match-score">${rec.matchScore} Match</span>
      </div>

      <div class="rec-member-profile">
        <div class="rec-member-avatar">${rec.collaborator.substring(0, 2).toUpperCase()}</div>
        <div class="rec-member-details">
          <div class="rec-member-name">${rec.collaborator}</div>
          <div style="font-size: 0.74rem; color: var(--text-silver-secondary);">${rec.role} • ${rec.workload}</div>
          <div class="rec-member-skills">
            ${rec.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="rec-reasoning">
        <i class="fa-solid fa-circle-info" style="color: #38bdf8; margin-right: 4px;"></i>
        ${rec.reason}
      </div>

      <div class="rec-actions">
        <button class="btn btn-silver btn-sm" onclick="window.location.href='team.html?ask=${rec.actionTarget}'">
          <span>View Profile</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="window.askCollaborator('${rec.collaborator}', '${rec.actionTarget}')">
          <i class="fa-regular fa-paper-plane"></i>
          <span>${rec.actionText}</span>
        </button>
      </div>
    </div>
  `;
}

window.askCollaborator = async function(name, memberId) {
  await api.sendWorkspaceMessage("proj-1", `Hey @${name}, could we collaborate on the authentication API? AI recommended your skill match.`);
  showToast("Request Sent", `Collaboration request dispatched to ${name} in project chat!`, "success");
};

function initChatInput() {
  const form = document.getElementById("aiChatForm");
  const input = document.getElementById("aiChatInput");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    handleUserMessage(text);
  });
}

async function handleUserMessage(query) {
  // Push user msg
  chatHistory.push({ sender: "user", text: query, recommendation: null });
  renderChatStream();

  // Show analyzing status
  const statusEl = document.getElementById("aiStatusIndicator");
  if (statusEl) statusEl.innerText = "Analyzing project state...";

  const banner = document.getElementById("aiAnalyzingBanner");
  if (banner) banner.style.display = "flex";

  // Simulate network thinking
  setTimeout(async () => {
    const res = await api.askAI(query);
    if (banner) banner.style.display = "none";
    if (statusEl) statusEl.innerText = "Ready • Project Synchronized";

    chatHistory.push({
      sender: "ai",
      text: res.answer,
      recommendation: res.recommendation ? {
        collaborator: res.recommendation.collaborator,
        role: res.recommendation.role,
        skills: res.recommendation.skills,
        workload: res.recommendation.workload,
        matchScore: "92%",
        reason: res.recommendation.reason,
        actionText: res.recommendation.actionText,
        actionTarget: "mem-2"
      } : null
    });

    renderChatStream();
  }, 1200);
}

function initQuickActions() {
  document.querySelectorAll(".ai-quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "allocate") {
        openAllocationModal();
      } else if (action === "help") {
        handleUserMessage("Who can help me with the current task blockers?");
      } else if (action === "workload") {
        handleUserMessage("Analyze team workload and tell me if anyone is overloaded.");
      } else if (action === "progress") {
        handleUserMessage("Summarize project progress and upcoming deadlines.");
      } else if (action === "resources") {
        handleUserMessage("Find relevant resources saved for FastAPI and authentication.");
      }
    });
  });

  // Modal decision buttons
  const acceptBtn = document.getElementById("aiModalAcceptBtn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", async () => {
      const taskId = acceptBtn.dataset.taskId || "task-107";
      const memberId = acceptBtn.dataset.memberId || "mem-2";
      const memberName = acceptBtn.dataset.memberName || "Rahul";

      await api.assignTask(taskId, memberId);
      closeModal("aiAllocationModal");
      showToast("Task Assigned", `Task assigned to ${memberName}. Workload successfully re-balanced.`, "success");

      chatHistory.push({
        sender: "ai",
        text: `✅ **Task Allocation Confirmed**: "Optimize async database queries" has been assigned to **${memberName}**. The team workload has been recalculated and updated on the dashboard.`,
        recommendation: null
      });
      renderChatStream();
    });
  }

  const rejectBtn = document.getElementById("aiModalRejectBtn");
  if (rejectBtn) {
    rejectBtn.addEventListener("click", () => {
      closeModal("aiAllocationModal");
      showToast("Suggestion Dismissed", "AI allocation suggestion dismissed.", "info");
    });
  }
}

async function openAllocationModal() {
  const suggestions = await api.getAISuggestions();
  if (!suggestions.length) {
    showToast("AI Allocation", "No pending allocation suggestions. Workload is balanced!", "info");
    return;
  }

  const s = suggestions[0];
  document.getElementById("aiModalTaskTitle").innerText = s.taskTitle;
  document.getElementById("aiModalTaskSkills").innerHTML = s.requiredSkills.map(sk => `<span class="skill-tag">${sk}</span>`).join('');
  document.getElementById("aiModalCurrentAssignee").innerText = s.currentAssignee;
  document.getElementById("aiModalSuggestedMember").innerText = s.suggestedMemberName;
  document.getElementById("aiModalMatchScore").innerText = `${s.matchScore}% Match`;
  document.getElementById("aiModalReason").innerText = s.reason;

  const acceptBtn = document.getElementById("aiModalAcceptBtn");
  acceptBtn.dataset.taskId = s.taskId;
  acceptBtn.dataset.memberId = s.suggestedMemberId;
  acceptBtn.dataset.memberName = s.suggestedMemberName;

  openModal("aiAllocationModal");
}

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}
