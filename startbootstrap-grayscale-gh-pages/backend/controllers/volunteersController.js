function createVolunteersController({ supabase }) {
    return {
        async signup(req, res) {
            try {
                const {
                    fullName,
                    age,
                    email,
                    password,
                    phone,
                    experience,
                    description
                } = req.body;

                // Validate required fields
                if (!fullName || !email || !password) {
                    return res.status(400).json({
                        success: false,
                        error: 'Full name, email, and password are required'
                    });
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password
                });

                if (authError) {
                    return res.status(400).json({
                        success: false,
                        error: authError.message
                    });
                }

                const authUserId = authData?.user?.id;

                if (!authUserId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Auth user was not created. Please check Supabase Auth settings.'
                    });
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
                    user_id: authUserId,
                    full_name: fullName,
                    age: parseInt(age) || null,
                    email: email,
                    contact: phone || null,
                    'past experience': experience || null,
                    description: description || null,
                    photo_url: photoUrl,
                    submitted_at: new Date().toISOString(),
                    role: 'volunteer',
                    approval_status: 'pending'
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
                    user: data[0],
                    session: authData.session
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
                const { email, password } = req.body;

                if (!email || !password) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email and password are required'
                    });
                }

                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (authError) {
                    return res.status(401).json({
                        success: false,
                        error: authError.message
                    });
                }

                const { data: volunteerData, error: volunteerError } = await supabase
                    .from('Volunteers')
                    .select('*')
                    .eq('user_id', authData.user.id)
                    .single();

                if (volunteerError || !volunteerData) {
                    return res.status(404).json({
                        success: false,
                        error: 'Volunteer profile not found'
                    });
                }

                res.json({
                    success: true,
                    message: 'Login successful',
                    session: authData.session,
                    user: volunteerData
                });

            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        },

        async update(req, res) {
            try {
                // Log what we received
                console.log('Raw request body:', JSON.stringify(req.body));
                console.log('Available fields:', Object.keys(req.body));

                const { volunteerId, email, fullName, age, phone, experience, description, photoUrl } = req.body;

                console.log('Extracted volunteerId:', volunteerId);
                console.log('Extracted email:', email);
                console.log('Extracted fullName:', fullName);

                // Use volunteer ID to find the record
                if (!volunteerId) {
                    console.error('No volunteer ID provided. Available fields:', Object.keys(req.body));
                    return res.status(400).json({ error: 'Volunteer ID is required' });
                }

                // Convert volunteerId to integer if needed
                const idToFind = parseInt(volunteerId) || volunteerId;
                console.log('Looking up volunteer with ID:', idToFind, 'Type:', typeof idToFind);

                // Handle photo upload if provided
                let updatedPhotoUrl = photoUrl;
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

                        updatedPhotoUrl = publicData.publicUrl;
                    } catch (error) {
                        console.error('Photo upload error:', error);
                    }
                }

                // Prepare update data
                const updateData = {
                    full_name: fullName || undefined,
                    age: age ? parseInt(age) : undefined,
                    contact: phone || undefined,
                    'past experience': experience || undefined,
                    description: description || undefined
                };

                // Update email if provided
                if (email) {
                    updateData.email = email;
                }

                // Only add photo URL if it was updated
                if (updatedPhotoUrl) {
                    updateData.photo_url = updatedPhotoUrl;
                }

                // Remove undefined values
                Object.keys(updateData).forEach(key => 
                    updateData[key] === undefined && delete updateData[key]
                );

                // Check if the volunteer exists first
                console.log('Checking volunteer existence with ID:', idToFind);
                const { data: existingData, error: selectError } = await supabase
                    .from('Volunteers')
                    .select('*')
                    .eq('id', idToFind)
                    .limit(1);

                console.log('Existence check error:', selectError);
                console.log('Existence check data:', existingData);

                if (selectError) {
                    console.error('Database error on select:', selectError);
                    throw new Error(`Database error: ${selectError.message}`);
                }

                if (!existingData || existingData.length === 0) {
                    console.warn('No existing volunteer row found with ID:', idToFind);
                }

                // Update in Supabase - use ID to find the record
                console.log('Attempting update with ID:', idToFind);
                let { data, error } = await supabase
                    .from('Volunteers')
                    .update(updateData)
                    .eq('id', idToFind)
                    .select();

                console.log('Primary update response - Error:', error);
                console.log('Primary update response - Data:', data);

                if (error) {
                    console.error('Database error:', error);
                    throw new Error(`Database error: ${error.message}`);
                }

                if (!data || data.length === 0) {
                    console.warn('No volunteer found by ID; attempting fallback lookup by email:', email);
                    if (email) {
                        const fallbackResult = await supabase
                            .from('Volunteers')
                            .update(updateData)
                            .eq('email', email)
                            .select();

                        console.log('Fallback update response - Error:', fallbackResult.error);
                        console.log('Fallback update response - Data:', fallbackResult.data);

                        if (fallbackResult.error) {
                            console.error('Fallback database error:', fallbackResult.error);
                            throw new Error(`Database error: ${fallbackResult.error.message}`);
                        }

                        if (fallbackResult.data && fallbackResult.data.length > 0) {
                            console.log('Fallback update succeeded:', fallbackResult.data[0]);
                            return res.json({
                                success: true,
                                message: 'Profile updated successfully',
                                data: fallbackResult.data[0]
                            });
                        }
                    }

                    console.error('No volunteer found with ID:', idToFind, 'or email:', email);
                    return res.status(404).json({
                        success: false,
                        error: `No volunteer found with ID: ${idToFind} or email: ${email}`
                    });
                }

                console.log('Successfully updated volunteer:', data[0]);
                res.json({
                    success: true,
                    message: 'Profile updated successfully',
                    data: data[0]
                });

            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    };
}

module.exports = createVolunteersController;
