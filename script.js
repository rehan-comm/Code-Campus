// Session Management Logic
const SESSION_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds

/**
 * Check if the user session is valid.
 * Implements a sliding expiration:
 * - If last visit was < 5 days ago, update last visit to now (extend session).
 * - If last visit was > 5 days ago, log out.
 */
function checkSession() {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) return; // No user logged in

    const user = JSON.parse(userJson);
    const now = Date.now();

    // If lastVisit is not set (legacy/first run), use loginTime or current time
    // This effectively starts the sliding window now for existing users
    let lastActivity = user.lastVisit || user.loginTime || now;

    if (now - lastActivity > SESSION_DURATION) {
        // Session expired
        console.log('Session expired. Logging out.');
        handleLogout();
    } else {
        // Session valid, extend it
        user.lastVisit = now;
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Also update in the main users array to persist across logins if needed
        const usersJson = localStorage.getItem('users');
        if (usersJson) {
            let users = JSON.parse(usersJson) || [];
            if (Array.isArray(users)) {
                const index = users.findIndex(u => u.email === user.email);
                if (index !== -1) {
                    users[index].lastVisit = now;
                    localStorage.setItem('users', JSON.stringify(users));
                }
            }
        }
    }
}

/**
 * Handle user logout
 */
function handleLogout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Initialize Auth UI
function initAuthUI() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const authBtn = document.getElementById('authBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileImg = document.getElementById('profileImg');
    const profileBtn = profileDropdown?.querySelector('.dropdown-btn') || document.querySelector('.dropdown-btn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (user) {
        if (authBtn) authBtn.classList.add('hidden');
        if (profileDropdown) profileDropdown.classList.remove('hidden');
        if (profileImg) {
            profileImg.src = user.image || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop';
        }

        // Dropdown toggle
        if (profileBtn) {
            // Remove existing listeners to avoid duplicates if re-initialized (though mostly this runs once)
            const newBtn = profileBtn.cloneNode(true);
            profileBtn.parentNode.replaceChild(newBtn, profileBtn);

            newBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (dropdownContent) dropdownContent.classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (profileDropdown && !profileDropdown.contains(e.target)) {
                if (dropdownContent) dropdownContent.classList.remove('show');
            }
        });
    }
}

// Sidebar/Hamburger toggle
function initSidebar() {
    const hamburger = document.querySelector('.hamburger');
    const rootLeft = document.querySelector('.root-left');
    const root = document.getElementById('root');

    if (hamburger && rootLeft && root) {
        hamburger.addEventListener('click', function (e) {
            e.stopPropagation();
            rootLeft.classList.toggle('expanded');
            root.classList.toggle('sidebar-expanded');
        });

        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 1780) {
                if (!rootLeft.contains(e.target) && !hamburger.contains(e.target)) {
                    rootLeft.classList.remove('expanded');
                    root.classList.remove('sidebar-expanded');
                }
            }
        });
    }
}

// Enroll button handler
function attachEnrollListeners() {
    const enrollButtons = document.querySelectorAll('.enroll-btn');
    enrollButtons.forEach(button => {
        button.addEventListener('click', function () {
            const courseCard = this.closest('.course-card');
            const courseId = courseCard.getAttribute('data-course-id');
            const courseName = courseCard.querySelector('.title').textContent;
            goToCourse(courseId, courseName);
        });
    });
}

// Run check on load
document.addEventListener('DOMContentLoaded', () => {
    // We only check session if we are not on the login page
    if (!window.location.pathname.includes('login.html')) {
        checkSession();
        initAuthUI();
        initSidebar();
        attachEnrollListeners();
    }
});

// Expose functions globally so they can be called by inline scripts if needed
window.checkSession = checkSession;
window.handleLogout = handleLogout;
