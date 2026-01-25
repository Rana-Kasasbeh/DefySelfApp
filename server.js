require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { initCronJobs } = require('./utils/cronJobs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const waterRoutes = require('./routes/water');
const habitRoutes = require('./routes/habits');
const learningRoutes = require('./routes/learning');
const vocabularyRoutes = require('./routes/vocabulary');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Initialize cron jobs
initCronJobs();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'http://localhost:19006'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'DefySelf API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   DefySelf API Server                     ║
║   Server running on port ${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Time: ${new Date().toLocaleString('ar-EG')}  ║
╚═══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
