export default {
  expo: {
    name: "EventyApp",
    slug: "eventy",
    version: "1.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    owner: "thevinizzz",
    backgroundColor: "#060706",
    extra: {
      eas: {
        projectId: "5a3a1483-c2f2-4191-9d54-c08e6b664219"
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
      bundleIdentifier: "com.eventyapp.v2",
      userInterfaceStyle: "dark",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#060706",
        tabletImage: "./assets/splash-icon.png",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#060706",
      },
      package: "com.eventyapp.v2",
      versionCode: 4,
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#060706",
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
        "expo-camera",
        {
          cameraPermission: "Permite acesso à câmera para check-ins instantâneos via QR Code",
          microphonePermission: false,
        },
      ],
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
      [
        "expo-system-ui",
        {
          userInterfaceStyle: "dark"
        }
      ]
    ],
  },
}; 