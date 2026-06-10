import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { MapPin, User, Compass } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ 
  onLogin, 
  onGuest, 
  locationConsent, 
  requestLocation, 
  onSkipLocation,
  isGuestView = false,
  onGuestContinue,
  onBack,
  onSwitchToLogin
}) {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.logoCircle}>
            <Image source={require('../../assets/tourism.png')} style={{width: 24, height: 24}} resizeMode="contain" />
          </View>
          <View style={styles.hdrTitle}>
            <Text style={styles.hdrName}>Odisha Tourism</Text>
            <Text style={styles.hdrSub}>Official AI Assistant</Text>
          </View>
        </View>
      </View>

      {!isGuestView && locationConsent === 'pending' && (
        <View style={styles.locBar}>
          <MapPin size={16} color="#412402" />
          <Text style={styles.locText}>Allow location for better travel routes?</Text>
          <TouchableOpacity style={styles.locAllow} onPress={requestLocation}>
            <Text style={styles.locAllowText}>Allow</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locSkip} onPress={onSkipLocation}>
            <Text style={styles.locSkipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isGuestView ? (
        <View style={styles.content}>
          <View style={styles.heroArea}>
            <Text style={styles.heroIcon}>🙏</Text>
            <Text style={styles.heroTitle}>Welcome to{'\n'}Odisha!</Text>
            <Text style={styles.heroSub}>Explore temples, beaches, festivals{'\n'}and the soul of India's east coast</Text>
          </View>

          <View style={styles.authArea}>
            <Text style={styles.authLabel}>How would you like to proceed?</Text>
            
            <TouchableOpacity style={styles.btnPrimary} onPress={onLogin}>
              <User size={15} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnPrimaryText}>Login / Register</Text>
            </TouchableOpacity>
            
            <Text style={styles.btnOr}>or</Text>
            
            <TouchableOpacity style={styles.btnGuest} onPress={onGuest}>
              <View style={styles.btnGuestIcon}><Text>🚶</Text></View>
              <Text style={styles.btnGuestText}>Start as Guest</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.footerNoteContainer}>
             <Image source={require('../../assets/footer.png')} style={styles.footerImageFull} resizeMode="contain" />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity style={styles.backRow} onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.formArea}>
            <Text style={styles.formTitle}>Explore as Guest 🌅</Text>
            <Text style={styles.formSub}>No sign-up needed — start discovering Odisha right away</Text>

            <View style={styles.guestPerks}>
              <View style={styles.perkRow}>
                <Text style={styles.perkIcon}>🗺️</Text>
                <Text style={styles.perkText}><Text style={{fontWeight: 'bold', color: '#2C1A0E'}}>Browse all destinations</Text> — temples, beaches, forests & more</Text>
              </View>
              <View style={styles.perkRow}>
                <Text style={styles.perkIcon}>🤖</Text>
                <Text style={styles.perkText}><Text style={{fontWeight: 'bold', color: '#2C1A0E'}}>Chat with Odisha Mitra</Text> — AI guide answers your questions</Text>
              </View>
              <View style={styles.perkRow}>
                <Text style={styles.perkIcon}>🔒</Text>
                <Text style={styles.perkText}><Text style={{fontWeight: 'bold', color: '#2C1A0E'}}>Limited features</Text> — bookmarks & trip planning need an account</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={onGuestContinue}>
              <Compass size={17} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.btnPrimaryText}>Continue as Guest ↗</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchAuth} onPress={onSwitchToLogin}>
              <Text style={styles.switchAuthText}>Want full access? <Text style={{color: '#C1440E', fontWeight: '500'}}>Create an account</Text></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerNote}>
            <Image source={require('../../assets/guest-removebg-preview.png')} style={styles.footerImage} resizeMode="contain" />
          </View>
        </View>
      )}
    </View>
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
    paddingTop: 40, // To account for status bar area since we aren't using SafeAreaView
    paddingBottom: 14,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF3D7', // gold-lt
    borderWidth: 1.5,
    borderColor: '#C8920A', // gold
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdrTitle: {
    flex: 1,
  },
  hdrName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  hdrSub: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  locBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A017',
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  locText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#412402',
  },
  locAllow: {
    backgroundColor: '#7A2406',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  locAllowText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  locSkip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(65, 36, 2, 0.35)',
  },
  locSkipText: {
    color: '#412402',
    fontSize: 11.5,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  heroArea: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: '#FBF6EF',
  },
  heroIcon: {
    fontSize: 52,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    color: '#7A2406',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 31,
  },
  heroSub: {
    fontSize: 13.5,
    color: '#7A5C42',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  authArea: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    alignItems: 'center',
  },
  authLabel: {
    color: '#B89878',
    fontWeight: '500',
    fontSize: 11.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    backgroundColor: '#1E5C2E', // forest
    width: '100%',
    padding: 15,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  btnOr: {
    marginVertical: 12,
    color: '#B89878',
    fontSize: 12,
  },
  btnGuest: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2D0BC',
  },
  btnGuestIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5EDE0',
    borderWidth: 1,
    borderColor: '#E2D0BC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  btnGuestText: {
    color: '#2C1A0E',
    fontWeight: '500',
    fontSize: 15,
  },
  footerNoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 22,
    marginTop: 'auto',
  },
  footerImageFull: {
    width: '100%',
    height: 120,
  },
  footerImage: {
    width: '100%',
    height: 100,
  },
  footerNote: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 22,
    marginTop: 'auto',
  },
  backRow: {
    marginBottom: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  backText: {
    color: '#7A5C42',
    fontSize: 13,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 26,
    color: '#7A2406',
    fontWeight: '700',
    marginBottom: 4,
  },
  formSub: {
    color: '#7A5C42',
    fontSize: 15,
    marginBottom: 12,
  },
  guestPerks: {
    backgroundColor: '#F5EDE0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2D0BC',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 32,
    marginTop: 12,
  },
  perkRow: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  perkIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D0BC',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
    marginRight: 10,
    fontSize: 15,
  },
  perkText: {
    color: '#7A5C42',
    lineHeight: 21,
    fontSize: 14,
    flex: 1,
  },
  switchAuth: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchAuthText: {
    color: '#7A5C42',
    fontSize: 13,
  }
});
