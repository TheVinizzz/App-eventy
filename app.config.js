export default {
  expo: {
    name: "EventyApp",
    slug: "eventy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    extra: {
      eas: {
        projectId: "e28871f8-90f8-46e8-b720-848194c71251"
      }
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#060706",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.eventy.app",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#060706",
        // Configurações específicas para iOS
        tabletImage: "./assets/splash-icon.png",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#060706",
      },
      package: "com.eventy.app",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#060706",
        // Configurações específicas para Android
        mdpi: "./assets/splash-icon.png",
        hdpi: "./assets/splash-icon.png",
        xhdpi: "./assets/splash-icon.png",
        xxhdpi: "./assets/splash-icon.png",
        xxxhdpi: "./assets/splash-icon.png",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#060706",
      },
    },
    jsEngine: "hermes",
    scheme: "eventy",
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "Permite acesso às fotos para criar stories e posts",
          cameraPermission: "Permite acesso à câmera para capturar fotos e vídeos",
          microphonePermission: "Permite acesso ao microfone para gravar vídeos com áudio",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#060706",
        },
      ],
    ],
  },
}; 