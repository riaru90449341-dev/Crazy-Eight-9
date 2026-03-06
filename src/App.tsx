import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { Card as CardType, Suit, GameState, Rank } from './types';
import { createDeck, shuffleDeck, isValidMove, getSuitSymbol, getSuitColor } from './gameLogic';
import Card from './components/Card';
import SuitPicker from './components/SuitPicker';

const INITIAL_CARDS = 8;

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentSuit: null,
    status: 'START_SCREEN',
    winner: null,
    lastAction: '欢迎来到疯狂 8 点！',
  });

  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [pendingEightCard, setPendingEightCard] = useState<CardType | null>(null);

  const initGame = useCallback(() => {
    const fullDeck = shuffleDeck(createDeck());
    const playerHand = fullDeck.splice(0, INITIAL_CARDS);
    const aiHand = fullDeck.splice(0, INITIAL_CARDS);
    
    // Find a non-8 card for the start of discard pile
    let firstCardIndex = 0;
    while (fullDeck[firstCardIndex].rank === Rank.EIGHT) {
      firstCardIndex++;
    }
    const discardPile = [fullDeck.splice(firstCardIndex, 1)[0]];
    const deck = fullDeck;

    setGameState({
      deck,
      discardPile,
      playerHand,
      aiHand,
      currentSuit: null,
      status: 'PLAYER_TURN',
      winner: null,
      lastAction: '游戏开始！轮到你了。',
    });
  }, []);

  // Removed the auto-init useEffect to allow start screen to show
  // useEffect(() => {
  //   initGame();
  // }, [initGame]);

  const checkWinner = (state: GameState) => {
    if (state.playerHand.length === 0) {
      return { ...state, status: 'GAME_OVER', winner: 'PLAYER', lastAction: '你赢了！' };
    }
    if (state.aiHand.length === 0) {
      return { ...state, status: 'GAME_OVER', winner: 'AI', lastAction: 'AI 赢了！' };
    }
    return state;
  };

  const drawCard = (isPlayer: boolean) => {
    if (gameState.deck.length === 0) {
      // If deck is empty, shuffle discard pile (except top card) back into deck
      if (gameState.discardPile.length <= 1) {
        setGameState(prev => ({
          ...prev,
          lastAction: '牌堆和弃牌堆都没有牌了！',
          status: isPlayer ? 'AI_TURN' : 'PLAYER_TURN'
        }));
        return;
      }

      const topCard = gameState.discardPile[gameState.discardPile.length - 1];
      const newDeck = shuffleDeck(gameState.discardPile.slice(0, -1));
      
      setGameState(prev => ({
        ...prev,
        deck: newDeck,
        discardPile: [topCard],
        lastAction: '正在将弃牌堆重新洗入牌堆...'
      }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;

    if (isPlayer) {
      setGameState(prev => {
        const newState = {
          ...prev,
          deck: newDeck,
          playerHand: [...prev.playerHand, drawnCard],
          lastAction: '你摸了一张牌。',
          status: 'AI_TURN'
        };
        return checkWinner(newState as GameState);
      });
    } else {
      setGameState(prev => {
        const newState = {
          ...prev,
          deck: newDeck,
          aiHand: [...prev.aiHand, drawnCard],
          lastAction: 'AI 摸了一张牌。',
          status: 'PLAYER_TURN'
        };
        return checkWinner(newState as GameState);
      });
    }
  };

  const playCard = (card: CardType, isPlayer: boolean, chosenSuit?: Suit) => {
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    
    if (isPlayer && !isValidMove(card, topCard, gameState.currentSuit)) return;

    const suitNames: Record<Suit, string> = {
      [Suit.HEARTS]: '红心',
      [Suit.DIAMONDS]: '方块',
      [Suit.CLUBS]: '梅花',
      [Suit.SPADES]: '黑桃',
    };

    setGameState(prev => {
      const handKey = isPlayer ? 'playerHand' : 'aiHand';
      const newHand = prev[handKey].filter(c => c.id !== card.id);
      const newDiscard = [...prev.discardPile, card];
      
      const newState: GameState = {
        ...prev,
        [handKey]: newHand,
        discardPile: newDiscard,
        currentSuit: chosenSuit || (card.rank === Rank.EIGHT ? null : null), // Reset if not 8
        status: isPlayer ? 'AI_TURN' : 'PLAYER_TURN',
        lastAction: `${isPlayer ? '你' : 'AI'} 打出了 ${suitNames[card.suit]} ${card.rank}。`
      };

      if (card.rank === Rank.EIGHT && chosenSuit) {
        newState.currentSuit = chosenSuit;
        newState.lastAction += ` 指定花色：${suitNames[chosenSuit]}。`;
      } else if (card.rank !== Rank.EIGHT) {
        newState.currentSuit = null;
      }

      return checkWinner(newState);
    });
  };

  const handlePlayerPlay = (card: CardType) => {
    if (gameState.status !== 'PLAYER_TURN') return;

    if (card.rank === Rank.EIGHT) {
      setPendingEightCard(card);
      setShowSuitPicker(true);
    } else {
      playCard(card, true);
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    if (pendingEightCard) {
      playCard(pendingEightCard, true, suit);
      setPendingEightCard(null);
      setShowSuitPicker(false);
    }
  };

  // AI Logic
  useEffect(() => {
    if (gameState.status === 'AI_TURN' && !gameState.winner) {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => isValidMove(c, topCard, gameState.currentSuit));

        if (playableCards.length > 0) {
          // AI strategy: play non-8s first, prefer matching rank if multiple suits available
          const nonEights = playableCards.filter(c => c.rank !== Rank.EIGHT);
          const cardToPlay = nonEights.length > 0 ? nonEights[0] : playableCards[0];
          
          if (cardToPlay.rank === Rank.EIGHT) {
            // AI picks most common suit in its hand
            const suitCounts: Record<string, number> = {};
            gameState.aiHand.forEach(c => {
              suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
            });
            const bestSuit = (Object.keys(suitCounts).sort((a, b) => suitCounts[b] - suitCounts[a])[0] as Suit) || Suit.HEARTS;
            playCard(cardToPlay, false, bestSuit);
          } else {
            playCard(cardToPlay, false);
          }
        } else {
          drawCard(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.aiHand, gameState.discardPile, gameState.currentSuit, gameState.winner]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  if (gameState.status === 'START_SCREEN') {
    return (
      <div className="min-h-screen cartoon-bg flex flex-col items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
        {/* Playful floating elements */}
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] text-6xl opacity-40 select-none"
        >
          🃏
        </motion.div>
        <motion.div 
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] text-6xl opacity-40 select-none"
        >
          ✨
        </motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[15%] text-5xl opacity-30 select-none"
        >
          🎈
        </motion.div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full text-center z-10"
        >
          <div className="mb-12 relative">
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <h1 className="text-7xl sm:text-9xl font-serif font-black tracking-tight text-amber-900 drop-shadow-[0_8px_0_rgba(0,0,0,0.1)]">
                小米酒疯狂 <span className="text-rose-500">8</span> 点
              </h1>
            </motion.div>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full border-4 border-amber-900 shadow-lg rotate-[-5deg]">
              <p className="text-amber-900 font-black uppercase tracking-widest text-sm">
                超好玩的童话世界
              </p>
            </div>
          </div>

          <div className="bg-white border-8 border-amber-900 rounded-[3rem] p-8 sm:p-12 mb-12 shadow-[12px_12px_0_rgba(120,53,15,1)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div className="space-y-3 group">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mx-auto border-4 border-rose-200 group-hover:rotate-12 transition-transform">
                  <RotateCcw size={32} />
                </div>
                <h3 className="font-black text-amber-900 text-xl">匹配出牌</h3>
                <p className="text-sm text-amber-800/70 font-bold">颜色或数字一样就能出！</p>
              </div>
              <div className="space-y-3 group">
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-500 mx-auto border-4 border-sky-200 group-hover:-rotate-12 transition-transform">
                  <AlertCircle size={32} />
                </div>
                <h3 className="font-black text-amber-900 text-xl">神奇 8 号</h3>
                <p className="text-sm text-amber-800/70 font-bold">万能 8 号可以变出任何花色！</p>
              </div>
              <div className="space-y-3 group">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto border-4 border-emerald-200 group-hover:scale-110 transition-transform">
                  <Trophy size={32} />
                </div>
                <h3 className="font-black text-amber-900 text-xl">清空手牌</h3>
                <p className="text-sm text-amber-800/70 font-bold">谁先出完谁就是大赢家！</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 2 }}
            whileTap={{ scale: 0.9 }}
            onClick={initGame}
            className="group relative px-16 py-6 bg-amber-500 hover:bg-amber-400 text-white rounded-[2rem] border-8 border-amber-900 font-black text-3xl tracking-widest uppercase transition-all shadow-[8px_8px_0_rgba(120,53,15,1)] flex items-center gap-4 mx-auto"
          >
            进入童话世界
            <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
          </motion.button>

          <p className="mt-12 text-amber-900/40 text-xs uppercase tracking-widest font-black">
            ✨ 小米酒的魔法工坊出品 ✨
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen game-felt flex flex-col items-center justify-between p-4 sm:p-8 font-sans relative">
      {/* Header Info */}
      <div className="w-full max-w-5xl flex justify-between items-start z-10">
        <div className="flex flex-col">
          <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-white drop-shadow-lg">
            小米酒疯狂 <span className="text-rose-400">8</span> 点
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-2 ${gameState.status === 'PLAYER_TURN' ? 'bg-white text-blue-600 border-white shadow-lg' : 'bg-blue-800/50 border-blue-400/30 text-blue-200'}`}>
              {gameState.status === 'PLAYER_TURN' ? '🌟 你的回合' : '🤖 AI 思考中...'}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setGameState(prev => ({ ...prev, status: 'START_SCREEN' }))}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl border-2 border-white/30 transition-all hover:scale-110 active:scale-95 shadow-lg"
            title="返回主菜单"
          >
            <Info size={24} className="text-white" />
          </button>
          <button 
            onClick={initGame}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl border-2 border-white/30 transition-all hover:scale-110 active:scale-95 shadow-lg"
            title="重新开始"
          >
            <RotateCcw size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* AI Hand */}
      <div className="w-full flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-white/70 text-xs font-black uppercase tracking-widest bg-black/10 px-4 py-1 rounded-full backdrop-blur-sm">
          <span>AI 对手</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-white">{gameState.aiHand.length} 张牌</span>
        </div>
        <div className="flex -space-x-8 sm:-space-x-12 overflow-hidden py-4">
          {gameState.aiHand.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card card={card} isFaceDown />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Center Board */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-24 my-8">
        {/* Draw Pile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div 
              onClick={() => gameState.status === 'PLAYER_TURN' && drawCard(true)}
              className={`relative cursor-pointer ${gameState.status !== 'PLAYER_TURN' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {gameState.deck.length > 0 ? (
                <div className="relative">
                  {/* Visual stack effect */}
                  <div className="absolute top-1 left-1 w-16 h-24 sm:w-24 sm:h-36 bg-indigo-900 rounded-lg border-2 border-white/20"></div>
                  <div className="absolute top-0.5 left-0.5 w-16 h-24 sm:w-24 sm:h-36 bg-indigo-800 rounded-lg border-2 border-white/40"></div>
                  <Card card={gameState.deck[0]} isFaceDown />
                </div>
              ) : (
                <div className="w-16 h-24 sm:w-24 sm:h-36 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                  <AlertCircle className="text-white/10" size={32} />
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">摸牌堆 ({gameState.deck.length})</span>
        </div>

        {/* Discard Pile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={topDiscard.id}
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.2, opacity: 0 }}
              >
                <Card card={topDiscard} disabled />
              </motion.div>
            </AnimatePresence>
            
            {gameState.currentSuit && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-6 -right-6 w-14 h-14 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-amber-400 z-20 rotate-12"
              >
                <span className={`text-3xl ${getSuitColor(gameState.currentSuit)}`}>
                  {getSuitSymbol(gameState.currentSuit)}
                </span>
              </motion.div>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">弃牌堆</span>
        </div>

        {/* Status Message */}
        <div className="hidden lg:flex flex-col max-w-xs">
          <div className="flex items-center gap-2 text-amber-300 mb-1">
            <Info size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">游戏日志</span>
          </div>
          <p className="text-sm text-white/80 font-bold italic leading-relaxed">
            {gameState.lastAction}
          </p>
        </div>
      </div>

      {/* Player Hand */}
      <div className="w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 w-full px-4">
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
          <div className="flex items-center gap-2 text-white/80 text-xs font-black uppercase tracking-widest">
            <span>你的手牌</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-white">{gameState.playerHand.length} 张牌</span>
          </div>
          <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
        </div>

        <div className="w-full overflow-x-auto hand-scroll pb-6 px-4">
          <div className="flex justify-center min-w-max gap-2 sm:gap-4 py-4">
            {gameState.playerHand.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handlePlayerPlay(card)}
                isPlayable={gameState.status === 'PLAYER_TURN' && isValidMove(card, topDiscard, gameState.currentSuit)}
                disabled={gameState.status !== 'PLAYER_TURN'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Suit Picker Modal */}
      {showSuitPicker && (
        <SuitPicker onSelect={handleSuitSelect} />
      )}

      {/* Game Over Modal */}
      {gameState.status === 'GAME_OVER' && (
        <div className="fixed inset-0 bg-amber-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-[12px_12px_0_rgba(120,53,15,1)] border-8 border-amber-900 text-center relative overflow-hidden"
          >
            <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6 border-4 ${gameState.winner === 'PLAYER' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
              {gameState.winner === 'PLAYER' ? <Trophy size={48} /> : <AlertCircle size={48} />}
            </div>

            <h2 className="text-5xl font-serif font-black text-amber-900 mb-4">
              {gameState.winner === 'PLAYER' ? '大获全胜！' : '惜败！'}
            </h2>
            <p className="text-amber-800/70 mb-10 font-bold text-lg">
              {gameState.winner === 'PLAYER' 
                ? '你真是太厉害了！童话世界为你欢呼！' 
                : '别灰心，AI 只是运气好一点点。再来一局？'}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={initGame}
                className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-[6px_6px_0_rgba(120,53,15,1)] border-4 border-amber-900 active:translate-x-1 active:translate-y-1 active:shadow-none"
              >
                <RotateCcw size={24} />
                再玩一局
              </button>
              <button
                onClick={() => setGameState(prev => ({ ...prev, status: 'START_SCREEN' }))}
                className="w-full py-5 bg-white border-4 border-amber-100 text-amber-900/40 rounded-2xl font-black text-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                返回主菜单
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Log Overlay */}
      <div className="lg:hidden fixed bottom-24 left-4 right-4 bg-amber-500/90 backdrop-blur border-4 border-amber-900 rounded-2xl p-3 flex items-center gap-3 z-20 shadow-lg">
        <div className="bg-white p-1.5 rounded-lg">
          <AlertCircle size={14} className="text-amber-600" />
        </div>
        <p className="text-xs text-amber-950 font-black italic line-clamp-1">
          {gameState.lastAction}
        </p>
      </div>
    </div>
  );
}
