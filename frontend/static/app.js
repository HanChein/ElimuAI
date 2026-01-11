let currentUser = null;
let currentLanguage = 'en';
let currentCourseId = null;
let currentTheme = localStorage.getItem('theme') || 'light';

const API_BASE = '';

// Initialize theme on load
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

// ==================== THEME TOGGLE ====================
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    showToast(currentTheme === 'dark' ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showNotification(message, type = 'info') {
    showToast(message, type);
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) targetPage.classList.add('active');
    
    // Close mobile nav
    document.getElementById('navMenu')?.classList.remove('active');
    document.getElementById('navToggle')?.classList.remove('active');
    
    if (pageName === 'courses') loadCourses();
    if (pageName === 'dashboard') loadDashboard();
    if (pageName === 'chatbot') initChatbot();
    if (pageName === 'gamification') loadGamification();
    if (pageName === 'certificates') loadCertificates();
    if (pageName === 'profile') loadProfile();
}

function toggleNav() {
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
}

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    if (navMenu && navToggle && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// ==================== CONFETTI EFFECT ====================
function showConfetti() {
    const colors = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ==================== LOADING STATE ====================
function showLoading(container) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        container.innerHTML = `
            <div class="loading-state" style="display:flex;justify-content:center;padding:3rem;">
                <div class="spinner"></div>
            </div>
        `;
    }
}

function showSkeleton(container, count = 3) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="skeleton skeleton-card" style="margin-bottom:1rem;"></div>
            `;
        }
        container.innerHTML = skeletons;
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    document.getElementById('langToggleText').textContent = currentLanguage === 'en' ? 'SW' : 'EN';
    updateLanguageDisplay();
}

function updateLanguageDisplay() {
    document.querySelectorAll('.text-en, .nav-text-en').forEach(el => {
        el.style.display = currentLanguage === 'en' ? 'inline' : 'none';
    });
    document.querySelectorAll('.text-sw, .nav-text-sw').forEach(el => {
        el.style.display = currentLanguage === 'sw' ? 'inline' : 'none';
    });
}

function updateAuthUI() {
    const isLoggedIn = currentUser !== null;
    document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
    document.getElementById('registerBtn').style.display = isLoggedIn ? 'none' : 'inline-block';
    document.getElementById('logoutBtn').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('coursesLink').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('dashboardLink').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('chatbotLink').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('gamificationLink').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('certificatesLink').style.display = isLoggedIn ? 'inline-block' : 'none';
    document.getElementById('profileLink').style.display = isLoggedIn ? 'inline-block' : 'none';
}

async function register(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            currentLanguage = result.user.preferred_language;
            updateAuthUI();
            updateLanguageDisplay();
            showNotification(currentLanguage === 'sw' ? 'Usajili umefanikiwa!' : 'Registration successful!', 'success');
            showPage('dashboard');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Registration failed', 'error');
    }
}

async function login(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            currentLanguage = result.user.preferred_language;
            updateAuthUI();
            updateLanguageDisplay();
            showNotification(currentLanguage === 'sw' ? 'Umeingia!' : 'Login successful!', 'success');
            showPage('dashboard');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/api/logout`, {method: 'POST'});
        currentUser = null;
        updateAuthUI();
        showNotification(currentLanguage === 'sw' ? 'Umetoka!' : 'Logged out!', 'success');
        showPage('home');
    } catch (error) {
        showNotification('Logout failed', 'error');
    }
}

