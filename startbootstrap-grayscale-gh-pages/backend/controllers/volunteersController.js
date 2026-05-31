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

        async checkEmail(req, res) {
            try {
                const { email } = req.body;
                if (!email) {
                    return res.status(400).json({ success: false, error: 'Email is required' });
                }

                const cleanedEmail = String(email || '').trim();
                console.log('Checking email existence for:', cleanedEmail);

                // Check Volunteers table (profile)
                let profileExists = false;
                let profileRow = null;
                try {
                    const { data: vdata, error: verror } = await supabase
                        .from('Volunteers')
                        .select('*')
                        .ilike('email', cleanedEmail)
                        .limit(1);
                    if (!verror && Array.isArray(vdata) && vdata.length > 0) {
                        profileExists = true;
                        profileRow = vdata[0];
                    }
                } catch (e) {
                    console.error('Volunteers table check failed:', e);
                }

                // Check Auth user existence if admin API available
                let authExists = false;
                try {
                    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.getUserByEmail === 'function') {
                        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserByEmail(cleanedEmail);
                        if (!authErr && authUser) authExists = true;
                    }
                } catch (e) {
                    console.error('Auth user check failed (non-fatal):', e && e.message ? e.message : e);
                }

                return res.json({ success: true, profileExists, authExists, user: profileRow });
            } catch (error) {
                console.error('Check email error:', error);
                return res.status(500).json({ success: false, error: error.message });
            }
        },

        async completeProfile(req, res) {
            try {
                const { fullName, age, email, phone, experience, description } = req.body;

                if (!email || !fullName) {
                    return res.status(400).json({ success: false, error: 'Email and fullName are required' });
                }

                const cleanedEmail = String(email || '').trim();
                let authUserId = null;
                // Try to find existing auth user by email
                try {
                    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.getUserByEmail === 'function') {
                        const { data: authUser, error: authErr } = await supabase.auth.admin.getUserByEmail(cleanedEmail);
                        if (!authErr && authUser) {
                            authUserId = authUser.id || (authUser.user && authUser.user.id) || (authUser.data && authUser.data.id) || null;
                        }
                    }
                } catch (e) {
                    console.warn('Auth lookup by email failed:', e && e.message ? e.message : e);
                }

                // If no auth user, create one with provided password or a random one
                if (!authUserId) {
                    const password = req.body.password || Math.random().toString(36).slice(-8);
                    const { data: signData, error: signErr } = await supabase.auth.signUp({ email: cleanedEmail, password });
                    if (signErr) {
                        console.error('Auth signup failed while completing profile:', signErr);
                        return res.status(400).json({ success: false, error: signErr.message });
                    }
                    authUserId = signData?.user?.id || null;
                }

                // Handle photo upload if provided
                let photoUrl = null;
                if (req.file) {
                    try {
                        const fileName = `volunteers/${Date.now()}_${req.file.originalname}`;
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('volunteer_photos')
                            .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
                        if (!uploadError) {
                            const { data: publicData } = supabase.storage.from('volunteer_photos').getPublicUrl(fileName);
                            photoUrl = publicData?.publicUrl || null;
                        }
                    } catch (e) {
                        console.error('Photo upload failed during completeProfile:', e);
                    }
                }

                // Insert profile row
                const formData = {
                    user_id: authUserId,
                    full_name: fullName,
                    age: parseInt(age) || null,
                    email: cleanedEmail,
                    contact: phone || null,
                    'past experience': experience || null,
                    description: description || null,
                    photo_url: photoUrl,
                    submitted_at: new Date().toISOString(),
                    role: 'volunteer',
                    approval_status: 'approved'
                };

                const { data: inserted, error: insertErr } = await supabase
                    .from('Volunteers')
                    .insert([formData])
                    .select();

                if (insertErr) {
                    console.error('Error inserting profile row:', insertErr);
                    return res.status(500).json({ success: false, error: insertErr.message });
                }

                return res.json({ success: true, message: 'Profile completed', user: inserted[0] });

            } catch (error) {
                console.error('completeProfile error:', error);
                return res.status(500).json({ success: false, error: error.message });
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

                // Convert volunteerId to integer if provided
                const idToFind = volunteerId ? (parseInt(volunteerId) || volunteerId) : null;
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

                // If an ID is provided, try update by ID first
                if (idToFind) {
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

                    if (data && data.length > 0) {
                        console.log('Successfully updated volunteer by ID:', data[0]);
                        return res.json({ success: true, message: 'Profile updated successfully', data: data[0] });
                    }

                    console.warn('No volunteer found by ID; will attempt fallback by email if provided');
                }

                // If email provided, attempt update by email
                if (email) {
                    console.log('Attempting fallback update by email:', email);
                    const fallbackResult = await supabase
                        .from('Volunteers')
                        .update(updateData)
                        .ilike('email', String(email).trim())
                        .select();

                    console.log('Fallback update response - Error:', fallbackResult.error);
                    console.log('Fallback update response - Data:', fallbackResult.data);

                    if (fallbackResult.error) {
                        console.error('Fallback database error:', fallbackResult.error);
                        throw new Error(`Database error: ${fallbackResult.error.message}`);
                    }

                    if (fallbackResult.data && fallbackResult.data.length > 0) {
                        console.log('Fallback update succeeded:', fallbackResult.data[0]);
                        return res.json({ success: true, message: 'Profile updated successfully', data: fallbackResult.data[0] });
                    }

                    console.error('No volunteer found with email:', email);
                    return res.status(404).json({ success: false, error: `No volunteer found with email: ${email}` });
                }

                // If neither ID nor email matched anything, return an error
                console.error('No volunteer found: no matching ID or email provided');
                return res.status(404).json({ success: false, error: 'No volunteer found with provided ID or email' });

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
