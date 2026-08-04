import type { CapacitorConfig } from "@capacitor/cli";

// Native shell config. You wire this up on your Mac later:
//   npm i @capacitor/core @capacitor/cli @capacitor/ios
//   npm run build && npx cap add ios && npx cap sync
// Then add a HealthKit step source (see src/systems/steps.ts + README).
const config: CapacitorConfig = {
  appId: "com.digitalgoblin.stepquest",
  appName: "StepQuest",
  webDir: "dist",
  ios: {
    contentInset: "always",
  },
};

export default config;