async function loadCourses(category = null) {
    try {
        const url = category ? `${API_BASE}/api/courses?category=${category}&language=${currentLanguage}` : `${API_BASE}/api/courses?language=${currentLanguage}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            displayCourses(result.courses);
        }
    } catch (error) {
        showNotification('Failed to load courses', 'error');
    }
}

function displayCourses(courses) {
    // Store for search
    if (courses.length > 0 && allCourses.length === 0) {
        allCourses = courses;
    }
    
    const grid = document.getElementById('coursesGrid');
    const categoryIcons = {
        'math': '📐',
        'business': '💼',
        'vocational': '🔧'
    };
    
    grid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="viewCourse(${course.id})">
            <div class="course-card-image">
                ${categoryIcons[course.category.toLowerCase()] || '📚'}
                ${course.is_premium ? '<span class="course-card-badge">⭐ Premium</span>' : ''}
            </div>
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
                <span class="course-category">${course.category}</span>
            </div>
            <div class="course-body">
                <p class="course-description">${course.description}</p>
                <div class="course-progress">
                    <div class="course-progress-bar">
                        <div class="course-progress-fill" style="width: ${course.progress || 0}%"></div>
                    </div>
                    <div class="course-progress-text">
                        <span>${course.progress || 0}% ${currentLanguage === 'sw' ? 'imekamilika' : 'complete'}</span>
                    </div>
                </div>
                <div class="course-meta">
                    <span>📚 ${course.lesson_count} ${currentLanguage === 'sw' ? 'Masomo' : 'Lessons'}</span>
                    <span>📝 ${course.quiz_count} ${currentLanguage === 'sw' ? 'Majaribio' : 'Quizzes'}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterCourses(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadCourses(category === 'all' ? null : category);
}

async function viewCourse(courseId) {
    currentCourseId = courseId;
    try {
        const response = await fetch(`${API_BASE}/api/courses/${courseId}?language=${currentLanguage}`);
        const result = await response.json();
        
        if (result.success) {
            displayCourseDetail(result.course);
            showPage('courseDetail');
        }
    } catch (error) {
        showNotification('Failed to load course', 'error');
    }
}

function displayCourseDetail(course) {
    const detail = document.getElementById('courseDetail');
    detail.innerHTML = `
        <h1>${course.title}</h1>
        <p>${course.description}</p>
        ${course.is_premium ? '<span class="premium-badge">Premium Content</span>' : ''}
        
        <h2>${currentLanguage === 'sw' ? 'Masomo' : 'Lessons'}</h2>
        <div>
            ${course.lessons.map(lesson => `
                <div class="lesson-card" onclick="viewLesson(${lesson.id})">
                    <h3>${lesson.title}</h3>
                    <button class="btn btn-primary">${currentLanguage === 'sw' ? 'Fungua' : 'Open'}</button>
                </div>
            `).join('')}
        </div>
        
        <h2>${currentLanguage === 'sw' ? 'Majaribio' : 'Quizzes'}</h2>
        <div>
            ${course.quizzes.map(quiz => `
                <div class="quiz-card" onclick="viewQuiz(${quiz.id})">
                    <h3>${quiz.title}</h3>
                    <p>${currentLanguage === 'sw' ? 'Maswali' : 'Questions'}: ${quiz.question_count}</p>
                    <button class="btn btn-primary">${currentLanguage === 'sw' ? 'Anza' : 'Start'}</button>
                </div>
            `).join('')}
        </div>
    `;
}

async function viewLesson(lessonId) {
    currentLessonId = lessonId;
    
    try {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}?language=${currentLanguage}`);
        const result = await response.json();
        
        if (result.success) {
            // Check if bookmarked
            const isBookmarked = bookmarks.includes(lessonId);
            document.getElementById('bookmarkIcon').textContent = isBookmarked ? '🔖' : '🔖';
            
            // Display lesson (video or text)
            displayVideoLesson(result.lesson);
            showPage('lesson');
        }
    } catch (error) {
        showNotification('Failed to load lesson', 'error');
    }
}

function displayLesson(lesson) {
    const content = document.getElementById('lessonContent');
    content.innerHTML = `
        <h1>${lesson.title}</h1>
        <div class="lesson-content">
            ${lesson.content}
        </div>
        <button class="btn btn-primary" onclick="completeLesson(${lesson.id})">
            ${currentLanguage === 'sw' ? 'Maliza Somo' : 'Complete Lesson'}
        </button>
    `;
}

async function completeLesson(lessonId) {
    try {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}/complete`, {method: 'POST'});
        const result = await response.json();
        
        if (result.success) {
            showNotification(currentLanguage === 'sw' ? 'Somo limekamilika!' : 'Lesson completed!', 'success');
        }
    } catch (error) {
        showNotification('Failed to complete lesson', 'error');
    }
}

let currentQuiz = null;
let quizAnswers = {};

async function viewQuiz(quizId) {
    try {
        const response = await fetch(`${API_BASE}/api/quizzes/${quizId}?language=${currentLanguage}`);
        const result = await response.json();
        
        if (result.success) {
            currentQuiz = result.quiz;
            quizAnswers = {};
            displayQuiz(result.quiz);
            showPage('quiz');
        }
    } catch (error) {
        showNotification('Failed to load quiz', 'error');
    }
}

function displayQuiz(quiz) {
    const content = document.getElementById('quizContent');
    content.innerHTML = `
        <h1>${quiz.title}</h1>
        <div id="quizQuestions">
            ${quiz.questions.map((q, idx) => `
                <div class="quiz-question">
                    <h3>${currentLanguage === 'sw' ? 'Swali' : 'Question'} ${idx + 1}</h3>
                    <p>${q.question_text}</p>
                    <div class="quiz-options">
                        ${Object.entries(q.options).map(([key, value]) => `
                            <div class="quiz-option" onclick="selectAnswer(${q.id}, '${key}')">
                                <strong>${key}:</strong> ${value}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary btn-lg" onclick="submitQuiz()">${currentLanguage === 'sw' ? 'Wasilisha' : 'Submit'}</button>
    `;
}

function selectAnswer(questionId, answer) {
    quizAnswers[questionId] = answer;
    document.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('selected'));
    event.target.closest('.quiz-option').classList.add('selected');
}

async function submitQuiz() {
    try {
        const response = await fetch(`${API_BASE}/api/quizzes/${currentQuiz.id}/submit`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({answers: quizAnswers, language: currentLanguage})
        });
        const result = await response.json();
        
        if (result.success) {
            displayQuizResults(result);
        }
    } catch (error) {
        showNotification('Failed to submit quiz', 'error');
    }
}

function displayQuizResults(result) {
    const content = document.getElementById('quizContent');
    content.innerHTML = `
        <div class="quiz-result">
            <h2>${currentLanguage === 'sw' ? 'Matokeo' : 'Results'}</h2>
            <div class="quiz-score">${result.score}/${result.total}</div>
            <p>${result.percentage.toFixed(1)}%</p>
        </div>
        <div>
            ${result.results.map((r, idx) => `
                <div class="quiz-question">
                    <h3>${currentLanguage === 'sw' ? 'Swali' : 'Question'} ${idx + 1}</h3>
                    <p>${r.question.question_text}</p>
                    <div class="quiz-options">
                        ${Object.entries(r.question.options).map(([key, value]) => `
                            <div class="quiz-option ${key === r.question.correct_answer ? 'correct' : ''} ${key === r.user_answer && !r.is_correct ? 'incorrect' : ''}">
                                <strong>${key}:</strong> ${value}
                            </div>
                        `).join('')}
                    </div>
                    ${r.question.explanation ? `<p><strong>${currentLanguage === 'sw' ? 'Maelezo' : 'Explanation'}:</strong> ${r.question.explanation}</p>` : ''}
                </div>
            `).join('')}
        </div>
        <button class="btn btn-primary" onclick="backToCourse()">${currentLanguage === 'sw' ? 'Rudi' : 'Back'}</button>
    `;
}

function backToCourse() {
    if (currentCourseId) {
        viewCourse(currentCourseId);
    } else {
        showPage('courses');
    }
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard?language=${currentLanguage}`);
        const result = await response.json();
        
        if (result.success) {
            displayDashboard(result);
        }
    } catch (error) {
        showNotification('Failed to load dashboard', 'error');
    }
}

