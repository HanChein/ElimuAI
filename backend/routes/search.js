// Advanced Search with AI-Powered Suggestions
const express = require('express');
const router = express.Router();

// Search courses with advanced filters
router.get('/courses', async (req, res) => {
  try {
    const {
      q: query = '',
      category,
      difficulty,
      price_min,
      price_max,
      rating_min,
      duration_min,
      duration_max,
      language = 'en',
      sort = 'relevance',
      page = 1,
      limit = 20,
      tags,
      instructor,
      premium_only = false
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['c.status = "published"'];
    let params = [];

    // Text search
    if (query.trim()) {
      whereConditions.push(`(
        MATCH(c.title, c.description) AGAINST(? IN NATURAL LANGUAGE MODE) OR
        c.title LIKE ? OR
        c.description LIKE ?
      )`);
      params.push(query, `%${query}%`, `%${query}%`);
    }

    // Filters
    if (category) {
      whereConditions.push('c.category = ?');
      params.push(category);
    }

    if (difficulty) {
      whereConditions.push('c.difficulty_level = ?');
      params.push(difficulty);
    }

    if (price_min !== undefined) {
      whereConditions.push('c.price >= ?');
      params.push(parseFloat(price_min));
    }

    if (price_max !== undefined) {
      whereConditions.push('c.price <= ?');
      params.push(parseFloat(price_max));
    }

    if (duration_min !== undefined) {
      whereConditions.push('c.estimated_duration >= ?');
      params.push(parseInt(duration_min));
    }

    if (duration_max !== undefined) {
      whereConditions.push('c.estimated_duration <= ?');
      params.push(parseInt(duration_max));
    }

    if (rating_min !== undefined) {
      whereConditions.push('c.average_rating >= ?');
      params.push(parseFloat(rating_min));
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      whereConditions.push('JSON_OVERLAPS(c.tags, ?)');
      params.push(JSON.stringify(tagArray));
    }

    if (instructor) {
      whereConditions.push('c.instructor_id = ?');
      params.push(instructor);
    }

    if (premium_only === 'true') {
      whereConditions.push('c.is_premium = 1');
    }

    // Language filter (for future multi-language support)
    whereConditions.push('c.language = ?');
    params.push(language);

    const whereClause = whereConditions.join(' AND ');

    // Sorting
    let orderBy = 'c.created_at DESC'; // default
    switch (sort) {
      case 'relevance':
        orderBy = query ? 'MATCH(c.title, c.description) AGAINST(? DESC)' : 'c.student_count DESC';
        if (query) params.push(query);
        break;
      case 'rating':
        orderBy = 'c.average_rating DESC, c.student_count DESC';
        break;
      case 'popular':
        orderBy = 'c.student_count DESC, c.average_rating DESC';
        break;
      case 'price_low':
        orderBy = 'c.price ASC';
        break;
      case 'price_high':
        orderBy = 'c.price DESC';
        break;
      case 'newest':
        orderBy = 'c.created_at DESC';
        break;
      case 'oldest':
        orderBy = 'c.created_at ASC';
        break;
    }

    // Main search query
    const searchQuery = `
      SELECT
        c.*,
        u.username as instructor_name,
        COUNT(DISTINCT up.user_id) as student_count,
        AVG(up.progress) as avg_completion,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as review_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN user_progress up ON c.id = up.course_id
      LEFT JOIN course_reviews r ON c.id = r.course_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const [courses] = await db.query(searchQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM courses c
      WHERE ${whereClause}
    `;

    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    // Get search suggestions
    const suggestions = await generateSearchSuggestions(query, category, req.user?.id);

    // Get related categories
    const relatedCategories = await getRelatedCategories(category, query);

    res.json({
      success: true,
      courses,
      suggestions,
      relatedCategories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        applied: {
          query,
          category,
          difficulty,
          priceRange: price_min && price_max ? `${price_min}-${price_max}` : null,
          ratingMin: rating_min,
          durationRange: duration_min && duration_max ? `${duration_min}-${duration_max}` : null,
          tags,
          instructor,
          premiumOnly: premium_only === 'true'
        }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

// Search lessons
router.get('/lessons', async (req, res) => {
  try {
    const {
      q: query = '',
      course_id,
      difficulty,
      has_video = false,
      duration_min,
      duration_max,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    if (query.trim()) {
      whereConditions.push(`(
        MATCH(l.title, l.content) AGAINST(? IN NATURAL LANGUAGE MODE) OR
        l.title LIKE ? OR
        l.content LIKE ?
      )`);
      params.push(query, `%${query}%`, `%${query}%`);
    }

    if (course_id) {
      whereConditions.push('l.course_id = ?');
      params.push(course_id);
    }

    if (difficulty) {
      whereConditions.push('c.difficulty_level = ?');
      params.push(difficulty);
    }

    if (has_video === 'true') {
      whereConditions.push('l.video_url IS NOT NULL AND l.video_url != ""');
    }

    if (duration_min !== undefined) {
      whereConditions.push('l.duration_minutes >= ?');
      params.push(parseInt(duration_min));
    }

    if (duration_max !== undefined) {
      whereConditions.push('l.duration_minutes <= ?');
      params.push(parseInt(duration_max));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const searchQuery = `
      SELECT
        l.*,
        c.title as course_title,
        c.category,
        c.difficulty_level,
        COUNT(DISTINCT up.user_id) as view_count
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      LEFT JOIN user_progress up ON l.id = up.lesson_id
      ${whereClause}
      GROUP BY l.id
      ORDER BY
        CASE WHEN ? != '' THEN MATCH(l.title, l.content) AGAINST(? DESC) ELSE 0 END DESC,
        l.order_index ASC
      LIMIT ? OFFSET ?
    `;

    params.push(query, query, parseInt(limit), offset);

    const [lessons] = await db.query(searchQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM lessons l JOIN courses c ON l.course_id = c.id ${whereClause}`;
    const [countResult] = await db.query(countQuery, params.slice(0, -4));
    const total = countResult[0].total;

    res.json({
      success: true,
      lessons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Lesson search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lesson search failed'
    });
  }
});

// AI-powered search suggestions
async function generateSearchSuggestions(query, category, userId) {
  try {
    const suggestions = [];

    if (!query || query.length < 2) {
      // Default suggestions based on popularity
      const [popular] = await db.query(`
        SELECT title, COUNT(up.user_id) as popularity
        FROM courses c
        LEFT JOIN user_progress up ON c.id = up.course_id
        WHERE c.status = 'published'
        GROUP BY c.id
        ORDER BY popularity DESC
        LIMIT 5
      `);

      suggestions.push(...popular.map(course => ({
        text: course.title,
        type: 'popular',
        reason: 'Popular course'
      })));
    } else {
      // AI-powered suggestions based on query
      const queryWords = query.toLowerCase().split(' ');

      // Find related terms
      const [relatedTerms] = await db.query(`
        SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n.n), ',', -1) as tag
        FROM courses c
        CROSS JOIN (
          SELECT 1 as n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        ) n
        WHERE JSON_EXTRACT(c.tags, CONCAT('$[', n.n-1, ']')) IS NOT NULL
        AND LOWER(JSON_EXTRACT(c.tags, CONCAT('$[', n.n-1, ']'))) LIKE ?
        LIMIT 3
      `, [`%${queryWords[0]}%`]);

      suggestions.push(...relatedTerms.map(term => ({
        text: JSON.parse(term.tag),
        type: 'related',
        reason: 'Related topic'
      })));

      // Personalized suggestions for logged-in users
      if (userId) {
        const [userInterests] = await db.query(`
          SELECT c.category, c.difficulty_level
          FROM user_progress up
          JOIN courses c ON up.course_id = c.id
          WHERE up.user_id = ? AND up.completed = 1
          GROUP BY c.category, c.difficulty_level
          ORDER BY COUNT(*) DESC
          LIMIT 2
        `, [userId]);

        for (const interest of userInterests) {
          const [similarCourses] = await db.query(`
            SELECT title
            FROM courses
            WHERE category = ? AND difficulty_level = ?
            AND status = 'published'
            AND title LIKE ?
            LIMIT 1
          `, [interest.category, interest.difficulty_level, `%${query}%`]);

          if (similarCourses.length > 0) {
            suggestions.push({
              text: similarCourses[0].title,
              type: 'personalized',
              reason: `Based on your interest in ${interest.category}`
            });
          }
        }
      }
    }

    // Category-specific suggestions
    if (category) {
      const [categoryCourses] = await db.query(`
        SELECT title
        FROM courses
        WHERE category = ? AND status = 'published'
        ORDER BY student_count DESC
        LIMIT 2
      `, [category]);

      suggestions.push(...categoryCourses.map(course => ({
        text: course.title,
        type: 'category',
        reason: `Trending in ${category}`
      })));
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions

  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
}

// Get related categories
async function getRelatedCategories(currentCategory, query) {
  try {
    let categories = [];

    if (currentCategory) {
      // Get categories that users also search with the current category
      const [related] = await db.query(`
        SELECT c2.category, COUNT(*) as frequency
        FROM user_progress up1
        JOIN user_progress up2 ON up1.user_id = up2.user_id AND up1.course_id != up2.course_id
        JOIN courses c1 ON up1.course_id = c1.id
        JOIN courses c2 ON up2.course_id = c2.id
        WHERE c1.category = ? AND c2.category != ?
        GROUP BY c2.category
        ORDER BY frequency DESC
        LIMIT 3
      `, [currentCategory, currentCategory]);

      categories = related.map(cat => ({
        name: cat.category,
        reason: 'Often studied together'
      }));
    } else if (query) {
      // Get categories related to search query
      const [queryCategories] = await db.query(`
        SELECT category, COUNT(*) as count
        FROM courses
        WHERE (title LIKE ? OR description LIKE ?) AND status = 'published'
        GROUP BY category
        ORDER BY count DESC
        LIMIT 3
      `, [`%${query}%`, `%${query}%`]);

      categories = queryCategories.map(cat => ({
        name: cat.category,
        reason: 'Matches your search'
      }));
    }

    return categories;
  } catch (error) {
    console.error('Related categories error:', error);
    return [];
  }
}

// Search users (for social features)
router.get('/users', async (req, res) => {
  try {
    const { q: query, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = ['u.id != ?']; // Exclude current user
    let params = [req.user?.id || 0];

    if (query) {
      whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }

    if (role) {
      whereConditions.push('u.role = ?');
      params.push(role);
    }

    const whereClause = whereConditions.join(' AND ');

    const searchQuery = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.avatar_url,
        u.created_at,
        COUNT(DISTINCT c.id) as courses_created,
        COUNT(DISTINCT up.user_id) as students_taught
      FROM users u
      LEFT JOIN courses c ON u.id = c.instructor_id
      LEFT JOIN user_progress up ON c.id = up.course_id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY u.username ASC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    const [users] = await db.query(searchQuery, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`;
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'User search failed'
    });
  }
});

// Global search (combines all search types)
router.get('/global', async (req, res) => {
  try {
    const { q: query, type = 'all', page = 1, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        results: {
          courses: [],
          lessons: [],
          users: [],
          forums: []
        }
      });
    }

    const results = {
      courses: [],
      lessons: [],
      users: [],
      forums: []
    };

    // Search courses
    if (type === 'all' || type === 'courses') {
      const [courses] = await db.query(`
        SELECT id, title, description, category, 'course' as type
        FROM courses
        WHERE status = 'published' AND (title LIKE ? OR description LIKE ?)
        ORDER BY student_count DESC
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, limit]);

      results.courses = courses;
    }

    // Search lessons
    if (type === 'all' || type === 'lessons') {
      const [lessons] = await db.query(`
        SELECT l.id, l.title, c.title as course_title, 'lesson' as type
        FROM lessons l
        JOIN courses c ON l.course_id = c.id
        WHERE c.status = 'published' AND l.title LIKE ?
        ORDER BY l.order_index ASC
        LIMIT ?
      `, [`%${query}%`, limit]);

      results.lessons = lessons;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const [users] = await db.query(`
        SELECT id, username, role, 'user' as type
        FROM users
        WHERE username LIKE ? OR email LIKE ?
        ORDER BY username ASC
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, limit]);

      results.users = users;
    }

    // Search forums
    if (type === 'all' || type === 'forums') {
      const [forums] = await db.query(`
        SELECT id, title, 'forum' as type
        FROM forum_topics
        WHERE title LIKE ? OR content LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, limit]);

      results.forums = forums;
    }

    res.json({
      success: true,
      query,
      results,
      total: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Global search failed'
    });
  }
});

module.exports = router;
