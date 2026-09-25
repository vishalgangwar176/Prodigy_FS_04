import { Check, Upload, User, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PRESET_AVATARS } from '../lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfileData, logout } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [statusText, setStatusText] = useState(currentUser?.statusText || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || PRESET_AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoURL(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfileData({
        displayName: displayName.trim(),
        statusText: statusText.trim(),
        photoURL,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Edit Profile
            </h3>
            <p className="text-xs text-neutral-500">
              Customize your identity and status across PulseChat.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Avatar Preview & Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Profile Photo
            </label>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-indigo-500/20 shadow-md shrink-0 bg-neutral-200 dark:bg-neutral-800">
                <img src={photoURL} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Photo</span>
                </button>
                <p className="text-[11px] text-neutral-400 mt-1">Or pick from preset avatars below</p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoURL(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden transition-all ${
                    photoURL === url
                      ? 'ring-3 ring-indigo-600 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Vishal Gangwar"
              className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white"
              required
            />
          </div>

          {/* Status Message */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              About / Status
            </label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="e.g. Available, At work 💻, In a meeting 📞"
              className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
            >
              Log Out
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !displayName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                {success ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : saving ? (
                  'Saving...'
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
