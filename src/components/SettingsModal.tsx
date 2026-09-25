import { Bell, Check, Volume2, VolumeX, X } from 'lucide-react';
import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  clearCustomFirebaseConfig,
  getCustomFirebaseConfig,
  isFirebaseConfigured,
  saveCustomFirebaseConfig,
} from '../lib/firebase';
import { playNotificationSound } from '../lib/utils';
import { FirebaseCustomConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    soundEnabled,
    setSoundEnabled,
    desktopNotificationsEnabled,
    requestDesktopNotificationPermission,
  } = useChat();

  const isConfigured = isFirebaseConfigured();
  const currentConfig = getCustomFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'firebase'>('preferences');

  if (!isOpen) return null;

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) return;

    setSavingConfig(true);
    const config: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(config);
  };

  const handleClearFirebaseConfig = () => {
    clearCustomFirebaseConfig();
  };

  const handleTestSound = () => {
    playNotificationSound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              App Settings & Integration
            </h3>
            <p className="text-xs text-neutral-500">
              Notification preferences, audio chimes, and Firebase sync configuration.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 my-4 p-1 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Notifications & Sound
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'firebase'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <span>Firebase Config</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          {activeTab === 'preferences' ? (
            <div className="space-y-4">
              {/* Sound Chimes */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#d9fdd3] dark:bg-[#005c4b]/50 text-[#008069] dark:text-[#25d366]">
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      WhatsApp Message Chimes
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Play synthesized WhatsApp incoming message chime when a new message arrives.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                  >
                    Test Sound
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundEnabled ? 'bg-[#00a884]' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Desktop Push Notifications */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#d9fdd3] dark:bg-[#005c4b]/50 text-[#008069] dark:text-[#25d366]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      Desktop Notifications
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Receive notifications when WhatsApp is in the background or minimized.
                    </p>
                  </div>
                </div>

                <div>
                  {desktopNotificationsEnabled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      Enabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requestDesktopNotificationPermission()}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#00a884] hover:bg-[#02906f] text-white rounded-xl shadow-xs transition"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>

              {/* Engine Status Note */}
              <div className="p-3.5 rounded-xl bg-[#d9fdd3]/40 dark:bg-[#005c4b]/20 border border-[#00a884]/30 text-xs text-[#008069] dark:text-[#25d366] leading-relaxed">
                <span className="font-bold">Real-Time Sync Engine: </span>
                {isConfigured
                  ? 'Connected to your Cloud Firestore database with real-time onSnapshot listeners.'
                  : 'Multi-tab BroadcastChannel & Local Storage sync is active. Open two tabs to test instant messaging, presence, and typing side-by-side!'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Current Connection Status
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {isConfigured
                      ? `Connected to Firebase Project: ${currentConfig?.projectId || 'Configured'}`
                      : 'Running in Local Multi-Tab Real-Time Mode (No Cloud Project Required)'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isConfigured
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                  }`}
                >
                  {isConfigured ? 'Live Firebase' : 'Multi-Tab Active'}
                </span>
              </div>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  You can paste your Firebase credentials below to connect to your live Firebase project (or configure via <code className="text-indigo-600 dark:text-indigo-400 font-mono">.env</code>):
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                    API Key (apiKey)
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      placeholder="my-pulsechat-app"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      value={authDomain}
                      onChange={(e) => setAuthDomain(e.target.value)}
                      placeholder="app.firebaseapp.com"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Storage Bucket
                    </label>
                    <input
                      type="text"
                      value={storageBucket}
                      onChange={(e) => setStorageBucket(e.target.value)}
                      placeholder="app.firebasestorage.app"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-[#00a884] font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="1:123456:web:abcd"
                      className="w-full px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-[#00a884] font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {currentConfig ? (
                    <button
                      type="button"
                      onClick={handleClearFirebaseConfig}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                    >
                      Clear & Use Local Engine
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={savingConfig || !apiKey.trim() || !projectId.trim()}
                    className="px-4 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Save & Reconnect
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
