import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Vibration,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import {
  checkInTicket,
  validateTicketQR,
  getRealtimeEventStats,
  CheckInResult,
  CheckinStats,
  QRValidationResult,
  formatCheckInTime,
  getStatusColor,
} from '../services/ticketsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CheckInScreenRouteProp = RouteProp<RootStackParamList, 'CheckIn'>;

interface LastScanResult {
  qr: string;
  timestamp: number;
  success: boolean;
}

const CheckInScreen: React.FC = () => {
  const route = useRoute<CheckInScreenRouteProp>();
  const navigation = useNavigation();
  const { eventId } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [stats, setStats] = useState<CheckinStats>({
    eventId,
    totalTickets: 0,
    checkedInTickets: 0,
    pendingTickets: 0,
    checkinRate: 0,
    recentCheckIns: [],
    lastUpdate: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [lastScan, setLastScan] = useState<LastScanResult | null>(null);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0)).current;
  const glowScaleAnim = useRef(new Animated.Value(1)).current;
  const statsUpdateAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize animations
  useEffect(() => {
    // Scan line animation - NATIVE DRIVEN
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation - NATIVE DRIVEN
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation - NATIVE DRIVEN (changed from false to true)
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow scale animation - NATIVE DRIVEN
    const glowScaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScaleAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    scanAnimation.start();
    pulseAnimation.start();
    glowAnimation.start();
    glowScaleAnimation.start();

    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
      glowAnimation.stop();
      glowScaleAnimation.stop();
    };
  }, []);

  // Load initial stats and setup real-time updates
  useEffect(() => {
    loadStats();
    setupRealTimeUpdates();

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [eventId]);

  const loadStats = async () => {
    try {
      const newStats = await getRealtimeEventStats(eventId);
      setStats(newStats);
      
      // Animate stats update
      Animated.sequence([
        Animated.timing(statsUpdateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(statsUpdateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const setupRealTimeUpdates = () => {
    // Update stats every 3 seconds for real-time experience
    statsIntervalRef.current = setInterval(() => {
      loadStats();
    }, 3000);
  };

  const handleBarcodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (isLoading) return;

      // Prevent duplicate scans within 2 seconds
      const now = Date.now();
      if (lastScan && lastScan.qr === data && now - lastScan.timestamp < 2000) {
        return;
      }

      setIsLoading(true);
      
      try {
        // Immediate feedback
        Vibration.vibrate(50);
        
        // Fast validation then check-in
        const result = await checkInTicket(data, eventId);
        
        setLastScan({
          qr: data,
          timestamp: now,
          success: result.success,
        });

        setLastResult(result);
        setShowResult(true);

        // Success vibration pattern
        if (result.success) {
          Vibration.vibrate([100, 50, 100]);
        } else {
          Vibration.vibrate([300]);
        }

        // Auto-hide result and continue scanning
        setTimeout(() => {
          setShowResult(false);
          setIsLoading(false);
          // Reload stats after successful check-in
          if (result.success) {
            loadStats();
          }
        }, 2000);

      } catch (error) {
        console.error('Check-in error:', error);
        setIsLoading(false);
        Vibration.vibrate([300, 100, 300]);
        
        // Create error result to show in modal instead of alert
        setLastResult({
          success: false,
          message: 'Erro de conexão. Verifique sua internet e tente novamente.',
          error: 'CONNECTION_ERROR',
        });
        setShowResult(true);

        setTimeout(() => {
          setShowResult(false);
        }, 3000);
      }
    },
    [eventId, isLoading, lastScan]
  );

  const handleManualCheckIn = async () => {
    if (!manualQR.trim()) return;

    setIsLoading(true);
    try {
      const result = await checkInTicket(manualQR.trim(), eventId);
      setLastResult(result);
      setShowResult(true);
      setManualQR('');
      setShowManualInput(false);

      if (result.success) {
        Vibration.vibrate([100, 50, 100]);
        loadStats();
      } else {
        Vibration.vibrate([300]);
      }

      setTimeout(() => {
        setShowResult(false);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Erro', 'Falha ao processar check-in manual');
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Permissão da câmera necessária</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progressPercentage = stats.totalTickets > 0 
    ? Math.round((stats.checkedInTickets / stats.totalTickets) * 100) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Check-in</Text>
          <Text style={styles.headerSubtitle}>
            {stats.checkedInTickets} de {stats.totalTickets} pessoas
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(true)}
        >
          <Ionicons name="keypad" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <Animated.View style={[styles.statsContainer, {
        transform: [{ scale: statsUpdateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02]
        })}]
      }]}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.checkedInTickets}</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="time" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{stats.pendingTickets}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="trending-up" size={24} color="#FFFFFF" />
            <Text style={styles.statNumber}>{progressPercentage}%</Text>
            <Text style={styles.statLabel}>Progresso</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>
            {progressPercentage}% concluído
          </Text>
        </View>
      </Animated.View>

      {/* Scanner */}
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* Scanner Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scannerFrame}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          
          {/* Glow ring animation */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowOpacityAnim,
                transform: [{ scale: glowScaleAnim }],
              },
            ]}
          />
        </View>

        {/* Loading indicator */}
        {isLoading && (
          <BlurView intensity={20} style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Processando...</Text>
          </BlurView>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="qr-code" size={32} color="#F59E0B" />
        <Text style={styles.instructionText}>
          Aponte a câmera para o QR Code do ingresso
        </Text>
        <Text style={styles.instructionSubtext}>
          O check-in será feito automaticamente
        </Text>
      </View>

      {/* Manual Input Modal */}
      <Modal
        visible={showManualInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualInput(false)}
      >
        <BlurView intensity={50} style={styles.modalContainer}>
          <View style={styles.manualInputContainer}>
            <Text style={styles.manualInputTitle}>Código Manual</Text>
            <Text style={styles.manualInputSubtitle}>
              Digite o código do QR Code
            </Text>
            
            <TextInput
              style={styles.manualInput}
              placeholder="Ex: ABCD1234..."
              value={manualQR}
              onChangeText={setManualQR}
              autoCapitalize="characters"
              autoFocus
            />
            
            <View style={styles.manualButtons}>
              <TouchableOpacity
                style={[styles.manualButton, styles.cancelButton]}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.manualButton, styles.confirmButton]}
                onPress={handleManualCheckIn}
                disabled={!manualQR.trim() || isLoading}
              >
                <Text style={styles.confirmButtonText}>Check-in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        transparent
        animationType="fade"
      >
        <BlurView intensity={30} style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.resultContainer,
              lastResult?.success ? styles.successResult : styles.errorResult,
            ]}
          >
            <Ionicons
              name={lastResult?.success ? "checkmark-circle" : "close-circle"}
              size={48}
              color={lastResult?.success ? "#10B981" : "#EF4444"}
            />
            
            <Text style={styles.resultTitle}>
              {lastResult?.success ? "✅ Check-in Realizado!" : "❌ Erro no Check-in"}
            </Text>
            
            <Text style={styles.resultMessage}>
              {lastResult?.message}
            </Text>

            {lastResult?.success && lastResult.user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{lastResult.user.name}</Text>
                <Text style={styles.userEmail}>{lastResult.user.email}</Text>
              </View>
            )}
          </Animated.View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2D2D2D',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 2,
  },
  manualButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#3D3D3D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 8,
    fontWeight: '500',
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  glowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: '#F59E0B',
    opacity: 0.3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2D2D2D',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInputContainer: {
    width: screenWidth - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
  },
  manualInputTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualInputSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  manualButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#F59E0B',
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 15,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 15,
  },
  resultContainer: {
    width: screenWidth - 60,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  successResult: {
    backgroundColor: '#FFFFFF',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  errorResult: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  resultMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  userInfo: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    width: '100%',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckInScreen; 