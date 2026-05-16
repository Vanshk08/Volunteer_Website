function createVolunteersController({ supabase }) {
    return {
        async signup(req, res) {
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

                        const { data, error: uploadError } = await supabase.storage
                            .from('volunteer_photos')
                            .upload(fileName, req.file.buffer, {
                                contentType: req.file.mimetype
                            });

                        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

                        // Get the public URL
                        const { data: publicData } = supabase.storage
                            .from('volunteer_photos')
                            .getPublicUrl(fileName);

                        photoUrl = publicData.publicUrl;
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
        },

        async login(req, res) {
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
        }
    };
}

module.exports = createVolunteersController;
