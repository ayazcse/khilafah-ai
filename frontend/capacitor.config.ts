import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.khalaf.app",
  appName: "KHALAF",
  webDir: "out",
  server: {
    // KHALAF currently uses Next.js server rendering and hosted APIs.
    // Load the production web app inside the native Android WebView.
    // This keeps the Android app in sync with the deployed website.
    url: "https://khilafah-ai-frontend.vercel.app",
    cleartext: false,
    allowNavigation: ["khilafah-ai-frontend.vercel.app"],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
