import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, orderBy, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, Loader2, Users, Send, AlertTriangle } from 'lucide-react';

interface HallEntry {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  createdAt: any;
  uploadedBy: string;
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

  // RESTORED: Background music
  useEffect(() => {
    const audio = new Audio('/jaydes-hysteric.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    
    const playAudio = () => {
      audio.play().catch(err => {
        const playOnInteraction = () => {
          audio.play();
          document.removeEventListener('click', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
      });
    };

    playAudio();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Sparkle effect
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
      setName(''); setImageUrl(''); setDescription('');
    } catch (err) {
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
      handleFirestoreError(err, OperationType.DELETE, `hall_of_autism/${id}`);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !auth.currentUser) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_autism_requests'), {
        name: name.trim(), imageUrl: imageUrl.trim(), description: description.trim() || '',
        requestedBy: auth.currentUser.uid, requestedByEmail: auth.currentUser.email || 'Unknown',
        status: 'pending', createdAt: serverTimestamp(),
      });
      setName(''); setImageUrl(''); setDescription(''); setShowRequestForm(false);
      alert('Request submitted!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'hall_of_autism_requests');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes rainbow {
          0% { color: #ff0000; }
          17% { color: #ff8000; }
          33% { color: #ffff00; }
          50% { color: #00ff00; }
          67% { color: #0000ff; }
          84% { color: #8b00ff; }
          100% { color: #ff0000; }
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
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.6) translateY(-20px); }
        }
        
        .rainbow-text {
          animation: rainbow 15s linear infinite; /* SLOWED TO 15s */
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
      `}</style>

      <div className="space-y-12">
        {!isSuperAdmin && auth.currentUser && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl">
            {!showRequestForm && !showTakedownForm ? (
              <div className="flex gap-3">
                <button onClick={() => setShowRequestForm(true)} className="flex-1 py-4 rounded-xl bg-accent text-white font-bold uppercase text-sm">Request Entry</button>
                <button onClick={() => setShowTakedownForm(true)} className="flex-1 py-4 rounded-xl bg-red-500/80 text-white font-bold uppercase text-sm">Request Takedown</button>
              </div>
            ) : showRequestForm ? (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase text-white mb-6">Request Entry</h2>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white" required />
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white" required />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why should they be in the Hall of Cornballs?" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white min-h-[100px]" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold uppercase">Cancel</button>
                  <button type="submit" disabled={isUploading} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold uppercase">Submit</button>
                </div>
              </form>
            ) : null}
          </motion.div>
        )}

        {isSuperAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-white/5 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-black italic uppercase text-white mb-6">Add New Entry</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white" required />
              <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white" required />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white" />
              <button type="submit" disabled={isUploading} className="w-full py-3 rounded-xl bg-accent text-white font-bold uppercase">Add to Hall of Cornballs</button>
            </form>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 text-accent"><Loader2 className="animate-spin" size={48} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((entry) => (
              <motion.div key={entry.id} className="bg-[#0E0E0E] border border-[#2a2a2a] overflow-hidden flex flex-col group relative">
                <div className="w-full h-[300px] overflow-hidden bg-[#0a0a0a] flex justify-center items-center">
                  <img src={entry.imageUrl} alt={entry.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-xl font-black italic uppercase rainbow-text">{entry.name}</h3>
                  <p className="text-[#b0b0b0] text-sm mt-2">{entry.description}</p>
                </div>
                {isSuperAdmin && (
                  <button onClick={() => handleDelete(entry.id)} className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
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
