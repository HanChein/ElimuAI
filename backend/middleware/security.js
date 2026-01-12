const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes.'
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const createCourseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 course creations per hour
  message: {
    success: false,
    message: 'Course creation limit exceeded. Please try again later.'
  }
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent. Please slow down.'
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://elimuai.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'exp://localhost:19000', // Expo development
      'https://*.expo.dev', // Expo production
    ];

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace('*', '.*'));
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Helmet security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.twilio.com"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Apply security middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));

// Data sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent parameter pollution

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/', apiLimiter);
app.use('/api/courses', createCourseLimiter);
app.use('/api/groups/*/messages', messageLimiter);
app.use('/api/forums/topics', messageLimiter);

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// SQL injection prevention middleware
const sqlInjectionCheck = (req, res, next) => {
  const suspiciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /('|(\\x27)|(\\x2D\\x2D)|(\#)|(\%27)|(\%23))/i,
    /(<script|javascript:|vbscript:|onload=|onerror=)/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(403).json({
      success: false,
      message: 'Suspicious input detected'
    });
  }

  next();
};

app.use(sqlInjectionCheck);

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logData.method} ${logData.url} ${logData.status} - ${logData.duration}`);
    }

    // In production, you might want to log to a service like Winston or CloudWatch
  });

  next();
};

app.use(requestLogger);

// File upload security
const multer = require('multer');
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/mov',
      'audio/mpeg',
      'audio/wav',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// API key authentication for external services
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};

// Brute force protection for sensitive endpoints
const bruteForceProtection = require('express-brute');
const store = new bruteForceProtection.MemoryStore();

const bruteforce = new bruteForceProtection(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  failCallback: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please try again later.'
    });
  }
});

// Apply brute force protection
app.use('/api/auth/login', bruteforce.prevent);
app.use('/api/auth/register', bruteforce.prevent);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

console.log('🔒 Security middleware configured');
console.log('🚦 Rate limiting enabled');
console.log('🛡️  CORS configured');
console.log('🔍 Input validation active');
console.log('📝 Request logging enabled');

module.exports = {
  authLimiter,
  apiLimiter,
  createCourseLimiter,
  messageLimiter,
  validateInput,
  upload,
  apiKeyAuth
};
