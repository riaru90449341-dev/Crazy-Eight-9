import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType, Suit } from '../types';
import { getSuitSymbol, getSuitColor } from '../gameLogic';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isFaceDown?: boolean;
  disabled?: boolean;
  isPlayable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isFaceDown, disabled, isPlayable }) => {
  if (isFaceDown) {
    return (
      <motion.div
        layoutId={card.id}
        className="w-16 h-24 sm:w-24 sm:h-36 bg-blue-600 rounded-2xl border-4 border-blue-400 shadow-[4px_4px_0_rgba(30,64,175,1)] flex flex-col items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="w-10 h-16 sm:w-16 sm:h-24 border-2 border-white/30 rounded-xl flex items-center justify-center">
          <div className="text-white/40 text-2xl sm:text-4xl font-black">8</div>
        </div>
        <div className="absolute top-1 left-1 text-[8px] text-white/20">✨</div>
        <div className="absolute bottom-1 right-1 text-[8px] text-white/20">✨</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId={card.id}
      whileHover={!disabled && isPlayable ? { y: -10, scale: 1.05, rotate: 2 } : {}}
      onClick={!disabled && isPlayable ? onClick : undefined}
      className={`
        w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-2xl border-4 shadow-[4px_4px_0_rgba(120,53,15,1)] flex flex-col p-1 sm:p-2 relative cursor-pointer select-none transition-all
        ${isPlayable ? 'border-amber-400 ring-4 ring-amber-200 shadow-amber-900/20' : 'border-amber-900'}
        ${disabled ? 'opacity-90 grayscale-[0.2]' : ''}
      `}
    >
      <div className={`text-sm sm:text-xl font-black leading-none ${getSuitColor(card.suit)}`}>
        {card.rank}
      </div>
      <div className={`text-xs sm:text-sm leading-none ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-6xl ${getSuitColor(card.suit)} opacity-10`}>
        {getSuitSymbol(card.suit)}
      </div>

      <div className={`mt-auto self-end text-sm sm:text-xl font-black leading-none rotate-180 ${getSuitColor(card.suit)}`}>
        <div className="flex flex-col items-center">
          <span>{card.rank}</span>
          <span className="text-xs sm:text-sm">{getSuitSymbol(card.suit)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Card;
