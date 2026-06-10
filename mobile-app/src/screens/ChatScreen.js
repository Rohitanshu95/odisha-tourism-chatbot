import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
  ImageBackground
} from 'react-native';
import { Send, Mic, MicOff, Volume2, VolumeX, X, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export default function ChatScreen({
  messages,
  setMessages,
  sessionId,
  userLocation,
  authMode,
  authData,
  onClose,
  pendingQuery,
  setPendingQuery,
  setAuthMode,
  apiBaseUrl
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTS, setIsTTS] = useState(false);
  const [feedbackState, setFeedbackState] = useState({});
  const flatListRef = useRef(null);

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results && event.results.length > 0) {
      setInput((prev) => prev + (prev ? ' ' : '') + event.results[0].transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error("Speech recognition error", event.error);
    setIsRecording(false);
  });

  useEffect(() => {
    if (pendingQuery) {
      handleSend(pendingQuery);
      setPendingQuery(null);
    }
  }, [pendingQuery]);

  const toggleRecording = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("Permissions not granted", result);
        setIsRecording(false);
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: 'en-IN' });
    }
  };

  const handleFeedback = async (msgId, queryText, type) => {
    if (feedbackState[msgId] === type) return;
    setFeedbackState(prev => ({ ...prev, [msgId]: type }));
    try {
      await axios.post(`${apiBaseUrl}/chat/feedback`, {
        session_id: sessionId,
        query: queryText,
        feedback: type
      });
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  const handleSend = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : input;
    if (!textToSend.trim()) return;

    if (authMode !== 'authenticated' && authMode !== 'guest-chat') {
      setAuthMode('guest-chat');
    }

    const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const payload = {
      session_id: sessionId,
      message: textToSend,
      user_location: userLocation
    };

    try {
      const response = await axios.post(`${apiBaseUrl}/chat`, payload);
      let responseText = response.data.response;
      let suggestions = [];
      let images = [];

      if (responseText.includes('IMAGES:')) {
        const parts = responseText.split('IMAGES:');
        responseText = parts[0].trim();
        const afterImages = parts[1];
        if (afterImages.includes('SUGGESTIONS:')) {
          const splitAgain = afterImages.split('SUGGESTIONS:');
          images = splitAgain[0].trim().split(',').map(s => s.trim()).filter(s => s.length > 0);
          suggestions = splitAgain[1].trim().split('\n').map(s => s.replace(/^-/, '').trim()).filter(s => s.length > 0);
        } else {
          images = afterImages.trim().split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      } else if (responseText.includes('SUGGESTIONS:')) {
        const parts = responseText.split('SUGGESTIONS:');
        responseText = parts[0].trim();
        suggestions = parts[1].trim().split('\n').map(s => s.replace(/^-/, '').trim()).filter(s => s.length > 0);
      }

      const botMsg = { id: Date.now() + 1, text: responseText, suggestions, images, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);

      if (isTTS) {
        const cleanText = responseText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        Speech.speak(cleanText, { language: 'en-IN' });
      }

      if (response.data.requires_login && authMode !== 'authenticated') {
        setPendingQuery(textToSend);
        setAuthMode('login');
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const fallbackText = error.response?.data?.response || "I'm currently experiencing technical difficulties.";
      const errorMsg = { id: Date.now() + 1, text: fallbackText, sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isBot = item.sender === 'bot';
    
    // Removing basic markdown for plain text display in React Native, 
    // ideally use a markdown renderer library like react-native-markdown-display
    const cleanText = item.text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    return (
      <View style={[styles.messageWrapper, isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
        <View style={[styles.messageBubble, isBot ? styles.messageBubbleBot : styles.messageBubbleUser]}>
          <Text style={[styles.messageText, isBot ? styles.messageTextBot : styles.messageTextUser]}>
            {cleanText}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {isBot && item.id > 1 && (
          <View style={styles.feedbackRow}>
            <TouchableOpacity onPress={() => handleFeedback(item.id, messages[index - 1]?.text || "", "Positive")}>
              <ThumbsUp size={14} color={feedbackState[item.id] === 'Positive' ? '#22c55e' : '#94a3b8'} style={{marginRight: 8}}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleFeedback(item.id, messages[index - 1]?.text || "", "Negative")}>
              <ThumbsDown size={14} color={feedbackState[item.id] === 'Negative' ? '#ef4444' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        )}

        {item.images && item.images.length > 0 && (
          <FlatList
            horizontal
            data={item.images}
            keyExtractor={(img, idx) => idx.toString()}
            renderItem={({item: imgUrl}) => (
              <Image source={{uri: imgUrl}} style={styles.messageImage} />
            )}
            style={styles.imageCarousel}
            showsHorizontalScrollIndicator={false}
          />
        )}

        {item.suggestions && item.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {item.suggestions.map((suggestion, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestionChip} onPress={() => handleSend(suggestion)}>
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoCircle}>
            <Image source={require('../../assets/tourism.png')} style={{width: 24, height: 24}} resizeMode="contain" />
          </View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Odisha Tourism</Text>
            <Text style={styles.headerSub}>Official AI Assistant</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setIsTTS(!isTTS)} style={styles.headerIcon}>
            {isTTS ? <Volume2 size={20} color="#fff" /> : <VolumeX size={20} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerIcon}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ImageBackground 
        source={require('../../assets/odisha-culture-removebg-preview.png')} 
        style={styles.chatBackground}
        imageStyle={styles.chatBackgroundImage}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
          ListFooterComponent={() => isLoading ? (
            <ActivityIndicator size="small" color="#C1440E" style={{marginVertical: 10}}/>
          ) : null}
        />
      </ImageBackground>

      <View style={styles.inputArea}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            value={input}
            onChangeText={setInput}
            editable={!isLoading}
          />
          <TouchableOpacity style={styles.micBtn} onPress={toggleRecording}>
            {isRecording ? <MicOff size={20} color="#ef4444" /> : <Mic size={20} color="#664E3F" />}
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EF', // cream
  },
  header: {
    backgroundColor: '#7A2406', // terra-dk
    padding: 16,
    paddingTop: 40,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flex: 1,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF3D7',
    borderWidth: 1.5,
    borderColor: '#C8920A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  chatBackground: {
    flex: 1,
  },
  chatBackgroundImage: {
    opacity: 0.15,
  },
  chatArea: {
    padding: 20,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperBot: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: '#C1440E', // terra-mid
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: '#FFFFFF', // white
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2D0BC', // border
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextBot: {
    color: '#2C1A0E', // text
  },
  messageTime: {
    fontSize: 11,
    color: '#B89878', // text-3
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  feedbackRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  imageCarousel: {
    marginTop: 8,
  },
  messageImage: {
    width: 140,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D0BC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionChipText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  inputArea: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2D0BC',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#2C1A0E',
  },
  micBtn: {
    padding: 8,
  },
  sendBtn: {
    backgroundColor: '#C1440E',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnDisabled: {
    backgroundColor: '#e5aa90',
  }
});
