function createPagesController() {
    return {
        landing(req, res) {
            res.json({
                status: 'ok',
                page: 'landing',
                message: 'Landing page endpoint'
            });
        },
        events(req, res) {
            res.json({
                status: 'ok',
                page: 'events',
                message: 'Events page endpoint'
            });
        },
        login(req, res) {
            res.json({
                status: 'ok',
                page: 'login',
                message: 'Login page endpoint'
            });
        },
        profile(req, res) {
            res.json({
                status: 'ok',
                page: 'profile',
                message: 'Profile page endpoint'
            });
        },
        signup(req, res) {
            res.json({
                status: 'ok',
                page: 'signup',
                message: 'Signup page endpoint'
            });
        },
        volunteerDashboard(req, res) {
            res.json({
                status: 'ok',
                page: 'volunteer-dashboard',
                message: 'Volunteer dashboard endpoint'
            });
        }
    };
}

module.exports = createPagesController;
