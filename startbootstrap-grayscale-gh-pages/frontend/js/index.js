// Global variables and functions - Define early so onclick handlers can find them
function normalizeApiBaseUrl(value) {
    const trimmedValue = String(value || '').trim();

    if (!trimmedValue) {
        return 'http://localhost:3001/api';
    }

    if (/^https?:\/\//i.test(trimmedValue)) {
        return trimmedValue.replace(/\/$/, '');
    }

    return `https://${trimmedValue.replace(/^\/+/, '').replace(/\/$/, '')}`;
}

const API_BASE_URL = normalizeApiBaseUrl(
    window.API_BASE_URL ||
    document.documentElement.dataset.apiBaseUrl ||
    'http://localhost:3001/api'
);

const SUPABASE_URL = String(document.documentElement.dataset.supabaseUrl || '').trim();
const SUPABASE_ANON_KEY = String(document.documentElement.dataset.supabaseAnonKey || '').trim();
const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function getStoredRole() {
    return localStorage.getItem('stafflyRole') || 'volunteer';
}

function setStoredRole(role) {
    localStorage.setItem('stafflyRole', role || 'volunteer');
}

function resolveLoginRole(email, selectedRole) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const storedProfileRaw = localStorage.getItem('volunteerProfile');

    if (selectedRole === 'head') {
        return 'head';
    }

    if (normalizedEmail.includes('head')) {
        return 'head';
    }

    if (storedProfileRaw) {
        try {
            const storedProfile = JSON.parse(storedProfileRaw);
            if ((storedProfile?.email || '').toString().trim().toLowerCase() === normalizedEmail && (storedProfile?.role || '').toString().toLowerCase() === 'head') {
                return 'head';
            }
        } catch (error) {
            console.warn('Could not parse stored volunteer profile for role detection:', error);
        }
    }

    return 'volunteer';
}

async function trackPageView(page) {
    try {
        await fetch(`${API_BASE_URL}/${page}`);
    } catch (error) {
        console.warn(`Page tracking failed for ${page}:`, error);
    }
}

