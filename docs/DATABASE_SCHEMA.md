# ElimuAI Database Schema

## Overview
This document describes the database schema for the ElimuAI e-learning platform.

## Entity Relationship Diagram

```
Users (1) ──── (M) Progress
Users (1) ──── (M) QuizAttempts
Users (1) ──── (M) Payments

Courses (1) ──── (M) Lessons
Courses (1) ──── (M) Quizzes
Courses (1) ──── (M) Progress

Quizzes (1) ──── (M) Questions
Quizzes (1) ──── (M) QuizAttempts

Lessons (1) ──── (M) Progress
```

## Tables

### Users
Stores user account information and preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique user identifier |
| username | String(80) | UNIQUE, NOT NULL | User's login name |
| email | String(120) | UNIQUE, NOT NULL | User's email address |
| password_hash | String(255) | NOT NULL | Hashed password |
| phone_number | String(20) | | Phone number for M-Pesa |
| preferred_language | String(10) | DEFAULT 'sw' | Language preference (sw/en) |
| is_premium | Boolean | DEFAULT False | Premium subscription status |
| premium_expires | DateTime | NULLABLE | Premium expiration date |
| created_at | DateTime | DEFAULT NOW | Account creation timestamp |

**Indexes:**
- username (unique)
- email (unique)

**Relationships:**
- One-to-Many with Progress
- One-to-Many with QuizAttempts
- One-to-Many with Payments

---

### Courses
Stores course information in both English and Swahili.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique course identifier |
| title_en | String(200) | NOT NULL | Course title in English |
| title_sw | String(200) | NOT NULL | Course title in Swahili |
| description_en | Text | | Course description in English |
| description_sw | Text | | Course description in Swahili |
| category | String(50) | NOT NULL | Course category (math/business/vocational) |
| difficulty_level | String(20) | DEFAULT 'beginner' | Difficulty level |
| is_premium | Boolean | DEFAULT False | Premium content flag |
| created_at | DateTime | DEFAULT NOW | Course creation timestamp |

**Indexes:**
- category

**Relationships:**
- One-to-Many with Lessons
- One-to-Many with Quizzes
- One-to-Many with Progress

---

### Lessons
Stores lesson content in both languages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique lesson identifier |
| course_id | Integer | FOREIGN KEY, NOT NULL | Reference to Courses.id |
| title_en | String(200) | NOT NULL | Lesson title in English |
| title_sw | String(200) | NOT NULL | Lesson title in Swahili |
| content_en | Text | NOT NULL | Lesson content in English |
| content_sw | Text | NOT NULL | Lesson content in Swahili |
| order | Integer | DEFAULT 0 | Lesson order in course |
| created_at | DateTime | DEFAULT NOW | Lesson creation timestamp |

**Indexes:**
- course_id
- (course_id, order)

**Relationships:**
- Many-to-One with Courses
- One-to-Many with Progress

---

### Quizzes
Stores quiz metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique quiz identifier |
| course_id | Integer | FOREIGN KEY, NOT NULL | Reference to Courses.id |
| title_en | String(200) | NOT NULL | Quiz title in English |
| title_sw | String(200) | NOT NULL | Quiz title in Swahili |
| difficulty_level | String(20) | DEFAULT 'beginner' | Difficulty level |
| created_at | DateTime | DEFAULT NOW | Quiz creation timestamp |

**Indexes:**
- course_id

**Relationships:**
- Many-to-One with Courses
- One-to-Many with Questions
- One-to-Many with QuizAttempts

---

### Questions
Stores quiz questions with multiple choice options.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique question identifier |
| quiz_id | Integer | FOREIGN KEY, NOT NULL | Reference to Quizzes.id |
| question_text_en | Text | NOT NULL | Question in English |
| question_text_sw | Text | NOT NULL | Question in Swahili |
| option_a_en | String(200) | NOT NULL | Option A in English |
| option_a_sw | String(200) | NOT NULL | Option A in Swahili |
| option_b_en | String(200) | NOT NULL | Option B in English |
| option_b_sw | String(200) | NOT NULL | Option B in Swahili |
| option_c_en | String(200) | NOT NULL | Option C in English |
| option_c_sw | String(200) | NOT NULL | Option C in Swahili |
| option_d_en | String(200) | NOT NULL | Option D in English |
| option_d_sw | String(200) | NOT NULL | Option D in Swahili |
| correct_answer | String(1) | NOT NULL | Correct answer (A/B/C/D) |
| explanation_en | Text | | Explanation in English |
| explanation_sw | Text | | Explanation in Swahili |

