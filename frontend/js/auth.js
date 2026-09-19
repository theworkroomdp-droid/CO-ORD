/**
 * CO-ORD — Authentication Logic (Login, Sign-Up, Demo Logins, Dynamic Skills)
 */

import { api } from "./api.js";
import { showToast } from "./components.js";

document.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initSignupForm();
  initDemoLogins();
});

// Login Page Logic
function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;

    if (!email || !pass) {
      showToast("Validation Error", "Please provide your email and password.", "warning");
      return;
    }

    const btn = loginForm.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
    btn.disabled = true;

    try {
      const res = await api.loginUser(email, pass);
      if (res && res.success) {
        showToast("Welcome to CO-ORD", `Logged in as ${res.user.name}`, "success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 600);
      } else {
        showToast("Login Failed", "Invalid credentials. Try quick demo login below.", "warning");
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      showToast("Error", "Authentication service error. Proceeding with demo account.", "info");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 600);
    }
  });
}

// Sign-Up Page Logic
function initSignupForm() {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  // Role Selection Cards
  let selectedCategory = "student";
  const roleCards = document.querySelectorAll(".role-card");
  roleCards.forEach(card => {
    card.addEventListener("click", () => {
      roleCards.forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedCategory = card.dataset.category;
    });
  });

  // Dynamic Skills Tag Input
  const selectedSkills = new Set(["Python", "JavaScript"]);
  const skillsContainer = document.getElementById("skillsTagsContainer");
  const skillsInput = document.getElementById("skillsTextInput");
  const skillPresets = document.querySelectorAll(".skill-chip-preset");

  function renderSkills() {
    if (!skillsContainer) return;
    skillsContainer.innerHTML = Array.from(selectedSkills).map(skill => `
      <span class="skills-tag-pill">
        ${skill}
        <span class="remove-skill" data-skill="${skill}">&times;</span>
      </span>
    `).join('');

    // Attach remove listeners
    skillsContainer.querySelectorAll(".remove-skill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSkills.delete(btn.dataset.skill);
        renderSkills();
      });
    });
  }

  if (skillsInput) {
    skillsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const val = skillsInput.value.trim().replace(",", "");
        if (val && !selectedSkills.has(val)) {
          selectedSkills.add(val);
          skillsInput.value = "";
          renderSkills();
        }
      }
    });
  }

  skillPresets.forEach(preset => {
    preset.addEventListener("click", () => {
      const skill = preset.dataset.skill || preset.innerText.trim();
      if (!selectedSkills.has(skill)) {
        selectedSkills.add(skill);
        renderSkills();
      }
    });
  });

  renderSkills();

  // Form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;
    const bio = document.getElementById("signupBio").value.trim();

    if (!name || !email || !password) {
      showToast("Missing Fields", "Please complete all required fields.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Password Mismatch", "Passwords do not match.", "warning");
      return;
    }

    if (selectedSkills.size === 0) {
      showToast("Skills Needed", "Please specify at least one skill.", "warning");
      return;
    }

    const btn = signupForm.querySelector("button[type='submit']");
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;
    btn.disabled = true;

    const roleName = selectedCategory === "student" ? "Student Builder" : "Working Professional";

    const res = await api.registerUser({
      name,
      email,
      password,
      category: selectedCategory,
      role: roleName,
      skills: Array.from(selectedSkills),
      bio: bio || "Excited to collaborate on hackathons and projects."
    });

    showToast("Account Created", `Welcome to CO-ORD, ${name}!`, "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });
}

// Quick Demo Login Pills
function initDemoLogins() {
  const demoPills = document.querySelectorAll(".demo-pill");
  demoPills.forEach(pill => {
    pill.addEventListener("click", async () => {
      const email = pill.dataset.email;
      if (!email) return;

      showToast("Demo Access", `Signing in as ${pill.querySelector('.demo-pill-name').innerText}...`, "info");
      await api.loginUser(email, "password123");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    });
  });
}
