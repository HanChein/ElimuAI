from models import db, Course, Lesson, Quiz, Question
from datetime import datetime

def seed_database():
    courses_data = [
        {
            'title_en': 'Basic Mathematics',
            'title_sw': 'Hesabu za Msingi',
            'description_en': 'Learn fundamental math concepts including arithmetic, algebra, and geometry',
            'description_sw': 'Jifunze dhana za msingi za hesabu ikiwa ni pamoja na hesabu, aljebra, na jiometri',
            'category': 'math',
            'difficulty_level': 'beginner',
            'is_premium': False
        },
        {
            'title_en': 'Business Fundamentals',
            'title_sw': 'Misingi ya Biashara',
            'description_en': 'Essential business skills for entrepreneurs and small business owners',
            'description_sw': 'Ujuzi muhimu wa biashara kwa wajasiriamali na wamiliki wa biashara ndogo',
            'category': 'business',
            'difficulty_level': 'beginner',
            'is_premium': False
        },
        {
            'title_en': 'Vocational Skills - Carpentry',
            'title_sw': 'Ujuzi wa Ufundi - Useremala',
            'description_en': 'Learn practical carpentry skills for building and furniture making',
            'description_sw': 'Jifunze ujuzi wa vitendo wa useremala kwa ujenzi na kutengeneza samani',
            'category': 'vocational',
            'difficulty_level': 'beginner',
            'is_premium': True
        },
        {
            'title_en': 'Advanced Mathematics',
            'title_sw': 'Hesabu za Juu',
            'description_en': 'Advanced topics in calculus, statistics, and problem solving',
            'description_sw': 'Mada za juu katika calculus, takwimu, na utatuzi wa matatizo',
            'category': 'math',
            'difficulty_level': 'advanced',
            'is_premium': True
        }
    ]
    
    for course_data in courses_data:
        course = Course(**course_data)
        db.session.add(course)
        db.session.flush()
        
        if course.category == 'math' and course.difficulty_level == 'beginner':
            lessons = [
                {
                    'course_id': course.id,
                    'title_en': 'Introduction to Addition',
                    'title_sw': 'Utangulizi wa Kuongeza',
                    'content_en': 'Addition is combining two or more numbers to get a sum. For example: 5 + 3 = 8. Practice with simple numbers first.',
                    'content_sw': 'Kuongeza ni kuunganisha nambari mbili au zaidi kupata jumla. Kwa mfano: 5 + 3 = 8. Fanya mazoezi na nambari rahisi kwanza.',
                    'order': 1
                },
                {
                    'course_id': course.id,
                    'title_en': 'Subtraction Basics',
                    'title_sw': 'Misingi ya Kutoa',
                    'content_en': 'Subtraction is taking away one number from another. For example: 10 - 4 = 6. This is the opposite of addition.',
                    'content_sw': 'Kutoa ni kuondoa nambari moja kutoka nyingine. Kwa mfano: 10 - 4 = 6. Hii ni kinyume cha kuongeza.',
                    'order': 2
                },
                {
                    'course_id': course.id,
                    'title_en': 'Multiplication Made Easy',
                    'title_sw': 'Kuzidisha Kwa Urahisi',
                    'content_en': 'Multiplication is repeated addition. 3 × 4 means adding 3 four times: 3 + 3 + 3 + 3 = 12.',
                    'content_sw': 'Kuzidisha ni kuongeza kwa mara nyingi. 3 × 4 inamaanisha kuongeza 3 mara nne: 3 + 3 + 3 + 3 = 12.',
                    'order': 3
                }
            ]
            
            for lesson_data in lessons:
                lesson = Lesson(**lesson_data)
                db.session.add(lesson)
            
            quiz = Quiz(
                course_id=course.id,
                title_en='Basic Math Quiz',
                title_sw='Jaribio la Hesabu za Msingi',
                difficulty_level='beginner'
            )
            db.session.add(quiz)
            db.session.flush()
            
            questions = [
                {
                    'quiz_id': quiz.id,
                    'question_text_en': 'What is 8 + 7?',
                    'question_text_sw': 'Ni nini 8 + 7?',
                    'option_a_en': '13', 'option_a_sw': '13',
                    'option_b_en': '14', 'option_b_sw': '14',
                    'option_c_en': '15', 'option_c_sw': '15',
                    'option_d_en': '16', 'option_d_sw': '16',
                    'correct_answer': 'C',
                    'explanation_en': '8 + 7 = 15',
                    'explanation_sw': '8 + 7 = 15'
                },
                {
                    'quiz_id': quiz.id,
                    'question_text_en': 'What is 20 - 12?',
                    'question_text_sw': 'Ni nini 20 - 12?',
                    'option_a_en': '6', 'option_a_sw': '6',
                    'option_b_en': '7', 'option_b_sw': '7',
                    'option_c_en': '8', 'option_c_sw': '8',
                    'option_d_en': '9', 'option_d_sw': '9',
                    'correct_answer': 'C',
                    'explanation_en': '20 - 12 = 8',
                    'explanation_sw': '20 - 12 = 8'
                },
                {
                    'quiz_id': quiz.id,
                    'question_text_en': 'What is 6 × 5?',
                    'question_text_sw': 'Ni nini 6 × 5?',
                    'option_a_en': '25', 'option_a_sw': '25',
                    'option_b_en': '30', 'option_b_sw': '30',
                    'option_c_en': '35', 'option_c_sw': '35',
                    'option_d_en': '40', 'option_d_sw': '40',
                    'correct_answer': 'B',
                    'explanation_en': '6 × 5 = 30',
                    'explanation_sw': '6 × 5 = 30'
                }
            ]
            
            for q_data in questions:
                question = Question(**q_data)
                db.session.add(question)
        
        elif course.category == 'business' and course.difficulty_level == 'beginner':
            lessons = [
                {
                    'course_id': course.id,
                    'title_en': 'Understanding Your Market',
                    'title_sw': 'Kuelewa Soko Lako',
                    'content_en': 'Know your customers: who they are, what they need, and how to reach them. Market research is essential for business success.',
                    'content_sw': 'Jua wateja wako: ni nani, wanahitaji nini, na jinsi ya kuwafikia. Utafiti wa soko ni muhimu kwa mafanikio ya biashara.',
                    'order': 1
                },
                {
                    'course_id': course.id,
                    'title_en': 'Basic Accounting',
                    'title_sw': 'Uhasibu wa Msingi',
                    'content_en': 'Track income and expenses. Profit = Revenue - Costs. Keep accurate records for business health.',
                    'content_sw': 'Fuatilia mapato na matumizi. Faida = Mapato - Gharama. Weka kumbukumbu sahihi kwa afya ya biashara.',
                    'order': 2
                }
            ]
            
            for lesson_data in lessons:
                lesson = Lesson(**lesson_data)
                db.session.add(lesson)
            
            quiz = Quiz(
                course_id=course.id,
                title_en='Business Basics Quiz',
                title_sw='Jaribio la Misingi ya Biashara',
                difficulty_level='beginner'
            )
            db.session.add(quiz)
            db.session.flush()
            
            questions = [
                {
                    'quiz_id': quiz.id,
                    'question_text_en': 'What is the formula for profit?',
                    'question_text_sw': 'Formula ya faida ni nini?',
                    'option_a_en': 'Revenue + Costs', 'option_a_sw': 'Mapato + Gharama',
                    'option_b_en': 'Revenue - Costs', 'option_b_sw': 'Mapato - Gharama',
                    'option_c_en': 'Revenue × Costs', 'option_c_sw': 'Mapato × Gharama',
                    'option_d_en': 'Revenue ÷ Costs', 'option_d_sw': 'Mapato ÷ Gharama',
                    'correct_answer': 'B',
                    'explanation_en': 'Profit is calculated as Revenue minus Costs',
                    'explanation_sw': 'Faida inahesabiwa kama Mapato minus Gharama'
                },
                {
                    'quiz_id': quiz.id,
                    'question_text_en': 'Why is market research important?',
                    'question_text_sw': 'Kwa nini utafiti wa soko ni muhimu?',
                    'option_a_en': 'To understand customers', 'option_a_sw': 'Kuelewa wateja',
                    'option_b_en': 'To waste time', 'option_b_sw': 'Kupoteza muda',
                    'option_c_en': 'To increase costs', 'option_c_sw': 'Kuongeza gharama',
                    'option_d_en': 'To confuse competitors', 'option_d_sw': 'Kuchanganya washindani',
                    'correct_answer': 'A',
                    'explanation_en': 'Market research helps understand customer needs and preferences',
                    'explanation_sw': 'Utafiti wa soko husaidia kuelewa mahitaji na mapendeleo ya wateja'
                }
            ]
            
            for q_data in questions:
                question = Question(**q_data)
                db.session.add(question)
    
    db.session.commit()
    print("Database seeded successfully!")
