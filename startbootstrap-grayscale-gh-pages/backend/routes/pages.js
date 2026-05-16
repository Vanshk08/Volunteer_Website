const express = require('express');
const createPagesController = require('../controllers/pagesController');

function createPagesRouter() {
    const router = express.Router();
    const pages = createPagesController();

    router.get('/landing', pages.landing);
    router.get('/events', pages.events);
    router.get('/login', pages.login);
    router.get('/profile', pages.profile);
    router.get('/signup', pages.signup);
    router.get('/volunteer-dashboard', pages.volunteerDashboard);

    return router;
}

module.exports = createPagesRouter;
