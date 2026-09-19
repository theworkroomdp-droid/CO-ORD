/**
 * Script.js - Authentication, 3D Tilt Physics, and AI Typewriter
 */

let isLoginView = true;

// --- 1. The 3D Mouse Physics Engine for Bento Tilt ---
const tiltWrapper = document.getElementById('tilt-wrapper');
let targetRotateX = 0;
let targetRotateY = 0;
let currentRotateX = 0;
let currentRotateY = 0;
let isTilting = false;

document.addEventListener('mousemove', (e) => {
    if (!tiltWrapper) return;
    isTilting = true;
    
    const rect = tiltWrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalized delta (-1 to 1)
    const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
    const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
    
    // Max tilt angles
    targetRotateY = Math.max(-14, Math.min(14, deltaX * 14));
    targetRotateX = Math.max(-14, Math.min(14, -deltaY * 14));
});

document.addEventListener('mouseleave', () => {
    isTilting = false;
    targetRotateX = 0;
    targetRotateY = 0;
});

// Smooth Lerp loop for fluid physical tilt
function renderTilt() {
    currentRotateX += (targetRotateX - currentRotateX) * 0.1;
    currentRotateY += (targetRotateY - currentRotateY) * 0.1;
    
    if (tiltWrapper) {
        tiltWrapper.style.transform = `rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
    }
    requestAnimationFrame(renderTilt);
}
requestAnimationFrame(renderTilt);

// --- 2. The AI Typewriter Status Engine ---
const statusMessages = [
    "Connecting to vLLM Engine...",
    "Calibrating Neural Task Embeddings...",
    "Synchronizing Tensor-Parallel Nodes...",
    "Benchmarking KV-Cache Latency...",
    "Ready: vLLM Llama-3.3-70B Online"
];

let msgIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typewriterEl = document.getElementById("typewriter-text");

function typeLoop() {
    if (!typewriterEl) return;
    
    const currentMsg = statusMessages[msgIndex];
    
    if (!isDeleting) {
        typewriterEl.textContent = currentMsg.substring(0, charIndex + 1);
        charIndex++;
        
        if (charIndex === currentMsg.length) {
            isDeleting = true;
            setTimeout(typeLoop, 2200); // Pause before delete
            return;
        }
        setTimeout(typeLoop, 40);
    } else {
        typewriterEl.textContent = currentMsg.substring(0, charIndex - 1);
        charIndex--;
        
        if (charIndex === 0) {
            isDeleting = false;
            msgIndex = (msgIndex + 1) % statusMessages.length;
            setTimeout(typeLoop, 400);
            return;
        }
        setTimeout(typeLoop, 20);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    typeLoop();
});

// --- 3. Switch Auth View (Login vs Register) ---
function switchAuthTab(login) {
    isLoginView = login;
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (login) {
        // Show Login
        loginForm.classList.remove('-translate-x-full', 'opacity-0', 'pointer-events-none');
        loginForm.classList.add('translate-x-0', 'opacity-100');
        
        signupForm.classList.remove('translate-x-0', 'opacity-100');
        signupForm.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');

        tabLogin.className = "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-white text-slate-900 shadow-sm";
        tabRegister.className = "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 text-slate-500 hover:text-slate-900";
    } else {
        // Show Register
        loginForm.classList.remove('translate-x-0', 'opacity-100');
        loginForm.classList.add('-translate-x-full', 'opacity-0', 'pointer-events-none');
        
        signupForm.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
        signupForm.classList.add('translate-x-0', 'opacity-100');

        tabRegister.className = "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 bg-white text-slate-900 shadow-sm";
        tabLogin.className = "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 text-slate-500 hover:text-slate-900";
    }
}

// --- 4. Submission Handlers ---
function submitLogin() {
    const email = document.getElementById('login-email').value.trim();
    const btn = document.getElementById('login-submit-btn');

    // Button loading state
    btn.innerHTML = `<span class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Handshaking vLLM...</span>`;
    btn.classList.add('opacity-80', 'pointer-events-none');

    // Match or create user
    const team = CoordStore.getTeam();
    const matched = team.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (matched) {
        CoordStore.setUser({
            name: matched.name,
            role: matched.role,
            email: matched.email,
            avatarGradient: matched.avatarGradient
        });
    } else if (email) {
        const fallbackName = email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase());
        CoordStore.setUser({
            name: fallbackName,
            role: 'Team Node',
            email: email,
            avatarGradient: 'from-indigo-500 to-purple-500'
        });
    }

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 700);
}

function submitRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const role = document.getElementById('reg-role').value;
    const email = document.getElementById('reg-email').value.trim();
    const skills = document.getElementById('reg-skills').value.trim();
    const btn = document.getElementById('signup-submit-btn');

    if (!name || !email || !skills) {
        alert('Please fill out all registration fields.');
        return;
    }

    btn.innerHTML = `<span class="flex items-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Registering Neural Node...</span>`;
    btn.classList.add('opacity-80', 'pointer-events-none');

    // Add to team store
    const member = CoordStore.addMember({
        name,
        role,
        email,
        skills,
        capacity: 20,
        maxTasks: 4,
        avatarGradient: 'from-indigo-500 to-teal-500'
    });

    // Set as active user
    CoordStore.setUser({
        name: member.name,
        role: member.role,
        email: member.email,
        avatarGradient: member.avatarGradient
    });

    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}