import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AccessGateScreenProps {
  onUnlocked: () => void;
}

// Simple, shared code for this testing phase — not meant to be
// high-security, just a low-friction barrier against casual discovery
// (search engines, a forwarded link, someone guessing the URL). Real
// account security still comes from Google Sign-In, which sits behind
// this gate, not from this code itself.
const ACCESS_CODE = 'CORALBAY2026';

export const AccessGateScreen: React.FC<AccessGateScreenProps> = ({ onUnlocked }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().toUpperCase() === ACCESS_CODE) {
      localStorage.setItem('access_gate_unlocked', 'true');
      onUnlocked();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#3d1f16' }}
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xs flex flex-col items-center gap-4"
      >
        <div className="text-4xl mb-1">🔒</div>
        <h1 className="text-white font-bold text-[17px] text-center">Private Testing</h1>
        <p className="text-[12px] text-center" style={{ color: '#e0b8a8' }}>
          Enter the access code you were given to continue.
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Access code"
          autoCapitalize="characters"
          className="w-full px-4 py-3 rounded-xl text-center text-[14px] font-bold tracking-wide outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: `1.5px solid ${error ? '#e05a5a' : 'rgba(255,255,255,0.2)'}`,
            color: '#ffffff',
          }}
        />
        {error && (
          <span className="text-[11px] font-medium" style={{ color: '#e05a5a' }}>
            That code isn't right — check with whoever invited you.
          </span>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-xl font-bold text-[14px] cursor-pointer"
          style={{ backgroundColor: '#d4a72c', color: '#3d1f16' }}
        >
          Continue
        </button>
      </motion.form>
    </div>
  );
};
