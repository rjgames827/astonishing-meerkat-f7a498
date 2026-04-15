import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, Loader2, Users, Send, AlertTriangle } from 'lucide-react';

interface HallEntry {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  createdAt: any;
  uploadedBy: string;
}

interface HallRequest {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  requestedBy: string;
  requestedByEmail: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
}

interface HallOfAutismProps {
  isSuperAdmin?: boolean;
}

const HallOfAutism: React.FC<HallOfAutismProps> = ({ isSuperAdmin = false }) => {
  const [entries, setEntries] = useState<HallEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showTakedownForm, setShowTakedownForm] = useState(false);
  const [takedownReason, setTakedownReason] = useState('');
  const [selectedEntryForTakedown, setSelectedEntryForTakedown] = useState<HallEntry | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'hall_of_autism'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HallEntry));
      setEntries(newEntries);
      setIsLoading(false);
    }, (err) => {
      console.error("Hall of Cornballs fetch error:", err);
      setIsLoading(false);
      handleFirestoreError(err, OperationType.LIST, 'hall_of_autism');
    });
    return () => unsubscribe();
  }, []);

  // Sparkle effect on mouse move
  useEffect(() => {
    const sparkleChars = ['✦', '✧', '✯', '✬', '✫', '*'];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    let mouseX = 0;
    let mouseY = 0;
    let isMoving = false;
    let movementTimeout: NodeJS.Timeout | null = null;
    let sparkleInterval: NodeJS.Timeout | null = null;

    function createSparkle() {
      const sparkle = document.createElement('div');
      sparkle.className = 'hoa-sparkle';
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      sparkle.style.left = (mouseX + offsetX) + 'px';
      sparkle.style.top = (mouseY + offsetY) + 'px';
      sparkle.style.color = colors[Math.floor(Math.random() * colors.length)];
      sparkle.textContent = sparkleChars[Math.floor(Math.random() * sparkleChars.length)];
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 800);
    }

    function updateMousePosition(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        sparkleInterval = setInterval(createSparkle, 50);
      }
      if (movementTimeout) clearTimeout(movementTimeout);
      movementTimeout = setTimeout(() => {
        isMoving = false;
        if (sparkleInterval) {
          clearInterval(sparkleInterval);
          sparkleInterval = null;
        }
      }, 100);
    }

    document.addEventListener('mousemove', updateMousePosition);
    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      if (sparkleInterval) clearInterval(sparkleInterval);
      if (movementTimeout) clearTimeout(movementTimeout);
    };
  }, []);

  // Background music
  useEffect(() => {
    const audio = new Audio('/jaydes-hysteric.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    
    const playAudio = () => {
      audio.play().catch(err => {
        console.log('Audio autoplay blocked, waiting for user interaction');
        const playOnInteraction = () => {
          audio.play();
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('keydown', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('keydown', playOnInteraction);
      });
    };

    playAudio();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !auth.currentUser || !isSuperAdmin) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_autism'), {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim() || '',
        createdAt: serverTimestamp(),
        uploadedBy: auth.currentUser.uid,
      });
      setName('');
      setImageUrl('');
      setDescription('');
    } catch (err) {
      console.error("Failed to add entry:", err);
      handleFirestoreError(err, OperationType.CREATE, 'hall_of_autism');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) return;
    try {
      await deleteDoc(doc(db, 'hall_of_autism', id));
    } catch (err) {
      console.error("Failed to delete entry:", err);
      handleFirestoreError(err, OperationType.DELETE, `hall_of_autism/${id}`);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !auth.currentUser) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_autism_requests'), {
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        description: description.trim() || '',
        requestedBy: auth.currentUser.uid,
        requestedByEmail: auth.currentUser.email || 'Unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setName('');
      setImageUrl('');
      setDescription('');
      setShowRequestForm(false);
      alert('Request submitted! An admin will review it soon.');
    } catch (err) {
      console.error("Failed to submit request:", err);
      handleFirestoreError(err, OperationType.CREATE, 'hall_of_autism_requests');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitTakedown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryForTakedown || !takedownReason.trim() || !auth.currentUser) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_autism_takedowns'), {
        entryId: selectedEntryForTakedown.id,
        entryName: selectedEntryForTakedown.name,
        entryImageUrl: selectedEntryForTakedown.imageUrl,
        reason: takedownReason.trim(),
        requestedBy: auth.currentUser.uid,
        requestedByEmail: auth.currentUser.email || 'Unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setTakedownReason('');
      setSelectedEntryForTakedown(null);
      setShowTakedownForm(false);
      alert('Takedown request submitted! An admin will review it soon.');
    } catch (err) {
      console.error("Failed to submit takedown request:", err);
      handleFirestoreError(err, OperationType.CREATE, 'hall_of_autism_takedowns');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes rainbow {
          0% { color: red; }
          17% { color: orange; }
          33% { color: yellow; }
          50% { color: green; }
          67% { color: blue; }
          84% { color: purple; }
          100% { color: red; }
        }
        
        .hoa-sparkle {
          pointer-events: none;
          position: fixed;
          font-family: monospace;
          font-weight: bold;
          font-size: 8px;
          animation: sparkle-fade 0.8s forwards;
          z-index: 1000;
          text-shadow: 0 0 3px currentColor;
        }
        
        @keyframes sparkle-fade {
          0% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.9) translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.6) translateY(-20px);
          }
        }
        
        .rainbow-text {
          animation: rainbow 5s infinite;
          text-shadow: 2px 2px 4px #000000;
        }
      `}</style>

      <div className="space-y-12">
        {!isSuperAdmin && auth.currentUser && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl"
          >
            {!showRequestForm && !showTakedownForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="flex-1 py-4 rounded-xl bg-accent text-white font-bold uppercase tracking-widest text-sm hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Request Entry
                </button>
                <button
                  onClick={() => setShowTakedownForm(true)}
                  className="flex-1 py-4 rounded-xl bg-red-500/80 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} />
                  Request Takedown
                </button>
              </div>
            ) : showTakedownForm ? (
              <>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6 flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={24} />
                  Request Takedown
                </h2>
                <form onSubmit={handleSubmitTakedown} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Select Entry to Remove</label>
                    <select
                      value={selectedEntryForTakedown?.id || ''}
                      onChange={(e) => {
                        const entry = entries.find(ent => ent.id === e.target.value);
                        setSelectedEntryForTakedown(entry || null);
                      }}
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                      required
                    >
                      <option value="">-- Select an entry --</option>
                      {entries.map(entry => (
                        <option key={entry.id} value={entry.id}>{entry.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedEntryForTakedown && (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <img
                        src={selectedEntryForTakedown.imageUrl}
                        alt={selectedEntryForTakedown.name}
                        className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-center text-white font-bold">{selectedEntryForTakedown.name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Reason for Takedown</label>
                    <textarea
                      value={takedownReason}
                      onChange={(e) => setTakedownReason(e.target.value)}
                      placeholder="Explain why this should be removed..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 min-h-[100px] resize-y"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTakedownForm(false);
                        setSelectedEntryForTakedown(null);
                        setTakedownReason('');
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 py-3 rounded-xl bg-red-500/80 text-white font-bold uppercase tracking-widest text-sm hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={18} />
                          Submit Takedown
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : showRequestForm ? (
              <>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6 flex items-center gap-3">
                  <Send className="text-accent" size={24} />
                  Request Entry
                </h2>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Image URL or Base64</label>
                    <textarea
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg or data:image/jpeg;base64,..."
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px] resize-y"
                      required
                    />
                    <p className="text-xs text-text-secondary mt-1">Supports URLs or base64 encoded images</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Description (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Why should they be in the Hall of Cornballs?"
                      className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px] resize-y"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestForm(false);
                        setName('');
                        setImageUrl('');
                        setDescription('');
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 py-3 rounded-xl bg-accent text-white font-bold uppercase tracking-widest text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </motion.div>
        )}

        {isSuperAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl"
          >
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6 flex items-center gap-3">
              <Upload className="text-accent" size={24} />
              Add New Entry
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Image URL or Base64</label>
                <textarea
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg or data:image/jpeg;base64,..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px] resize-y"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">Supports URLs or base64 encoded images</p>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-text-secondary mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent min-h-[100px] resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 rounded-xl bg-accent text-white font-bold uppercase tracking-widest text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Add to Hall
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 text-accent">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-text-muted opacity-50">
            <Users size={80} className="mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-widest italic mb-2">No entries yet</h2>
            <p className="text-sm">The hall is empty... for now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0E0E0E] border border-[#2a2a2a] overflow-hidden flex flex-col group relative"
              >
                <div className="w-full h-[300px] overflow-hidden border-b border-[#2a2a2a] bg-[#0a0a0a] flex justify-center items-center">
                  <img
                    src={entry.imageUrl}
                    alt={entry.name}
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + entry.id + '/400/400';
                    }}
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col items-center text-center">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 rainbow-text w-full">
                    {entry.name}
                  </h3>
                  {entry.description && (
                    <div className="text-[#b0b0b0] text-sm leading-relaxed max-h-[9rem] overflow-y-auto w-full whitespace-pre-line break-words">
                      {entry.description}
                    </div>
                  )}
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HallOfAutism;
