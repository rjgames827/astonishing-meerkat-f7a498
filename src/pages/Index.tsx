import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import LibrarySection from '@/components/LibrarySection';
import Settings, { defaultThemes } from '@/components/Settings';
import MusicPlayer from '@/components/MusicPlayer';
import Partners from '@/components/Partners';
import UpdateLog from '@/components/UpdateLog';
import DateTimeWidget from '@/components/DateTimeWidget';
import { GamesHub } from '@/components/GamesHub';
import { Category, LibraryItem, StaffMember, Game, FavoriteItem } from '@/types';
import { MOVIES_DATA, ANIME_DATA, MANGA_DATA, TV_DATA, STAFF_DATA, PARTNERS_DATA, PROXIES_DATA } from '@/constants';
import { useLanguage } from '@/context/LanguageContext';
import { auth, logout, db, handleFirestoreError, OperationType } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, where, getDocs, deleteDoc } from 'firebase/firestore';
import ChatRoom from '@/components/ChatRoom';
import AdminDashboard from '@/components/AdminDashboard';
import AuthModal from '@/components/AuthModal';
import SuggestionModal from '@/components/SuggestionModal';
import AppealModal from '@/components/AppealModal';
import HallOfAutism from '@/components/HallOfAutism';
import { SiteAnnouncements } from '@/components/SiteAnnouncements';
import { Search, X, Film, Sparkles, BookOpen, Tv, SearchX, PlayCircle, Star, Globe, Users, ExternalLink, ShieldAlert, Zap, MessageSquare, Activity, Loader2, Book, AlertTriangle, Settings as SettingsIcon, GitCommit, ChevronDown, LayoutGrid, Gamepad2, ShieldCheck, LogOut, LogIn, Send } from 'lucide-react';

const DEFAULT_LOGO = "https://files.catbox.moe/4wz029.svg";

const DiscordIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
  </svg>
);

const TranslatedText: React.FC<{ text: string }> = ({ text }) => {
  const { translateDynamic, language } = useLanguage();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    let isMounted = true;
    const translate = async () => {
      if (language === 'en-US') {
        if (isMounted) setTranslated(text);
        return;
      }
      
      const cacheKey = `${language}:${text}`;
      const savedCache = JSON.parse(localStorage.getItem('rjpgames_translation_cache') || '{}');
      if (savedCache[cacheKey]) {
        if (isMounted) setTranslated(savedCache[cacheKey]);
        return;
      }

      const result = await translateDynamic(text);
      if (isMounted) setTranslated(result);
    };
    translate();
    return () => { isMounted = false; };
  }, [text, language, translateDynamic]);

  return <>{translated}</>;
};

