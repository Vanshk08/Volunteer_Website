// Global variables and functions - Define early so onclick handlers can find them
const API_BASE_URL =
    window.API_BASE_URL ||
    document.documentElement.dataset.apiBaseUrl ||
    'http://localhost:3001/api';

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
    console.log('✅ Frontend initialized. Backend API base URL:', API_BASE_URL);

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
                
                // Store profile data in localStorage
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
                
                // Check localStorage first (demo purposes)
                const storedProfile = localStorage.getItem('volunteerProfile');
                let loginSuccess = false;
                
                if (storedProfile) {
                    try {
                        const profile = JSON.parse(storedProfile);
                        if (profile.email === email) {
                            // Email found in localStorage
                            loginSuccess = true;
                            console.log('✅ Login successful - email found in local storage');
                        }
                    } catch (e) {
                        console.log('Error checking localStorage');
                    }
                }
                
                if (!loginSuccess) {
                    // Try backend API
                    const response = await fetch(`${API_BASE_URL}/volunteers/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(result.error || 'Email not registered. Please sign up first.');
                    }
                    
                    // Store the profile data in localStorage
                    localStorage.setItem('volunteerProfile', JSON.stringify(result.data));
                    loginSuccess = true;
                }
                
                if (loginSuccess) {
                    // Show success message
                    if (loginSuccessMessage) {
                        loginSuccessMessage.classList.remove('d-none');
                        loginSuccessMessage.textContent = '✅ Login successful! Redirecting...';
                    }
                    
                    // Redirect to app page after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1500);
                } else {
                    throw new Error('Email not registered. Please sign up first.');
                }
                
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
