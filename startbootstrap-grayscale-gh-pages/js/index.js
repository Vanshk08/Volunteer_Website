// Global variables and functions - Define early so onclick handlers can find them
let supabaseClient = null;

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
    // Initialize Supabase after library is loaded
    if (window.supabase) {
        const { createClient } = window.supabase;
        const url = 'https://vdrfkocnwtdhetlihzzj.supabase.co';
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcmZrb2Nud3RkaGV0bGloenpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDgwMzgsImV4cCI6MjA5Mzk4NDAzOH0.KuBQcf7gsc9Wy2dLGXNaudkI0-pOb_wW5PtK_4SmkgQ';
        supabaseClient = createClient(url, key);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('Supabase library not available');
    }
    
    // Check if user already has a profile
    if (localStorage.getItem('volunteerProfile')) {
        updateSignupButton();
    }
    
    // Set up modal click outside handler
    const modal = document.getElementById('volunteerModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVolunteerForm();
            }
        });
    }
    
    // Set up form submission
    const form = document.getElementById('volunteerForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            const submitBtn = document.querySelector('.form-actions button[type="submit"]');
            
            // Hide messages
            if (successMessage) successMessage.classList.add('d-none');
            if (errorMessage) errorMessage.classList.add('d-none');
            
            // Get form data
            const formData = {
                full_name: document.getElementById('fullName').value,
                age: parseInt(document.getElementById('age').value),
                email: document.getElementById('email').value,
                contact: document.getElementById('phone').value,
                'past experience': document.getElementById('experience').value,
                description: document.getElementById('description').value,
                photo_url: null,
                submitted_at: new Date().toISOString()
            };
            
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Submitting...';
                }
                
                // Handle photo upload if Supabase is configured
                const photoFile = document.getElementById('photoUpload').files[0];
                if (photoFile && supabaseClient) {
                    // Upload photo to Supabase Storage
                    const fileName = `volunteers/${Date.now()}_${photoFile.name}`;
                    console.log('Uploading photo with filename:', fileName);
                    
                    const { data, error: uploadError } = await supabaseClient.storage
                        .from('volunteer_photos')
                        .upload(fileName, photoFile);
                    
                    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
                    
                    console.log('✅ Photo uploaded successfully');
                    
                    // Get the public URL for the uploaded file
                    const { data: publicData } = supabaseClient.storage
                        .from('volunteer_photos')
                        .getPublicUrl(fileName);
                    
                    console.log('Public URL data:', publicData);
                    formData.photo_url = publicData.publicUrl;
                    console.log('Photo URL set to:', formData.photo_url);
                }
                
                // Save volunteer data to Supabase
                if (supabaseClient) {
                    const { data, error } = await supabaseClient
                        .from('Volunteers')
                        .insert([formData]);
                    
                    if (error) throw new Error(error.message);
                } else {
                    // If Supabase not configured, log data to console
                    console.log('Volunteer data (not saved - Supabase not configured):', formData);
                }
                
                // Show success message
                if (successMessage) successMessage.classList.remove('d-none');
                
                // Store profile data in localStorage
                localStorage.setItem('volunteerProfile', JSON.stringify(formData));
                
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
        });
    }
    
    // Set up login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const loginSuccessMessage = document.getElementById('loginSuccessMessage');
            const loginErrorMessage = document.getElementById('loginErrorMessage');
            const loginErrorText = document.getElementById('loginErrorText');
            const loginSubmitBtn = document.querySelector('#loginForm .form-actions button[type="submit"]');
            
            // Hide messages
            if (loginSuccessMessage) loginSuccessMessage.classList.add('d-none');
            if (loginErrorMessage) loginErrorMessage.classList.add('d-none');
            
            try {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = true;
                    loginSubmitBtn.textContent = 'Logging in...';
                }
                
                // Query Supabase for the volunteer
                if (supabaseClient) {
                    const { data, error } = await supabaseClient
                        .from('Volunteers')
                        .select('*')
                        .eq('email', email)
                        .single();
                    
                    if (error || !data) {
                        throw new Error('No volunteer found with this email address.');
                    }
                    
                    // Store the profile data in localStorage
                    localStorage.setItem('volunteerProfile', JSON.stringify(data));
                    
                    // Show success message
                    if (loginSuccessMessage) loginSuccessMessage.classList.remove('d-none');
                    
                    // Redirect to profile page after 1.5 seconds
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                } else {
                    throw new Error('Supabase not configured.');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (loginErrorMessage) {
                    if (loginErrorText) loginErrorText.textContent = error.message;
                    loginErrorMessage.classList.remove('d-none');
                }
            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.textContent = 'Login';
                }
            }
        });
    }
});
