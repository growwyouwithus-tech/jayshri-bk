const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google DNS to resolve MongoDB Atlas SRV records
const express = require('express')
console.log('🔄 Server Restarting...');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Security middleware with relaxed CSP for images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "http://localhost:5174", "http://localhost:5173"],
    },
  },
}));

// Rate limiting (disabled for development, enable for production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes only in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.USER_APP_URL || 'http://localhost:5174',
    'http://localhost:3000' // Additional fallback
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Database connection with retry logic
const connectDB = async () => {
  let retries = 5;

  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });
      // `mongoose.connect()` resolves to the `mongoose` instance in v6/v7, so we
      // should read the details from `mongoose.connection` instead of the return
      // value. This also works reliably across standalone and Atlas clusters.
      const { host, port, name: dbName } = mongoose.connection;
      console.log(`✅ MongoDB Connected: ${host ?? 'unknown'}${port ? ':' + port : ''}`);
      console.log(`📊 Database: ${dbName ?? 'unknown'}`);
      return;
    } catch (error) {
      retries -= 1;
      console.error(`❌ Database connection error: ${error.message}`);
      console.log(`⏳ Retrying connection... (${retries} attempts remaining)`);

      if (retries === 0) {
        console.error('❌ Failed to connect to MongoDB after 5 attempts');
        process.exit(1);
      }

      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Connect to database
connectDB();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/customer-auth', require('./routes/customerAuthRoutes').router);
app.use('/api/v1/customers', require('./routes/customerRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/roles', require('./routes/roleRoutes'));
app.use('/api/v1/colonies', require('./routes/colonyRoutes'));
app.use('/api/v1/plots', require('./routes/plotRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/properties', require('./routes/propertyRoutes'));
app.use('/api/v1/settings', require('./routes/settingsRoutes'));
app.use('/api/v1/cities', require('./routes/cityRoutes'));
app.use('/api/v1/registry', require('./routes/registryRoutes'));
app.use('/api/v1/commissions', require('./routes/commissionRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/kisan-payments', require('./routes/kisanPaymentRoutes'));
app.use('/api/v1/expenses', require('./routes/expenseRoutes'));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Jaishree Colony Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongoConnection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api/v1`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});
