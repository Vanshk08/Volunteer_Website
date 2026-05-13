// App Page JavaScript - Tab Management & Events Loading

const API_BASE_URL = 'http://localhost:3001/api';

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    
    // Check if user is logged in
    const userProfile = localStorage.getItem('volunteerProfile');
    if (!userProfile) {
        // Show signup modal for new users
        setTimeout(() => {
            openVolunteerForm();
        }, 500);
    }
    
    // Load initial data
    switchTab('events');
    loadProfile();
});

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Update button states
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update button state
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Load content based on tab
    if (tabName === 'events') {
        loadEvents();
    } else if (tabName === 'dashboard') {
        loadDashboard();
    }
}

// Load and display events
function loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;
    
    // Mock events data (in production, fetch from API)
    const mockEvents = [
        {
            id: 1,
            title: 'Music Festival 2024',
            location: 'Central Park, NYC',
            date: '2024-06-15',
            category: 'music',
            slots: 25,
            filledSlots: 18,
            hourlyRate: 18,
            image: 'assets/img/demo-image-01.jpg'
        },
        {
            id: 2,
            title: 'Tech Conference Summit',
            location: 'San Francisco, CA',
            date: '2024-07-20',
            category: 'tech',
            slots: 50,
            filledSlots: 35,
            hourlyRate: 22,
            image: 'assets/img/demo-image-02.jpg'
        },
        {
            id: 3,
            title: 'Marathon Event',
            location: 'Boston, MA',
            date: '2024-06-22',
            category: 'sports',
            slots: 100,
            filledSlots: 75,
            hourlyRate: 16,
            image: 'assets/img/bg-masthead.jpg'
        },
        {
            id: 4,
            title: 'Jazz Night Concert',
            location: 'Blue Note, NYC',
            date: '2024-07-05',
            category: 'music',
            slots: 30,
            filledSlots: 20,
            hourlyRate: 20,
            image: 'assets/img/demo-image-01.jpg'
        },
        {
            id: 5,
            title: 'AI Workshop',
            location: 'Seattle, WA',
            date: '2024-07-15',
            category: 'tech',
            slots: 40,
            filledSlots: 28,
            hourlyRate: 25,
            image: 'assets/img/demo-image-02.jpg'
        },
        {
            id: 6,
            title: 'Sports Expo',
            location: 'Las Vegas, NV',
            date: '2024-08-10',
            category: 'sports',
            slots: 80,
            filledSlots: 60,
            hourlyRate: 19,
            image: 'assets/img/bg-masthead.jpg'
        }
    ];
    
    // Get filter from active button
    const activeFilter = document.querySelector('.filter-btn.active');
    const selectedFilter = activeFilter ? activeFilter.dataset.filter || 'all' : 'all';
    
    // Filter events
    let filteredEvents = mockEvents;
    if (selectedFilter !== 'all') {
        filteredEvents = mockEvents.filter(event => event.category === selectedFilter);
    }
    
    // Render events
    eventsGrid.innerHTML = '';
    filteredEvents.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

// Create event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const availableSlots = event.slots - event.filledSlots;
    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    
    card.innerHTML = `
        <img src="${event.image}" alt="${event.title}" class="event-image">
        <div class="event-card-body">
            <div class="event-date">
                <i class="fas fa-calendar"></i> ${formattedDate}
            </div>
            <h3 class="event-title">${event.title}</h3>
            <div class="event-location">
                <i class="fas fa-map-marker-alt"></i> ${event.location}
            </div>
            <div class="event-details">
                <div class="detail-item">
                    <span>Hourly Rate</span>
                    <strong>$${event.hourlyRate}</strong>
                </div>
                <div class="detail-item">
                    <span>Available Slots</span>
                    <strong>${availableSlots}</strong>
                </div>
            </div>
            <button class="event-btn" onclick="applyForEvent(${event.id}, '${event.title}')">
                <i class="fas fa-check"></i> Apply Now
            </button>
        </div>
    `;
    
    return card;
}

// Filter events by category
function filterEvents(category) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = Array.from(document.querySelectorAll('.filter-btn')).find(btn => {
        return (category === 'all' && btn.textContent.includes('All')) ||
               (category === 'music' && btn.textContent.includes('Music')) ||
               (category === 'tech' && btn.textContent.includes('Technology')) ||
               (category === 'sports' && btn.textContent.includes('Sports'));
    });
    
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.dataset.filter = category;
    }
    
    // Reload events with filter
    loadEvents();
}

// Apply for an event
function applyForEvent(eventId, eventTitle) {
    const userProfile = localStorage.getItem('volunteerProfile');
    if (!userProfile) {
        alert('Please sign up first to apply for events.');
        switchTab('dashboard');
        return;
    }
    
    // Mock API call
    alert(`Successfully applied for "${eventTitle}"! You will receive confirmation soon.`);
}

