# PulseChat - Production Real-Time Chat Web Application
**Task-04 Software Development Internship Submission**

PulseChat is a modern, real-time messaging application engineered with React 19, TypeScript, Tailwind CSS, and Firebase (Auth, Firestore, and Cloud Storage). It provides responsive Slack/Discord/WhatsApp Web inspired UI/UX, multi-room group channels, 1:1 direct messaging, online presence indicators, live typing indicators, multimedia file sharing, read receipts, and sound/toast notifications.

---

## 🚀 Key Features

1. **Authentication & User Management**
   - Email/password registration and sign-in with full validation and error handling.
   - Google Sign-In with popup provider flow.
   - Instant Demo accounts switcher (Alex Chen, Maya Lin, David Park) for immediate cross-tab multi-user testing without waiting for email confirmations.
   - Editable user profiles: display name, status message ("Focus mode 🎯", "Available", etc.), preset persona avatars, or custom image uploads.
   - Session persistence across reloads.

2. **Rooms & 1:1 Direct Conversations**
   - Browse and join public channels (e.g. `#general`, `#engineering`, `#design-system`, `#announcements`).
   - Create custom rooms with title, description, and custom channel icons.
   - Searchable user directory to start direct 1:1 private conversations.
   - Activity-sorted conversation list with unread counter badges and real-time snippet updates.

3. **Real-Time Messaging & UX**
   - Live Firestore `onSnapshot` listener synchronization (with cross-tab BroadcastChannel backup if running in standalone preview mode).
   - Read & delivered statuses (single check = sent/delivered, double blue checks = read).
   - Live typing indicators ("Maya is typing...").
   - Auto-scroll to latest message with an interactive "Jump to latest" floating pill when viewing older history.
   - Paginated historical messages loading ("Load earlier messages").
   - Integrated native emoji picker and keyboard shortcuts (Enter to send, Shift+Enter for newline).

4. **User Presence & Activity**
   - Real-time online/offline green presence badge indicator.
   - "Last seen" relative timestamps when users disconnect.
   - Activity heartbeat listener.

5. **Multimedia File & Image Sharing**
   - Drag-and-drop file upload zone over the chat conversation.
   - File attachment picker with image previews and lightbox viewer.
   - File cards displaying filename, file size, extension badge, and direct download links.
   - Uploads to Firebase Storage with local fallback caching.

6. **Notifications & Polish**
   - In-app toast alerts when receiving messages in background conversations.
   - Subtle audio notification chime using Web Audio API synthesis (no broken external MP3 links).
   - Browser push notification permission prompt with native notification dispatch when in background.
   - Full dark mode and light mode support with seamless toggle.

---

## 🛠️ Project Structure

