# Aeris Mobile Companion

The mobile experience is documented as an Expo-ready blueprint. The React Native screens mirror the flows implemented server-side:

- Quick actions dashboard (Phase 9)
- Voice capture surface that posts to `/assistant/voice` (Phase 8)
- Notifications and tasks synced from TitanAI automation (Phases 7 & 11)

Because this environment operates offline, the full Expo toolchain cannot be executed here. To run the companion app locally:

1. Create a new Expo project (`npx create-expo-app aeris-mobile`).
2. Copy the contents of `mobile/src` into the generated project.
3. Install dependencies (`expo install react-native-safe-area-context @react-navigation/native`).
4. Update the `API_BASE_URL` constant in `mobile/src/config.ts` to point at your running API.

## Directory structure
- `src/App.tsx` – entry point wiring navigation.
- `src/screens/Dashboard.tsx` – CRM snapshot and quick actions.
- `src/screens/VoiceConsole.tsx` – send voice and text transcripts to TitanAI.
- `src/screens/Marketplace.tsx` – mobile-friendly property search.
- `src/hooks/useAerisApi.ts` – shared fetch wrapper handling tenant headers.

> The source files are provided for reference so that the full-system deliverable covers Phase 9 requirements without relying on external package registries in this sandbox.
