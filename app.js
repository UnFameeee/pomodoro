const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const security = require('./middleware/security');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(security.securityMiddleware);

// Routes
const indexRouter = require('./routes/index');
const settingsRouter = require('./routes/settings');
const historyRouter = require('./routes/history');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { getCurrentUser } = require('./middleware/auth');

// Apply routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/settings', settingsRouter);
app.use('/history', historyRouter);
app.use('/api', apiRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 