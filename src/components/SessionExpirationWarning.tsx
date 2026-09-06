import React, { useEffect } from 'react';
import { Clock, LogOut, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * SessionExpirationWarning Component
 *
 * Displays a warning modal when session is about to expire.
 * Users can choose to extend their session or logout.
 */
export const SessionExpirationWarning: React.FC = () => {
  const { sessionExpiring, sessionExpiresIn, logout, extendSession } = useAuth();

  if (!sessionExpiring || sessionExpiresIn === null) {
    return null;
  }

  const handleExtendSession = () => {
    extendSession();
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-yellow-100 p-3">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Session Expiring Soon</h2>
        </div>

        <p className="mb-2 text-sm text-gray-600">
          Your session will expire in <span className="font-semibold text-yellow-600">{formatTimeRemaining(sessionExpiresIn)}</span>.
        </p>
        <p className="mb-6 text-sm text-gray-600">
          Would you like to extend your session or logout?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            Extend Session
          </button>
          <button
            onClick={logout}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-900 transition hover:bg-gray-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          ⏱️ Remaining time updates in real-time. Activity timeout: 30 minutes of inactivity.
        </p>
      </div>
    </div>
  );
};

export default SessionExpirationWarning;
