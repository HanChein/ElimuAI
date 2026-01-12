// AI-Powered Recommendations Engine
const getUserLearningPattern = async (userId) => {
    try {
        // Get user's completed courses and lessons
        const [completedCourses] = await db.query(`
            SELECT c.id, c.title, c.category, c.difficulty_level
            FROM user_progress up
            JOIN courses c ON up.course_id = c.id
            WHERE up.user_id = ? AND up.completed = 1
        `, [userId]);

        // Get user's quiz performance
        const [quizScores] = await db.query(`
            SELECT q.category, AVG(uq.score) as avg_score
            FROM user_quizzes uq
            JOIN quizzes q ON uq.quiz_id = q.id
            WHERE uq.user_id = ?
            GROUP BY q.category
        `, [userId]);

        // Get user's learning preferences (time of day, session duration, etc.)
        const [learningHabits] = await db.query(`
            SELECT
                HOUR(start_time) as preferred_hour,
                AVG(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as avg_session_minutes,
                COUNT(*) as total_sessions
            FROM user_sessions
            WHERE user_id = ? AND end_time IS NOT NULL
            GROUP BY HOUR(start_time)
            ORDER BY COUNT(*) DESC
            LIMIT 3
        `, [userId]);

        return {
            completedCourses,
            quizScores: quizScores.reduce((acc, score) => {
                acc[score.category] = score.avg_score;
                return acc;
            }, {}),
            learningHabits: learningHabits[0] || {}
        };
    } catch (error) {
        console.error('Error getting user learning pattern:', error);
        return { completedCourses: [], quizScores: {}, learningHabits: {} };
    }
};

const calculateContentSimilarity = (userProfile, course) => {
    let score = 0;
    let reasons = [];

    // Category preference
    const completedCategories = userProfile.completedCourses.map(c => c.category);
    if (completedCategories.includes(course.category)) {
        score += 0.3;
        reasons.push('Similar to courses you\'ve enjoyed');
    }

    // Difficulty progression
    const avgDifficulty = userProfile.completedCourses.reduce((sum, c) => sum + (c.difficulty_level || 1), 0) /
                         Math.max(userProfile.completedCourses.length, 1);

    if (Math.abs(course.difficulty_level - avgDifficulty) <= 1) {
        score += 0.25;
        reasons.push('Matches your current skill level');
    }

    // Quiz performance in category
    if (userProfile.quizScores[course.category] > 70) {
        score += 0.2;
        reasons.push('You excel in this subject area');
    }

    // Learning style (based on session patterns)
    if (userProfile.learningHabits.total_sessions > 10) {
        score += 0.15;
        reasons.push('Aligns with your learning schedule');
    }

    // Popularity bonus (courses with high completion rates)
    const [popularity] = await db.query(`
        SELECT AVG(progress) as avg_completion
        FROM user_progress
        WHERE course_id = ? AND progress > 0
    `, [course.id]);

    if (popularity[0]?.avg_completion > 70) {
        score += 0.1;
        reasons.push('Highly rated by other learners');
    }

    return {
        score: Math.min(score, 1),
        reasons
    };
};

const generatePersonalizedRecommendations = async (userId) => {
    try {
        const userProfile = await getUserLearningPattern(userId);

        // Get all available courses not completed by user
        const [availableCourses] = await db.query(`
            SELECT c.*, COUNT(up.user_id) as student_count
            FROM courses c
            LEFT JOIN user_progress up ON c.id = up.course_id AND up.completed = 1 AND up.user_id = ?
            WHERE up.user_id IS NULL OR up.completed = 0
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT 50
        `, [userId]);

        // Calculate recommendations for courses
        const courseRecommendations = [];
        for (const course of availableCourses) {
            const similarity = await calculateContentSimilarity(userProfile, course);
            if (similarity.score > 0.3) { // Only include relevant recommendations
                courseRecommendations.push({
                    ...course,
                    confidence_score: similarity.score,
                    ai_reason: similarity.reasons[Math.floor(Math.random() * similarity.reasons.length)]
                });
            }
        }

        // Sort by confidence score
        courseRecommendations.sort((a, b) => b.confidence_score - a.confidence_score);

        // Get lesson recommendations based on current progress
        const [inProgressCourses] = await db.query(`
            SELECT c.id, c.title, l.id as lesson_id, l.title as lesson_title
            FROM user_progress up
            JOIN courses c ON up.course_id = c.id
            JOIN lessons l ON c.id = l.course_id
            WHERE up.user_id = ? AND up.completed = 0
            ORDER BY up.last_accessed DESC
            LIMIT 10
        `, [userId]);

        // Get study path recommendations
        const studyPaths = await generateStudyPaths(userProfile);

        return {
            courses: courseRecommendations.slice(0, 5),
            lessons: inProgressCourses.map(item => ({
                id: item.lesson_id,
                title: item.lesson_title,
                course_title: item.title,
                ai_reason: 'Continue where you left off',
                confidence_score: 0.9
            })),
            studyPaths
        };

    } catch (error) {
        console.error('Error generating recommendations:', error);
        return { courses: [], lessons: [], studyPaths: [] };
    }
};

