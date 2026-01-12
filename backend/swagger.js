const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ElimuAI API',
    version: '1.0.0',
    description: 'AI-powered learning platform API for Tanzania',
    contact: {
      name: 'ElimuAI Team',
      email: 'support@elimuai.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://elimuai.onrender.com',
      description: 'Production server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'User ID' },
          username: { type: 'string', description: 'Username' },
          email: { type: 'string', format: 'email', description: 'Email address' },
          role: { type: 'string', enum: ['student', 'instructor', 'admin'], description: 'User role' },
          avatar_url: { type: 'string', description: 'Avatar URL' },
          created_at: { type: 'string', format: 'date-time', description: 'Account creation date' }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Course ID' },
          title: { type: 'string', description: 'Course title' },
          description: { type: 'string', description: 'Course description' },
          category: { type: 'string', description: 'Course category' },
          difficulty_level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], description: 'Difficulty level' },
          lesson_count: { type: 'integer', description: 'Number of lessons' },
          quiz_count: { type: 'integer', description: 'Number of quizzes' },
          price: { type: 'number', description: 'Course price in USD' },
          is_premium: { type: 'boolean', description: 'Whether course is premium' },
          instructor_id: { type: 'integer', description: 'Instructor ID' },
          created_at: { type: 'string', format: 'date-time', description: 'Creation date' }
        }
      },
      Lesson: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Lesson ID' },
          course_id: { type: 'integer', description: 'Parent course ID' },
          title: { type: 'string', description: 'Lesson title' },
          content: { type: 'string', description: 'Lesson content (HTML/markdown)' },
          video_url: { type: 'string', description: 'Video URL if applicable' },
          order_index: { type: 'integer', description: 'Order in course' },
          duration_minutes: { type: 'integer', description: 'Estimated duration' },
          created_at: { type: 'string', format: 'date-time', description: 'Creation date' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', description: 'Error message' },
          error: { type: 'string', description: 'Error details' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Swagger options
const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './routes/**/*.js'], // Paths to files containing OpenAPI definitions
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Custom CSS for ElimuAI branding
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info .title { color: #4f46e5 }
  .swagger-ui .scheme-container { background: #f8fafc }
  .swagger-ui .btn { background-color: #4f46e5; border-color: #4f46e5 }
  .swagger-ui .btn:hover { background-color: #4338ca; border-color: #4338ca }
`;

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss,
  customSiteTitle: 'ElimuAI API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  }
}));

// Serve OpenAPI JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

console.log('📚 API Documentation available at /api-docs');
console.log('📄 OpenAPI JSON available at /api-docs.json');

module.exports = { swaggerSpec };
