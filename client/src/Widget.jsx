import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Map, Sun, Utensils, Info, MessageSquare, X, Mic, MicOff, Volume2, VolumeX, Moon, Sparkles } from 'lucide-react';
import './index.css';

function Widget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationConsent, setLocationConsent] = useState('pending');
  const [authMode, setAuthMode] = useState('selection');
  const [authData, setAuthData] = useState({ name: '', email: '', mobile: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [isTTS, setIsTTS] = useState(false);
  const [theme, setTheme] = useState('light');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const endSessionOnUnload = () => {
      if (messages.length > 0) {
        const blob = new Blob([JSON.stringify({ session_id: sessionId })], { type: 'application/json' });
        navigator.sendBeacon('http://localhost:8000/api/v1/chat/end', blob);
      }
    };
    window.addEventListener('beforeunload', endSessionOnUnload);
    return () => {
      window.removeEventListener('beforeunload', endSessionOnUnload);
    };
  }, [messages.length, sessionId]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(`${position.coords.latitude},${position.coords.longitude}`);
          setLocationConsent('granted');
        },
        (error) => {
          console.log("Geolocation error:", error);
          setLocationConsent('denied');
        }
      );
    } else {
      setLocationConsent('denied');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSend = async (e, customText = null) => {
    e?.preventDefault();
    const textToSend = customText || input;

    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/chat', {
        session_id: sessionId,
        message: textToSend,
        user_location: userLocation
      });

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

      // TTS Output
      if (isTTS) {
          const cleanText = responseText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
      }

      if (response.data.requires_login) {
        setAuthMode('login');
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const fallbackText = error.response?.data?.response || "I'm currently experiencing technical difficulties. If you have an urgent query, please reach out to our official support team at support@odishatourism.gov.in";
      const errorMsg = {
        id: Date.now() + 1,
        text: fallbackText,
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8000/api/v1/auth/login?session_id=${sessionId}`, authData);
      setAuthMode('authenticated');
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
    if (messages.length > 0) {
      try {
        await axios.post('http://localhost:8000/api/v1/chat/end', {
          session_id: sessionId
        });
        setMessages([]);
        setAuthMode('selection');
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }
  };

  return (
    <div className={`widget-container theme-${theme}`} role="region" aria-label="Chatbot Widget">
      <div className={`chat-window ${isOpen ? 'open' : 'closed'}`} aria-hidden={!isOpen}>
        <header className="header">
          <div className="header-title">
            <img src="/botimage.png" alt="Logo" className="header-logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <h1 id="chatbot-title">Odisha Tourism</h1>
              <p className="header-subtitle">Official AI Assistant</p>
            </div>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="action-btn" onClick={() => setIsTTS(!isTTS)} title="Toggle Voice Output" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              {isTTS ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button className="action-btn" onClick={() => {
              setTheme(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'festive' : 'light');
            }} title="Toggle Theme" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Sparkles size={20} />}
            </button>
            <button className="close-btn" onClick={handleClose} title="End Chat & Close" aria-label="Close Chat" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
        </header>

        {locationConsent === 'pending' && (
          <div className="consent-banner" role="alert">
            <span>Allow location for better travel routes?</span>
            <div className="consent-buttons">
              <button className="consent-allow" onClick={requestLocation} aria-label="Allow Location">Allow</button>
              <button className="consent-skip" onClick={() => setLocationConsent('denied')} aria-label="Deny Location">Skip</button>
            </div>
          </div>
        )}

        <div className="chat-area" aria-live="polite">
          {authMode === 'selection' ? (
            <div className="auth-selection-screen">
              <h2>Welcome to Odisha!</h2>
              <p>How would you like to proceed?</p>
              <div className="auth-buttons">
                <button className="btn-primary" onClick={() => setAuthMode('login')}>Login / Register</button>
                <button className="btn-secondary" onClick={() => setAuthMode('guest')}>Start as Guest</button>
              </div>
            </div>
          ) : authMode === 'login' ? (
            <div className="login-screen">
              <h2>User Details</h2>
              <p>Please provide your details to continue.</p>
              <form onSubmit={handleLoginSubmit} className="login-form">
                <input type="text" placeholder="Full Name" required value={authData.name} onChange={e => setAuthData({ ...authData, name: e.target.value })} />
                <input type="email" placeholder="Email Address" required value={authData.email} onChange={e => setAuthData({ ...authData, email: e.target.value })} />
                <input type="tel" placeholder="Mobile Number" required value={authData.mobile} onChange={e => setAuthData({ ...authData, mobile: e.target.value })} />
                <button type="submit" className="btn-primary">Submit</button>
              </form>
            </div>
          ) : messages.length === 0 ? (
            <div className="welcome-screen">
              <h2>
                {authMode === 'authenticated' && authData.name
                  ? `Namaskara, ${authData.name}!`
                  : 'Namaskara, Explorer!'}
              </h2>
              <p>
                {authMode === 'authenticated'
                  ? 'Ready to discover the hidden gems of Odisha today?'
                  : 'Jay Jagannath! 🙏 Welcome to Odisha Tourism. Atithi Devo Bhava. How can I help you plan your trip?'}
              </p>

              <div className="features-grid">
                <button className="feature-card" onClick={() => handleSend(null, "I would like to plan a trip.")}>
                  <Map className="feature-icon" size={20} />
                  <span>Plan a Trip</span>
                </button>
                <button className="feature-card" onClick={() => handleSend(null, "What is the weather like?")}>
                  <Sun className="feature-icon" size={20} />
                  <span>Check Weather</span>
                </button>
                <button className="feature-card" onClick={() => handleSend(null, "Tell me about local food.")}>
                  <Utensils className="feature-icon" size={20} />
                  <span>Local Cuisine</span>
                </button>
                <button className="feature-card" onClick={() => handleSend(null, "Show me heritage sites.")}>
                  <Info className="feature-icon" size={20} />
                  <span>Heritage Info</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                  <div className="message">
                    {msg.text.split('\n').map((line, i) => {
                      let htmlLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                      htmlLine = htmlLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                      return <p key={i} dangerouslySetInnerHTML={{ __html: htmlLine }} />;
                    })}
                  </div>
                  <span className="message-time">
                    {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.images && msg.images.length > 0 && (
                    <div className="image-carousel" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '8px', paddingBottom: '4px' }}>
                      {msg.images.map((imgUrl, idx) => (
                        <img key={idx} src={imgUrl} alt="Location" style={{ height: '120px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="suggestion-chips">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button key={idx} className="suggestion-chip" onClick={() => handleSend(null, suggestion)}>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="typing-indicator" aria-label="Bot is typing">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              <div ref={messagesEndRef} tabIndex="-1" />
            </>
          )}
        </div>

        {(authMode !== 'selection' && authMode !== 'login') && (
          <form className="input-area" onSubmit={handleSend}>
            <div className="input-row">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  aria-label="Chat input field"
                />
                {recognitionRef.current && (
                  <button
                    type="button"
                    className={`action-button ${isRecording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                    title="Voice Input"
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                )}
              </div>
              <button type="submit" className="send-button" disabled={!input.trim() || isLoading} aria-label="Send message">
                <Send size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

      {!isOpen && (
        <button
          className="widget-toggle custom-logo-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open Chatbot"
        >
          <img src="/botimage.png" alt="Odisha Tourism" className="toggle-logo" />
        </button>
      )}
    </div>
  );
}

export default Widget;
