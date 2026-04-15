import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Maximize } from 'lucide-react';

interface GameData {
  title: string;
  file_name: string;
  thumb?: string;
  frame?: string;
}

export function GamesHub() {
  const [games, setGames] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGame, setActiveGame] = useState<GameData | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const popularGames = [
    "Hollow Knight", "ULTRAKILL", "Celeste", "Katana ZERO", "Dead Cells",
    "Hyper Light Drifter", "DOOM", "Doom 64", "Balatro", "Castlevania",
    "Super Meat Boy", "Cuphead", "Among Us", "Cookie Clicker",
    "Buckshot Roulette", "A Dark Room", "Undertale", "Deltarune",
    "Bloons TD 5", "Age of War", "Duck Life", "Happy Wheels",
    "Cluster Rush", "Drive Mad",
  ];

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/gmes.json"
        );
        if (response.ok) {
          const data: GameData[] = await response.json();
          const sorted = [...data].sort((a, b) => {
            const aP = popularGames.includes(a.title);
            const bP = popularGames.includes(b.title);
            if (aP && !bP) return -1;
            if (!aP && bP) return 1;
            if (aP && bP) return popularGames.indexOf(a.title) - popularGames.indexOf(b.title);
            return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
          });
          setGames(sorted);
          setFilteredGames(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch games:", error);
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    if (!q) {
      setFilteredGames(games);
    } else {
      setFilteredGames(games.filter(g => g.title.toLowerCase().includes(q)));
    }
  }, [searchQuery, games]);

  const openGame = useCallback((game: GameData) => {
    setActiveGame(game);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeGame = useCallback(() => {
    setActiveGame(null);
    document.body.style.overflow = '';
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeGame) {
        closeGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGame, closeGame]);

  const getGameSrc = (game: GameData) => {
    if (game.frame === "true") {
      return `https://raw.githack.com/Hydra-Network/hydra-assets/main/gmes/${game.file_name}`;
    }
    return `https://raw.githack.com/Hydra-Network/hydra-assets/main/gmes/${game.file_name}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-8"
    >
      <div className="max-w-7xl mx-auto">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 mb-6 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          placeholder={`Search from ${games.length} games`}
        />

        <div className="flex flex-wrap justify-center gap-3">
          {filteredGames.map((game, idx) => {
            const thumbUrl = game.thumb
              ? `https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/${game.thumb}`
              : null;

            return (
              <motion.div
                key={`${game.file_name}-${idx}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openGame(game)}
                className="group relative w-64 h-40 cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-sm"
              >
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={game.title}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-[var(--surface)] flex items-center justify-center">
                    <p className="text-[var(--text-muted)]">No Image</p>
                  </div>
                )}
                <div className="absolute inset-0 flex items-start justify-start p-3 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <h3 className="text-[var(--text-primary)] text-lg font-bold p-2">{game.title}</h3>
                </div>
              </motion.div>
            );
          })}
          {filteredGames.length === 0 && (
            <p className="text-center py-20 text-[var(--text-muted)]">No games found.</p>
          )}
        </div>
      </div>

      {/* Game Overlay */}
      {/* Game Overlay - portaled to body to escape stacking context */}
      {createPortal(
        <AnimatePresence>
          {activeGame && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black flex flex-col"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-[rgba(255,255,255,0.1)] shrink-0">
                <button
                  onClick={closeGame}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[var(--accent)] text-[var(--text-primary)] font-bold uppercase text-sm tracking-wider transition-all"
                >
                  <ArrowLeft size={18} />
                  ← Back
                </button>
                <h1 className="text-[var(--text-primary)] font-bold text-lg truncate mx-4">
                  {activeGame.title}
                </h1>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.1)] hover:bg-[var(--accent)] text-[var(--text-primary)] font-bold uppercase text-sm tracking-wider transition-all"
                >
                  <Maximize size={18} />
                  Fullscreen
                </button>
              </div>

              {/* Game iframe */}
              <iframe
                ref={iframeRef}
                src={getGameSrc(activeGame)}
                className="w-full flex-1 border-none"
                allow="fullscreen"
                title={activeGame.title}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
