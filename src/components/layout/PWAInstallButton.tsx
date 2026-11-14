import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          compact
            ? 'p-2 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400 hover:text-white transition-colors'
            : 'px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
        }
        title="Install App on Device"
        aria-label="Install App on Device"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        {!compact && <span>Install App</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'p-2 rounded-lg bg-slate-900 border border-slate-700 text-indigo-400 hover:text-white transition-colors'
              : 'px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
          }
          title="Install on iPhone / iPad"
          aria-label="Install on iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          {!compact && <span>Install App</span>}
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Install IITDh Events on iOS</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong className="inline-flex items-center gap-1 text-white"><Share className="w-3.5 h-3.5 text-indigo-400" /> Share</strong> button in Safari.
                <br />
                2. Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
