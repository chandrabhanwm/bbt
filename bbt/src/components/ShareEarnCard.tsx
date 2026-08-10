import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Share2, Check } from 'lucide-react';
import { playClick } from '../utils/audio';

interface ShareEarnCardProps {
  referrerUid: string;
  bonusCoins: number;
}

const GOLD = 'var(--color-premium-gold-400)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';
const WHATSAPP_GREEN = '#25D366';

/** The real WhatsApp glyph — a generic chat-bubble icon reads as "share
 *  somewhere," not specifically WhatsApp, and brand recognition is the
 *  entire point of a dedicated button here. Small, self-contained inline
 *  SVG rather than pulling in a whole icon-brand package for one glyph. */
const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 3.67C14.25 3.67 16.32 4.53 17.89 6.09C19.45 7.66 20.31 9.73 20.3 11.92C20.3 16.46 16.58 20.17 12.03 20.17C10.56 20.17 9.12 19.78 7.85 19.05L7.55 18.87L4.43 19.7L5.27 16.66L5.08 16.35C4.28 15.03 3.86 13.5 3.86 11.91C3.87 7.37 7.5 3.67 12.04 3.67ZM8.53 6.85C8.36 6.85 8.09 6.91 7.86 7.16C7.64 7.41 7.5 7.92 7.5 8.5C7.5 9.08 7.88 9.61 8 9.77C8.14 9.9 9.76 12.5 12.31 13.61C14.42 14.53 14.85 14.36 15.31 14.32C15.77 14.28 16.78 13.72 17 13.14C17.21 12.55 17.21 12.05 17.14 11.94C17.08 11.84 16.91 11.77 16.66 11.65C16.41 11.52 15.17 10.91 14.94 10.83C14.71 10.74 14.55 10.7 14.38 10.95C14.22 11.2 13.75 11.77 13.6 11.94C13.46 12.1 13.31 12.13 13.06 12C12.81 11.87 12 11.6 11.03 10.73C10.28 10.06 9.77 9.24 9.63 8.99C9.49 8.74 9.61 8.6 9.74 8.48C9.85 8.36 10 8.18 10.13 8.03C10.25 7.89 10.3 7.79 10.38 7.62C10.46 7.46 10.42 7.31 10.36 7.19C10.3 7.07 9.8 5.83 9.58 5.31C9.37 4.81 9.16 4.87 9 4.87C8.85 4.86 8.68 4.85 8.53 6.85Z" />
  </svg>
);

/**
 * Replaces the old Daily Goal card on Home. Each player's link is just
 * their own uid as a ?ref= query param — read on the new signup's
 * first load (see utils/referral.ts) and turned into a referral record
 * the moment that signup is confirmed genuinely new.
 *
 * Two distinct share paths, side by side: a dedicated WhatsApp button
 * (opens wa.me directly, guaranteed to land in WhatsApp specifically —
 * this is the primary, most-used sharing channel for this audience) and
 * a general Share button (navigator.share where the platform supports
 * it, falling back to copy-to-clipboard everywhere else) for every other
 * app someone might want to share through instead.
 */
export const ShareEarnCard: React.FC<ShareEarnCardProps> = ({ referrerUid, bonusCoins }) => {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}?ref=${referrerUid}`;
  // Coins are an in-game currency, not real money — the ₹ symbol implies
  // real rupees and overstates what's actually being offered.
  const shareMessage = `Join me on CoralBay Business Tycoon! We both get ${bonusCoins.toLocaleString('en-IN')} coins when you sign up: ${referralLink}`;

  const handleWhatsAppShare = () => {
    playClick();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleGenericShare = async () => {
    playClick();
    if (navigator.share) {
      try {
        await navigator.share({ text: shareMessage });
      } catch {
        // User cancelled the share sheet — not an error, nothing to do.
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard access denied — rare, silently do nothing rather
        // than show a confusing error for something this minor.
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl px-3.5 py-3 flex items-center gap-2.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #C2298A 0%, #8B2FC9 55%, #5A2FB8 100%)',
        boxShadow: '0 8px 20px rgba(150,40,180,0.35), inset 0 1.5px 0 rgba(255,255,255,0.22)',
      }}
    >
      <motion.div
        className="absolute -right-6 -bottom-8 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,180,230,0.4), transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.95, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="text-[28px] leading-none flex-shrink-0 relative"
        animate={{ rotate: [-8, 8, -8], y: [0, -2, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,150,220,0.7))' }}
      >
        🎁
      </motion.div>

      <div className="flex-1 min-w-0 relative">
        <div className="text-[12px] font-black text-white truncate">
          Share &amp; Earn
        </div>
        <div className="text-[9.5px] font-bold leading-tight text-white/85">
          Both get {bonusCoins.toLocaleString('en-IN')} coins
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 relative">
        <motion.button
          whileTap={{ y: 1 }}
          onClick={handleWhatsAppShare}
          aria-label="Share via WhatsApp"
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: WHATSAPP_GREEN,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1.5px 0 rgba(0,0,0,0.25), 0 2px 5px rgba(0,0,0,0.3)',
          }}
        >
          <WhatsAppIcon />
        </motion.button>

        <motion.button
          whileTap={{ y: 1 }}
          onClick={handleGenericShare}
          className="px-2.5 py-1.5 rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1 flex-shrink-0"
          style={{
            backgroundColor: '#FFD700',
            color: '#3D1A4A',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1.5px 0 rgba(0,0,0,0.15), 0 2px 5px rgba(0,0,0,0.3)',
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Share2 size={11} /> Share</>}
        </motion.button>
      </div>
    </motion.div>
  );
};