function displayDashboard(data) {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.stats.total_courses}</div>
            <div class="stat-label">${currentLanguage === 'sw' ? 'Jumla ya Kozi' : 'Total Courses'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.enrolled_courses}</div>
            <div class="stat-label">${currentLanguage === 'sw' ? 'Kozi Zilizosajiliwa' : 'Enrolled Courses'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.completed_lessons}</div>
            <div class="stat-label">${currentLanguage === 'sw' ? 'Masomo Yaliyokamilika' : 'Completed Lessons'}</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.quiz_attempts}</div>
            <div class="stat-label">${currentLanguage === 'sw' ? 'Majaribio' : 'Quiz Attempts'}</div>
        </div>
    `;
    
    const premiumBadge = document.getElementById('premiumBadge');
    if (data.is_premium) {
        premiumBadge.innerHTML = '<span class="premium-badge">Premium Member</span>';
    } else {
        premiumBadge.innerHTML = `<button class="btn btn-primary" onclick="showPage('premium')">${currentLanguage === 'sw' ? 'Pata Premium' : 'Get Premium'}</button>`;
    }
    
    const recentProgress = document.getElementById('recentProgress');
    recentProgress.innerHTML = data.recent_progress.length > 0 ? data.recent_progress.map(p => `
        <div class="progress-card">
            <h3>${p.course.title}</h3>
            ${p.lesson ? `<p>${p.lesson.title}</p>` : ''}
            <p>${p.completed ? '✓ ' + (currentLanguage === 'sw' ? 'Imekamilika' : 'Completed') : currentLanguage === 'sw' ? 'Inaendelea' : 'In Progress'}</p>
        </div>
    `).join('') : `<p>${currentLanguage === 'sw' ? 'Hakuna maendeleo bado' : 'No progress yet'}</p>`;
    
    const recentQuizzes = document.getElementById('recentQuizzes');
    recentQuizzes.innerHTML = data.recent_quizzes.length > 0 ? data.recent_quizzes.map(q => `
        <div class="quiz-card">
            <p>${currentLanguage === 'sw' ? 'Alama' : 'Score'}: ${q.score}/${q.total_questions} (${q.percentage.toFixed(1)}%)</p>
            <p>${new Date(q.completed_at).toLocaleDateString()}</p>
        </div>
    `).join('') : `<p>${currentLanguage === 'sw' ? 'Hakuna majaribio bado' : 'No quizzes yet'}</p>`;
}

function initChatbot() {
    // Chatbot is already initialized with welcome message in HTML
}

async function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Hide welcome and suggestions after first message
    const welcome = document.querySelector('.chat-welcome');
    if (welcome) welcome.style.display = 'none';
    document.getElementById('suggestedQuestions').style.display = 'none';
    
    addChatMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch(`${API_BASE}/api/chatbot`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message, language: currentLanguage})
        });
        const result = await response.json();
        
        hideTypingIndicator();
        
        if (result.success) {
            addChatMessage('bot', result.response);
            sounds.notification();
        }
    } catch (error) {
        hideTypingIndicator();
        addChatMessage('bot', currentLanguage === 'sw' ? 'Samahani, kuna tatizo.' : 'Sorry, I encountered an error.');
        sounds.error();
    }
}

function addChatMessage(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'flex';
}

function hideTypingIndicator() {
    document.getElementById('typingIndicator').style.display = 'none';
}

function clearChat() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="chat-welcome">
            <div class="welcome-icon">👋</div>
            <h3 class="text-en">Hello! I'm your AI Tutor</h3>
            <h3 class="text-sw" style="display:${currentLanguage === 'sw' ? 'block' : 'none'};">Habari! Mimi ni Mwalimu wako wa AI</h3>
            <p class="text-en">Ask me anything about Math, Business, or Vocational Skills!</p>
            <p class="text-sw" style="display:${currentLanguage === 'sw' ? 'block' : 'none'};">Niulize chochote kuhusu Hesabu, Biashara, au Ujuzi wa Ufundi!</p>
        </div>
    `;
    document.getElementById('suggestedQuestions').style.display = 'flex';
    showToast(currentLanguage === 'sw' ? 'Mazungumzo yamefutwa' : 'Chat cleared', 'info');
}

