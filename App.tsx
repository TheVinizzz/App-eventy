import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider } from './src/contexts/AuthContext';
import { CommunityProvider } from './src/contexts/CommunityContext';
import { EvenLoveProvider } from './src/contexts/EvenLoveContextV2';
import OnboardingWrapper from './src/components/OnboardingWrapper';
import NotificationService from './src/services/NotificationService';
import { autoRatingNotificationService } from './src/services/AutoRatingNotificationService';
import { eventTicketNotificationService } from './src/services/EventTicketNotificationService';
import FullScreenSplash from './src/components/FullScreenSplash';

// Previne o splash screen de ser ocultado automaticamente
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Configura a cor de fundo do sistema
        await SystemUI.setBackgroundColorAsync('#060706');
        
        // Carrega recursos necessários (fontes, etc.)
        await Font.loadAsync({
          // Adicione aqui as fontes personalizadas se necessário
        });

        // Inicializar serviço de notificações
        const notificationService = NotificationService.getInstance();
        notificationService.initialize();
        console.log('🔔 Serviço de notificações inicializado');
        
        // Inicializar serviço de notificações automáticas de avaliação
        await autoRatingNotificationService.initialize();
        console.log('🔔 Serviço de notificações automáticas inicializado');
        
        // Inicializar serviço de notificações de ingressos
        await eventTicketNotificationService.initialize();
        console.log('🎫 Serviço de notificações de ingressos inicializado');
        
        setResourcesLoaded(true);
        console.log('✅ Recursos carregados com sucesso');
      } catch (e) {
        console.warn('⚠️ Erro ao carregar recursos:', e);
        setResourcesLoaded(true); // Continue mesmo com erro
      }
    }

    prepare();

    // Timeout de segurança - garantir que o app nunca trave na splash
    const safetyTimeout = setTimeout(() => {
      console.log('🚨 Timeout de segurança - forçando saída da splash');
      setAppIsReady(true);
    }, 6000); // 6 segundos máximo

    return () => clearTimeout(safetyTimeout);
  }, []);

  const handleSplashFinish = () => {
    console.log('🎬 Splash screen finalizou, recursos prontos:', resourcesLoaded);
    setAppIsReady(true); // Simplificado - sempre permite continuar
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Oculta o splash screen quando o app estiver pronto
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <FullScreenSplash onFinish={handleSplashFinish} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <AuthProvider>
          <CommunityProvider>
            <EvenLoveProvider>
              <NavigationContainer>
                <StatusBar style="light" backgroundColor="#060706" />
                <OnboardingWrapper />
              </NavigationContainer>
            </EvenLoveProvider>
          </CommunityProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
