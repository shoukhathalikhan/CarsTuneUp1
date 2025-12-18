export default {
  expo: {
    name: "CarsTuneUp",
    slug: "carstuneup-customer",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#007BFF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.carstuneup.customer"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#007BFF"
      },
      package: "com.carstuneup.customer",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "NOTIFICATIONS"
      ]
    },
    web: {
      bundler: "metro",
      build: {
        serviceWorker: false
      }
    },
    plugins: [
      "expo-font",
      "expo-notifications",
      "expo-location"
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || null,
      eas: {
        projectId: "02acf4e2-4894-415f-ab90-e78e6b49d0d0"
      }
    }
  }
};
