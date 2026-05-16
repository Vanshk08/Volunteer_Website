const express = require('express');
const createVolunteersController = require('../controllers/volunteersController');

function createVolunteersRouter({ supabase, upload }) {
    const router = express.Router();
    const volunteers = createVolunteersController({ supabase });

    router.post('/volunteers/signup', upload.single('photoUpload'), volunteers.signup);
    router.post('/volunteers/login', volunteers.login);

    return router;
}

module.exports = createVolunteersRouter;
