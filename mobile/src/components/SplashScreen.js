// SOTA Splash Screen - Animated launch screen for Oracle Trading
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.5)).current;
  const ringScale2 = useRef(new Animated.Value(0.5)).current;
  const ringScale3 = useRef(new Animated.Value(0.5)).current;
  const ringOpacity1 = useRef(new Animated.Value(0)).current;
  const ringOpacity2 = useRef(new Animated.Value(0)).current;
  const ringOpacity3 = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Particle positions
  const [particles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2000,
      duration: Math.random() * 3000 + 2000,
    }))
  );

  const particleAnimations = useRef(
    particles.map(() => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Start animation sequence
    const animationSequence = async () => {
      // Phase 1: Logo entrance with bounce
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Phase 2: Pulsing rings
      setTimeout(() => {
        // Ring 1
        Animated.loop(
          Animated.sequence([
            Animated.parallel([
              Animated.timing(ringScale1, {
                toValue: 2,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(ringOpacity1, {
                toValue: 0.5,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(ringOpacity1, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(ringScale1, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();

        // Ring 2 (delayed)
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(ringScale2, {
                  toValue: 2.5,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(ringOpacity2, {
                  toValue: 0.3,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(ringOpacity2, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(ringScale2, {
                toValue: 0.5,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, 500);

        // Ring 3 (more delayed)
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.parallel([
                Animated.timing(ringScale3, {
                  toValue: 3,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(ringOpacity3, {
                  toValue: 0.2,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]),
              Animated.timing(ringOpacity3, {
                toValue: 0,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(ringScale3, {
                toValue: 0.5,
                duration: 0,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, 1000);
      }, 300);

      // Phase 3: Logo glow pulse
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoGlow, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(logoGlow, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 500);

      // Phase 4: Title reveal
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(titleTranslate, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600);

      // Phase 5: Subtitle reveal
      setTimeout(() => {
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 1000);

      // Phase 6: Particles
      setTimeout(() => {
        Animated.timing(particleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // Animate each particle
        particleAnimations.forEach((anim, index) => {
          const particle = particles[index];
          setTimeout(() => {
            Animated.loop(
              Animated.sequence([
                Animated.parallel([
                  Animated.timing(anim.translateY, {
                    toValue: -100,
                    duration: particle.duration,
                    useNativeDriver: true,
                  }),
                  Animated.sequence([
                    Animated.timing(anim.opacity, {
                      toValue: 0.8,
                      duration: particle.duration * 0.3,
                      useNativeDriver: true,
                    }),
                    Animated.timing(anim.opacity, {
                      toValue: 0,
                      duration: particle.duration * 0.7,
                      useNativeDriver: true,
                    }),
                  ]),
                ]),
                Animated.timing(anim.translateY, {
                  toValue: 0,
                  duration: 0,
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }, particle.delay);
        });
      }, 800);

      // Phase 7: Loading bar
      setTimeout(() => {
        Animated.timing(loadingWidth, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }).start();
      }, 1200);

      // Phase 8: Fade out and finish
      setTimeout(() => {
        Animated.timing(fadeOut, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onFinish?.();
        });
      }, 3500);
    };

    animationSequence();
  }, []);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#050505', '#0a0a0a', '#050505']}
        style={StyleSheet.absoluteFill}
      />

      {/* Background gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(20, 184, 166, 0.3)', 'transparent']}
          style={[styles.orb, styles.orb1]}
        />
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.2)', 'transparent']}
          style={[styles.orb, styles.orb2]}
        />
        <LinearGradient
          colors={['rgba(6, 182, 212, 0.2)', 'transparent']}
          style={[styles.orb, styles.orb3]}
        />
      </View>

      {/* Floating particles */}
      <Animated.View style={[styles.particlesContainer, { opacity: particleOpacity }]}>
        {particles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                opacity: particleAnimations[index].opacity,
                transform: [
                  { translateY: particleAnimations[index].translateY },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Pulsing rings */}
      <View style={styles.ringsContainer}>
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale1 }],
              opacity: ringOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale2 }],
              opacity: ringOpacity2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              transform: [{ scale: ringScale3 }],
              opacity: ringOpacity3,
            },
          ]}
        />
      </View>

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: logoScale },
              { rotate: logoRotateInterpolate },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoGlow,
            {
              opacity: logoGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [
                {
                  scale: logoGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <LinearGradient
          colors={['#14B8A6', '#0D9488', '#0F766E']}
          style={styles.logoInner}
        >
          <Ionicons name="flash" size={50} color="#fff" />
        </LinearGradient>
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        <Text style={styles.title}>ORACLE</Text>
        <Text style={styles.titleAccent}>TRADING</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        AI-Powered • Multi-Exchange • Real-Time
      </Animated.Text>

      {/* Loading bar */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingTrack}>
          <Animated.View
            style={[
              styles.loadingBar,
              {
                width: loadingWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Animated.Text
          style={[
            styles.loadingText,
            {
              opacity: loadingWidth.interpolate({
                inputRange: [0, 0.1, 1],
                outputRange: [0, 1, 1],
              }),
            },
          ]}
        >
          Initializing trading systems...
        </Animated.Text>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 400,
    height: 400,
    top: -100,
    left: -100,
  },
  orb2: {
    width: 300,
    height: 300,
    bottom: 100,
    right: -100,
  },
  orb3: {
    width: 250,
    height: 250,
    bottom: -50,
    left: 50,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  ringsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.primary,
    letterSpacing: 4,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 3,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    width: width * 0.6,
    alignItems: 'center',
  },
  loadingTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
    letterSpacing: 1,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default SplashScreen;
