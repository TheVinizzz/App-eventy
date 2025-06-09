import React, { useState, useEffect } from 'react';
import { Modal } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  visible, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Sincronizar o modo interno quando initialMode ou visibilidade mudam
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
    }
  }, [visible, initialMode]);

  const handleSwitchToRegister = () => setMode('register');
  const handleSwitchToLogin = () => setMode('login');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {mode === 'login' ? (
        <LoginScreen
          onSwitchToRegister={handleSwitchToRegister}
          onClose={onClose}
        />
      ) : (
        <RegisterScreen
          onSwitchToLogin={handleSwitchToLogin}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default AuthModal; 