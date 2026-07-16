# React + TypeScript + Vite

## Firebase integration

This app uses the Firebase Web SDK through a TypeScript integration layer under `src/firebase`.

- `src/config/firebase.ts`: app initialization, Auth local persistence, Firestore offline cache, Storage
- `src/firebase/services`: auth, Firestore, and Storage service APIs
- `src/firebase/repositories`: repository pattern for users and study sessions
- `src/firebase/hooks`: reusable loading/error hooks, real-time Firestore hooks, upload hook
- `src/context/AuthContext.tsx`: Firebase Authentication context with profile and role state
- `src/firebase/routes/ProtectedRoute.tsx`: protected route and role guard
- `firestore.rules` and `storage.rules`: owner-scoped security rules

Required environment variables are listed in `.env.example`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Implemented Firebase features include email/password auth, Google sign-in, password reset, email verification, local session persistence, Firestore user profile creation, real-time study-session listeners, offline Firestore persistence, Storage uploads, typed error handling, and reusable loading states.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
# StudyTube
