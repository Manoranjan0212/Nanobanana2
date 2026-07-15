import React from 'react';

interface BananaSvgProps {
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  skinId: string;
  isFever: boolean;
}

export const BananaSvg: React.FC<BananaSvgProps> = ({
  colorFrom,
  colorTo,
  glowColor,
  skinId,
  isFever,
}) => {
  const gradientId = `banana-grad-${skinId}`;
  
  return (
    <div className="relative w-72 h-72 flex items-center justify-center select-none no-select">
      {/* Dynamic Glow Filter in the background */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-60 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: isFever ? 'scale(1.3)' : 'scale(1)',
        }}
      />

      <svg
        viewBox="0 0 300 300"
        className={`w-full h-full relative z-10 filter drop-shadow-2xl transition-transform duration-100 ${
          isFever ? 'animate-bounce' : ''
        }`}
        style={{
          filter: `drop-shadow(0 10px 20px ${glowColor})`,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="100%" stopColor={colorTo} />
          </linearGradient>

          {/* Special Gradients/Patterns for skins */}
          {skinId === 'hacker_matrix' && (
            <pattern id="matrix-pattern" width="20" height="40" patternUnits="userSpaceOnUse">
              <text x="5" y="15" fill="#22C55E" fontSize="8" fontFamily="monospace" opacity="0.4">1</text>
              <text x="12" y="30" fill="#22C55E" fontSize="6" fontFamily="monospace" opacity="0.3">0</text>
              <text x="2" y="38" fill="#22C55E" fontSize="7" fontFamily="monospace" opacity="0.5">0</text>
            </pattern>
          )}

          {skinId === 'cyberpunk_neon' && (
            <pattern id="cyber-grid" width="15" height="15" patternUnits="userSpaceOnUse">
              <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#FF007F" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          )}

          <filter id="neon-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* --- Background / Behind Banana effects --- */}
        {skinId === 'stellar_supernova' && (
          <g className="animate-spin" style={{ transformOrigin: '150px 150px', animationDuration: '25s' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="150"
                y1="150"
                x2="150"
                y2="10"
                stroke="url(#stellar_supernova)"
                strokeWidth="2"
                opacity="0.3"
                transform={`rotate(${angle} 150 150)`}
              />
            ))}
          </g>
        )}

        {/* --- MAIN BANANA SHAPE --- */}
        {/* Curved stem back */}
        <path
          d="M 75,190 C 65,200 55,205 45,210 C 40,212 36,208 38,203 C 44,195 56,182 66,174 Z"
          fill="#451a03" // Deep brown
          opacity="0.85"
        />

        {/* Main Fruit Body */}
        <path
          id="main-banana-body"
          d="M 50,185 
             C 32,135 60,50 175,45 
             C 192,44 212,50 222,58 
             C 230,65 235,76 230,90 
             C 210,145 155,205 50,185 Z"
          fill={`url(#${gradientId})`}
          stroke={skinId === 'gamer_rgb' ? '#00ffff' : 'none'}
          strokeWidth={skinId === 'gamer_rgb' ? '2.5' : '0'}
          className="transition-all duration-300"
        />

        {/* Inner shadow / crease for organic volume */}
        <path
          d="M 52,183 C 78,135 125,75 220,60"
          fill="none"
          stroke="#000000"
          strokeWidth="3.5"
          opacity="0.15"
        />

        {/* Outer highlight curve */}
        <path
          d="M 68,165 C 50,120 72,62 165,56"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          opacity="0.25"
        />

        {/* Tip (black/brown bottom) */}
        <path
          d="M 222,58 C 226,53 232,48 238,45 C 242,43 245,46 242,50 C 235,58 230,65 222,58 Z"
          fill="#1c1917" // stone-900
        />

        {/* --- SKIN-SPECIFIC GRAPHICS OVERLAYS --- */}
        
        {/* Zombie Peel: Stitches and bite marks */}
        {skinId === 'zombie_peel' && (
          <g stroke="#1e293b" strokeWidth="2" opacity="0.75" fill="none">
            {/* Stitch 1 */}
            <line x1="100" y1="120" x2="120" y2="135" />
            <line x1="105" y1="132" x2="115" y2="122" />
            
            {/* Stitch 2 */}
            <line x1="140" y1="85" x2="155" y2="105" />
            <line x1="143" y1="102" x2="152" y2="88" />
            
            {/* Spooky zombie spiral eye */}
            <path d="M 90,85 A 8,8 0 1,1 91,85" strokeWidth="1.5" />
            <path d="M 120,75 L 130,85 M 130,75 L 120,85" strokeWidth="1.5" /> {/* X Eye */}
          </g>
        )}

        {/* Hacker Matrix: Glowing binary characters */}
        {skinId === 'hacker_matrix' && (
          <path
            d="M 50,185 
               C 32,135 60,50 175,45 
               C 192,44 212,50 222,58 
               C 230,65 235,76 230,90 
               C 210,145 155,205 50,185 Z"
            fill="url(#matrix-pattern)"
          />
        )}

        {/* Cyberpunk Neon: Holographic grid */}
        {skinId === 'cyberpunk_neon' && (
          <g>
            <path
              d="M 50,185 
                 C 32,135 60,50 175,45 
                 C 192,44 212,50 222,58 
                 C 230,65 235,76 230,90 
                 C 210,145 155,205 50,185 Z"
              fill="url(#cyber-grid)"
            />
            {/* Glowing neon lines across the body */}
            <path
              d="M 60,140 Q 110,120 180,100"
              fill="none"
              stroke="#00FFFF"
              strokeWidth="2"
              filter="url(#neon-glow)"
              opacity="0.8"
            />
            <path
              d="M 100,165 Q 150,145 210,110"
              fill="none"
              stroke="#FF007F"
              strokeWidth="2"
              filter="url(#neon-glow)"
              opacity="0.8"
            />
          </g>
        )}

        {/* Imperial Golden: A majestic glowing crown */}
        {skinId === 'imperial_golden' && (
          <g transform="translate(145, 5) scale(0.28)">
            {/* Shadow of crown */}
            <path
              d="M 10,90 L 30,30 L 60,65 L 100,20 L 140,65 L 170,30 L 190,90 Z"
              fill="#78350f"
              opacity="0.2"
              transform="translate(5, 5)"
            />
            {/* Gold Crown base */}
            <path
              d="M 10,90 L 30,30 L 60,65 L 100,20 L 140,65 L 170,30 L 190,90 Z"
              fill="#FBBF24"
              stroke="#B45309"
              strokeWidth="4"
            />
            {/* Jewels */}
            <circle cx="30" cy="30" r="8" fill="#EF4444" /> {/* Red */}
            <circle cx="100" cy="20" r="10" fill="#3B82F6" /> {/* Blue */}
            <circle cx="170" cy="30" r="8" fill="#10B981" /> {/* Green */}
            <rect x="25" y="75" width="150" height="12" rx="4" fill="#D97706" />
          </g>
        )}

        {/* Gamer RGB: Cyber Gaming Headset */}
        {skinId === 'gamer_rgb' && (
          <g transform="translate(50, 45)">
            {/* Glowing Headset Arch */}
            <path
              d="M 20,60 C 20,0 120,0 120,60"
              fill="none"
              stroke="#FF007F"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#neon-glow)"
              className="animate-pulse"
            />
            {/* Left Ear Cup */}
            <rect x="10" y="55" width="16" height="26" rx="6" fill="#1e1b4b" stroke="#00ffff" strokeWidth="2" />
            <circle cx="18" cy="68" r="4" fill="#00ffff" />
            {/* Right Ear Cup */}
            <rect x="114" y="52" width="16" height="26" rx="6" fill="#1e1b4b" stroke="#00ffff" strokeWidth="2" />
            <circle cx="122" cy="65" r="4" fill="#00ffff" />
            {/* Mic boom */}
            <path d="M 26,75 Q 40,90 60,82" fill="none" stroke="#00ffff" strokeWidth="2" />
            <circle cx="60" cy="82" r="3" fill="#ff007f" />
          </g>
        )}

        {/* Diamond Ice: Holographic crystalline shards */}
        {skinId === 'diamond_ice' && (
          <g fill="#ffffff" opacity="0.22" stroke="#ffffff" strokeWidth="0.5">
            {/* Crystal facets */}
            <polygon points="65,150 90,120 120,155" />
            <polygon points="90,120 145,100 120,155" />
            <polygon points="145,100 185,115 150,150" />
            <polygon points="145,100 170,70 185,115" />
            <polygon points="120,155 150,150 115,190" />
            <polygon points="150,150 185,115 195,160" />
          </g>
        )}

        {/* Cosmic Void: Floating Nebula Stars inside body */}
        {skinId === 'cosmic_void' && (
          <g fill="#ffffff" opacity="0.6">
            <circle cx="95" cy="120" r="1.5" className="animate-pulse" />
            <circle cx="125" cy="95" r="2.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
            <circle cx="150" cy="140" r="1" />
            <circle cx="165" cy="80" r="2" className="animate-pulse" style={{ animationDelay: '1s' }} />
            <polygon points="110,145 112,140 117,145 112,147" fill="#818CF8" />
            <polygon points="140,110 141,107 144,110 141,111" fill="#A78BFA" />
          </g>
        )}

        {/* Magma Ember: Cracked boiling lava veins */}
        {skinId === 'magma_ember' && (
          <g stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" filter="url(#neon-glow)">
            <path d="M 68,160 Q 95,140 120,155" fill="none" />
            <path d="M 120,155 T 180,120" fill="none" stroke="#F97316" strokeWidth="2" />
            <path d="M 90,110 Q 130,105 160,85" fill="none" />
            <path d="M 130,105 Q 145,130 150,150" fill="none" stroke="#EF4444" strokeWidth="1.5" />
            {/* Sparkles */}
            <circle cx="85" cy="135" r="1.5" fill="#FBBF24" />
            <circle cx="140" cy="120" r="2" fill="#FBBF24" />
            <circle cx="165" cy="100" r="1" fill="#F97316" />
          </g>
        )}

        {/* Stellar Supernova: Glowing central core and orbiting stars */}
        {skinId === 'stellar_supernova' && (
          <g>
            {/* Orbiting star 1 */}
            <g className="animate-pulse">
              <polygon points="110,80 112,74 118,72 112,70 110,64 108,70 102,72 108,74" fill="#FFFFFF" />
              <polygon points="180,130 181,125 186,124 181,123 180,118 179,123 174,124 179,125" fill="#FFFFFF" />
              <circle cx="140" cy="110" r="6" fill="#ffffff" filter="url(#neon-glow)" />
            </g>
          </g>
        )}

        {/* Default highlights to make it premium */}
        <ellipse cx="140" cy="140" rx="3" ry="5" fill="#ffffff" opacity="0.1" transform="rotate(-30 140 140)" />
      </svg>

      {/* Rarity Aura overlay */}
      <div 
        className="absolute inset-0 border-2 rounded-full pointer-events-none scale-105 opacity-20 transition-all duration-500 animate-pulse"
        style={{
          borderColor: colorTo,
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      />
    </div>
  );
};
