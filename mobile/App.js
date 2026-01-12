import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { OfflineProvider } from './src/contexts/OfflineContext';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CoursesScreen from './src/screens/courses/CoursesScreen';
import CourseDetailScreen from './src/screens/courses/CourseDetailScreen';
import LessonScreen from './src/screens/courses/LessonScreen';
import QuizScreen from './src/screens/quizzes/QuizScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudyGroupsScreen from './src/screens/groups/StudyGroupsScreen';
import GroupChatScreen from './src/screens/groups/GroupChatScreen';
import ForumsScreen from './src/screens/forums/ForumsScreen';
import ForumTopicScreen from './src/screens/forums/ForumTopicScreen';
import VideoRecorderScreen from './src/screens/VideoRecorderScreen';
import OfflineContentScreen from './src/screens/OfflineContentScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';

// Components
import TabBar from './src/components/navigation/TabBar';

// Navigation
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Groups" component={StudyGroupsScreen} />
      <Tab.Screen name="Forums" component={ForumsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // App initialization
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null; // Show splash screen
  }

  return (
    <ThemeProvider>
      <PaperProvider>
        <OfflineProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Login"
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                }}
              >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />

                {/* Course Screens */}
                <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
                <Stack.Screen name="Lesson" component={LessonScreen} />
                <Stack.Screen name="Quiz" component={QuizScreen} />

                {/* Group Screens */}
                <Stack.Screen name="GroupChat" component={GroupChatScreen} />

                {/* Forum Screens */}
                <Stack.Screen name="ForumTopic" component={ForumTopicScreen} />

                {/* Other Screens */}
                <Stack.Screen name="VideoRecorder" component={VideoRecorderScreen} />
                <Stack.Screen name="OfflineContent" component={OfflineContentScreen} />
                <Stack.Screen name="AIRecommendations" component={AIRecommendationsScreen} />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="auto" />
          </AuthProvider>
        </OfflineProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
