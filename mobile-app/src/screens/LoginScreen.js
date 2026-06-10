import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LogIn } from 'lucide-react-native';

export default function LoginScreen({ authData, setAuthData, onSubmit, onBack }) {
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

      <View style={styles.content}>
        <TouchableOpacity style={styles.backRow} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.formArea}>
          <Text style={styles.formTitle}>Join us today 🌅</Text>
          <Text style={styles.formSub}>Provide your details to get full access to Odisha Mitra.</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Rahul Sharma"
              value={authData.name}
              onChangeText={text => setAuthData({ ...authData, name: text })}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={authData.email}
              onChangeText={text => setAuthData({ ...authData, email: text })}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              value={authData.mobile}
              onChangeText={text => setAuthData({ ...authData, mobile: text })}
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={onSubmit}>
            <LogIn size={17} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.btnPrimaryText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerNoteContainer}>
          <Image source={require('../../assets/register.png')} style={styles.footerImageFull} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EF',
  },
  header: {
    backgroundColor: '#7A2406',
    padding: 16,
    paddingTop: 40,
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
    backgroundColor: '#FDF3D7',
    borderWidth: 1.5,
    borderColor: '#C8920A',
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
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  fieldWrap: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#7A5C42',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2D0BC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    color: '#2C1A0E',
  },
  btnPrimary: {
    flexDirection: 'row',
    backgroundColor: '#1E5C2E', // forest
    width: '100%',
    padding: 15,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
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
});
