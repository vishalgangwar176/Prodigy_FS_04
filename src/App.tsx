/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { ChatHeader } from './components/ChatHeader';
import { ChatPanel } from './components/ChatPanel';
import { CreateRoomModal } from './components/CreateRoomModal';
import { LeftNavRail } from './components/LeftNavRail';
import { MessageComposer } from './components/MessageComposer';
import { NewDirectChatModal } from './components/NewDirectChatModal';
import { NotificationToast } from './components/NotificationToast';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';

function MainChatLayout() {
  const { currentUser, loading } = useAuth();
  const {
    activeRoom,
    setActiveRoomId,
    toastNotification,
    dismissToast,
    rooms,
  } = useChat();

  const [currentTab, setCurrentTab] = useState<'all' | 'channels' | 'direct'>('all');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Modals state
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showNewDirectMessage, setShowNewDirectMessage] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync mobile view with active room selection
  useEffect(() => {
    if (activeRoom && window.innerWidth < 768) {
      setMobileView('chat');
    }
  }, [activeRoom]);

  // Handle hardware / browser back button on mobile
  useEffect(() => {
    if (mobileView === 'chat') {
      window.history.pushState({ view: 'chat' }, '');
      const handlePopState = () => {
        setMobileView('list');
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [mobileView]);

  // If initial auth is still loading
  if (loading) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#111b21] text-white select-none">
        <div className="w-14 h-14 rounded-full bg-[#00a884] animate-pulse flex items-center justify-center mb-4 shadow-xl shadow-[#00a884]/20">
          <span className="text-2xl">💬</span>
        </div>
        <h2 className="text-base font-semibold tracking-tight text-[#e9edef]">WhatsApp Web</h2>
        <p className="text-xs text-[#8696a0] mt-1">Connecting end-to-end encrypted sync...</p>
      </div>
    );
  }

  // If user is completely unauthenticated, force Auth modal
  if (!currentUser) {
    return <AuthModal isOpen={true} isForced={true} />;
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-white dark:bg-[#111b21] font-sans antialiased text-neutral-900 dark:text-[#e9edef]">
      {/* 1. Far-left Navigation Rail (Desktop side-rail & Mobile bottom-nav) */}
      <LeftNavRail
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileView('list');
        }}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenDemoUsers={() => setShowAuthModal(true)}
        isMobileChatOpen={mobileView === 'chat'}
      />

      {/* 2. Middle Panel: Conversation List Sidebar */}
      <div
        className={`${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full flex-col`}
      >
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenCreateChannel={() => setShowCreateChannel(true)}
          onOpenNewDirectMessage={() => setShowNewDirectMessage(true)}
          onSelectConversationMobile={() => setMobileView('chat')}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenDemoUsers={() => setShowAuthModal(true)}
        />
      </div>

      {/* 3. Main Chat Panel */}
      <main
        className={`${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        } flex-1 flex-col h-full min-w-0 bg-neutral-50/50 dark:bg-neutral-950/40 relative`}
      >
        {activeRoom ? (
          <>
            <ChatHeader
              room={activeRoom}
              onBackMobile={() => setMobileView('list')}
            />
            <ChatPanel />
            <MessageComposer />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-between p-8 text-center select-none bg-[#f0f2f5] dark:bg-[#222e35] border-b-6 border-[#00a884]">
            <div />
            <div className="max-w-md flex flex-col items-center">
              {/* WhatsApp Web Illustration Graphic */}
              <div className="w-64 h-48 mb-8 relative flex items-center justify-center">
                <div className="w-48 h-36 rounded-2xl bg-white dark:bg-[#111b21] shadow-lg border border-[#e9edef] dark:border-[#222d34] flex flex-col items-center justify-center p-4 relative">
                  <div className="w-12 h-12 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-md mb-2">
                    <span className="text-2xl font-bold">💬</span>
                  </div>
                  <div className="h-2 w-24 bg-[#e9edef] dark:bg-[#222d34] rounded-full mb-1.5" />
                  <div className="h-2 w-16 bg-[#e9edef] dark:bg-[#222d34] rounded-full" />

                  {/* Little smartphone companion */}
                  <div className="absolute -right-3 -bottom-2 w-14 h-24 rounded-xl bg-white dark:bg-[#202c33] shadow-xl border-2 border-[#00a884] flex flex-col items-center justify-between p-1.5">
                    <div className="w-4 h-1 bg-[#d1d7db] dark:bg-[#374248] rounded-full" />
                    <div className="w-6 h-6 rounded-full bg-[#d9fdd3] dark:bg-[#005c4b] flex items-center justify-center text-[10px]">
                      ✓✓
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full border border-[#d1d7db] dark:border-[#374248]" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-light text-[#41525d] dark:text-[#e9edef] mb-3">
                Download WhatsApp for Windows
              </h2>
              <p className="text-[14px] text-[#667781] dark:text-[#8696a0] leading-relaxed max-w-sm mb-6">
                Make calls, share your screen and get a faster experience when you download the Windows app.
              </p>

              <button
                onClick={() => {
                  // Select first room if available
                  const firstRoom = rooms[0];
                  if (firstRoom) setActiveRoomId(firstRoom.id);
                }}
                className="px-6 py-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white text-sm font-medium shadow-sm transition active:scale-95 cursor-pointer"
              >
                Select a Chat to Start
              </button>
            </div>

            {/* Bottom Encrypted Tagline */}
            <div className="flex items-center gap-1.5 text-[13px] text-[#8696a0] dark:text-[#667781]">
              <span>🔒</span>
              <span>End-to-end encrypted</span>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
      />

      <NewDirectChatModal
        isOpen={showNewDirectMessage}
        onClose={() => setShowNewDirectMessage(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* In-App Notification Toast */}
      {toastNotification && (
        <NotificationToast
          roomName={toastNotification.roomName}
          senderName={toastNotification.senderName}
          text={toastNotification.text}
          onOpenRoom={() => {
            setActiveRoomId(toastNotification.roomId);
            setMobileView('chat');
            dismissToast();
          }}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <MainChatLayout />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