// Load and display profile/dashboard
function loadDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    const noDashboardContent = document.getElementById('noDashboardContent');
    
    if (!dashboardContent) return;
    
    try {
        const userProfile = localStorage.getItem('volunteerProfile');
        
        if (!userProfile) {
            dashboardContent.style.display = 'none';
            if (noDashboardContent) noDashboardContent.style.display = 'block';
            return;
        }
        
        const profile = JSON.parse(userProfile);
        
        dashboardContent.innerHTML = `
            <div class="profile-card">
                <div class="profile-header">
                    <div class="profile-photo-container">
                        <div class="profile-photo" style="display:flex;">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="profile-header-info">
                            <h1 class="profile-name">${profile.fullName || 'Volunteer'}</h1>
                            <span class="profile-badge">
                                <i class="fas fa-check-circle"></i> Registered Volunteer
                            </span>
                        </div>
                    </div>
                </div>

                <div class="profile-content">
                    <div class="content-left">
                        <div class="section-card about-section">
                            <h3 class="section-title">
                                <i class="fas fa-user"></i> About
                            </h3>
                            <p class="about-text">${profile.description || 'No description provided yet.'}</p>
                        </div>

                        <div class="section-card">
                            <h3 class="section-title">
                                <i class="fas fa-briefcase"></i> Experience
                            </h3>
                            <div class="info-item">
                                <div class="info-icon"><i class="fas fa-briefcase"></i></div>
                                <div class="info-content">
                                    <div class="info-label">Past Experience</div>
                                    <div class="info-value">${profile.experience || 'No experience listed'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="content-right">
                        <div class="section-card">
                            <h3 class="section-title">
                                <i class="fas fa-envelope"></i> Contact Info
                            </h3>
                            <div class="info-item">
                                <div class="info-icon"><i class="fas fa-envelope"></i></div>
                                <div class="info-content">
                                    <div class="info-label">Email</div>
                                    <div class="info-value">${profile.email || 'N/A'}</div>
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-icon"><i class="fas fa-phone"></i></div>
                                <div class="info-content">
                                    <div class="info-label">Phone</div>
                                    <div class="info-value">${profile.phone || 'N/A'}</div>
                                </div>
                            </div>
                        </div>

                        <div class="section-card">
                            <h3 class="section-title">
                                <i class="fas fa-info-circle"></i> Details
                            </h3>
                            <div class="info-item">
                                <div class="info-icon"><i class="fas fa-birthday-cake"></i></div>
                                <div class="info-content">
                                    <div class="info-label">Age</div>
                                    <div class="info-value">${profile.age || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <a href="index.html" class="btn-back">
                        <i class="fas fa-arrow-left"></i> Back to Home
                    </a>
                    <button class="btn-logout" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
        
        dashboardContent.style.display = 'block';
        if (noDashboardContent) noDashboardContent.style.display = 'none';
    } catch (error) {
        console.error('Error loading dashboard:', error);
        dashboardContent.style.display = 'none';
        if (noDashboardContent) noDashboardContent.style.display = 'block';
    }
}

// Load profile data (for profile display)
function loadProfile() {
    try {
        const userProfile = localStorage.getItem('volunteerProfile');
        const navSignupBtn = document.getElementById('navSignupBtn');
        const navLogoutBtn = document.getElementById('navLogoutBtn');
        
        if (userProfile) {
            const profile = JSON.parse(userProfile);
            
            // Update navbar - hide signup, show logout
            if (navSignupBtn) navSignupBtn.classList.add('d-none');
            if (navLogoutBtn) navLogoutBtn.classList.remove('d-none');
        } else {
            // Update navbar - show signup, hide logout
            if (navSignupBtn) navSignupBtn.classList.remove('d-none');
            if (navLogoutBtn) navLogoutBtn.classList.add('d-none');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('volunteerProfile');
        window.location.href = 'index.html';
    }
}

// Modal functions for signup/login
function openVolunteerForm() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeVolunteerForm() {
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('volunteerForm');
        if (form) form.reset();
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');
        if (successMsg) successMsg.classList.add('d-none');
        if (errorMsg) errorMsg.classList.add('d-none');
    }
    document.body.style.overflow = 'auto';
}

function openLoginForm() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}
window.openLoginForm = openLoginForm;

function closeLoginForm() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        const successMsg = document.getElementById('loginSuccessMessage');
        const errorMsg = document.getElementById('loginErrorMessage');
        if (successMsg) successMsg.classList.add('d-none');
        if (errorMsg) errorMsg.classList.add('d-none');
    }
    document.body.style.overflow = 'auto';
}

// Modal background click handlers
document.addEventListener('DOMContentLoaded', function() {
    const volunteerModal = document.getElementById('volunteerModal');
    if (volunteerModal) {
        volunteerModal.addEventListener('click', (e) => {
            if (e.target === volunteerModal) {
                closeVolunteerForm();
            }
        });
    }
    
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginForm();
            }
        });
    }
    
    // Set up volunteer form submission
    const volunteerForm = document.getElementById('volunteerForm');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // Collect form data
                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                const age = document.getElementById('age').value;
                const experience = document.getElementById('experience').value;
                const description = document.getElementById('description').value;
                const profilePic = document.getElementById('profilePic').files[0];
                const errorMsg = document.getElementById('errorMessage');
                const successMsg = document.getElementById('successMessage');
                
                // Hide messages
                if (errorMsg) errorMsg.classList.add('d-none');
                if (successMsg) successMsg.classList.add('d-none');
                
                // Validate required fields
                if (!fullName || !email) {
                    if (errorMsg) {
                        errorMsg.classList.remove('d-none');
                        errorMsg.textContent = 'Please fill in all required fields';
                    }
                    return;
                }
                
                // Check if email already exists by calling login endpoint
                try {
                    const checkResponse = await fetch(`${API_BASE_URL}/volunteers/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    });
                    
                    const checkResult = await checkResponse.json();
                    
                    // If email is found in database, show error
                    if (checkResponse.ok && checkResult.data) {
                        if (errorMsg) {
                            errorMsg.classList.remove('d-none');
                            errorMsg.innerHTML = '<strong>Email already registered.</strong> <a href="javascript:void(0);" onclick="closeVolunteerForm(); openLoginForm();" style="color: #64a19d; text-decoration: underline;">Login here</a>';
                        }
                        return;
                    }
                } catch (error) {
                    // Email check failed, proceed with signup
                }
                
                // Prepare FormData for API
                const formData = new FormData();
                formData.append('fullName', fullName);
                formData.append('email', email);
                formData.append('phone', phone);
                formData.append('age', age);
                formData.append('experience', experience);
                formData.append('description', description);
                if (profilePic) {
                    formData.append('photoUpload', profilePic);
                }
                
                // Send to backend API
                const response = await fetch(`${API_BASE_URL}/volunteers/signup`, {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    if (errorMsg) {
                        errorMsg.classList.remove('d-none');
                        errorMsg.textContent = result.error || 'Failed to submit form';
                    }
                    return;
                }
                
                // Success!
                if (successMsg) {
                    successMsg.classList.remove('d-none');
                    successMsg.textContent = '✅ Signup successful! You can now browse events.';
                }
                
                // Store profile data in localStorage
                localStorage.setItem('volunteerProfile', JSON.stringify(result.data));
                
                // Update navbar buttons
                loadProfile();
                
                // Reset form and close modal
                volunteerForm.reset();
                setTimeout(() => {
                    closeVolunteerForm();
                }, 1500);
                
            } catch (error) {
                console.error('Form submission error:', error);
                const errorMsg = document.getElementById('errorMessage');
                if (errorMsg) {
                    errorMsg.classList.remove('d-none');
                    errorMsg.textContent = '❌ Error: ' + error.message;
                }
            }
            
            return false;
        });
    }
    
    // Set up login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const loginSuccessMessage = document.getElementById('loginSuccessMessage');
            const loginErrorMessage = document.getElementById('loginErrorMessage');
            
            // Hide messages
            if (loginSuccessMessage) loginSuccessMessage.classList.add('d-none');
            if (loginErrorMessage) loginErrorMessage.classList.add('d-none');
            
            try {
                // Call backend API to verify email
                const response = await fetch(`${API_BASE_URL}/volunteers/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });
                
                const result = await response.json();
                
                if (response.ok && result.data) {
                    // Email found - login successful
                    if (loginSuccessMessage) {
                        loginSuccessMessage.classList.remove('d-none');
                        loginSuccessMessage.textContent = 'Login successful! Redirecting...';
                    }
                    
                    // Store profile in localStorage for session
                    localStorage.setItem('volunteerProfile', JSON.stringify(result.data));
                    
                    // Update navbar buttons
                    loadProfile();
                    
                    // Reload the dashboard
                    setTimeout(() => {
                        closeLoginForm();
                        loadDashboard();
                    }, 1000);
                } else {
                    // Email not found - ask to signup
                    if (loginErrorMessage) {
                        loginErrorMessage.classList.remove('d-none');
                        loginErrorMessage.innerHTML = '<strong>No account found with this email.</strong> <a href="javascript:void(0);" onclick="closeLoginForm(); openVolunteerForm();" style="color: #64a19d; text-decoration: underline;">Create an account</a>';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (loginErrorMessage) {
                    loginErrorMessage.classList.remove('d-none');
                    loginErrorMessage.textContent = 'An error occurred. Please try again.';
                }
            }
            
            loginForm.reset();
        });
    }
    
    // Set up "Go to Login" button listener
    const goToLoginBtn = document.getElementById('goToLoginBtn');
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', function() {
            closeVolunteerForm();
            openLoginForm();
        });
    }
});