function askSuggested(question) {
    document.getElementById('chatInput').value = question;
    document.querySelector('.chat-input-form').dispatchEvent(new Event('submit'));
}

function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast(currentLanguage === 'sw' ? 'Sauti haitekezeki' : 'Voice input not supported', 'warning');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguage === 'sw' ? 'sw-TZ' : 'en-US';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chatInput').value = transcript;
        sounds.click();
    };
    
    recognition.onerror = () => {
        showToast(currentLanguage === 'sw' ? 'Tatizo la sauti' : 'Voice error', 'error');
    };
    
    recognition.start();
    showToast(currentLanguage === 'sw' ? '🎤 Sema sasa...' : '🎤 Speak now...', 'info');
}

// ==================== SEARCH & FILTER ====================
let allCourses = [];

function searchCourses(query) {
    query = query.toLowerCase().trim();
    const filtered = allCourses.filter(course => 
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query)
    );
    
    if (filtered.length === 0) {
        document.getElementById('coursesGrid').innerHTML = '';
        document.getElementById('noResults').style.display = 'block';
    } else {
        document.getElementById('noResults').style.display = 'none';
        displayCourses(filtered);
    }
}

// ==================== FLOATING ACTION BUTTON ====================
function toggleFab() {
    const container = document.getElementById('fabContainer');
    const icon = document.getElementById('fabIcon');
    container.classList.toggle('open');
    icon.textContent = container.classList.contains('open') ? '×' : '+';
    icon.style.transform = container.classList.contains('open') ? 'rotate(45deg)' : 'rotate(0)';
}

// ==================== LESSON ENHANCEMENTS ====================
let currentLessonId = null;
let bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let notes = JSON.parse(localStorage.getItem('notes') || '[]');

