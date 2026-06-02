import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Map, Sun, Utensils, Info, MessageSquare, X, Mic, MicOff, Volume2, VolumeX, Moon, Sparkles, User, ArrowLeft, LogIn, Compass, MapPin } from 'lucide-react';
import './index.css';

const TOP_QUICK_REPLIES = [
  { label: 'Sacred Odisha', icon: '🚶‍♂️', type: 'normal' },
  { label: 'Wildlife Sanctuaries Of Odisha', icon: '🍃', type: 'normal' },
  { label: 'Beaches & Coastal', icon: '🌊', type: 'normal' },
  { label: 'Waterfalls & Scenic Landscapes', icon: '🌊', type: 'normal' },
];

function Widget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationConsent, setLocationConsent] = useState('pending');
  const [authMode, setAuthMode] = useState('selection');
  const [authData, setAuthData] = useState({name: '', email: '', mobile: ''});
  const [isRecording, setIsRecording] = useState(false);
  const [isTTS, setIsTTS] = useState(false);
  const [theme, setTheme] = useState('light');
  const [sessionId, setSessionId] = useState(() => Math.random().toString(36).substring(7));
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [pendingQuery, setPendingQuery] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      
      // Inject welcome back message if returning user and no welcome back message exists
      if (isReturningUser && messages.length > 0 && !messages.some(m => m.isWelcomeBack)) {
        const welcomeBackMsg = {
          id: Date.now(),
          text: `Welcome back! Ready to continue your journey?`,
          sender: 'bot',
          isWelcomeBack: true
        };
        setMessages(prev => [...prev, welcomeBackMsg]);
      }
    }
  }, [messages, isLoading, isOpen, isReturningUser]);

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

    if (authMode !== 'authenticated' && authMode !== 'guest-chat') {
        setAuthMode('guest-chat');
    }

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

      if (isTTS) {
          const cleanText = responseText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'en-IN';
          window.speechSynthesis.speak(utterance);
      }

      if (response.data.requires_login && authMode !== 'authenticated') {
        setPendingQuery(textToSend);
        setAuthMode('login');
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const fallbackText = error.response?.data?.response || "I'm currently experiencing technical difficulties. If you have an urgent query, please reach out to our official support team at support@odishatourism.gov.in";
      const errorMsg = { id: Date.now() + 1, text: fallbackText, sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const welcomeMsg = `Jay Jagannath, ${authData.name}! 🙏 How can I help you explore today?`;
    try {
      const response = await axios.post(`http://localhost:8000/api/v1/auth/login?session_id=${sessionId}`, authData);
      setAuthMode('authenticated');
      
      const returnedSessionId = response.data.session_id;
      const history = response.data.history || [];
      
      if (returnedSessionId) {
          setSessionId(returnedSessionId);
      }
      
      if (history.length > 0) {
          setMessages(history);
          setIsReturningUser(true);
      } else {
          setMessages([{ 
            id: Date.now(), 
            text: `Jay Jagannath, ${authData.name}! 🙏 Please type or select your preferred language. / ଦୟାକରି ଆପଣଙ୍କର ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ କିମ୍ବା ଟାଇପ୍ କରନ୍ତୁ | / कृपया अपनी पसंदीदा भाषा टाइप करें या चुनें।`, 
            sender: 'bot',
            suggestions: ["English", "ଓଡ଼ିଆ", "हिन्दी", "বাংলা", "తెలుగు", "தமிழ்"] 
          }]);
      }
      
      // Auto-send the pending query if it exists
      if (pendingQuery) {
          setTimeout(() => {
              handleSend(null, pendingQuery);
          }, 500); // slight delay to allow UI to settle
          setPendingQuery(null);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setAuthMode('authenticated');
      if (messages.length === 0) setMessages([{ id: Date.now(), text: welcomeMsg, sender: 'bot' }]);
    }
  };

  const handleClose = async () => {
    setIsOpen(false);
  };

  const renderHeader = (showBack = false, backAction = () => {}) => (
    <>
      <div className="header">
        <svg className="wheel-bg" width="120" height="120" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="white" strokeWidth="2"/>
          <circle cx="50" cy="50" r="32" stroke="white" strokeWidth="1.5"/>
          <circle cx="50" cy="50" r="9" fill="white"/>
          <line x1="50" y1="4" x2="50" y2="22" stroke="white" strokeWidth="2.5"/>
          <line x1="50" y1="78" x2="50" y2="96" stroke="white" strokeWidth="2.5"/>
          <line x1="4" y1="50" x2="22" y2="50" stroke="white" strokeWidth="2.5"/>
          <line x1="78" y1="50" x2="96" y2="50" stroke="white" strokeWidth="2.5"/>
          <line x1="15" y1="15" x2="29" y2="29" stroke="white" strokeWidth="2"/>
          <line x1="71" y1="71" x2="85" y2="85" stroke="white" strokeWidth="2"/>
          <line x1="85" y1="15" x2="71" y2="29" stroke="white" strokeWidth="2"/>
          <line x1="29" y1="71" x2="15" y2="85" stroke="white" strokeWidth="2"/>
          <line x1="50" y1="4" x2="65" y2="13" stroke="white" strokeWidth="1.5"/>
          <line x1="65" y1="87" x2="50" y2="96" stroke="white" strokeWidth="1.5"/>
          <line x1="35" y1="87" x2="50" y2="96" stroke="white" strokeWidth="1.5"/>
          <line x1="4" y1="65" x2="13" y2="50" stroke="white" strokeWidth="1.5"/>
          <line x1="87" y1="65" x2="96" y2="50" stroke="white" strokeWidth="1.5"/>
          <line x1="4" y1="35" x2="13" y2="50" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div className="header-row">
          <div className="logo-circle">🏛️</div>
          <div className="hdr-title">
            <div className="hdr-name">Odisha Tourism</div>
            <div className="hdr-sub">Official AI Assistant</div>
          </div>
          <div className="hdr-icons">
            {authMode === 'authenticated' || authMode === 'guest-chat' ? (
                <>
                  <div className="hdr-icon" title="Toggle Voice Output" onClick={() => setIsTTS(!isTTS)}>
                    {isTTS ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                </>
            ) : null}
            <div className="hdr-icon" title="Close" onClick={handleClose}>
              <X size={16} />
            </div>
          </div>
        </div>
      </div>
      {showBack && (
        <div className="back-row" onClick={backAction}>
          <ArrowLeft size={16} /> Back
        </div>
      )}
    </>
  );

  return (
    <div className={`widget-container theme-${theme}`} role="region" aria-label="Chatbot Widget">
      <div className={`phone ${isOpen ? 'open' : 'closed'}`} aria-hidden={!isOpen}>
        
        {authMode === 'selection' && (
          <div className="screen active">
            {renderHeader()}
            
            {locationConsent === 'pending' && (
              <div className="loc-bar">
                <MapPin size={16} color="#412402" />
                <span className="loc-text">Allow location for better travel routes?</span>
                <button className="loc-allow" onClick={requestLocation}>Allow</button>
                <button className="loc-skip" onClick={() => setLocationConsent('denied')}>Skip</button>
              </div>
            )}

            <div className="hero-area">
              <svg className="hero-motif" width="200" height="200" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" stroke="#C1440E" strokeWidth="1"/>
                <circle cx="50" cy="50" r="36" stroke="#C1440E" strokeWidth="0.8"/>
                <circle cx="50" cy="50" r="24" stroke="#C1440E" strokeWidth="0.8"/>
                <circle cx="50" cy="50" r="8" fill="#C1440E"/>
                <line x1="50" y1="2" x2="50" y2="98" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="2" y1="50" x2="98" y2="50" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="15" y1="15" x2="85" y2="85" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="85" y1="15" x2="15" y2="85" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="50" y1="2" x2="74" y2="8" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="50" y1="2" x2="26" y2="8" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="92" y1="26" x2="98" y2="50" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="92" y1="74" x2="98" y2="50" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="8" y1="26" x2="2" y2="50" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="8" y1="74" x2="2" y2="50" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="50" y1="98" x2="74" y2="92" stroke="#C1440E" strokeWidth="0.5"/>
                <line x1="50" y1="98" x2="26" y2="92" stroke="#C1440E" strokeWidth="0.5"/>
              </svg>
              <div className="hero-icon">🙏</div>
              <div className="hero-title">Welcome to Odisha!</div>
              <div className="hero-sub">Explore temples, beaches, festivals<br/>and the soul of India's east coast</div>
              <div className="dots">
                <div className="dot active"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>

            <div className="features">
              <div className="feat">
                <div className="feat-icon">🛕</div>
                <div className="feat-label">65,000+ temples</div>
              </div>
              <div className="feat">
                <div className="feat-icon">🌊</div>
                <div className="feat-label">480km coastline</div>
              </div>
              <div className="feat">
                <div className="feat-icon">🎨</div>
                <div className="feat-label">Ancient crafts</div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="auth-area">
              <div className="auth-label">How would you like to proceed?</div>
              <button className="btn-primary" onClick={() => setAuthMode('login')}>
                <div className="btn-primary-icon"><User size={15} /></div>
                Login / Register
              </button>
              <div className="btn-or">or</div>
              <button className="btn-guest" onClick={() => setAuthMode('guest')}>
                <div className="btn-guest-icon"><span style={{color: 'var(--text-2)', fontSize: '15px'}}>🚶</span></div>
                Start as Guest
              </button>
            </div>

            <div className="footer-note">
              By continuing you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
            </div>
          </div>
        )}

        {authMode === 'login' && (
          <div className="screen active">
            {renderHeader(true, () => setAuthMode('selection'))}
            <div className="form-area">
              <div className="form-title">Join us today 🌅</div>
              <div className="form-sub">Provide your details to get full access to Odisha Mitra.</div>
              
              <form onSubmit={handleLoginSubmit} style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                <div className="field-wrap">
                  <div className="field-label">Full Name</div>
                  <input className="field-input" type="text" placeholder="e.g. Rahul Sharma" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} required minLength={2} />
                </div>
                <div className="field-wrap">
                  <div className="field-label">Email Address</div>
                  <input className="field-input" type="email" placeholder="you@example.com" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
                </div>
                <div className="field-wrap">
                  <div className="field-label">Mobile Number</div>
                  <input className="field-input" type="tel" placeholder="e.g. 9876543210" value={authData.mobile} onChange={e => setAuthData({...authData, mobile: e.target.value})} required minLength={10} />
                </div>
                <button type="submit" className="btn-primary" style={{marginTop: '4px'}}>
                  <LogIn size={17} />
                  Continue
                </button>
              </form>

            </div>
          </div>
        )}

        {authMode === 'guest' && (
          <div className="screen active">
            {renderHeader(true, () => setAuthMode('selection'))}
            <div className="form-area">
              <div className="form-title">Explore as Guest 🌅</div>
              <div className="form-sub">No sign-up needed — start discovering Odisha right away</div>
              
              <div className="guest-perks">
                <div className="perk-row">
                  <div className="perk-icon">🗺️</div>
                  <div className="perk-text"><b>Browse all destinations</b> — temples, beaches, forests & more</div>
                </div>
                <div className="perk-row">
                  <div className="perk-icon">🤖</div>
                  <div className="perk-text"><b>Chat with Odisha Mitra</b> — AI guide answers your questions</div>
                </div>
                <div className="perk-row">
                  <div className="perk-icon">🔒</div>
                  <div className="perk-text"><b>Limited features</b> — bookmarks & trip planning need an account</div>
                </div>
              </div>

              <button className="btn-primary" onClick={() => {
                setAuthMode('guest-chat');
                if (messages.length === 0) {
                  setMessages([{ 
                    id: Date.now(), 
                    text: "Namaskara! 🙏 Please type or select your preferred language. / ଦୟାକରି ଆପଣଙ୍କର ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ କିମ୍ବା ଟାଇପ୍ କରନ୍ତୁ | / कृपया अपनी पसंदीदा भाषा टाइप करें या चुनें।", 
                    sender: 'bot',
                    suggestions: ["English", "ଓଡ଼ିଆ", "हिन्दी", "বাংলা", "తెలుగు", "தமிழ்"]
                  }]);
                }
              }}>
                <Compass size={17} />
                Continue as Guest ↗
              </button>

              <div className="switch-auth">
                Want full access? <span onClick={() => setAuthMode('login')}>Create an account</span>
              </div>
            </div>
          </div>
        )}

        {(authMode === 'authenticated' || authMode === 'guest-chat') && (
          <div className="screen active" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
            {renderHeader(true, () => setAuthMode('selection'))}

            <div className="chat-area" aria-live="polite">
              {messages.length === 0 ? (
                <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <div style={{fontSize: '40px', marginBottom: '10px'}}>👋</div>
                    <h2 style={{fontFamily: 'Outfit', color: 'var(--terra-dk)', marginBottom: '8px'}}>Namaskara!</h2>
                    <p style={{color: 'var(--text-2)', fontSize: '14px', marginBottom: '24px'}}>
                      {authMode === 'authenticated' && authData.email 
                        ? 'Ready to discover the hidden gems of Odisha today?'
                        : 'How can I help you plan your trip?'}
                    </p>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <button className="suggestion-chip" onClick={() => handleSend(null, "Plan a 3-day trip to Puri")}>🗺️ Plan a 3-day trip to Puri</button>
                        <button className="suggestion-chip" onClick={() => handleSend(null, "What are the best local dishes to try?")}>🍛 What are the best local dishes to try?</button>
                        <button className="suggestion-chip" onClick={() => handleSend(null, "Tell me about Konark Sun Temple")}>🛕 Tell me about Konark Sun Temple</button>
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

            <div className="top-quick-replies" style={{ borderBottom: 'none', padding: '10px 14px', background: 'transparent' }}>
              {TOP_QUICK_REPLIES.map((qr, idx) => (
                <button 
                  key={idx} 
                  className={`tqr-pill ${qr.type === 'highlight' ? 'highlight' : ''}`}
                  onClick={() => handleSend(null, qr.label)}
                >
                  <span className="tqr-icon">{qr.icon}</span>
                  {qr.label}
                </button>
              ))}
            </div>

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
                      {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}
                </div>
                <button type="submit" className="send-button" disabled={!input.trim() || isLoading} aria-label="Send message">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {!isOpen && (
        <>
          <div className="widget-tooltip" onClick={() => setIsOpen(true)}>
            <strong>Jay Jagannath </strong>
          </div>
          <button
            className="widget-toggle"
            onClick={() => setIsOpen(true)}
            aria-label="Open Chatbot"
            style={{ position: 'relative', background: 'transparent', boxShadow: 'none' }}
          >
            <img src="/bot.png" alt="Odisha Tourism" className="toggle-logo" style={{width: '85px', height: '85px', borderRadius: '50%', objectFit: 'cover', background: 'transparent'}}/>
            <div className="notification-dot" style={{position: 'absolute', top: '2px', right: '2px', width: '20px', height: '20px', backgroundColor: '#F0B800', borderRadius: '50%', border: '3px solid #834026'}}></div>
          </button>
        </>
      )}
    </div>
  );
}

export default Widget;
