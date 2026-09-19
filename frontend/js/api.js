/**
 * CO-ORD — API Client & Local State Abstraction Layer
 * Configured for REST communication with Python FastAPI backend (http://localhost:8000)
 * Seamlessly falls back to reactive localStorage store for standalone demo evaluation.
 */

const API_BASE_URL = "http://localhost:8000";

// Seed Data for Instant Hackathon Demonstration
const DEFAULT_STORE = {
  currentUser: {
    id: "user-1",
    name: "Alex Rivera",
    email: "alex@coord.io",
    role: "Full-Stack Builder",
    category: "student", // "student" or "professional"
    skills: ["Python", "FastAPI", "JavaScript", "HTML/CSS", "UI/UX"],
    bio: "Passionate hackathon participant focused on building AI-powered productivity software.",
    workload: "balanced",
    avatar: "AR"
  },
  team: [
    {
      id: "mem-1",
      name: "Anu",
      role: "Frontend Developer",
      skills: ["HTML", "CSS", "JavaScript", "React", "UI Components"],
      activeTasks: 3,
      completedTasks: 8,
      workload: "balanced",
      avatar: "A",
      email: "anu@coord.io",
      availableToHelp: true
    },
    {
      id: "mem-2",
      name: "Rahul",
      role: "Backend Developer",
      skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "REST"],
      activeTasks: 3,
      completedTasks: 6,
      workload: "balanced",
      avatar: "R",
      email: "rahul@coord.io",
      availableToHelp: true
    },
    {
      id: "mem-3",
      name: "Meera",
      role: "AI/ML Engineer",
      skills: ["PyTorch", "NLP", "Prompt Engineering", "Python", "Data Science"],
      activeTasks: 1,
      completedTasks: 5,
      workload: "low",
      avatar: "M",
      email: "meera@coord.io",
      availableToHelp: true
    },
    {
      id: "mem-4",
      name: "Arjun",
      role: "UI/UX Designer",
      skills: ["Figma", "Design Systems", "Prototyping", "Wireframing", "User Research"],
      activeTasks: 5,
      completedTasks: 9,
      workload: "high",
      avatar: "Ar",
      email: "arjun@coord.io",
      availableToHelp: false
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "CO-ORD Hackathon",
      tagline: "AI-Powered Collaborative Task Management Platform",
      description: "Building the next-gen collaborative workspace for hackathons, student teams, and fast-moving project groups.",
      status: "active",
      progress: 72,
      dueDate: "Sep 22, 2026",
      tasksCount: 7,
      completedCount: 3,
      members: ["mem-1", "mem-2", "mem-3", "mem-4", "user-1"],
      ownerId: "user-1",
      roomCode: "COORD26"
    },
    {
      id: "proj-2",
      name: "AI Research Paper Assistant",
      tagline: "Automated synthesis of arXiv papers with RAG",
      description: "Research exploration tool helping graduate students summarize technical literature.",
      status: "active",
      progress: 45,
      dueDate: "Oct 15, 2026",
      tasksCount: 12,
      completedCount: 5,
      members: ["mem-2", "mem-3"],
      ownerId: "user-1",
      roomCode: "AIRESEARCH"
    },
    {
      id: "proj-3",
      name: "College Mini Project",
      tagline: "Decentralized attendance tracking system",
      description: "Semester academic submission focused on secure student record verification.",
      status: "planning",
      progress: 20,
      dueDate: "Nov 01, 2026",
      tasksCount: 6,
      completedCount: 1,
      members: ["mem-1", "user-1"],
      ownerId: "user-1",
      roomCode: "MINIPROJ"
    }
  ],
  tasks: [
    {
      id: "task-101",
      projectId: "proj-1",
      title: "Design dashboard UI & Design System",
      description: "Establish modern dark obsidian and silver components, typography tokens, and responsive layout.",
      status: "completed",
      priority: "high",
      assigneeId: "mem-4",
      assigneeName: "Arjun",
      requiredSkills: ["Figma", "Design Systems"],
      dueDate: "Yesterday",
      progress: 100
    },
    {
      id: "task-102",
      projectId: "proj-1",
      title: "Build authentication API with FastAPI",
      description: "Implement JWT login, user registration endpoints, and password hashing security.",
      status: "inprogress",
      priority: "urgent",
      assigneeId: "mem-2",
      assigneeName: "Rahul",
      requiredSkills: ["Python", "FastAPI"],
      dueDate: "Tomorrow",
      progress: 65
    },
    {
      id: "task-103",
      projectId: "proj-1",
      title: "Implement task management & Kanban board",
      description: "Provide drag-and-drop or status column updating with real-time state synchronization.",
      status: "inprogress",
      priority: "high",
      assigneeId: "mem-1",
      assigneeName: "Anu",
      requiredSkills: ["HTML", "JavaScript", "CSS"],
      dueDate: "In 2 days",
      progress: 50
    },
    {
      id: "task-104",
      projectId: "proj-1",
      title: "Integrate AI assistant & workload allocation",
      description: "Connect intelligent matching algorithm to recommend collaborators based on skill compatibility and load.",
      status: "todo",
      priority: "urgent",
      assigneeId: "mem-3",
      assigneeName: "Meera",
      requiredSkills: ["Python", "Prompt Engineering"],
      dueDate: "In 3 days",
      progress: 15
    },
    {
      id: "task-105",
      projectId: "proj-1",
      title: "Create Chrome extension resource clipper",
      description: "Lightweight popup extension allowing members to clip documentation links directly to project library.",
      status: "backlog",
      priority: "medium",
      assigneeId: "mem-1",
      assigneeName: "Anu",
      requiredSkills: ["JavaScript", "Chrome API"],
      dueDate: "In 4 days",
      progress: 0
    },
    {
      id: "task-106",
      projectId: "proj-1",
      title: "Prepare presentation slides & live demo script",
      description: "Synthesize problem statement, solution demo, and AI workflow into a high-impact 3-minute pitch deck.",
      status: "todo",
      priority: "medium",
      assigneeId: "mem-4",
      assigneeName: "Arjun",
      requiredSkills: ["Design Systems", "Prototyping"],
      dueDate: "In 5 days",
      progress: 25
    },
    {
      id: "task-107",
      projectId: "proj-1",
      title: "Optimize async database queries & connection pool",
      description: "Tune PostgreSQL connection pooler and async SQLAlchemy models for sub-20ms queries.",
      status: "backlog",
      priority: "high",
      assigneeId: null,
      assigneeName: "Unassigned",
      requiredSkills: ["Python", "PostgreSQL", "FastAPI"],
      dueDate: "In 3 days",
      progress: 0
    }
  ],
  resources: [
    {
      id: "res-1",
      projectId: "proj-1",
      title: "FastAPI Dependency Injection & Security Best Practices",
      url: "https://fastapi.tiangolo.com/tutorial/security/",
      domain: "fastapi.tiangolo.com",
      description: "Comprehensive guide on OAuth2 password bearer tokens and JWT validation for backend services.",
      category: "Documentation",
      addedBy: "Rahul",
      date: "Sep 18, 2026",
      tags: ["Backend", "FastAPI", "Security"],
      savedViaExtension: true
    },
    {
      id: "res-2",
      projectId: "proj-1",
      title: "Linear App Interface Design Breakdown & Motion Principles",
      url: "https://uxdesign.cc/linear-design-system",
      domain: "uxdesign.cc",
      description: "Deep dive into keyboard shortcuts, micro-interactions, and dark mode UI hierarchy.",
      category: "Articles",
      addedBy: "Arjun",
      date: "Sep 19, 2026",
      tags: ["UI/UX", "Design", "Micro-Interactions"],
      savedViaExtension: true
    },
    {
      id: "res-3",
      projectId: "proj-1",
      title: "Building Lightweight Real-time Apps with WebSockets & Vanilla JS",
      url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket",
      domain: "developer.mozilla.org",
      description: "Standard WebSocket API spec for bidirectional client-server event streams without heavy client libraries.",
      category: "Documentation",
      addedBy: "Anu",
      date: "Sep 19, 2026",
      tags: ["Frontend", "WebSockets", "VanillaJS"],
      savedViaExtension: false
    },
    {
      id: "res-4",
      projectId: "proj-1",
      title: "Prompt Engineering for Collaborative Multi-Agent Systems",
      url: "https://learnprompting.org/docs/agents",
      domain: "learnprompting.org",
      description: "Formulas and system prompts for intelligent workload leveling and skill matching in teams.",
      category: "References",
      addedBy: "Meera",
      date: "Sep 19, 2026",
      tags: ["AI/ML", "LLM", "Prompting"],
      savedViaExtension: true
    }
  ],
  notifications: [
    {
      id: "notif-1",
      message: "Anu accepted your help request for Task Management UI.",
      type: "success",
      time: "10m ago",
      read: false
    },
    {
      id: "notif-2",
      message: "AI suggested 2 task reallocations to balance Arjun's high workload.",
      type: "info",
      time: "35m ago",
      read: false
    },
    {
      id: "notif-3",
      message: "Your task 'Build authentication API' is due tomorrow.",
      type: "warning",
      time: "2h ago",
      read: true
    },
    {
      id: "notif-4",
      message: "Rahul added a new resource from Chrome Extension.",
      type: "info",
      time: "5h ago",
      read: true
    }
  ],
  aiSuggestions: [
    {
      id: "sugg-1",
      taskId: "task-107",
      taskTitle: "Optimize async database queries",
      requiredSkills: ["Python", "FastAPI", "PostgreSQL"],
      currentAssignee: "Unassigned",
      suggestedMemberId: "mem-2",
      suggestedMemberName: "Rahul",
      matchScore: 94,
      reason: "Rahul has high proficiency in Python and FastAPI with a balanced workload and capacity for 1 more task."
    },
    {
      id: "sugg-2",
      taskId: "task-106",
      taskTitle: "Prepare presentation slides & live demo script",
      requiredSkills: ["Design Systems", "Prototyping"],
      currentAssignee: "Arjun (High Workload)",
      suggestedMemberId: "mem-1",
      suggestedMemberName: "Anu",
      matchScore: 88,
      reason: "Arjun currently has 5 active tasks (High Workload). Anu has frontend design experience and balanced workload."
    }
  ],
  workspaceMessages: [
    {
      id: "msg-1",
      senderId: "mem-2",
      senderName: "Rahul",
      role: "Backend Developer",
      avatarClass: "avatar-rahul",
      avatar: "R",
      time: "10:15 AM",
      text: "Hey team! I just set up the initial FastAPI boilerplate with OAuth2 password bearer tokens. You can check the documentation resource I saved.",
      taskMention: null
    },
    {
      id: "msg-2",
      senderId: "mem-1",
      senderName: "Anu",
      role: "Frontend Developer",
      avatarClass: "avatar-anu",
      avatar: "A",
      time: "10:18 AM",
      text: "Awesome Rahul! I'm polishing the Kanban card drag handlers in pure JavaScript right now. Will plug into your endpoints once ready.",
      taskMention: "task-103"
    },
    {
      id: "msg-3",
      senderId: "mem-3",
      senderName: "Meera",
      role: "AI/ML Engineer",
      avatarClass: "avatar-meera",
      avatar: "M",
      time: "10:24 AM",
      text: "I finished the prompt schema for skill-to-task compatibility scoring. It achieves a 94% accuracy score for recommended collaborators!",
      taskMention: "task-104"
    },
    {
      id: "msg-4",
      senderId: "mem-4",
      senderName: "Arjun",
      role: "UI/UX Designer",
      avatarClass: "avatar-arjun",
      avatar: "Ar",
      time: "10:30 AM",
      text: "Design system tokens (Obsidian Black, Silver, Deep Blue) look super crisp. Make sure to check the preview cards on the login page.",
      taskMention: "task-101"
    }
  ]
};

