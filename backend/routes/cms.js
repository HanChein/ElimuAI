// Content Management System (CMS) Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateInput, upload } = require('../middleware/security');
const Joi = require('joi');

// Validation schemas
const courseSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().valid('math', 'business', 'vocational').required(),
  difficulty_level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
  price: Joi.number().min(0).max(999.99).precision(2),
  is_premium: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().max(50)),
  prerequisites: Joi.array().items(Joi.string()),
  learning_objectives: Joi.array().items(Joi.string()),
  estimated_duration: Joi.number().min(1).max(1000) // hours
});

const lessonSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).max(50000).required(),
  video_url: Joi.string().uri().allow(''),
  quiz_data: Joi.object(),
  order_index: Joi.number().integer().min(0),
  duration_minutes: Joi.number().integer().min(1).max(480),
  is_preview: Joi.boolean().default(false)
});

// Get all courses for CMS (admin/instructor only)
router.get('/courses', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, u.username as instructor_name,
             COUNT(DISTINCT up.user_id) as student_count,
             AVG(up.progress) as avg_completion
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN user_progress up ON c.id = up.course_id
      WHERE 1=1
    `;

    const params = [];

    if (status !== 'all') {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add instructor filter for non-admin users
    if (req.user.role !== 'admin') {
      query += ` AND c.instructor_id = ?`;
      params.push(req.user.id);
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [courses] = await db.query(query, params);

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT c.id) as total FROM').split('ORDER BY')[0];
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('CMS courses fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses'
    });
  }
});

// Create new course
router.post('/courses', authenticateToken, requireRole(['admin', 'instructor']), validateInput(courseSchema), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      instructor_id: req.user.role === 'admin' ? (req.body.instructor_id || req.user.id) : req.user.id,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    const [result] = await db.query(
      `INSERT INTO courses (title, description, category, difficulty_level, price, is_premium, tags, prerequisites, learning_objectives, estimated_duration, instructor_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseData.title,
        courseData.description,
        courseData.category,
        courseData.difficulty_level,
        courseData.price || 0,
        courseData.is_premium || false,
        JSON.stringify(courseData.tags || []),
        JSON.stringify(courseData.prerequisites || []),
        JSON.stringify(courseData.learning_objectives || []),
        courseData.estimated_duration,
        courseData.instructor_id,
        courseData.status,
        courseData.created_at,
        courseData.updated_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      courseId: result.insertId
    });
  } catch (error) {
    console.error('Course creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course'
    });
  }
});

// Update course
router.put('/courses/:id', authenticateToken, requireRole(['admin', 'instructor']), validateInput(courseSchema), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    await db.query(
      `UPDATE courses SET
       title = ?, description = ?, category = ?, difficulty_level = ?,
       price = ?, is_premium = ?, tags = ?, prerequisites = ?,
       learning_objectives = ?, estimated_duration = ?, updated_at = ?
       WHERE id = ?`,
      [
        updateData.title,
        updateData.description,
        updateData.category,
        updateData.difficulty_level,
        updateData.price || 0,
        updateData.is_premium || false,
        JSON.stringify(updateData.tags || []),
        JSON.stringify(updateData.prerequisites || []),
        JSON.stringify(updateData.learning_objectives || []),
        updateData.estimated_duration,
        updateData.updated_at,
        courseId
      ]
    );

    res.json({
      success: true,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Course update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course'
    });
  }
});

// Publish/Draft course
router.patch('/courses/:id/status', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { status } = req.body;
    const courseId = req.params.id;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query(
      'UPDATE courses SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date(), courseId]
    );

    res.json({
      success: true,
      message: `Course ${status} successfully`
    });
  } catch (error) {
    console.error('Course status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course status'
    });
  }
});

// Delete course
router.delete('/courses/:id', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Soft delete - mark as deleted
    await db.query(
      'UPDATE courses SET status = "deleted", updated_at = ? WHERE id = ?',
      [new Date(), courseId]
    );

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Course deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course'
    });
  }
});

// Get course lessons for CMS
router.get('/courses/:id/lessons', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [lessons] = await db.query(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
      [courseId]
    );

    res.json({
      success: true,
      lessons
    });
  } catch (error) {
    console.error('Lessons fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons'
    });
  }
});