```
├── /src
│   ├── /components
│   │   ├── AuthModal.tsx             # Sign in, Sign up & Google auth modal
│   │   ├── ChatHeader.tsx            # Active channel/DM header & presence status
│   │   ├── ChatPanel.tsx             # Messages feed, scroll management, date separators
│   │   ├── ConversationItem.tsx      # Sidebar conversation row with unread badges
│   │   ├── CreateRoomModal.tsx       # Modal to create channels with icon picker
│   │   ├── EmojiPicker.tsx           # Categorized emoji selector
│   │   ├── FileUploadPreview.tsx     # Attachment preview & drag-drop indicator
│   │   ├── ImageLightbox.tsx         # Full-screen image preview
│   │   ├── LeftNavRail.tsx           # Far-left quick switch rail (Slack/Discord style)
│   │   ├── MessageBubble.tsx         # Message item with avatar, timestamp, read receipts
│   │   ├── MessageComposer.tsx       # Auto-growing textarea, attachments, send action
│   │   ├── NewDirectChatModal.tsx    # Searchable user list to start 1:1 DM
│   │   ├── NotificationToast.tsx     # In-app toast notifications for inactive rooms
│   │   ├── ProfileModal.tsx          # Profile editor with preset avatars and status
│   │   ├── SettingsModal.tsx         # Firebase credentials configuration & preferences
│   │   ├── Sidebar.tsx               # Conversations list, search filter, tabs
│   │   └── UserPresenceBadge.tsx     # Real-time green/gray presence status indicator
│   ├── /context
│   │   ├── AuthContext.tsx           # User session, login/logout, profile updates
│   │   ├── ChatContext.tsx           # Real-time rooms, messages, presence, typing state
│   │   └── ThemeContext.tsx          # Light/Dark mode state and persistence
│   ├── /hooks
│   │   ├── useAudioNotification.ts   # Web Audio notification chimes
│   │   └── useScrollManager.ts       # Message feed auto-scroll and jump-to-bottom
│   ├── /lib
│   │   ├── demoData.ts               # Default seed rooms and mock users
│   │   ├── firebase.ts               # Firebase App, Auth, Firestore, Storage init
│   │   ├── firebaseService.ts        # Firestore queries, mutations & snapshot sync
│   │   ├── localRealtimeEngine.ts    # BroadcastChannel & storage fallback engine
│   │   └── utils.ts                  # Date formatting, file size formatters, classnames
│   ├── /types
│   │   └── index.ts                  # Strict TypeScript interfaces for Users, Rooms, Messages
│   ├── App.tsx                       # Root application layout & responsive panels
│   ├── index.css                     # Tailwind CSS imports & custom scrollbars
│   └── main.tsx                      # Vite React entry point
├── firebase.json                     # Firebase Hosting & Firestore rules configuration
├── firestore.rules                   # ABAC Firestore Security rules
├── firebase-blueprint.json           # Data schema blueprint
└── .env.example                      # Environment variables documentation
```

---

## 📦 Setting Up Firebase (Step-by-Step)

Follow these steps to link this project to your own live Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, name it (e.g. `pulse-chat-app`), and click **Continue**.
3. (Optional) Disable Google Analytics or leave enabled, then click **Create Project**.

### Step 2: Enable Firebase Authentication
1. In the Firebase Console left menu, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under **Sign-in method**, enable:
   - **Email/Password**: Toggle to enabled and Save.
   - **Google**: Toggle to enabled, provide your project support email, and Save.

### Step 3: Enable Cloud Firestore
1. Navigate to **Build > Firestore Database**.
2. Click **Create Database**.
3. Select a cloud region close to your users (e.g. `us-central1` or `asia-southeast1`).
4. Choose **Start in production mode** (our `firestore.rules` file contains the complete rules).
5. Click **Create**.

### Step 4: Enable Firebase Cloud Storage
1. Navigate to **Build > Storage**.
2. Click **Get Started**.
3. Select **Start in production mode** and choose the same region.
4. Click **Done**.

### Step 5: Register a Web App & Retrieve Config
1. In Project Overview, click the Web icon (`</>`) to add a web application.
2. Enter App nickname (e.g. `PulseChat Web`) and click **Register app**.
3. Copy the `firebaseConfig` keys from the SDK snippet:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 6: Configure Environment Variables
Create a `.env` file in the root directory and paste your keys:
```bash
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="pulse-chat-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="pulse-chat-app"
VITE_FIREBASE_STORAGE_BUCKET="pulse-chat-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

*(Note: You can also click the ⚙️ Settings icon in the app navigation rail to paste these credentials directly at runtime!)*

---

## 💻 Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local Vite development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Multi-User Testing:**
   Open a second browser tab (or incognito window) and select a different user account from the Auth switcher. Send messages, share pictures, or type — updates synchronize instantaneously across tabs!

---

## 🚢 Deploying to Firebase Hosting

Deploying takes just two terminal commands with the Firebase CLI:

1. **Install Firebase CLI (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to your Firebase account:**
   ```bash
   firebase login
   ```

3. **Initialize or link your project (if not linked):**
   ```bash
   firebase use --add <your-firebase-project-id>
   ```

4. **Build the production bundle:**
   ```bash
   npm run build
   ```

5. **Deploy Hosting and Firestore Security Rules:**
   ```bash
   firebase deploy
   ```
   *Or deploy only hosting:*
   ```bash
   firebase deploy --only hosting
   ```

Your app is now live at `https://<your-project-id>.web.app` and `https://<your-project-id>.firebaseapp.com`!
