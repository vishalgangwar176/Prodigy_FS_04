import {
  Camera,
  Lock,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  User,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'voice' | 'video';
  calleeName: string;
  calleeAvatar?: string;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  type,
  calleeName,
  calleeAvatar,
}) => {
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected'>('calling');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Transition from calling -> ringing -> connected
  useEffect(() => {
    if (!isOpen) {
      setCallStatus('calling');
      setCallSeconds(0);
      setIsMuted(false);
      setIsVideoOff(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setCallStatus('ringing');
    }, 1500);

    const timer2 = setTimeout(() => {
      setCallStatus('connected');
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  // Duration counter when connected
  useEffect(() => {
    if (callStatus !== 'connected' || !isOpen) return;
    const interval = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus, isOpen]);

  if (!isOpen) return null;

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b141a]/95 backdrop-blur-md flex flex-col justify-between items-center p-6 text-white select-none animate-in fade-in duration-200">
      {/* Top Header: Security and Title */}
      <div className="w-full flex flex-col items-center pt-safe pt-4">
        <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mb-2 font-medium">
          <Lock className="w-3.5 h-3.5 text-[#00a884]" />
          <span>End-to-end encrypted</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#e9edef]">
          {calleeName}
        </h2>
        <p className="text-sm font-medium mt-1 text-[#25d366]">
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'ringing' && 'Ringing...'}
          {callStatus === 'connected' && formatCallTime(callSeconds)}
        </p>
      </div>

      {/* Center: Avatar or Simulated Video Stream */}
      <div className="flex flex-col items-center justify-center my-auto relative">
        {type === 'video' && !isVideoOff && callStatus === 'connected' ? (
          <div className="relative w-64 h-80 sm:w-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#111b21] flex items-center justify-center">
            {calleeAvatar ? (
              <img
                src={calleeAvatar}
                alt={calleeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-24 h-24 text-[#8696a0]" />
            )}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 text-[#25d366]">
              <Sparkles className="w-3 h-3" /> HD Video
            </div>
            {/* Self preview thumbnail in bottom right */}
            <div className="absolute bottom-3 right-3 w-20 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-[#202c33] flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#8696a0]" />
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Ripple wave animations while ringing */}
            {callStatus !== 'connected' && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#00a884]/20 animate-ping" />
                <div className="absolute -inset-4 rounded-full border border-[#00a884]/30 animate-pulse" />
              </>
            )}

            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-3 border-[#00a884] shadow-2xl bg-[#202c33] relative z-10 flex items-center justify-center">
              {calleeAvatar ? (
                <img
                  src={calleeAvatar}
                  alt={calleeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {calleeName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-sm flex items-center justify-around gap-4 pb-safe pb-6 pt-4">
        {/* Toggle Mute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
            isMuted
              ? 'bg-white text-[#111b21]'
              : 'bg-[#202c33] text-white hover:bg-[#2a3942]'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle if video call */}
        {type === 'video' && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-13 h-13 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
              isVideoOff
                ? 'bg-white text-[#111b21]'
                : 'bg-[#202c33] text-white hover:bg-[#2a3942]'
            }`}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5 text-red-500" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Speaker Toggle */}
        <button
          onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          className={`w-13 h-13 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
            isSpeakerOn
              ? 'bg-[#202c33] text-[#25d366] hover:bg-[#2a3942]'
              : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
          }`}
          title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
        >
          {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="w-14 h-14 rounded-full bg-[#ea0038] hover:bg-[#d00030] text-white flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