// Create lesson
router.post('/courses/:id/lessons', authenticateToken, requireRole(['admin', 'instructor']), validateInput(lessonSchema), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check course ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get next order index
    const [maxOrder] = await db.query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM lessons WHERE course_id = ?',
      [courseId]
    );

    const lessonData = {
      ...req.body,
      course_id: courseId,
      order_index: req.body.order_index !== undefined ? req.body.order_index : maxOrder[0].next_order,
      quiz_data: JSON.stringify(req.body.quiz_data || {}),
      created_at: new Date(),
      updated_at: new Date()
    };

    const [result] = await db.query(
      `INSERT INTO lessons (course_id, title, content, video_url, quiz_data, order_index, duration_minutes, is_preview, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lessonData.course_id,
        lessonData.title,
        lessonData.content,
        lessonData.video_url || null,
        lessonData.quiz_data,
        lessonData.order_index,
        lessonData.duration_minutes,
        lessonData.is_preview,
        lessonData.created_at,
        lessonData.updated_at
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lessonId: result.insertId
    });
  } catch (error) {
    console.error('Lesson creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson'
    });
  }
});

// Update lesson
router.put('/courses/:courseId/lessons/:lessonId', authenticateToken, requireRole(['admin', 'instructor']), validateInput(lessonSchema), async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Check ownership
    const [lesson] = await db.query(
      'SELECT l.course_id, c.instructor_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ?',
      [lessonId]
    );

    if (!lesson.length) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role !== 'admin' && lesson[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updateData = {
      ...req.body,
      quiz_data: JSON.stringify(req.body.quiz_data || {}),
      updated_at: new Date()
    };

    await db.query(
      `UPDATE lessons SET
       title = ?, content = ?, video_url = ?, quiz_data = ?,
       order_index = ?, duration_minutes = ?, is_preview = ?, updated_at = ?
       WHERE id = ? AND course_id = ?`,
      [
        updateData.title,
        updateData.content,
        updateData.video_url || null,
        updateData.quiz_data,
        updateData.order_index,
        updateData.duration_minutes,
        updateData.is_preview,
        updateData.updated_at,
        lessonId,
        courseId
      ]
    );

    res.json({
      success: true,
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    console.error('Lesson update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson'
    });
  }
});

// Reorder lessons
router.patch('/courses/:id/lessons/reorder', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { lessonOrder } = req.body; // Array of { id, order_index }

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update order indexes
    for (const item of lessonOrder) {
      await db.query(
        'UPDATE lessons SET order_index = ?, updated_at = ? WHERE id = ? AND course_id = ?',
        [item.order_index, new Date(), item.id, courseId]
      );
    }

    res.json({
      success: true,
      message: 'Lessons reordered successfully'
    });
  } catch (error) {
    console.error('Lesson reorder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder lessons'
    });
  }
});

// Delete lesson
router.delete('/courses/:courseId/lessons/:lessonId', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;

    // Check ownership
    const [lesson] = await db.query(
      'SELECT l.id, c.instructor_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ? AND l.course_id = ?',
      [lessonId, courseId]
    );

    if (!lesson.length) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role !== 'admin' && lesson[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query('DELETE FROM lessons WHERE id = ? AND course_id = ?', [lessonId, courseId]);

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Lesson deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson'
    });
  }
});

// Upload course thumbnail
router.post('/courses/:id/thumbnail', authenticateToken, requireRole(['admin', 'instructor']), upload.single('thumbnail'), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Here you would upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll just store the filename
    const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;

    await db.query(
      'UPDATE courses SET thumbnail_url = ?, updated_at = ? WHERE id = ?',
      [thumbnailUrl, new Date(), courseId]
    );

    res.json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      thumbnailUrl
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload thumbnail'
    });
  }
});

// Get course analytics
router.get('/courses/:id/analytics', authenticateToken, requireRole(['admin', 'instructor']), async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check ownership
    const [course] = await db.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
    if (!course.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course[0].instructor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get enrollment stats
    const [enrollments] = await db.query(
      'SELECT COUNT(*) as total_enrolled, COUNT(CASE WHEN completed = 1 THEN 1 END) as completed FROM user_progress WHERE course_id = ?',
      [courseId]
    );

    // Get completion rates by lesson
    const [lessonStats] = await db.query(`
      SELECT l.title, COUNT(up.user_id) as views, AVG(up.progress) as avg_progress
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id
      WHERE l.course_id = ?
      GROUP BY l.id, l.title
      ORDER BY l.order_index
    `, [courseId]);

    // Get quiz performance
    const [quizStats] = await db.query(`
      SELECT AVG(uq.score) as avg_quiz_score, COUNT(*) as total_quizzes
      FROM user_quizzes uq
      JOIN quizzes q ON uq.quiz_id = q.id
      WHERE q.course_id = ?
    `, [courseId]);

    res.json({
      success: true,
      analytics: {
        enrollments: enrollments[0],
        lessonStats,
        quizStats: quizStats[0]
      }
    });
  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
