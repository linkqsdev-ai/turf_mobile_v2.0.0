import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { ThemedText } from './themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface CoinTossModalProps {
  visible: boolean;
  onClose: () => void;
}

// External helper to generate random result - keeps component pure for React Compiler
function getRandomTossResult(): 'HEADS' | 'TAILS' {
  return Math.random() < 0.5 ? 'HEADS' : 'TAILS';
}

export function CoinTossModal({ visible, onClose }: CoinTossModalProps) {
  const theme = useTheme();
  const [result, setResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // State for toggling displayed face during flip - avoids Math.random inside render
  const [displaySide, setDisplaySide] = useState<'HEADS' | 'TAILS'>('HEADS');

  // Use state instead of ref to store Animated.Value - avoids compiler ref-during-render errors
  const [spinAnim] = useState(() => new Animated.Value(0));

  const handleToss = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setResult(null);
    spinAnim.setValue(0);

    // Toggle coin face during the toss for visual effect
    let currentSide = displaySide;
    const intervalId = setInterval(() => {
      currentSide = currentSide === 'HEADS' ? 'TAILS' : 'HEADS';
      setDisplaySide(currentSide);
    }, 80);

    const tossResult = getRandomTossResult();

    // Spin 8 full rotations (2880 degrees) + 180 degrees extra if it's TAILS
    const targetValue = tossResult === 'HEADS' ? 8 : 9;

    Animated.timing(spinAnim, {
      toValue: targetValue,
      duration: 1200,
      useNativeDriver: true,
    }).start(() => {
      clearInterval(intervalId);
      setIsFlipping(false);
      setResult(tossResult);
      setDisplaySide(tossResult);
    });
  };

  const handleClose = () => {
    setResult(null);
    setIsFlipping(false);
    spinAnim.setValue(0);
    onClose();
  };

  // Interpolated variables (derived from state-bound spinAnim, safe for render)
  const spin = spinAnim.interpolate({
    inputRange: [0, 8, 9],
    outputRange: ['0deg', '2880deg', '3060deg'],
  });

  const lift = spinAnim.interpolate({
    inputRange: [0, 4.5, 8, 9],
    outputRange: [0, -80, 0, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <View style={[styles.modalBox, { backgroundColor: '#05151e', borderColor: theme.outlineVariant }]}>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </Pressable>

          <View style={styles.header}>
            <FontAwesome5 name="coins" size={24} color="#feae2c" style={{ marginBottom: Spacing.sm }} />
            <ThemedText type="headlineSm" style={{ color: theme.text, fontFamily: 'HankenGrotesk_700Bold' }}>
              Kickoff Coin Toss
            </ThemedText>
            <ThemedText type="labelMd" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4 }}>
              Decide which team starts the match
            </ThemedText>
          </View>

          {/* Animated Coin */}
          <View style={styles.coinArea}>
            <Animated.View
              style={[
                styles.coinContainer,
                {
                  transform: [
                    { translateY: lift },
                    { rotateY: spin }
                  ]
                }
              ]}
            >
              <View style={styles.coinOuter}>
                <View style={styles.coinInner}>
                  <ThemedText style={styles.coinText}>
                    {displaySide === 'HEADS' ? 'H' : 'T'}
                  </ThemedText>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Result Area */}
          <View style={styles.resultContainer}>
            {isFlipping && (
              <ThemedText type="bodyMd" style={{ color: '#feae2c', fontFamily: 'HankenGrotesk_700Bold' }}>
                Flipping...
              </ThemedText>
            )}
            {!isFlipping && result && (
              <View style={{ alignItems: 'center' }}>
                <ThemedText type="headlineSm" style={{ color: '#feae2c', fontFamily: 'HankenGrotesk_700Bold', fontSize: 22 }}>
                  {result}
                </ThemedText>
                <ThemedText type="labelSm" style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {result === 'HEADS' ? 'Heads kicks off the match!' : 'Tails kicks off the match!'}
                </ThemedText>
              </View>
            )}
            {!isFlipping && !result && (
              <ThemedText type="bodyMd" style={{ color: theme.textSecondary }}>
                Tap flip to toss the coin
              </ThemedText>
            )}
          </View>

          {/* Actions */}
          <Pressable
            style={[styles.tossButton, isFlipping && styles.tossButtonDisabled]}
            onPress={handleToss}
            disabled={isFlipping}
          >
            <ThemedText type="labelMd" style={styles.tossButtonText}>
              {isFlipping ? 'TOSSING...' : 'FLIP COIN'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 21, 30, 0.85)',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalBox: {
    width: '80%',
    maxWidth: 320,
    borderRadius: BorderRadius.premium,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  coinArea: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  coinContainer: {
    width: 84,
    height: 84,
  },
  coinOuter: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    backgroundColor: '#feae2c',
    borderWidth: 4,
    borderColor: '#d28f1e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#feae2c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  coinInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: {
    color: '#05151e',
    fontSize: 32,
    fontFamily: 'HankenGrotesk_700Bold',
  },
  resultContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tossButton: {
    backgroundColor: '#feae2c',
    height: 44,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#feae2c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tossButtonDisabled: {
    backgroundColor: 'rgba(254, 174, 44, 0.5)',
  },
  tossButtonText: {
    color: '#05151e',
    fontFamily: 'HankenGrotesk_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
