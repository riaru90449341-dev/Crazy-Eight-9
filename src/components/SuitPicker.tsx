import React from 'react';
import { motion } from 'motion/react';
import { Suit } from '../types';
import { getSuitSymbol, getSuitColor } from '../gameLogic';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

const SuitPicker: React.FC<SuitPickerProps> = ({ onSelect }) => {
  const suits = Object.values(Suit);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-[12px_12px_0_rgba(120,53,15,1)] border-8 border-amber-900 text-center"
      >
        <h2 className="text-3xl font-black mb-2 text-amber-900">神奇 8 号！</h2>
        <p className="text-amber-800/60 mb-8 italic font-bold">请施展魔法选择花色</p>
        
        <div className="grid grid-cols-2 gap-6">
          {suits.map((suit) => {
            const suitNames: Record<Suit, string> = {
              [Suit.HEARTS]: '红心',
              [Suit.DIAMONDS]: '方块',
              [Suit.CLUBS]: '梅花',
              [Suit.SPADES]: '黑桃',
            };
            return (
              <button
                key={suit}
                onClick={() => onSelect(suit)}
                className={`
                  flex flex-col items-center justify-center p-6 rounded-3xl border-4 border-amber-100 
                  hover:border-amber-500 hover:bg-amber-50 transition-all group active:scale-90
                `}
              >
                <span className={`text-6xl mb-2 ${getSuitColor(suit)} group-hover:scale-125 transition-transform`}>
                  {getSuitSymbol(suit)}
                </span>
                <span className="text-sm font-black uppercase tracking-widest text-amber-900/40 group-hover:text-amber-600">
                  {suitNames[suit]}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SuitPicker;
