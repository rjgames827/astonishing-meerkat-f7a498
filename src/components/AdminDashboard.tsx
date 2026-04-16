import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, AlertCircle, CheckCircle2, ShieldCheck, Users, Megaphone, Activity, Send, Check, Ban, UserCheck, Upload, Loader2, GitCommit, AlertTriangle, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth, OperationType, handleFirestoreError } from '@/firebase';
import { collection, addDoc, query, orderBy, deleteDoc, doc, updateDoc, serverTimestamp, Timestamp, setDoc, where, getDocs, limit, onSnapshot } from 'firebase/firestore';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'co-owner' | 'owner' | 'user' | 'donator' | 'tester';
  banned?: boolean;
  createdAt?: Timestamp;
}

interface RequestEntry {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  requestedBy: string;
  requestedByEmail: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
}

interface AdminDashboardProps {
  onClose: () => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, isSuperAdmin, isAdmin }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [updateLogs, setUpdateLogs] = useState<any[]>([]);
  const [hallRequests, setHallRequests] = useState<RequestEntry[]>([]);
  const [tuffRequests, setTuffRequests] = useState<RequestEntry[]>([]);
  const [takedownRequests, setTakedownRequests] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'announcements' | 'users' | 'updatelogs' | 'hallrequests' | 'tuffrequests' | 'takedowns'>('announcements');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    let unsubscribe: () => void = () => {};

    try {
      if (activeTab === 'announcements') {
        const q = query(collection(db, 'site_announcements'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      } else if (activeTab === 'hallrequests') {
        const q = query(collection(db, 'hall_of_autism_requests'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (s) => setHallRequests(s.docs.map(d => ({ id: d.id, ...d.data() })) as RequestEntry[]));
      } else if (activeTab === 'tuffrequests') {
        const q = query(collection(db, 'hall_of_tuff_requests'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (s) => setTuffRequests(s.docs.map(d => ({ id: d.id, ...d.data() })) as RequestEntry[]));
      } else if (activeTab === 'takedowns') {
        const q = query(collection(db, 'hall_of_autism_takedowns'), orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(q, (s) => setTakedownRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      } else if (activeTab === 'users') {
        const q = query(collection(db, 'users'), limit(100));
        unsubscribe = onSnapshot(q, (s) => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() })) as User[]));
      }
    } catch (err) {
      console.error("Dashboard Listener Error:", err);
    }

    setIsLoading(false);
    return () => unsubscribe();
  }, [activeTab]);

  // Handle Cornball Approval
  const handleApproveCornball = async (request: RequestEntry) => {
    try {
      await addDoc(collection(db, 'hall_of_autism'), {
        name: request.name,
        imageUrl: request.imageUrl,
        description: request.description || '',
        createdAt: serverTimestamp(),
        uploadedBy: 'admin_approved',
      });
      await updateDoc(doc(db, 'hall_of_autism_requests', request.id), { status: 'approved' });
      setSuccess('Added to Hall of Cornballs!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError('Approval failed.'); }
  };

  // Handle Tuff Approval
  const handleApproveTuff = async (request: RequestEntry) => {
    try {
      await addDoc(collection(db, 'hall_of_tuff'), {
        name: request.name,
        imageUrl: request.imageUrl,
        description: request.description || '',
        createdAt: serverTimestamp(),
        uploadedBy: 'admin_approved',
      });
      await updateDoc(doc(db, 'hall_of_tuff_requests', request.id), { status: 'approved' });
      setSuccess('Added to Hall of Tuff!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError('Approval failed.'); }
  };

  const handleDenyRequest = async (collectionName: string, id: string) => {
    try {
      await updateDoc(doc(db, collectionName, id), { status: 'denied' });
      setSuccess('Request denied.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError('Action failed.'); }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-black uppercase italic tracking-tighter">Admin Dashboard</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white transition-all"><X size={20} /></button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 px-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'announcements', icon: Megaphone, label: 'Announcements' },
          { id: 'hallrequests', icon: Users, label: 'Cornball Requests' },
          { id: 'tuffrequests', icon: Zap, label: 'Tuff Requests' },
          { id: 'takedowns', icon: AlertTriangle, label: 'Takedowns' },
          { id: 'users', icon: UserCheck, label: 'Users' },
          { id: 'updatelogs', icon: GitCommit, label: 'Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-accent' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
        ))}
      </div>

      {/* Feedback Alerts */}
      <div className="px-6 pt-4">
        {success && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold rounded-xl">{success}</div>}
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl">{error}</div>}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" size={32} /></div>
        ) : (
          <>
            {/* CORNBALL REQUESTS */}
            {activeTab === 'hallrequests' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Hall of Cornballs Requests</h3>
                {hallRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-xs italic text-neutral-600">No pending Cornball requests.</p>
                ) : (
                  hallRequests.filter(r => r.status === 'pending').map(r => (
                    <div key={r.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <img src={r.imageUrl} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                        <div>
                          <p className="font-bold text-sm">{r.name}</p>
                          <p className="text-[10px] text-neutral-500">{r.requestedByEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveCornball(r)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"><Check size={16} /></button>
                        <button onClick={() => handleDenyRequest('hall_of_autism_requests', r.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><X size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TUFF REQUESTS */}
            {activeTab === 'tuffrequests' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Hall of Tuff Requests</h3>
                {tuffRequests.filter(r => r.status === 'pending').length === 0 ? (
                  <p className="text-xs italic text-neutral-600">No pending Tuff requests.</p>
                ) : (
                  tuffRequests.filter(r => r.status === 'pending').map(r => (
                    <div key={r.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <img src={r.imageUrl} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                        <div>
                          <p className="font-bold text-sm">{r.name}</p>
                          <p className="text-[10px] text-neutral-500">{r.requestedByEmail}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveTuff(r)} className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20"><Check size={16} /></button>
                        <button onClick={() => handleDenyRequest('hall_of_tuff_requests', r.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><X size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Other tabs follow the same pattern... */}
            {activeTab === 'announcements' && (
               <p className="text-xs text-neutral-500 italic">Manage your site-wide announcements here.</p>
               // Logic for adding announcements would go here
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