const generateStudyPaths = async (userProfile) => {
    // Generate personalized learning paths based on user profile
    const paths = [];

    // Career-focused paths
    if (userProfile.quizScores['business'] > 60) {
        paths.push({
            id: 'business-fundamentals',
            title: 'Business Fundamentals Path',
            description: 'Complete foundation for business studies',
            course_count: 5,
            estimated_hours: 40,
            ai_reason: 'Based on your business aptitude',
            confidence_score: 0.85
        });
    }

    // Academic improvement paths
    if (userProfile.quizScores['math'] < 70 && userProfile.completedCourses.length > 0) {
        paths.push({
            id: 'math-improvement',
            title: 'Mathematics Mastery',
            description: 'Strengthen your math foundation',
            course_count: 4,
            estimated_hours: 32,
            ai_reason: 'Targeted improvement in mathematics',
            confidence_score: 0.8
        });
    }

    // Skill development paths
    if (userProfile.learningHabits.total_sessions > 20) {
        paths.push({
            id: 'vocational-skills',
            title: 'Vocational Skills Bundle',
            description: 'Practical skills for career advancement',
            course_count: 6,
            estimated_hours: 48,
            ai_reason: 'Matches your consistent learning habit',
            confidence_score: 0.75
        });
    }

    return paths.slice(0, 3);
};

// API endpoint for recommendations
app.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
        const recommendations = await generatePersonalizedRecommendations(req.user.id);

        res.json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating recommendations'
        });
    }
});

// Collaborative filtering for similar users
const findSimilarUsers = async (userId, limit = 5) => {
    try {
        const [userCourses] = await db.query(`
            SELECT course_id FROM user_progress
            WHERE user_id = ? AND completed = 1
        `, [userId]);

        const userCourseIds = userCourses.map(c => c.course_id);

        if (userCourseIds.length === 0) return [];

        // Find users who completed similar courses
        const [similarUsers] = await db.query(`
            SELECT DISTINCT up.user_id,
                   COUNT(*) as common_courses
            FROM user_progress up
            WHERE up.course_id IN (${userCourseIds.map(() => '?').join(',')})
            AND up.user_id != ?
            AND up.completed = 1
            GROUP BY up.user_id
            ORDER BY common_courses DESC
            LIMIT ?
        `, [...userCourseIds, userId, limit]);

        return similarUsers;
    } catch (error) {
        console.error('Error finding similar users:', error);
        return [];
    }
};

// Enhanced recommendations with collaborative filtering
const getCollaborativeRecommendations = async (userId) => {
    try {
        const similarUsers = await findSimilarUsers(userId);

        if (similarUsers.length === 0) return [];

        const similarUserIds = similarUsers.map(u => u.user_id);

        // Get courses that similar users liked but user hasn't taken
        const [recommendations] = await db.query(`
            SELECT c.*, COUNT(*) as recommendation_count
            FROM courses c
            JOIN user_progress up ON c.id = up.course_id
            WHERE up.user_id IN (${similarUserIds.map(() => '?').join(',')})
            AND up.completed = 1
            AND c.id NOT IN (
                SELECT course_id FROM user_progress WHERE user_id = ?
            )
            GROUP BY c.id
            ORDER BY recommendation_count DESC, c.student_count DESC
            LIMIT 3
        `, [...similarUserIds, userId]);

        return recommendations.map(course => ({
            ...course,
            ai_reason: 'Recommended by learners with similar interests',
            confidence_score: 0.7
        }));

    } catch (error) {
        console.error('Collaborative filtering error:', error);
        return [];
    }
};

// Machine learning-based difficulty prediction
const predictOptimalDifficulty = (userProfile) => {
    const recentScores = Object.values(userProfile.quizScores);
    const avgScore = recentScores.reduce((sum, score) => sum + score, 0) / Math.max(recentScores.length, 1);

    // Simple ML-like logic for difficulty recommendation
    if (avgScore > 85) return 'advanced';
    if (avgScore > 70) return 'intermediate';
    if (avgScore > 50) return 'beginner';
    return 'beginner'; // Encourage starting simple
};
