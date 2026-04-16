import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, query, orderBy, deleteDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Upload, Trash2, Loader2, Users, Send, Zap } from 'lucide-react';

const HallOfTuff = ({ isSuperAdmin = false }) => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'hall_of_tuff'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim() || !isSuperAdmin) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_tuff'), {
        name: name.trim(), imageUrl: imageUrl.trim(), description: description.trim(),
        createdAt: serverTimestamp(), uploadedBy: auth.currentUser.uid,
      });
      setName(''); setImageUrl(''); setDescription('');
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'hall_of_tuff'); }
    setIsUploading(false);
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'hall_of_tuff_requests'), {
        name, imageUrl, description, status: 'pending', createdAt: serverTimestamp(),
        requestedByEmail: auth.currentUser.email
      });
      setShowRequestForm(false);
      alert('Tuff Request Sent!');
    } catch (err) { console.error(err); }
    setIsUploading(false);
  };

  return (
    <div className="space-y-12">
      <style>{`
        .tuff-text {
          background: linear-gradient(to right, #ff4d00, #ffae00, #fff700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          text-shadow: 0 0 10px rgba(255, 77, 0, 0.3);
        }
      `}</style>
      
      {!isSuperAdmin && auth.currentUser && (
        <button onClick={() => setShowRequestForm(true)} className="w-full py-4 rounded-xl bg-orange-600 text-white font-bold uppercase">Request Tuff Entry</button>
      )}

      {showRequestForm && (
        <form onSubmit={handleSubmitRequest} className="bg-surface p-6 rounded-2xl border border-white/10 space-y-4">
           <input type="text" placeholder="Name" className="w-full bg-bg p-3 rounded-xl border border-white/10" onChange={e => setName(e.target.value)} required />
           <input type="text" placeholder="Image URL" className="w-full bg-bg p-3 rounded-xl border border-white/10" onChange={e => setImageUrl(e.target.value)} required />
           <button type="submit" className="w-full py-3 bg-accent rounded-xl font-bold">Submit</button>
           <button type="button" onClick={() => setShowRequestForm(false)} className="w-full py-2 text-sm opacity-50">Cancel</button>
        </form>
      )}

      {isSuperAdmin && (
        <form onSubmit={handleUpload} className="bg-surface p-8 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-xl font-bold">Add Tuff Entry</h2>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full bg-bg p-3 rounded-xl border border-white/10" required />
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full bg-bg p-3 rounded-xl border border-white/10" required />
          <button type="submit" className="w-full py-3 bg-orange-500 text-black font-bold rounded-xl">Add to Hall of Tuff</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entries.map(entry => (
          <div key={entry.id} className="bg-[#0E0E0E] border border-white/5 rounded-2xl overflow-hidden text-center group">
            <img src={entry.imageUrl} className="w-full h-64 object-cover" />
            <div className="p-4">
              <h3 className="text-2xl tuff-text uppercase italic">{entry.name}</h3>
              <p className="text-neutral-400 mt-2 text-sm">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HallOfTuff;