// Local Store Management
function getStore() {
  const data = localStorage.getItem("coord_store");
  if (!data) {
    localStorage.setItem("coord_store", JSON.stringify(DEFAULT_STORE));
    return DEFAULT_STORE;
  }
  try {
    const store = JSON.parse(data);
    // Lightweight migration for stores created before private room codes existed.
    (store.projects || []).forEach((project, index) => {
      if (!project.ownerId) project.ownerId = (project.members || []).includes(store.currentUser?.id) ? store.currentUser.id : "user-1";
      if (!project.roomCode) project.roomCode = ["COORD26", "AIRESEARCH", "MINIPROJ"][index] || `ROOM-${String(index + 1).padStart(2, "0")}`;
    });
    localStorage.setItem("coord_store", JSON.stringify(store));
    return store;
  } catch (e) {
    return DEFAULT_STORE;
  }
}

function saveStore(store) {
  localStorage.setItem("coord_store", JSON.stringify(store));
}

// REST Client with local fallback
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // Graceful fallback to reactive local mock store
    return null;
  }
}

// ==========================================================================
// API EXPORTED FUNCTIONS
// ==========================================================================

export const api = {
  // Authentication
  async loginUser(email, password) {
    const remote = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (remote) return remote;

    const store = getStore();
    // Support demo logins
    const foundMember = store.team.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (foundMember) {
      store.currentUser = {
        id: foundMember.id,
        name: foundMember.name,
        email: foundMember.email,
        role: foundMember.role,
        category: "professional",
        skills: foundMember.skills,
        bio: `${foundMember.role} at CO-ORD`,
        workload: foundMember.workload,
        avatar: foundMember.avatar
      };
      saveStore(store);
      return { success: true, user: store.currentUser };
    }

    // Default user session
    return { success: true, user: store.currentUser };
  },

  async registerUser(userData) {
    const remote = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });
    if (remote) return remote;

    const store = getStore();
    const newUser = {
      id: "user-" + Date.now(),
      name: userData.name || "New Team Member",
      email: userData.email,
      role: userData.role || (userData.category === "student" ? "Student Builder" : "Professional"),
      category: userData.category || "student",
      skills: userData.skills || ["HTML", "JavaScript"],
      bio: userData.bio || "Excited to collaborate on hackathons and projects.",
      workload: "low",
      avatar: (userData.name || "U").substring(0, 2).toUpperCase()
    };

    store.currentUser = newUser;
    // Add to team list as well
    store.team.push({
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      skills: newUser.skills,
      activeTasks: 0,
      completedTasks: 0,
      workload: "low",
      avatar: newUser.avatar,
      email: newUser.email,
      availableToHelp: true
    });
    saveStore(store);
    return { success: true, user: newUser };
  },

  getCurrentUser() {
    return getStore().currentUser;
  },

  // Projects
  async fetchProjects() {
    const remote = await request("/api/projects");
    if (remote) return remote;
    return getStore().projects;
  },

  async fetchProject(id = "proj-1") {
    const remote = await request(`/api/projects/${id}`);
    if (remote) return remote;
    const store = getStore();
    return store.projects.find(p => p.id === id) || store.projects[0];
  },

  async createProject(projectData) {
    const remote = await request("/api/projects", {
      method: "POST",
      body: JSON.stringify(projectData)
    });
    if (remote) return remote;

    const store = getStore();
    const newProj = {
      id: "proj-" + Date.now(),
      name: projectData.name,
      tagline: projectData.tagline || "",
      description: projectData.description || "",
      status: "active",
      progress: 0,
      dueDate: projectData.dueDate || "Oct 2026",
      tasksCount: 0,
      completedCount: 0,
      members: Array.from(new Set([getStore().currentUser?.id || "user-1", ...(projectData.memberIds || [])])),
      ownerId: projectData.ownerId || getStore().currentUser?.id || "user-1",
      roomCode: String(projectData.roomCode || "").trim().toUpperCase(),
      archived: false
    };
    store.projects.push(newProj);
    saveStore(store);
    return newProj;
  },

  // Tasks
  async fetchTasks(projectId = "proj-1") {
    const remote = await request(`/api/projects/${projectId}/tasks`);
    if (remote) return remote;
    const store = getStore();
    return store.tasks.filter(t => t.projectId === projectId);
  },

  async createTask(taskData) {
    const remote = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(taskData)
    });
    if (remote) return remote;

    const store = getStore();
    const newTask = {
      id: "task-" + (100 + store.tasks.length + 1),
      projectId: taskData.projectId || "proj-1",
      title: taskData.title,
      description: taskData.description || "",
      status: taskData.status || "todo",
      priority: taskData.priority || "medium",
      assigneeId: taskData.assigneeId || null,
      assigneeName: taskData.assigneeName || "Unassigned",
      requiredSkills: taskData.requiredSkills || ["General"],
      dueDate: taskData.dueDate || "In 3 days",
      progress: 0
    };

    store.tasks.push(newTask);
    // Update project stats
    const proj = store.projects.find(p => p.id === newTask.projectId);
    if (proj) proj.tasksCount += 1;

    saveStore(store);
    return newTask;
  },

  async updateTask(taskId, updates) {
    const remote = await request(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
    if (remote) return remote;

    const store = getStore();
    const idx = store.tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      store.tasks[idx] = { ...store.tasks[idx], ...updates };
      
      // Update workload if status changed
      if (updates.status === "completed") {
        store.tasks[idx].progress = 100;
      }
      saveStore(store);
      return store.tasks[idx];
    }
    return null;
  },

  async deleteTask(taskId) {
    const remote = await request(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (remote) return remote;

    const store = getStore();
    store.tasks = store.tasks.filter(t => t.id !== taskId);
    saveStore(store);
    return { success: true };
  },

  async assignTask(taskId, memberId) {
    const store = getStore();
    const member = store.team.find(m => m.id === memberId);
    if (!member) return null;

    const updated = await this.updateTask(taskId, {
      assigneeId: member.id,
      assigneeName: member.name,
      status: "inprogress"
    });

    // Update workload
    member.activeTasks += 1;
    if (member.activeTasks >= 5) member.workload = "high";
    else if (member.activeTasks >= 2) member.workload = "balanced";
    else member.workload = "low";

    // Remove suggestion if matched
    store.aiSuggestions = store.aiSuggestions.filter(s => s.taskId !== taskId);

    // Add notification
    store.notifications.unshift({
      id: "notif-" + Date.now(),
      message: `Task '${updated.title}' assigned to ${member.name}.`,
      type: "success",
      time: "Just now",
      read: false
    });

    saveStore(store);
    return updated;
  },

  // Team
  async validateWorkspaceAccess(projectId, roomCode) {
    const normalizedCode = String(roomCode || "").trim().toUpperCase();
    const remote = await request(`/api/projects/${projectId}/access`, {
      method: "POST",
      body: JSON.stringify({ roomCode: normalizedCode })
    });
    if (remote) return remote;

    const store = getStore();
    const project = store.projects.find(p => p.id === projectId);
    const user = store.currentUser;
    if (!project || !user) return { success: false, reason: "workspace_not_found" };
    if (project.archived || project.status === "archived") return { success: false, reason: "workspace_archived" };
    if (!(project.members || []).includes(user.id)) return { success: false, reason: "not_a_member" };
    if (!project.roomCode || project.roomCode.toUpperCase() !== normalizedCode) return { success: false, reason: "invalid_code" };
    return { success: true, projectId };
  },

  async getWorkspaceAccessInfo(projectId) {
    const remote = await request(`/api/projects/${projectId}/access-info`);
    if (remote) return remote;
    const store = getStore();
    const project = store.projects.find(p => p.id === projectId);
    const user = store.currentUser;
    if (!project || !user) return { allowed: false, reason: "workspace_not_found" };
    if (project.archived || project.status === "archived") return { allowed: false, reason: "workspace_archived" };
    if (!(project.members || []).includes(user.id)) return { allowed: false, reason: "not_a_member" };
    const isOwner = project.ownerId === user.id;
    const accessKey = `coord_workspace_access_${projectId}_${user.id}`;
    const hasSessionAccess = sessionStorage.getItem(accessKey) === "granted";
    return { allowed: isOwner || hasSessionAccess, isOwner, needsCode: !isOwner && !hasSessionAccess };
  },

  async grantWorkspaceSession(projectId) {
    const user = getStore().currentUser;
    if (user) sessionStorage.setItem(`coord_workspace_access_${projectId}_${user.id}`, "granted");
    return true;
  },

  async fetchTeamMembers() {
    const remote = await request("/api/team");
    if (remote) return remote;
    return getStore().team;
  },

  async updateMemberSkills(memberId, skills) {
    const store = getStore();
    const member = store.team.find(m => m.id === memberId);
    if (member) {
      member.skills = skills;
      saveStore(store);
      return member;
    }
    return null;
  },

  // Resources
  async fetchResources(projectId = "proj-1") {
    const remote = await request(`/api/projects/${projectId}/resources`);
    if (remote) return remote;
    return getStore().resources.filter(r => r.projectId === projectId);
  },

  async updateProject(projectId, updates) {
    const remote = await request(`/api/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
    if (remote) return remote;
    const store = getStore();
    const project = store.projects.find(p => p.id === projectId);
    if (!project) return null;
    Object.assign(project, updates);
    saveStore(store);
    return project;
  },

  async saveResource(resourceData) {
    const remote = await request("/api/resources", {
      method: "POST",
      body: JSON.stringify(resourceData)
    });
    if (remote) return remote;

    const store = getStore();
    const newRes = {
      id: "res-" + Date.now(),
      projectId: resourceData.projectId || "proj-1",
      title: resourceData.title,
      url: resourceData.url || "https://coord.io",
      domain: resourceData.domain || "coord.io",
      description: resourceData.description || "",
      category: resourceData.category || "Documentation",
      addedBy: store.currentUser.name,
      date: "Today",
      tags: resourceData.tags || ["Reference"],
      savedViaExtension: !!resourceData.savedViaExtension
    };

    store.resources.unshift(newRes);
    saveStore(store);
    return newRes;
  },

  // Notifications
  async fetchNotifications() {
    const remote = await request("/api/notifications");
    if (remote) return remote;
    return getStore().notifications;
  },

  async markNotificationRead(id) {
    const store = getStore();
    const notif = store.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    saveStore(store);
    return notif;
  },

  async markAllNotificationsRead() {
    const store = getStore();
    store.notifications.forEach(n => n.read = true);
    saveStore(store);
    return true;
  },

  // AI Recommendations
  async getAISuggestions() {
    const remote = await request("/api/ai/suggestions");
    if (remote) return remote;
    return getStore().aiSuggestions;
  },

  async askAI(query, context = {}) {
    const remote = await request("/api/ai/ask", {
      method: "POST",
      body: JSON.stringify({ query, context })
    });
    if (remote) return remote;

    // Intelligent local response generation based on team and workload
    const lower = query.toLowerCase();
    const store = getStore();

    if (lower.includes("authentication") || lower.includes("auth") || lower.includes("api")) {
      return {
        answer: "Based on team skills and current workload, Rahul and Anu are your best matches. Rahul is currently implementing the backend endpoints in Python/FastAPI, while Anu has capacity to connect the frontend components.",
        recommendation: {
          collaborator: "Rahul",
          role: "Backend Developer",
          skills: ["Python", "FastAPI", "PostgreSQL"],
          workload: "Balanced (3 active tasks)",
          reason: "Directly owns the auth endpoints and has 65% of the logic ready.",
          actionText: "Ask Rahul"
        }
      };
    } else if (lower.includes("who can help") || lower.includes("help") || lower.includes("stuck")) {
      return {
        answer: "Meera is currently in a 'Low' workload state with only 1 active task. She specializes in Python, NLP, and prompt architectures and has marked herself as 'Available to Help'.",
        recommendation: {
          collaborator: "Meera",
          role: "AI/ML Engineer",
          skills: ["Python", "NLP", "PyTorch"],
          workload: "Low (1 active task)",
          reason: "Strong algorithm experience with open capacity to unblock teammates.",
          actionText: "Ask Meera"
        }
      };
    } else if (lower.includes("workload") || lower.includes("balance")) {
      return {
        answer: "Workload analysis indicates an imbalance: Arjun is currently at High Workload with 5 tasks, while Meera is at Low Workload (1 task). Reallocating 'Prepare presentation slides' from Arjun to Anu or Meera will balance the sprint velocity.",
        recommendation: {
          collaborator: "Anu",
          role: "Frontend Developer",
          skills: ["Design Systems", "UI Components"],
          workload: "Balanced (3 tasks)",
          reason: "Can take on deck design to prevent Arjun from bottlenecking.",
          actionText: "Reallocate to Anu"
        }
      };
    } else {
      return {
        answer: `I analyzed your project "${store.projects[0].name}". Team velocity is strong at 72% overall completion. 4 tasks are in progress or review, and 1 task is currently unassigned ("Optimize async database queries"). I recommend assigning it to Rahul.`,
        recommendation: {
          collaborator: "Rahul",
          role: "Backend Developer",
          skills: ["Python", "PostgreSQL"],
          workload: "Balanced",
          reason: "Best skill compatibility (94% match) for database tuning.",
          actionText: "Assign to Rahul"
        }
      };
    }
  },

  // Team Chat Messages in Workspace
  async fetchWorkspaceMessages(projectId = "proj-1") {
    const remote = await request(`/api/projects/${projectId}/messages`);
    if (remote) return remote;
    return getStore().workspaceMessages;
  },

  async sendWorkspaceMessage(projectId = "proj-1", text, taskMention = null) {
    const store = getStore();
    const user = store.currentUser;
    const newMsg = {
      id: "msg-" + Date.now(),
      senderId: user.id,
      senderName: user.name,
      role: user.role,
      avatarClass: "avatar-self",
      avatar: user.avatar,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text,
      taskMention: taskMention
    };

    store.workspaceMessages.push(newMsg);
    saveStore(store);
    return newMsg;
  }
};
