import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const result = await ApiService.request(`/api/analytics/user?range=${timeRange}`);

      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRanges = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Analyzing your learning data...
        </Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="analytics-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          No data available
        </Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Start learning to see your analytics
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Learning Analytics
        </Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range.key}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === range.key ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setTimeRange(range.key)}
          >
            <Text
              style={[
                styles.timeRangeText,
                {
                  color: timeRange === range.key ? 'white' : theme.colors.text,
                },
              ]}
            >
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
          <View style={styles.overviewContent}>
            <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
              {formatDuration(analytics.totalStudyTime)}
            </Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
              Study Time
            </Text>
          </View>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="school-outline" size={24} color={theme.colors.success} />
          <View style={styles.overviewContent}>
            <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
              {analytics.completedLessons}
            </Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
              Lessons Completed
            </Text>
          </View>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.warning} />
          <View style={styles.overviewContent}>
            <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
              {analytics.averageScore}%
            </Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
              Avg Score
            </Text>
          </View>
        </View>

        <View style={[styles.overviewCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="flame-outline" size={24} color="#ef4444" />
          <View style={styles.overviewContent}>
            <Text style={[styles.overviewValue, { color: theme.colors.text }]}>
              {analytics.currentStreak}
            </Text>
            <Text style={[styles.overviewLabel, { color: theme.colors.textSecondary }]}>
              Day Streak
            </Text>
          </View>
        </View>
      </View>

      {/* Study Pattern */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Study Pattern
        </Text>
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.studyPattern}>
            {analytics.studyPattern.map((day, index) => (
              <View key={index} style={styles.dayBar}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${(day.minutes / analytics.maxStudyMinutes) * 100}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
                <Text style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>
                  {day.day}
                </Text>
                <Text style={[styles.dayValue, { color: theme.colors.text }]}>
                  {day.minutes}m
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Subject Performance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Subject Performance
        </Text>
        <View style={styles.subjectsList}>
          {analytics.subjectPerformance.map((subject, index) => (
            <View
              key={index}
              style={[styles.subjectCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.subjectHeader}>
                <Text style={[styles.subjectName, { color: theme.colors.text }]}>
                  {subject.name}
                </Text>
                <Text style={[styles.subjectScore, { color: theme.colors.primary }]}>
                  {subject.averageScore}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${subject.averageScore}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.subjectStats, { color: theme.colors.textSecondary }]}>
                {subject.completedLessons} lessons • {subject.totalQuizzes} quizzes
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Activity
        </Text>
        <View style={styles.activityList}>
          {analytics.recentActivity.map((activity, index) => (
            <View
              key={index}
              style={[styles.activityItem, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={
                    activity.type === 'lesson' ? 'book-outline' :
                    activity.type === 'quiz' ? 'help-circle-outline' :
                    'trophy-outline'
                  }
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                  {formatDate(activity.date)}
                </Text>
              </View>
              {activity.score && (
                <Text style={[styles.activityScore, { color: theme.colors.success }]}>
                  {activity.score}%
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          AI Insights
        </Text>
        <View style={[styles.insightsCard, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="bulb" size={24} color={theme.colors.primary} />
          <View style={styles.insightsContent}>
            <Text style={[styles.insightsTitle, { color: theme.colors.text }]}>
              Learning Recommendations
            </Text>
            <Text style={[styles.insightsText, { color: theme.colors.textSecondary }]}>
              {analytics.insights}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  overviewCard: {
    width: (width - 50) / 2,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewContent: {
    marginLeft: 12,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  studyPattern: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
  },
  dayBar: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 8,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  dayValue: {
    fontSize: 10,
    marginTop: 4,
  },
  subjectsList: {
    gap: 12,
  },
  subjectCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectStats: {
    fontSize: 12,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  activityScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  insightsContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
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
});

export default AnalyticsScreen;
