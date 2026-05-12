const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
} else {
    console.log('✅ Supabase configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend API is running' });
});

// Endpoint to submit volunteer signup
app.post('/api/volunteers/signup', upload.single('photoUpload'), async (req, res) => {
    try {
        const {
            fullName,
            age,
            email,
            phone,
            experience,
            description
        } = req.body;

        // Validate required fields
        if (!fullName || !email) {
            return res.status(400).json({ error: 'Full name and email are required' });
        }

        let photoUrl = null;

        // Handle photo upload if provided
        if (req.file) {
            try {
                const fileName = `volunteers/${Date.now()}_${req.file.originalname}`;
                console.log('Uploading photo with filename:', fileName);

                const { data, error: uploadError } = await supabase.storage
                    .from('volunteer_photos')
                    .upload(fileName, req.file.buffer, {
                        contentType: req.file.mimetype
                    });

                if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

                console.log('✅ Photo uploaded successfully');

                // Get the public URL
                const { data: publicData } = supabase.storage
                    .from('volunteer_photos')
                    .getPublicUrl(fileName);

                photoUrl = publicData.publicUrl;
                console.log('Photo URL:', photoUrl);
            } catch (error) {
                console.error('Photo upload error:', error);
                // Continue without photo if upload fails
            }
        }

        // Prepare volunteer data
        const formData = {
            full_name: fullName,
            age: parseInt(age) || null,
            email: email,
            contact: phone || null,
            'past experience': experience || null,
            description: description || null,
            photo_url: photoUrl,
            submitted_at: new Date().toISOString()
        };

        // Insert into Supabase
        const { data, error } = await supabase
            .from('Volunteers')
            .insert([formData])
            .select();

        if (error) {
            console.error('Database error:', error);
            throw new Error(error.message);
        }

        res.json({
            success: true,
            message: 'Volunteer signup successful',
            data: data[0]
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint to login volunteer
app.post('/api/volunteers/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Query Supabase for the volunteer
        const { data, error } = await supabase
            .from('Volunteers')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                error: 'No volunteer found with this email address.'
            });
        }

        res.json({
            success: true,
            message: 'Login successful',
            data: data
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoints:`);
    console.log(`  - POST http://localhost:${PORT}/api/volunteers/signup`);
    console.log(`  - POST http://localhost:${PORT}/api/volunteers/login`);
    console.log(`  - GET  http://localhost:${PORT}/api/health`);
});