function openVolunteerForm() {
    console.log('Opening form');
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeVolunteerForm() {
    console.log('Closing form');
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

function updateSignupButton() {
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    if (signupBtn && loginBtn) {
        // User is logged in - hide signup, show profile button
        signupBtn.style.display = 'none';
        loginBtn.textContent = 'View Profile';
        loginBtn.className = 'btn btn-primary btn-lg ms-3';
        loginBtn.onclick = function() {
            window.location.href = 'profile.html';
        };
    }
}

function resetSignupButton() {
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    if (signupBtn && loginBtn) {
        // User logged out - show signup and login buttons
        signupBtn.style.display = 'inline-block';
        loginBtn.textContent = 'Login';
        loginBtn.className = 'btn btn-secondary btn-lg ms-3';
        loginBtn.onclick = function() {
            openLoginForm();
        };
    }
}

function openLoginForm() {
    console.log('Opening login form');
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginForm() {
    console.log('Closing login form');
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Frontend initialized. Backend API base URL:', API_BASE_URL);

    trackPageView('landing');
    
    // Check if user already has a profile
    if (localStorage.getItem('volunteerProfile')) {
        updateSignupButton();
    }
    
    // Set up modal click outside handler for volunteer form
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        // Prevent clicks inside modal content from closing the modal
        const modalContent = modal.querySelector('.modal-content-volunteer');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Only close modal when clicking the background
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVolunteerForm();
            }
        });
    }
    
    // Set up modal click outside handler for login form
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        // Prevent clicks inside modal content from closing the modal
        const modalContent = loginModal.querySelector('.modal-content-volunteer');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Only close modal when clicking the background
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeLoginForm();
            }
        });
    }
    
    // Set up form submission
    const form = document.getElementById('volunteerForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            const submitBtn = document.querySelector('.form-actions button[type="submit"]');
            
            // Hide messages
            if (successMessage) successMessage.classList.add('d-none');
            if (errorMessage) errorMessage.classList.add('d-none');
            
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                }
                
                // Prepare FormData for multipart/form-data submission
                const formDataToSend = new FormData(form);
                formDataToSend.set('fullName', document.getElementById('fullName').value);
                formDataToSend.set('age', document.getElementById('age').value);
                formDataToSend.set('email', document.getElementById('email').value);
                formDataToSend.set('password', document.getElementById('password').value);
                formDataToSend.set('phone', document.getElementById('phone').value);
                formDataToSend.set('experience', document.getElementById('experience').value);
                formDataToSend.set('description', document.getElementById('description').value);
                
                // Send to backend API
                const response = await fetch(`${API_BASE_URL}/volunteers/signup`, {
                    method: 'POST',
                    body: formDataToSend
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Failed to submit form');
                }
                
                // Show success message
                if (successMessage) successMessage.classList.remove('d-none');
                
                    const profile = result.user || result.data || {};
                localStorage.setItem('volunteerProfile', JSON.stringify(result.data));
                
                // Update button to Profile
                updateSignupButton();
                
                form.reset();
                
                // Clear form after 2 seconds
                setTimeout(() => {
                    closeVolunteerForm();
                }, 2000);
                
            } catch (error) {
                console.error('Error:', error);
                if (errorMessage) {
                    const errorText = document.getElementById('errorText');
                    if (errorText) errorText.textContent = error.message;
                    errorMessage.classList.remove('d-none');
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit & Sign Up';
                }
            }
            
            return false;
        });
    }
    
    // Set up login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const loginSuccessMessage = document.getElementById('loginSuccessMessage');
            const loginErrorMessage = document.getElementById('loginErrorMessage');
            const loginErrorText = document.getElementById('loginErrorText');
            const loginSubmitBtn = document.querySelector('#loginForm button[type="submit"]');
            
            // Hide messages
            if (loginSuccessMessage) loginSuccessMessage.classList.add('d-none');
            if (loginErrorMessage) loginErrorMessage.classList.add('d-none');

         
            
            try {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = true;
                    loginSubmitBtn.textContent = 'Logging in...';
                }
                
                // Always fetch from backend so we get the latest profile and ID
                const response = await fetch(`${API_BASE_URL}/volunteers/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Email not registered. Please sign up first.');
                }
                
                // Store the profile data in localStorage
                const profile = result.user || result.data || {};
                localStorage.setItem('volunteerProfile', JSON.stringify(profile));
                const role = (profile.role || 'volunteer').toLowerCase();

                localStorage.setItem('stafflyRole', role);

                if (supabaseClient) {
                    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
                    if (userError) {
                        console.warn('Supabase getUser failed:', userError.message);
                    } else if (userData?.user) {
                        localStorage.setItem('supabaseUser', JSON.stringify(userData.user));
                    }
                }

                // If backend marks this profile as Head, redirect to head dashboard
                if (role === 'head') {
                    setStoredRole('head');
                    if (loginSuccessMessage) {
                        loginSuccessMessage.classList.remove('d-none');
                        loginSuccessMessage.textContent = 'Head login detected! Redirecting to Head Dashboard...';
                    }
                    setTimeout(() => {
                        window.location.href = 'head-dashboard.html';
                    }, 900);
                    return;
                }

                // Default volunteer flow
                setStoredRole('volunteer');
                if (loginSuccessMessage) {
                    loginSuccessMessage.classList.remove('d-none');
                    loginSuccessMessage.textContent = 'Login successful! Redirecting...';
                }

                setTimeout(() => {
                    window.location.href = 'app.html';
                }, 1500);
                return;
            } catch (error) {
                console.error('Login error:', error);
                if (loginErrorMessage) {
                    if (loginErrorText) {
                        loginErrorText.innerHTML = error.message + ' <a href="javascript:void(0);" onclick="closeLoginForm(); openVolunteerForm();" style="color: #64a19d; text-decoration: underline;">Sign up here</a>';
                    }
                    loginErrorMessage.classList.remove('d-none');
                }
            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.textContent = 'Login';
                }
            }
            
            return false;
        });
    }
});