**Indexes:**
- quiz_id

**Relationships:**
- Many-to-One with Quizzes

---

### QuizAttempts
Stores user quiz attempt records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique attempt identifier |
| user_id | Integer | FOREIGN KEY, NOT NULL | Reference to Users.id |
| quiz_id | Integer | FOREIGN KEY, NOT NULL | Reference to Quizzes.id |
| score | Float | NOT NULL | Number of correct answers |
| total_questions | Integer | NOT NULL | Total questions in quiz |
| answers | JSON | | User's answers (question_id: answer) |
| completed_at | DateTime | DEFAULT NOW | Completion timestamp |

**Indexes:**
- user_id
- quiz_id
- (user_id, completed_at)

**Relationships:**
- Many-to-One with Users
- Many-to-One with Quizzes

---

### Progress
Tracks user progress through courses and lessons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique progress identifier |
| user_id | Integer | FOREIGN KEY, NOT NULL | Reference to Users.id |
| course_id | Integer | FOREIGN KEY, NOT NULL | Reference to Courses.id |
| lesson_id | Integer | FOREIGN KEY, NULLABLE | Reference to Lessons.id |
| completed | Boolean | DEFAULT False | Completion status |
| last_accessed | DateTime | DEFAULT NOW | Last access timestamp |

**Indexes:**
- user_id
- course_id
- lesson_id
- (user_id, course_id)

**Relationships:**
- Many-to-One with Users
- Many-to-One with Courses
- Many-to-One with Lessons

---

### Payments
Stores M-Pesa payment transactions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PRIMARY KEY | Unique payment identifier |
| user_id | Integer | FOREIGN KEY, NOT NULL | Reference to Users.id |
| amount | Float | NOT NULL | Payment amount (TZS) |
| phone_number | String(20) | NOT NULL | M-Pesa phone number |
| transaction_id | String(100) | UNIQUE | M-Pesa checkout request ID |
| mpesa_receipt | String(100) | | M-Pesa receipt number |
| status | String(20) | DEFAULT 'pending' | Payment status |
| created_at | DateTime | DEFAULT NOW | Payment initiation timestamp |
| completed_at | DateTime | NULLABLE | Payment completion timestamp |

**Indexes:**
- user_id
- transaction_id (unique)
- status

**Relationships:**
- Many-to-One with Users

---

## Sample Queries

### Get user's enrolled courses
```sql
SELECT DISTINCT c.* 
FROM courses c
JOIN progress p ON c.id = p.course_id
WHERE p.user_id = ?
```

### Get user's quiz performance
```sql
SELECT q.title_en, qa.score, qa.total_questions, 
       (qa.score / qa.total_questions * 100) as percentage
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.user_id = ?
ORDER BY qa.completed_at DESC
```

### Get course completion percentage
```sql
SELECT 
    c.id,
    c.title_en,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT CASE WHEN p.completed = 1 THEN p.lesson_id END) as completed_lessons,
    (COUNT(DISTINCT CASE WHEN p.completed = 1 THEN p.lesson_id END) * 100.0 / 
     COUNT(DISTINCT l.id)) as completion_percentage
FROM courses c
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = ?
WHERE c.id = ?
GROUP BY c.id
```

## Migration Notes

### From SQLite to PostgreSQL

When migrating to PostgreSQL for production:

1. JSON column type is natively supported
2. DateTime fields use timezone-aware timestamps
3. Add proper indexes for foreign keys
4. Consider adding full-text search indexes for content fields

### Recommended Indexes for Production

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_lessons_course_order ON lessons(course_id, order);
CREATE INDEX idx_progress_user_course ON progress(user_id, course_id);
CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, completed_at);
CREATE INDEX idx_payments_status ON payments(status);
```

## Data Integrity

### Cascade Deletes

- Deleting a User cascades to: Progress, QuizAttempts, Payments
- Deleting a Course cascades to: Lessons, Quizzes, Progress
- Deleting a Quiz cascades to: Questions, QuizAttempts
- Deleting a Lesson cascades to: Progress

### Constraints

- Email and username must be unique
- Phone numbers should follow format: 254XXXXXXXXX (Tanzanian format)
- Language codes: 'en' or 'sw' only
- Quiz answers: 'A', 'B', 'C', or 'D' only
- Payment status: 'pending', 'completed', or 'failed'
