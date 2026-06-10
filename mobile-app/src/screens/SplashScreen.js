import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const jayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Logo moves (scales up and fades in) for 2 seconds
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: "Welcome to Odisha Tourism," fades in
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Phase 3: "Jay Jagannath" fades in
      Animated.timing(jayOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Wait for a brief moment before finishing
      Animated.delay(1000)
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../assets/tourism.png')} 
        style={[
          styles.logo, 
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]} 
        resizeMode="contain" 
      />
      
      <Animated.Text style={[styles.welcomeText, { opacity: welcomeOpacity }]}>
        Welcome to Odisha Tourism,
      </Animated.Text>
      
      <Animated.Text style={[styles.jayText, { opacity: jayOpacity }]}>
        Jay Jagannath 🙏
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF6EF', // cream
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 22,
    color: '#7A5C42', // secondary brown
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  jayText: {
    fontSize: 28,
    color: '#7A2406', // primary terra-cotta
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
