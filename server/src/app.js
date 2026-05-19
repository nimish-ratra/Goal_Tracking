const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./utils/errorHandler');

const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const checkinRoutes = require('./routes/checkins');
const userRoutes = require('./routes/users');
const cycleRoutes = require('./routes/cycles');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({
  // Rate limiter resets on server restart
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
