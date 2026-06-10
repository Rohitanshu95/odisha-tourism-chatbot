import React, { useState, useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import axios from 'axios';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import SplashScreen from './src/screens/SplashScreen';

// Update this to your local IP address for physical device testing or use Localtunnel
const API_BASE_URL = 'https://tattered-spinach-happening.ngrok-free.dev -> http://localhost:8000'; // Localtunnel public URL

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [authMode, setAuthMode] = useState('selection'); // 'selection', 'login', 'guest', 'guest-chat', 'authenticated'
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [userLocation, setUserLocation] = useState(null);
  const [locationConsent, setLocationConsent] = useState('pending');
  const [authData, setAuthData] = useState({ name: '', email: '', mobile: '' });
  const [messages, setMessages] = useState([]);
  const [pendingQuery, setPendingQuery] = useState(null);

  const requestLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationConsent('denied');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(`${location.coords.latitude},${location.coords.longitude}`);
      setLocationConsent('granted');
      
      await axios.post(`${API_BASE_URL}/location`, {
        session_id: sessionId,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (err) {
      console.log("Failed to save location:", err);
      setLocationConsent('denied'); // Or keep as granted but just log error
    }
  };

  const handleLoginSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login?session_id=${sessionId}`, authData);
      setAuthMode('authenticated');

      const returnedSessionId = response.data.session_id;
      const history = response.data.history || [];

      if (returnedSessionId) {
        setSessionId(returnedSessionId);
      }

      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([{
          id: Date.now(),
          text: `Jay Jagannath, ${authData.name}! 🙏 Please type or select your preferred language.`,
          sender: 'bot',
          suggestions: ["English", "ଓଡ଼ିଆ", "हिन्दी", "বাংলা", "తెలుగు", "தமிழ்"]
        }]);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setAuthMode('authenticated');
      if (messages.length === 0) setMessages([{ id: Date.now(), text: `Jay Jagannath, ${authData.name}! 🙏 How can I help you explore today?`, sender: 'bot' }]);
    }
  };

  const handleGuestContinue = () => {
    setAuthMode('guest-chat');
    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        text: "Namaskara! 🙏 Please type or select your preferred language.",
        sender: 'bot',
        suggestions: ["English", "ଓଡ଼ିଆ", "हिन्दी", "বাংলা", "తెలుగు", "தமிழ்"]
      }]);
    }
  };

  const resetSession = async () => {
    if ((authMode === 'authenticated' || authMode === 'guest-chat') && messages.length > 0) {
      try {
        await axios.post(`${API_BASE_URL}/chat/end`, { session_id: sessionId });
      } catch (error) {
        console.error("Error ending session:", error);
      }
    }
    setMessages([]);
    setSessionId(Math.random().toString(36).substring(7));
    setAuthMode('selection');
    setPendingQuery(null);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fdfbf7' }} edges={['right', 'left']}>
        <StatusBar hidden={true} />
        
        {showSplash ? (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        ) : (
          <>
            {authMode === 'selection' && (
          <WelcomeScreen 
            onLogin={() => setAuthMode('login')}
            onGuest={() => setAuthMode('guest')}
            locationConsent={locationConsent}
            requestLocation={requestLocation}
            onSkipLocation={() => setLocationConsent('denied')}
          />
        )}

        {authMode === 'login' && (
          <LoginScreen 
            authData={authData}
            setAuthData={setAuthData}
            onSubmit={handleLoginSubmit}
            onBack={() => setAuthMode('selection')}
          />
        )}

        {authMode === 'guest' && (
          <WelcomeScreen 
            isGuestView={true}
            onGuestContinue={handleGuestContinue}
            onBack={() => setAuthMode('selection')}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}

        {(authMode === 'authenticated' || authMode === 'guest-chat') && (
          <ChatScreen 
            messages={messages}
            setMessages={setMessages}
            sessionId={sessionId}
            userLocation={userLocation}
            authMode={authMode}
            authData={authData}
            onClose={resetSession}
            pendingQuery={pendingQuery}
            setPendingQuery={setPendingQuery}
            setAuthMode={setAuthMode}
            apiBaseUrl={API_BASE_URL}
          />
        )}
          </>
        )}

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
