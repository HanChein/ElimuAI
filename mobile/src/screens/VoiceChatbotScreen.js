import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/ApiService';

const VoiceChatbotScreen = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI learning assistant. I can help you with courses, answer questions, and even speak with you. What would you like to learn today?',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);

  const scrollViewRef = useRef();
  const recordingRef = useRef();

  const { user } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    // Request microphone permissions
    Audio.requestPermissionsAsync();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await ApiService.request('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          user_id: user?.id,
          voice_response: true
        })
      });

      if (response.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.message,
          timestamp: new Date(),
          voiceUrl: response.voice_url,
          suggestions: response.suggestions,
        };

        setMessages(prev => [...prev, botMessage]);

        // Auto-play voice response if available
        if (response.voice_url) {
          playVoiceResponse(response.voice_url);
        }
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Sorry, I\'m having trouble responding right now. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required for voice input');
        return;
      }

      setIsRecording(true);

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();

        // Send audio file to speech-to-text API
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/m4a',
          name: 'voice_input.m4a',
        });

        const response = await ApiService.request('/api/chatbot/speech-to-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        if (response.success && response.transcript) {
          sendMessage(response.transcript);
        } else {
          Alert.alert('Error', 'Could not understand audio. Please try again.');
        }
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to process audio');
    }
  };

  const playVoiceResponse = async (voiceUrl) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: voiceUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Voice playback error:', error);
    }
  };

  const toggleVoicePlayback = async () => {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear the conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([{
              id: 1,
              type: 'bot',
              content: 'Hello! I\'m your AI learning assistant. I can help you with courses, answer questions, and even speak with you. What would you like to learn today?',
              timestamp: new Date(),
            }]);
          }
        }
      ]
    );
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message) => {
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.botMessage
      ]}>
        <View style={[
          styles.messageBubble,
          message.type === 'user' ? styles.userBubble : styles.botBubble,
          { backgroundColor: message.type === 'user' ? theme.colors.primary : theme.colors.surface }
        ]}>
          <Text style={[
            styles.messageText,
            { color: message.type === 'user' ? 'white' : theme.colors.text }
          ]}>
            {message.content}
          </Text>

          {message.voiceUrl && (
            <TouchableOpacity
              style={[styles.voiceButton, { backgroundColor: theme.colors.secondary }]}
              onPress={toggleVoicePlayback}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={16}
                color="white"
              />
              <Text style={styles.voiceButtonText}>
                {isPlaying ? 'Pause' : 'Listen'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[
            styles.messageTime,
            { color: message.type === 'user' ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {message.suggestions && message.suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {message.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionButton, { borderColor: theme.colors.primary }]}
                onPress={() => sendMessage(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="robot" size={20} color="white" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>AI Learning Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Voice-enabled AI tutor
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
          onPress={clearChat}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      >
        {messages.map(renderMessage)}

        {isTyping && (
          <View style={[styles.messageContainer, styles.botMessage]}>
            <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.colors.primary }]} />
              </View>
              <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
                AI is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
          placeholder="Ask me anything about learning..."
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        <View style={styles.inputButtons}>
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && { backgroundColor: '#ef4444' }
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.border }
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? 'white' : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Ionicons name="radio-button-on" size={20} color="#ef4444" />
          <Text style={styles.recordingText}>Listening...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  voiceButtonText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
  },
  suggestions: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    animation: 'pulse 1.5s infinite',
  },
  typingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  voiceButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default VoiceChatbotScreen;
