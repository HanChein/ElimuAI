let currentUser = null;
let currentLanguage = 'en';
let currentCourseId = null;

const API_BASE = '';

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) targetPage.classList.add('active');
    
    if (pageName === 'courses') loadCourses();
    if (pageName === 'dashboard') loadDashboard();
    if (pageName === 'chatbot') initChatbot();
}

function toggleNav() {
    document.getElementById('navMenu').classList.toggle('active');
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
    const grid = document.getElementById('coursesGrid');
    grid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="viewCourse(${course.id})">
            <div class="course-header">
                <h3 class="course-title">${course.title}</h3>
                <span class="course-category">${course.category}</span>
                ${course.is_premium ? '<span class="premium-badge">Premium</span>' : ''}
            </div>
            <div class="course-body">
                <p class="course-description">${course.description}</p>
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
    try {
        const response = await fetch(`${API_BASE}/api/lessons/${lessonId}?language=${currentLanguage}`);
        const result = await response.json();
        
        if (result.success) {
            displayLesson(result.lesson);
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
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages.children.length === 0) {
        addChatMessage('bot', currentLanguage === 'sw' ? 'Habari! Mimi ni msaidizi wako wa ElimuAI. Ninaweza kukusaidia na hesabu, biashara, na ujuzi wa ufundi. Unaweza kuniuliza swali lolote!' : 'Hello! I\'m your ElimuAI assistant. I can help you with math, business, and vocational skills. Feel free to ask me anything!');
    }
}

async function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage('user', message);
    input.value = '';
    
    try {
        const response = await fetch(`${API_BASE}/api/chatbot`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message, language: currentLanguage})
        });
        const result = await response.json();
        
        if (result.success) {
            addChatMessage('bot', result.response);
        }
    } catch (error) {
        addChatMessage('bot', 'Sorry, I encountered an error.');
    }
}

function addChatMessage(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `<div class="chat-bubble">${text}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

updateAuthUI();
updateLanguageDisplay();