function toggleBookmark() {
    if (!currentLessonId) return;
    
    const index = bookmarks.indexOf(currentLessonId);
    if (index > -1) {
        bookmarks.splice(index, 1);
        document.getElementById('bookmarkIcon').textContent = '🔖';
        showToast('Bookmark removed', 'info');
    } else {
        bookmarks.push(currentLessonId);
        document.getElementById('bookmarkIcon').textContent = '🔖';
        showToast('Lesson bookmarked!', 'success');
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    updateBookmarksDisplay();
}

function toggleNotes() {
    const panel = document.getElementById('notesPanel');
    panel.classList.toggle('open');
    
    if (panel.classList.contains('open')) {
        loadNotes();
        document.getElementById('notesTextarea').focus();
    }
}

function saveNotes() {
    if (!currentLessonId) return;
    
    const content = document.getElementById('notesTextarea').value;
    const noteIndex = notes.findIndex(n => n.lessonId === currentLessonId);
    
    if (noteIndex > -1) {
        notes[noteIndex].content = content;
        notes[noteIndex].updatedAt = new Date().toISOString();
    } else {
        notes.push({
            lessonId: currentLessonId,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    localStorage.setItem('notes', JSON.stringify(notes));
    
    const saved = document.getElementById('notesSaved');
    saved.style.display = 'inline';
    setTimeout(() => saved.style.display = 'none', 2000);
    
    updateNotesDisplay();
    showToast('Notes saved!', 'success');
}

function loadNotes() {
    if (!currentLessonId) return;
    
    const note = notes.find(n => n.lessonId === currentLessonId);
    document.getElementById('notesTextarea').value = note ? note.content : '';
}

function updateBookmarksDisplay() {
    const grid = document.getElementById('bookmarksGrid');
    if (!grid) return;
    
    if (bookmarks.length === 0) {
        grid.innerHTML = '<div class="no-bookmarks"><p>No bookmarked lessons yet</p></div>';
        return;
    }
    
    // This would need course data - for now showing placeholder
    grid.innerHTML = bookmarks.map(id => `
        <div class="bookmark-item">
            <span class="bookmark-icon">🔖</span>
            <div class="bookmark-info">
                <div class="bookmark-title">Lesson ${id}</div>
                <div class="bookmark-course">Course</div>
            </div>
        </div>
    `).join('');
}

function updateNotesDisplay() {
    const list = document.getElementById('notesList');
    if (!list) return;
    
    const recentNotes = notes.slice(-5).reverse();
    
    if (recentNotes.length === 0) {
        list.innerHTML = '<div class="no-notes"><p>No notes yet</p></div>';
        return;
    }
    
    list.innerHTML = recentNotes.map(note => `
        <div class="note-item" onclick="openNote(${note.lessonId})">
            <div class="note-header">
                <span class="note-lesson">Lesson ${note.lessonId}</span>
                <span class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="note-preview">${note.content.substring(0, 100)}...</div>
        </div>
    `).join('');
}

function openNote(lessonId) {
    // Navigate to lesson and open notes
    viewLesson(lessonId);
    setTimeout(() => toggleNotes(), 500);
}

// ==================== SOCIAL SHARING ====================
let shareData = {};

function shareLesson() {
    if (!currentLessonId) return;
    
    shareData = {
        title: 'Check out this lesson on ElimuAI',
        text: 'I\'m learning with ElimuAI - AI-powered education for Tanzania!',
        url: window.location.origin + '/lesson/' + currentLessonId
    };
    
    document.getElementById('shareModal').style.display = 'block';
}

function shareAchievement(type, data) {
    shareData = {
        title: `I earned a ${type} on ElimuAI!`,
        text: `Just achieved ${data} on ElimuAI - Join me in learning!`,
        url: window.location.origin
    };
    
    document.getElementById('shareModal').style.display = 'block';
}

function shareOnWhatsApp() {
    const text = `${shareData.title} ${shareData.text} ${shareData.url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    closeShareModal();
}

function shareOnTwitter() {
    const text = `${shareData.title} ${shareData.url}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    closeShareModal();
}

function shareOnFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`, '_blank');
    closeShareModal();
}

function copyShareLink() {
    navigator.clipboard.writeText(shareData.url);
    showToast('Link copied to clipboard!', 'success');
    closeShareModal();
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

// ==================== PUSH NOTIFICATIONS ====================
let pushSubscription = null;

async function togglePushNotifications() {
    const toggle = document.getElementById('pushToggle');
    
    if (toggle.checked) {
        await requestPushPermission();
    } else {
        await unsubscribePush();
    }
}

async function requestPushPermission() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('Push notifications not supported', 'warning');
        document.getElementById('pushToggle').checked = false;
        return;
    }
    
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Would need actual VAPID key
        });
        
        pushSubscription = subscription;
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));
        showToast('Push notifications enabled!', 'success');
        
        // Send subscription to backend
        await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(subscription)
        });
    } catch (error) {
        console.error('Push subscription error:', error);
        showToast('Failed to enable push notifications', 'error');
        document.getElementById('pushToggle').checked = false;
    }
}

async function unsubscribePush() {
    if (pushSubscription) {
        await pushSubscription.unsubscribe();
        pushSubscription = null;
        localStorage.removeItem('pushSubscription');
        showToast('Push notifications disabled', 'info');
    }
}

async function toggleBrowserNotifications() {
    const toggle = document.getElementById('notificationsToggle');
    
    if (toggle.checked) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            showToast('Browser notifications enabled!', 'success');
        } else {
            toggle.checked = false;
            showToast('Notification permission denied', 'warning');
        }
    }
}

function showBrowserNotification(title, body, icon = '/favicon.ico') {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    }
}

// ==================== VIDEO PLAYER ====================
function displayVideoLesson(lesson) {
    const content = document.getElementById('lessonContent');
    
    if (lesson.video_url) {
        content.innerHTML = `
            <h1>${lesson.title}</h1>
            <div class="video-container">
                <video class="video-player" id="videoPlayer" controls>
                    <source src="${lesson.video_url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="video-controls">
                    <button class="video-play-btn" onclick="togglePlay()">▶</button>
                    <div class="video-progress" onclick="seekVideo(event)">
                        <div class="video-progress-fill" id="videoProgress"></div>
                    </div>
                    <span class="video-time" id="videoTime">0:00 / 0:00</span>
                    <button class="video-fullscreen" onclick="toggleFullscreen()">⛶</button>
                </div>
            </div>
            <div class="lesson-content">
                ${lesson.content}
            </div>
            <button class="btn btn-primary" onclick="completeLesson(${lesson.id})">
                ${currentLanguage === 'sw' ? 'Maliza Somo' : 'Complete Lesson'}
            </button>
        `;
        
        initVideoPlayer();
    } else {
        // Regular lesson display
        displayLesson(lesson);
    }
}

function initVideoPlayer() {
    const video = document.getElementById('videoPlayer');
    if (!video) return;
    
    video.addEventListener('timeupdate', updateVideoProgress);
    video.addEventListener('loadedmetadata', updateVideoTime);
    video.addEventListener('play', () => {
        document.querySelector('.video-play-btn').textContent = '❚❚';
    });
    video.addEventListener('pause', () => {
        document.querySelector('.video-play-btn').textContent = '▶';
    });
}

function togglePlay() {
    const video = document.getElementById('videoPlayer');
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function updateVideoProgress() {
    const video = document.getElementById('videoPlayer');
    const progress = document.getElementById('videoProgress');
    if (video && progress) {
        const percent = (video.currentTime / video.duration) * 100;
        progress.style.width = percent + '%';
        updateVideoTime();
    }
}

function updateVideoTime() {
    const video = document.getElementById('videoPlayer');
    const timeDisplay = document.getElementById('videoTime');
    if (video && timeDisplay) {
        const current = formatTime(video.currentTime);
        const duration = formatTime(video.duration);
        timeDisplay.textContent = `${current} / ${duration}`;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function seekVideo(event) {
    const video = document.getElementById('videoPlayer');
    const progress = event.currentTarget;
    const rect = progress.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
}

function toggleFullscreen() {
    const video = document.getElementById('videoPlayer');
    if (video.requestFullscreen) {
        video.requestFullscreen();
    }
}

// ==================== GAMIFICATION FUNCTIONS ====================

async function loadGamification() {
    try {
        const response = await fetch(`${API_BASE}/api/gamification/stats`, {
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('totalPoints').textContent = stats.total_points || 0;
            document.getElementById('currentStreak').textContent = stats.current_streak || 0;
            document.getElementById('userLevel').textContent = stats.level || 1;
            document.getElementById('badgeCount').textContent = stats.badges_earned || 0;
            
            renderBadges(result.badges, result.all_badges);
        }
        
        loadLeaderboard('all');
    } catch (error) {
        console.error('Error loading gamification:', error);
    }
}

function renderBadges(earnedBadges, allBadges) {
    const grid = document.getElementById('badgesGrid');
    const earnedIds = earnedBadges.map(b => b.id);
    
    grid.innerHTML = Object.entries(allBadges).map(([id, badge]) => {
        const earned = earnedIds.includes(id);
        const name = currentLanguage === 'sw' ? badge.name_sw : badge.name_en;
        return `
            <div class="badge-card ${earned ? 'earned' : 'locked'}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${name}</div>
                ${earned ? '<div class="badge-earned">✓</div>' : '<div class="badge-locked">🔒</div>'}
            </div>
        `;
    }).join('');
}

async function loadLeaderboard(timeframe = 'all') {
    try {
        document.querySelectorAll('.leaderboard-filters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event?.target?.classList.add('active');
        
        const response = await fetch(`${API_BASE}/api/gamification/leaderboard?timeframe=${timeframe}&limit=10`);
        const result = await response.json();
        
        if (result.success) {
            const list = document.getElementById('leaderboardList');
            list.innerHTML = result.leaderboard.map((user, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                    <div class="leaderboard-rank">${getRankIcon(index + 1)}</div>
                    <div class="leaderboard-user">${user.username}</div>
                    <div class="leaderboard-points">${user.points} pts</div>
                    <div class="leaderboard-streak">🔥 ${user.streak}</div>
                </div>
            `).join('') || '<p>No leaderboard data yet</p>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

function getRankIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

// ==================== CERTIFICATES FUNCTIONS ====================

async function loadCertificates() {
    try {
        const response = await fetch(`${API_BASE}/api/certificates`, {
            credentials: 'include'
        });
        const result = await response.json();
        
        const grid = document.getElementById('certificatesGrid');
        
        if (result.success && result.certificates.length > 0) {
            grid.innerHTML = result.certificates.map(cert => `
                <div class="certificate-card">
                    <div class="certificate-icon">📜</div>
                    <div class="certificate-title">${cert.course_title}</div>
                    <div class="certificate-id">ID: ${cert.certificate_id}</div>
                    <div class="certificate-date">${new Date(cert.issued_at).toLocaleDateString()}</div>
                    <button class="btn btn-primary btn-sm" onclick="shareCertificate('${cert.certificate_id}')">
                        ${currentLanguage === 'sw' ? 'Shiriki' : 'Share'}
                    </button>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `
                <div class="no-certificates">
                    <p>${currentLanguage === 'sw' ? 'Hakuna vyeti bado. Kamilisha kozi kupata cheti!' : 'No certificates yet. Complete a course to earn one!'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading certificates:', error);
    }
}

async function generateCertificate(courseId) {
    try {
        const response = await fetch(`${API_BASE}/api/certificates/generate/${courseId}`, {
            method: 'POST',
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification(currentLanguage === 'sw' ? 'Cheti kimezalishwa!' : 'Certificate generated!', 'success');
            loadCertificates();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Error generating certificate', 'error');
    }
}

function shareCertificate(certId) {
    shareData = {
        title: 'ElimuAI Certificate',
        text: currentLanguage === 'sw' ? 'Angalia cheti changu cha ElimuAI!' : 'Check out my ElimuAI certificate!',
        url: `${window.location.origin}/api/certificates/verify/${certId}`
    };
    
    document.getElementById('shareModal').style.display = 'block';
}

// ==================== SOUND EFFECTS ====================
let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';

const sounds = {
    click: () => playTone(800, 0.1),
    success: () => playTone(523, 0.15, () => playTone(659, 0.15, () => playTone(784, 0.2))),
    levelUp: () => playTone(523, 0.1, () => playTone(659, 0.1, () => playTone(784, 0.1, () => playTone(1047, 0.3)))),
    badge: () => playTone(784, 0.15, () => playTone(988, 0.15, () => playTone(1175, 0.25))),
    streak: () => playTone(440, 0.1, () => playTone(554, 0.1, () => playTone(659, 0.2))),
    error: () => playTone(200, 0.3),
    notification: () => playTone(600, 0.1, () => playTone(800, 0.15))
};

function playTone(frequency, duration, callback) {
    if (!soundEnabled) {
        if (callback) callback();
        return;
    }
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        if (callback) {
            setTimeout(callback, duration * 1000);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    document.getElementById('soundToggle').checked = soundEnabled;
    showToast(soundEnabled ? '🔊 Sound enabled' : '🔇 Sound disabled', 'info');
}

// ==================== PROFILE PAGE ====================
function loadProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('avatarInitial').textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Load stats
    loadProfileStats();
    renderProgressChart();
    renderActivityChart();
}

async function loadProfileStats() {
    try {
        const response = await fetch(`${API_BASE}/api/gamification/stats`, { credentials: 'include' });
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('profileStreak').textContent = result.stats.current_streak || 0;
            document.getElementById('profilePoints').textContent = result.stats.total_points || 0;
        }
        
        // Load dashboard for course count
        const dashResponse = await fetch(`${API_BASE}/api/dashboard`, { credentials: 'include' });
        const dashResult = await dashResponse.json();
        
        if (dashResult.success) {
            document.getElementById('profileCourses').textContent = dashResult.courses_in_progress || 0;
        }
    } catch (error) {
        console.error('Error loading profile stats:', error);
    }
}

function uploadAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImage = document.getElementById('avatarImage');
            const avatarInitial = document.getElementById('avatarInitial');
            avatarImage.src = e.target.result;
            avatarImage.style.display = 'block';
            avatarInitial.style.display = 'none';
            localStorage.setItem('userAvatar', e.target.result);
            showToast('Avatar updated!', 'success');
            sounds.success();
        };
        reader.readAsDataURL(file);
    }
}

function loadSavedAvatar() {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        const avatarImage = document.getElementById('avatarImage');
        const avatarInitial = document.getElementById('avatarInitial');
        if (avatarImage && avatarInitial) {
            avatarImage.src = savedAvatar;
            avatarImage.style.display = 'block';
            avatarInitial.style.display = 'none';
        }
    }
}

// ==================== CHARTS ====================
function renderProgressChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    
    // Sample data - in production this would come from API
    const data = [30, 45, 60, 55, 80, 75, 90];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw bars
    const barWidth = (width - 60) / data.length - 10;
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#7c3aed');
    
    data.forEach((value, index) => {
        const barHeight = (value / maxVal) * (height - 40);
        const x = 30 + index * (barWidth + 10);
        const y = height - barHeight - 25;
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted');
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x + barWidth / 2, height - 5);
        ctx.fillText(value + '%', x + barWidth / 2, y - 5);
    });
}

function renderActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    
    // Sample data
    const data = [2, 3, 1, 4, 2, 5, 3];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const maxVal = Math.max(...data);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw line chart
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    data.forEach((value, index) => {
        const x = 40 + index * ((width - 80) / (data.length - 1));
        const y = height - 30 - (value / maxVal) * (height - 60);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw points
    data.forEach((value, index) => {
        const x = 40 + index * ((width - 80) / (data.length - 1));
        const y = height - 30 - (value / maxVal) * (height - 60);
        
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted');
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[index], x, height - 5);
    });
}

// ==================== ONBOARDING TOUR ====================
let onboardingStep = 0;
const onboardingSteps = [
    {
        icon: '👋',
        title: 'Welcome to ElimuAI!',
        titleSw: 'Karibu ElimuAI!',
        text: 'Your personalized AI-powered learning platform. Let us show you around!',
        textSw: 'Jukwaa lako la kujifunza kwa AI. Hebu tukuonyeshe!'
    },
    {
        icon: '📚',
        title: 'Browse Courses',
        titleSw: 'Tazama Kozi',
        text: 'Explore courses in Math, Business, and Vocational Skills. Learn at your own pace!',
        textSw: 'Tazama kozi za Hesabu, Biashara, na Ujuzi wa Ufundi. Jifunze kwa kasi yako!'
    },
    {
        icon: '🤖',
        title: 'AI Tutor',
        titleSw: 'Mwalimu wa AI',
        text: 'Got questions? Chat with our AI tutor anytime in English or Swahili!',
        textSw: 'Una maswali? Zungumza na mwalimu wetu wa AI wakati wowote!'
    },
    {
        icon: '🏆',
        title: 'Earn Rewards',
        titleSw: 'Pata Tuzo',
        text: 'Complete lessons, take quizzes, and earn points, badges, and certificates!',
        textSw: 'Kamilisha masomo, fanya majaribio, na upate pointi, beji, na vyeti!'
    },
    {
        icon: '🚀',
        title: 'Ready to Start!',
        titleSw: 'Tayari Kuanza!',
        text: 'You\'re all set! Start learning and achieve your goals!',
        textSw: 'Uko tayari! Anza kujifunza na kufikia malengo yako!'
    }
];

function startOnboarding() {
    if (localStorage.getItem('onboardingComplete')) return;
    
    onboardingStep = 0;
    document.getElementById('onboardingTour').style.display = 'flex';
    renderOnboardingStep();
    sounds.notification();
}

function renderOnboardingStep() {
    const step = onboardingSteps[onboardingStep];
    const content = document.getElementById('onboardingContent');
    const progress = document.getElementById('onboardingProgress');
    const dots = document.getElementById('onboardingDots');
    const prevBtn = document.getElementById('onboardingPrev');
    const nextBtn = document.getElementById('onboardingNext');
    
    content.innerHTML = `
        <div class="onboarding-icon">${step.icon}</div>
        <h2 class="onboarding-title">${currentLanguage === 'sw' ? step.titleSw : step.title}</h2>
        <p class="onboarding-text">${currentLanguage === 'sw' ? step.textSw : step.text}</p>
    `;
    
    progress.style.width = ((onboardingStep + 1) / onboardingSteps.length * 100) + '%';
    
    dots.innerHTML = onboardingSteps.map((_, i) => 
        `<div class="onboarding-dot ${i === onboardingStep ? 'active' : ''}"></div>`
    ).join('');
    
    prevBtn.style.visibility = onboardingStep === 0 ? 'hidden' : 'visible';
    nextBtn.innerHTML = onboardingStep === onboardingSteps.length - 1 
        ? `<span class="text-en">Get Started!</span><span class="text-sw" style="display:${currentLanguage === 'sw' ? 'inline' : 'none'};">Anza!</span>`
        : `<span class="text-en">Next</span><span class="text-sw" style="display:${currentLanguage === 'sw' ? 'inline' : 'none'};">Ifuatayo</span>`;
}

function nextOnboardingStep() {
    sounds.click();
    if (onboardingStep < onboardingSteps.length - 1) {
        onboardingStep++;
        renderOnboardingStep();
    } else {
        completeOnboarding();
    }
}

function prevOnboardingStep() {
    sounds.click();
    if (onboardingStep > 0) {
        onboardingStep--;
        renderOnboardingStep();
    }
}

function skipOnboarding() {
    completeOnboarding();
}

function completeOnboarding() {
    document.getElementById('onboardingTour').style.display = 'none';
    localStorage.setItem('onboardingComplete', 'true');
    showToast('Welcome aboard! 🎉', 'success');
    sounds.success();
}

// ==================== CELEBRATION MODALS ====================
function showLevelUp(oldLevel, newLevel) {
    document.getElementById('oldLevel').textContent = oldLevel;
    document.getElementById('newLevel').textContent = newLevel;
    document.getElementById('levelUpModal').style.display = 'flex';
    showConfetti();
    sounds.levelUp();
}

function closeLevelUpModal() {
    document.getElementById('levelUpModal').style.display = 'none';
    sounds.click();
}

function showBadgeEarned(badgeIcon, badgeName, message) {
    document.getElementById('earnedBadgeIcon').textContent = badgeIcon;
    document.getElementById('earnedBadgeName').textContent = badgeName;
    document.getElementById('badgeMessage').textContent = message || 'Keep up the great work!';
    document.getElementById('badgeModal').style.display = 'flex';
    showConfetti();
    sounds.badge();
}

function closeBadgeModal() {
    document.getElementById('badgeModal').style.display = 'none';
    sounds.click();
}

function showStreakCelebration(days, bonus) {
    document.getElementById('streakTitle').textContent = `${days} Day Streak!`;
    document.getElementById('streakBonus').textContent = bonus;
    document.getElementById('streakModal').style.display = 'flex';
    sounds.streak();
}

function closeStreakModal() {
    document.getElementById('streakModal').style.display = 'none';
    sounds.click();
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        switch(key) {
            case 'h': showPage('home'); break;
            case 'c': if (currentUser) showPage('courses'); break;
            case 'd': if (currentUser) showPage('dashboard'); break;
            case 't': if (currentUser) showPage('chatbot'); break;
            case 'r': if (currentUser) showPage('gamification'); break;
            case 'p': if (currentUser) showPage('profile'); break;
            case 'l': toggleLanguage(); break;
            case 'm': toggleTheme(); break;
            case '?': showShortcutsModal(); break;
            case 'escape': closeAllModals(); break;
        }
    });
}

function showShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'flex';
}

function closeShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'none';
}

function closeAllModals() {
    document.getElementById('shortcutsModal').style.display = 'none';
    document.getElementById('levelUpModal').style.display = 'none';
    document.getElementById('badgeModal').style.display = 'none';
    document.getElementById('streakModal').style.display = 'none';
    document.getElementById('onboardingTour').style.display = 'none';
}

// ==================== LANGUAGE CHANGE ====================
function changeLanguage(lang) {
    currentLanguage = lang;
    document.getElementById('langToggleText').textContent = lang === 'en' ? 'SW' : 'EN';
    updateLanguageDisplay();
    showToast(lang === 'sw' ? 'Lugha imebadilika kuwa Kiswahili' : 'Language changed to English', 'info');
}

// Award points for actions
async function awardPoints(action) {
    try {
        await fetch(`${API_BASE}/api/gamification/award`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ action })
        });
    } catch (error) {
        console.error('Error awarding points:', error);
    }
}

// Initialize app
updateAuthUI();
updateLanguageDisplay();
initKeyboardShortcuts();
loadSavedAvatar();
updateBookmarksDisplay();
updateNotesDisplay();

// Show onboarding for new users after login
document.addEventListener('DOMContentLoaded', () => {
    // Check for first visit
    setTimeout(() => {
        if (currentUser && !localStorage.getItem('onboardingComplete')) {
            startOnboarding();
        }
        
        // Initialize notification settings
        const pushToggle = document.getElementById('pushToggle');
        if (pushToggle && localStorage.getItem('pushSubscription')) {
            pushToggle.checked = true;
        }
        
        const notifToggle = document.getElementById('notificationsToggle');
        if (notifToggle && Notification.permission === 'granted') {
            notifToggle.checked = true;
        }
    }, 1000);
});
