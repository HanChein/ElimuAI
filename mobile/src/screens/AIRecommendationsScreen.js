import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const AIRecommendationsScreen = () => {
  const [recommendations, setRecommendations] = useState({
    courses: [],
    lessons: [],
    studyPaths: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('courses');

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const result = await ApiService.request('/api/recommendations');

      if (result.success) {
        setRecommendations(result.recommendations);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'courses', label: 'Courses', icon: 'book-outline' },
    { id: 'lessons', label: 'Lessons', icon: 'document-text-outline' },
    { id: 'studyPaths', label: 'Study Paths', icon: 'school-outline' },
  ];

  const renderRecommendationCard = (item, type) => {
    let icon, title, subtitle, action;

    switch (type) {
      case 'courses':
        icon = 'book';
        title = item.title;
        subtitle = `${item.lesson_count} lessons • ${item.category}`;
        action = () => navigation.navigate('CourseDetail', { course: item });
        break;
      case 'lessons':
        icon = 'document-text';
        title = item.title;
        subtitle = `From: ${item.course_title}`;
        action = () => navigation.navigate('Lesson', { lessonId: item.id });
        break;
      case 'studyPaths':
        icon = 'school';
        title = item.title;
        subtitle = `${item.course_count} courses • ${item.estimated_hours}h`;
        action = () => navigation.navigate('StudyPath', { pathId: item.id });
        break;
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.recommendationCard, { backgroundColor: theme.colors.surface }]}
        onPress={action}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>

        {item.ai_reason && (
          <View style={styles.aiReason}>
            <Ionicons name="bulb" size={16} color={theme.colors.primary} />
            <Text style={[styles.aiReasonText, { color: theme.colors.primary }]}>
              {item.ai_reason}
            </Text>
          </View>
        )}

        {item.confidence_score && (
          <View style={styles.confidence}>
            <Text style={[styles.confidenceLabel, { color: theme.colors.textSecondary }]}>
              Match: {Math.round(item.confidence_score * 100)}%
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Analyzing your learning pattern...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          AI Recommendations
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.colors.surface }]}
          onPress={loadRecommendations}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              {
                backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={16}
              color={selectedCategory === category.id ? 'white' : theme.colors.text}
            />
            <Text
              style={[
                styles.categoryTabText,
                {
                  color: selectedCategory === category.id ? 'white' : theme.colors.text,
                },
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendations List */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recommended for You
          </Text>

          {recommendations[selectedCategory]?.length > 0 ? (
            recommendations[selectedCategory].map((item) =>
              renderRecommendationCard(item, selectedCategory)
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No recommendations yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Complete some courses to get personalized recommendations
              </Text>
            </View>
          )}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            AI Learning Insights
          </Text>

          <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                Your Learning Pattern
              </Text>
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
                You prefer hands-on Math courses and complete lessons on weekends.
                Based on your progress, we recommend focusing on Algebra fundamentals.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="trending-up" size={24} color={theme.colors.success} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                Performance Trend
              </Text>
              <Text style={[styles.insightText, { color: theme.colors.textSecondary }]}>
                Your quiz scores improved by 15% this month. You're mastering concepts faster!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabs: {
    marginVertical: 10,
  },
  categoryTabsContainer: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recommendationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  aiReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 8,
  },
  aiReasonText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  confidence: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});

export default AIRecommendationsScreen;
