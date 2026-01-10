import re
from datetime import datetime

class SimpleChatbot:
    def __init__(self):
        self.greetings_sw = ['habari', 'mambo', 'vipi', 'hujambo', 'shikamoo']
        self.greetings_en = ['hello', 'hi', 'hey', 'greetings']
        
        self.math_keywords = ['hesabu', 'math', 'calculate', 'solve', 'equation', 'formula']
        self.business_keywords = ['biashara', 'business', 'marketing', 'sales', 'profit', 'faida']
        self.vocational_keywords = ['ufundi', 'vocational', 'skill', 'ujuzi', 'training']
        
        self.knowledge_base = {
            'math': {
                'en': {
                    'algebra': 'Algebra involves working with variables and equations. Key concepts include solving for x, factoring, and working with polynomials.',
                    'geometry': 'Geometry deals with shapes, sizes, and properties of space. Important topics include angles, triangles, circles, and area calculations.',
                    'arithmetic': 'Arithmetic covers basic operations: addition, subtraction, multiplication, and division. Master these fundamentals first.'
                },
                'sw': {
                    'algebra': 'Aljebra inahusisha kufanya kazi na vigeuzi na equations. Dhana muhimu ni pamoja na kutatua x, kugawanya, na kufanya kazi na polynomials.',
                    'geometry': 'Jiometri inashughulikia maumbo, ukubwa, na sifa za nafasi. Mada muhimu ni pamoja na pembe, pembetatu, duara, na mahesabu ya eneo.',
                    'arithmetic': 'Hesabu za msingi zinajumuisha: kuongeza, kutoa, kuzidisha, na kugawanya. Jifunze misingi hii kwanza.'
                }
            },
            'business': {
                'en': {
                    'marketing': 'Marketing is about promoting and selling products or services. Key strategies include understanding your target market, branding, and digital marketing.',
                    'finance': 'Business finance covers budgeting, cash flow management, and financial planning. Track your income and expenses carefully.',
                    'entrepreneurship': 'Entrepreneurship involves identifying opportunities, taking calculated risks, and building sustainable businesses.'
                },
                'sw': {
                    'marketing': 'Masoko ni kuhusu kutangaza na kuuza bidhaa au huduma. Mikakati muhimu ni pamoja na kuelewa soko lako lengwa, chapa, na masoko ya kidijitali.',
                    'finance': 'Fedha za biashara zinajumuisha bajeti, usimamizi wa mtiririko wa fedha, na mipango ya kifedha. Fuatilia mapato na matumizi yako kwa makini.',
                    'entrepreneurship': 'Ujasiriamali unahusisha kutambua fursa, kuchukua hatari zilizokokotolewa, na kujenga biashara endelevu.'
                }
            },
            'vocational': {
                'en': {
                    'carpentry': 'Carpentry involves working with wood to create structures and furniture. Essential skills include measuring, cutting, and joining.',
                    'electrical': 'Electrical work requires understanding circuits, safety protocols, and proper installation techniques.',
                    'plumbing': 'Plumbing involves installing and maintaining water supply and drainage systems. Safety and proper tools are essential.'
                },
                'sw': {
                    'carpentry': 'Useremala unahusisha kufanya kazi na mbao kuunda miundo na samani. Ujuzi muhimu ni pamoja na kupima, kukata, na kuunganisha.',
                    'electrical': 'Kazi za umeme zinahitaji kuelewa mzunguko, itifaki za usalama, na mbinu sahihi za usakinishaji.',
                    'plumbing': 'Bomba linahusisha kusakinisha na kudumisha mifumo ya usambazaji wa maji na mifereji. Usalama na zana sahihi ni muhimu.'
                }
            }
        }
    
    def detect_language(self, text):
        text_lower = text.lower()
        sw_indicators = ['habari', 'nini', 'vipi', 'namna', 'jinsi', 'saidia', 'tafadhali', 'asante']
        
        sw_count = sum(1 for word in sw_indicators if word in text_lower)
        return 'sw' if sw_count > 0 else 'en'
    
    def get_response(self, user_message, language='en'):
        message_lower = user_message.lower()
        
        for greeting in (self.greetings_sw if language == 'sw' else self.greetings_en):
            if greeting in message_lower:
                if language == 'sw':
                    return "Habari! Mimi ni msaidizi wako wa ElimuAI. Ninaweza kukusaidia na hesabu, biashara, na ujuzi wa ufundi. Unaweza kuniuliza swali lolote!"
                else:
                    return "Hello! I'm your ElimuAI assistant. I can help you with math, business, and vocational skills. Feel free to ask me anything!"
        
        if any(keyword in message_lower for keyword in self.math_keywords):
            return self._get_math_response(message_lower, language)
        
        if any(keyword in message_lower for keyword in self.business_keywords):
            return self._get_business_response(message_lower, language)
        
        if any(keyword in message_lower for keyword in self.vocational_keywords):
            return self._get_vocational_response(message_lower, language)
        
        if 'help' in message_lower or 'saidia' in message_lower or 'msaada' in message_lower:
            if language == 'sw':
                return "Ninaweza kukusaidia na:\n1. Hesabu (algebra, geometry, arithmetic)\n2. Biashara (masoko, fedha, ujasiriamali)\n3. Ujuzi wa ufundi (useremala, umeme, bomba)\n\nUliza swali lako!"
            else:
                return "I can help you with:\n1. Math (algebra, geometry, arithmetic)\n2. Business (marketing, finance, entrepreneurship)\n3. Vocational skills (carpentry, electrical, plumbing)\n\nAsk your question!"
        
        if '?' in user_message:
            if language == 'sw':
                return "Swali zuri! Tafadhali nipe maelezo zaidi kuhusu kile unachotaka kujifunza. Je, ni kuhusu hesabu, biashara, au ujuzi wa ufundi?"
            else:
                return "Great question! Please give me more details about what you'd like to learn. Is it about math, business, or vocational skills?"
        
        if language == 'sw':
            return "Samahani, sijaelewa vizuri. Unaweza kuuliza kuhusu hesabu, biashara, au ujuzi wa ufundi. Nini ungependa kujifunza?"
        else:
            return "I'm not sure I understand. You can ask me about math, business, or vocational skills. What would you like to learn?"
    
    def _get_math_response(self, message, language):
        if 'algebra' in message or 'equation' in message:
            topic = 'algebra'
        elif 'geometry' in message or 'shape' in message or 'angle' in message or 'pembe' in message:
            topic = 'geometry'
        else:
            topic = 'arithmetic'
        
        return self.knowledge_base['math'][language].get(topic, self.knowledge_base['math'][language]['arithmetic'])
    
    def _get_business_response(self, message, language):
        if 'market' in message or 'masoko' in message or 'sell' in message:
            topic = 'marketing'
        elif 'finance' in message or 'fedha' in message or 'money' in message or 'pesa' in message:
            topic = 'finance'
        else:
            topic = 'entrepreneurship'
        
        return self.knowledge_base['business'][language].get(topic, self.knowledge_base['business'][language]['entrepreneurship'])
    
    def _get_vocational_response(self, message, language):
        if 'wood' in message or 'mbao' in message or 'carpenter' in message or 'seremala' in message:
            topic = 'carpentry'
        elif 'electric' in message or 'umeme' in message or 'wire' in message:
            topic = 'electrical'
        elif 'water' in message or 'maji' in message or 'pipe' in message or 'bomba' in message:
            topic = 'plumbing'
        else:
            topic = 'carpentry'
        
        return self.knowledge_base['vocational'][language].get(topic, self.knowledge_base['vocational'][language]['carpentry'])
    
    def get_adaptive_quiz_question(self, category, difficulty, language='en'):
        questions = {
            'math': {
                'beginner': {
                    'en': {
                        'question': 'What is 15 + 27?',
                        'options': ['32', '42', '52', '62'],
                        'answer': 'B',
                        'explanation': '15 + 27 = 42. Add the ones place (5+7=12, carry 1) then tens place (1+2+1=4).'
                    },
                    'sw': {
                        'question': 'Ni nini 15 + 27?',
                        'options': ['32', '42', '52', '62'],
                        'answer': 'B',
                        'explanation': '15 + 27 = 42. Ongeza nafasi ya moja (5+7=12, beba 1) kisha nafasi ya kumi (1+2+1=4).'
                    }
                },
                'intermediate': {
                    'en': {
                        'question': 'Solve for x: 2x + 5 = 13',
                        'options': ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
                        'answer': 'B',
                        'explanation': '2x + 5 = 13, subtract 5: 2x = 8, divide by 2: x = 4'
                    },
                    'sw': {
                        'question': 'Tatua x: 2x + 5 = 13',
                        'options': ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
                        'answer': 'B',
                        'explanation': '2x + 5 = 13, toa 5: 2x = 8, gawanya na 2: x = 4'
                    }
                }
            },
            'business': {
                'beginner': {
                    'en': {
                        'question': 'What is profit?',
                        'options': ['Total sales', 'Revenue minus costs', 'Total expenses', 'Investment amount'],
                        'answer': 'B',
                        'explanation': 'Profit is calculated as revenue (income) minus costs (expenses).'
                    },
                    'sw': {
                        'question': 'Faida ni nini?',
                        'options': ['Mauzo yote', 'Mapato minus gharama', 'Gharama zote', 'Kiasi cha uwekezaji'],
                        'answer': 'B',
                        'explanation': 'Faida inahesabiwa kama mapato (income) minus gharama (expenses).'
                    }
                }
            }
        }
        
        return questions.get(category, {}).get(difficulty, {}).get(language, {})