const ScrambleEffect: React.FC = () => {
  useEffect(() => {
    let interval: any;
    const originalTexts = new Map<HTMLElement, string>();

    const scrambleText = (text: string) => {
      if (!text) return '';
      return text.split(' ').map(word => {
        if (word.length <= 3) return word;
        const chars = word.split('');
        for (let i = chars.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
      }).join(' ');
    };

    const runScramble = () => {
      if (document.documentElement.dataset.theme !== 'aprilfools') return;

      const elements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, button')) as HTMLElement[];
      const targetElements = elements
        .filter(el => {
          return el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 && Math.random() > 0.9;
        })
        .slice(0, 5);

      targetElements.forEach(el => {
        if (!originalTexts.has(el)) {
          originalTexts.set(el, el.innerText);
        }
        el.innerText = scrambleText(el.innerText);
      });

      setTimeout(() => {
        targetElements.forEach(el => {
          const original = originalTexts.get(el);
          if (original && document.contains(el)) {
            el.innerText = original;
            originalTexts.delete(el);
          }
        });
      }, 1000);
    };

    interval = setInterval(runScramble, 10000);
    return () => {
      clearInterval(interval);
      originalTexts.forEach((text, el) => {
        if (document.contains(el)) {
          el.innerText = text;
        }
      });
    };
  }, []);

  return null;
};

const getInitialCategory = (): Category => {
  const path = window.location.pathname.substring(1).toLowerCase();
  const normalizedPath = path.replace(/-/g, ' ') as Category;
  const validCategories: Category[] = ['home', 'movies', 'tv shows', 'anime', 'manga', 'proxies', 'partners', 'dev', 'support', 'apps', 'browser', 'settings', 'music', 'games', 'chat', 'admin-chat', 'hall-of-cornballs'];
  
  if (validCategories.includes(normalizedPath)) {
    return normalizedPath;
  }
  return path === '' ? 'support' : 'home';
};

const Index: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>(getInitialCategory);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [proxySearch, setProxySearch] = useState('');
  const [customLogo, setCustomLogo] = useState<string>(DEFAULT_LOGO);

  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const navigate = (cat: Category) => {
    setActiveCategory(cat);
    const path = '/' + cat.replace(/ /g, '-');
    window.history.pushState({}, '', path);
  };

  const [selectedItem, setSelectedItem] = useState<{item: LibraryItem, category: string, showPlayer: boolean} | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const saved = localStorage.getItem('rjpgames_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdateLogOpen, setIsUpdateLogOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [hasOpenedUpdateLog, setHasOpenedUpdateLog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const { t } = useLanguage();
  const [uploads, setUploads] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const superAdminUid = 'HfjrcUIslZPCvNI3fxiQJVK1ebB3';
      const userEmail = currentUser?.email?.toLowerCase() || '';
      const isSuperAdminUser = currentUser?.uid === superAdminUid || 
                               userEmail === 'lily.smith7406@gmail.com' || 
                               userEmail.includes('rj.po');
      setIsSuperAdmin(isSuperAdminUser);
      setIsAdmin(isSuperAdminUser); 
      setIsAuthReady(true);
      if (!currentUser) {
        setFavorites([]);
        setIsBanned(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.customLogo) setCustomLogo(data.customLogo);
        if (data.favorites) setFavorites(data.favorites);
        
        const superAdminUid = 'HfjrcUIslZPCvNI3fxiQJVK1ebB3';
        const userEmail = user.email?.toLowerCase() || '';
        const isSuperAdminUser = user.uid === superAdminUid || userEmail === 'lily.smith7406@gmail.com';
        const isAdminRole = ['admin', 'co-owner', 'owner'].includes(data.role || '');
        
        setIsSuperAdmin(isSuperAdminUser);
        setIsAdmin(isSuperAdminUser || isAdminRole);
        setIsBanned(data.banned === true && !isSuperAdminUser);
      }
    });
    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleUpdateLogo = (newLogoUrl: string) => {
    setCustomLogo(newLogoUrl);
    if (user) updateDoc(doc(db, 'users', user.uid), { customLogo: newLogoUrl });
  };

  const handleOpenDetails = (item: LibraryItem, category: string) => {
    setSelectedItem({ item, category, showPlayer: false });
  };

  const onToggleFavorite = async (item: FavoriteItem) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === item.id);
      const newFavs = exists ? prev.filter(f => f.id !== item.id) : [...prev, item];
      if (user) updateDoc(doc(db, 'users', user.uid), { favorites: newFavs });
      return newFavs;
    });
  };

  const [searchCategory, setSearchCategory] = useState<'all' | 'movies' | 'tv' | 'anime' | 'manga'>('all');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const textFilter = (item: LibraryItem) => item.t.toLowerCase().includes(q);
    
    const results = {
      movies: MOVIES_DATA.filter(textFilter),
      anime: ANIME_DATA.filter(textFilter),
      manga: MANGA_DATA.filter(textFilter),
      tv: TV_DATA.filter(textFilter),
    };

    if (searchCategory !== 'all') {
      return {
        movies: searchCategory === 'movies' ? results.movies : [],
        anime: searchCategory === 'anime' ? results.anime : [],
        manga: searchCategory === 'manga' ? results.manga : [],
        tv: searchCategory === 'tv' ? results.tv : [],
      };
    }
    return results;
  }, [searchQuery, searchCategory]);

  const totalMatches = searchResults ? 
    searchResults.movies.length + searchResults.anime.length + searchResults.manga.length + searchResults.tv.length : 0;

  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-[#0a0a0a] border border-red-500/20 rounded-[32px] p-12 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-8" />
          <h1 className="text-4xl font-black uppercase italic text-white mb-4">Access Denied</h1>
          <p className="text-neutral-400 text-sm mb-8">Account banned for violating community guidelines.</p>
          <button onClick={() => setIsAppealModalOpen(true)} className="w-full py-4 rounded-2xl bg-accent text-white font-black uppercase">Appeal Ban</button>
        </motion.div>
        <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} userEmail={user?.email || ''} userId={user?.uid || ''} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <ScrambleEffect />
      <SiteAnnouncements />
      <div id="app" className="fixed inset-0 flex flex-col overflow-hidden bg-bg">
        <div className="relative z-20 flex items-center justify-between p-4 bg-bg/80 backdrop-blur-md border-b border-white/5">
            <div></div>
            <div className="text-xs text-text-secondary">© 2026 RJ.P Games</div>
        </div>

        <Sidebar 
          activeCategory={activeCategory} 
          logoUrl={customLogo} 
          onLogoChange={handleUpdateLogo}
          isAdmin={isAdmin}
          onSelect={navigate}
        />
        
        <main className="flex-1 flex flex-col min-w-0 h-full relative z-10 overflow-auto custom-scrollbar">
          <header className="sticky top-0 z-40 border-b border-surface-hover p-4 md:p-6 flex justify-between items-center bg-bg/60 backdrop-blur-xl">
            <DateTimeWidget />
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button onClick={() => setIsAdminOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent"><ShieldCheck size={18} /></button>
              )}
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5"><SettingsIcon size={18} /></button>
              <button onClick={() => setIsUpdateLogOpen(!isUpdateLogOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5"><GitCommit size={18} /></button>
              <button onClick={user ? logout : () => setIsAuthModalOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-hover border border-white/5">{user ? <LogOut size={18} /> : <LogIn size={18} />}</button>
            </div>
          </header>

          <div id="content-area" className="flex-1 p-4 md:p-10 custom-scrollbar">
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {isPageLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <Loader2 size={64} className="text-accent animate-spin mb-4" />
                  <h2 className="text-white font-black uppercase">Loading...</h2>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={activeCategory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full pb-24">
                    
                    {/* Devs Section */}
                    {activeCategory === 'support' && (
                      <div className="py-12 space-y-16">
                        <div className="text-center">
                          <h1 className="text-7xl font-black uppercase italic text-white mb-4">Devs</h1>
                          <p className="text-text-muted">The team behind RJ.P Games.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                          {STAFF_DATA.map((staff, idx) => (
                            <div key={idx} onClick={() => staff.link && window.open(staff.link)} className="bg-bg border border-surface-hover p-10 rounded-[48px] text-center cursor-pointer hover:bg-surface-hover transition-all">
                              <img src={staff.img} className="w-40 h-40 mx-auto mb-10 rounded-[40px] object-cover" />
                              <h3 className="text-2xl font-black text-white uppercase">{staff.name}</h3>
                              <p className="text-accent text-[9px] uppercase tracking-widest">{staff.role}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hall of Cornballs Section */}
                    {activeCategory === 'hall-of-cornballs' && (
                      <div className="mt-20 max-w-[1600px] mx-auto pb-40 px-4 relative">
                        <div className="text-center mb-16">
                          <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white mb-4">Hall of Cornballs</h1>
                          <p className="text-text-secondary max-w-2xl mx-auto font-medium">A showcase of Cornballs</p>
                        </div>
                        <HallOfAutism isSuperAdmin={isSuperAdmin} />
                      </div>
                    )}

                    {/* Other Categories */}
                    {activeCategory === 'games' && <GamesHub />}
                    {activeCategory === 'music' && <MusicPlayer />}
                    {activeCategory === 'movies' && <LibrarySection title="Movies" items={MOVIES_DATA} category="movie" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'tv shows' && <LibrarySection title="TV Shows" items={TV_DATA} category="tv" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'anime' && <LibrarySection title="Animes" items={ANIME_DATA} category="anime" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'manga' && <LibrarySection title="Mangas" items={MANGA_DATA} category="manga" searchQuery="" onOpenDetails={handleOpenDetails} showSearch={true} />}
                    {activeCategory === 'chat' && <div className="p-10">{user ? <ChatRoom isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} /> : <div className="text-center">Please login to chat.</div>}</div>}
                    {activeCategory === 'admin-chat' && <div className="p-10">{isAdmin ? <ChatRoom collectionName="admin_chat" isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} /> : <div className="text-center">Access Denied.</div>}</div>}
                    {activeCategory === 'partners' && <Partners />}
                    {activeCategory === 'proxies' && (
                      <div className="py-12 px-6">
                        <h1 className="text-5xl font-black italic uppercase text-white mb-10">Proxies</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {PROXIES_DATA.map((p, i) => (
                            <a key={i} href={p.url} target="_blank" className="bg-surface-hover p-6 rounded-xl border border-white/5 flex justify-between items-center group hover:border-accent/40">
                              <span className="text-white font-bold">{p.name || p.url}</span>
                              <ExternalLink size={16} className="text-text-secondary group-hover:text-accent" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-bg/95 backdrop-blur-3xl" onClick={() => setSelectedItem(null)}></div>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`relative w-full ${selectedItem.showPlayer ? 'h-full' : 'max-w-5xl max-h-[90vh]'} bg-bg border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row`}>
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 right-8 z-50 bg-bg/40 p-4 rounded-2xl"><X size={24} /></button>
              <div className="flex-1 p-10 flex flex-col">
                {selectedItem.showPlayer ? (
                  <iframe src={selectedItem.item.l?.replace('/view', '/preview')} className="w-full h-full" allowFullScreen />
                ) : (
                  <>
                    <h2 className="text-6xl font-black uppercase text-white mb-10">{selectedItem.item.t}</h2>
                    <button onClick={() => setSelectedItem({...selectedItem, showPlayer: true})} className="w-full py-5 rounded-[2rem] bg-accent text-white font-black uppercase italic">PLAY HERE</button>
                    <a href={selectedItem.item.l} target="_blank" className="w-full py-5 rounded-[2rem] border border-white/10 text-white font-black uppercase text-center mt-4">OPEN IN DRIVE</a>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60" onClick={() => setIsSettingsOpen(false)}></div>
             <motion.div className="relative w-full max-w-md bg-surface rounded-3xl overflow-hidden border border-white/10"><Settings onClose={() => setIsSettingsOpen(false)} /></motion.div>
          </div>
        )}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60" onClick={() => setIsAuthModalOpen(false)}></div>
             <motion.div className="relative w-full max-w-md bg-surface rounded-3xl overflow-hidden border border-white/10"><AuthModal onClose={() => setIsAuthModalOpen(false)} /></motion.div>
          </div>
        )}
        {isAdminOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/95" onClick={() => setIsAdminOpen(false)}></div>
             <motion.div className="relative w-full max-w-5xl h-[80vh] bg-surface rounded-3xl overflow-hidden border border-white/10"><AdminDashboard onClose={() => setIsAdminOpen(false)} isSuperAdmin={isSuperAdmin} isAdmin={isAdmin} /></motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
