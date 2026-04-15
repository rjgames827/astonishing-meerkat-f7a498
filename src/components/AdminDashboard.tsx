import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Save, AlertCircle, CheckCircle2, ShieldCheck, Users, Megaphone, Activity, Send, Check, Ban, UserCheck, Upload, Loader2, GitCommit, AlertTriangle } from 'lucide-react';
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

interface Appeal {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: Timestamp;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Timestamp;
  active: boolean;
}

interface Suggestion {
  id: string;
  userId: string;
  userEmail: string;
  text: string;
  createdAt: Timestamp;
  status: 'pending' | 'reviewed';
}

interface AllowedAdmin {
  id: string;
  email: string;
  addedBy: string;
  createdAt: Timestamp;
}

interface UpdateLog {
  id: string;
  version: string;
  date: string;
  changes: string[];
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

interface TakedownRequest {
  id: string;
  entryId: string;
  entryName: string;
  entryImageUrl: string;
  reason: string;
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [uploadType, setUploadType] = useState('movie');
  const [uploadTitle, setUploadTitle] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleUpload = async () => {
    if (!uploadTitle || !driveLink || !imageLink) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await addDoc(collection(db, 'uploads'), {
        title: uploadTitle,
        type: uploadType,
        driveLink,
        imageLink,
        createdAt: serverTimestamp(),
      });
      setUploadSuccess('Content uploaded successfully!');
      setUploadTitle('');
      setDriveLink('');
      setImageLink('');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload content.');
      handleFirestoreError(err, OperationType.CREATE, 'uploads');
    }
  };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [allowedAdmins, setAllowedAdmins] = useState<AllowedAdmin[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [hallRequests, setHallRequests] = useState<HallRequest[]>([]);
  const [takedownRequests, setTakedownRequests] = useState<TakedownRequest[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [newDate, setNewDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format: 2026-04-15T12:30
  });
  const [newChanges, setNewChanges] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'suggestions' | 'users' | 'admins' | 'analytics' | 'appeals' | 'banned' | 'upload' | 'updatelogs' | 'hallrequests' | 'takedowns'>('announcements');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [appealFilter, setAppealFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'co-owner' | 'owner' | 'user' | 'donator' | 'tester'>('all');

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'upload') return;

    setIsLoading(true);
    setError(null); // Clear previous errors
    let unsubscribe: () => void = () => {};

    try {
      if (activeTab === 'announcements') {
        const q = query(collection(db, 'site_announcements'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] Announcements snapshot received: ${snapshot.size} docs`);
          setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] Announcements error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'site_announcements');
          setIsLoading(false);
        });
      } else if (activeTab === 'suggestions') {
        const q = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] Suggestions snapshot received: ${snapshot.size} docs`);
          setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Suggestion[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] Suggestions error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'suggestions');
          setIsLoading(false);
        });
      } else if (activeTab === 'updatelogs') {
        const q = query(collection(db, 'update_logs'), orderBy('date', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] UpdateLogs snapshot received: ${snapshot.size} docs`);
          setUpdateLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UpdateLog[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] UpdateLogs error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'update_logs');
          setIsLoading(false);
        });
      } else if (activeTab === 'admins') {
        const q = query(collection(db, 'allowed_admins'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] AllowedAdmins snapshot received: ${snapshot.size} docs`);
          setAllowedAdmins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AllowedAdmin[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] AllowedAdmins error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'allowed_admins');
          setIsLoading(false);
        });
      } else if (activeTab === 'users' || activeTab === 'banned') {
        const q = query(collection(db, 'users'), limit(500));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] Users snapshot received: ${snapshot.size} docs`);
          setUsers(snapshot.docs.map(doc => ({ 
            uid: doc.id, 
            role: 'user', // Default role
            ...doc.data() 
          })) as User[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] Users error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'users');
          setIsLoading(false);
        });
      } else if (activeTab === 'appeals') {
        const q = query(collection(db, 'appeals'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] Appeals snapshot received: ${snapshot.size} docs`);
          setAppeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appeal[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] Appeals error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'appeals');
          setIsLoading(false);
        });
      } else if (activeTab === 'hallrequests') {
        const q = query(collection(db, 'hall_of_autism_requests'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] HallRequests snapshot received: ${snapshot.size} docs`);
          setHallRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HallRequest[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] HallRequests error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'hall_of_autism_requests');
          setIsLoading(false);
        });
      } else if (activeTab === 'takedowns') {
        const q = query(collection(db, 'hall_of_autism_takedowns'), orderBy('createdAt', 'desc'), limit(100));
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`[AdminDashboard] TakedownRequests snapshot received: ${snapshot.size} docs`);
          setTakedownRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TakedownRequest[]);
          setIsLoading(false);
          setError(null);
        }, (err) => {
          console.error('[AdminDashboard] TakedownRequests error:', err);
          setError('Permission denied. Please update Firestore rules to grant admin access.');
          handleFirestoreError(err, OperationType.LIST, 'hall_of_autism_takedowns');
          setIsLoading(false);
        });
      }
    } catch (err) {
      console.error("Error setting up listeners:", err);
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [activeTab]);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await addDoc(collection(db, 'site_announcements'), {
        title: newTitle,
        content: newContent,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        active: true
      });
      setNewTitle('');
      setNewContent('');
      setSuccess('Announcement posted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to post announcement. Check console for details.');
      handleFirestoreError(err, OperationType.CREATE, 'site_announcements');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'site_announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `site_announcements/${id}`);
    }
  };

  const toggleAnnouncementStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'site_announcements', id), {
        active: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `site_announcements/${id}`);
    }
  };

  const handleMarkSuggestionReviewed = async (id: string) => {
    try {
      await updateDoc(doc(db, 'suggestions', id), {
        status: 'reviewed'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suggestions/${id}`);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'suggestions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `suggestions/${id}`);
    }
  };

  const handleRemoveAllAdmins = async () => {
    if (!window.confirm('Are you sure you want to remove all other admins and reset all user roles to "user"? This cannot be undone.')) return;
    try {
      console.log('Starting admin removal...');
      // 1. Clear allowed_admins
      const adminsRef = collection(db, 'allowed_admins');
      const adminSnapshot = await getDocs(adminsRef);
      console.log(`Found ${adminSnapshot.docs.length} allowed admins to remove.`);
      const deletePromises = adminSnapshot.docs.map(docSnap => deleteDoc(doc(db, 'allowed_admins', docSnap.id)));
      await Promise.all(deletePromises);
      setAllowedAdmins([]);
      console.log('Allowed admins cleared.');

      // 2. Reset all users to 'user' role except super admin
      const usersRef = collection(db, 'users');
      // Query only users with admin-related roles to save quota
      const adminRoles = ['admin', 'co-owner', 'owner'];
      const qUsers = query(usersRef, where('role', 'in', adminRoles), limit(500));
      const userSnapshot = await getDocs(qUsers);
      console.log(`Found ${userSnapshot.docs.length} users with admin roles.`);
      const superAdminUid = 'HfjrcUIslZPCvNI3fxiQJVK1ebB3';
      const updatePromises = userSnapshot.docs
        .filter(docSnap => docSnap.id !== superAdminUid)
        .map(docSnap => {
          console.log(`Demoting user: ${docSnap.data().email} (${docSnap.id})`);
          return setDoc(doc(db, 'users', docSnap.id), { role: 'user' }, { merge: true });
        });
      await Promise.all(updatePromises);
      console.log('Users demoted.');
      
      setSuccess('All other admins removed and roles reset successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error removing admins:', err);
      setError('Failed to remove admins.');
      handleFirestoreError(err, OperationType.UPDATE, 'users/allowed_admins');
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: 'admin' | 'co-owner' | 'owner' | 'user' | 'donator' | 'tester') => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    
    try {
      console.log(`[AdminDashboard] Updating user ${uid} role to ${newRole}`);
      await updateDoc(doc(db, 'users', uid), {
        role: newRole
      });
      setSuccess(`User role updated to ${newRole} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user role.');
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleToggleBan = async (uid: string, currentBanned: boolean) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, banned: !currentBanned } : u));
    
    try {
      console.log(`[AdminDashboard] Toggling ban for user ${uid} (current: ${currentBanned})`);
      await updateDoc(doc(db, 'users', uid), {
        banned: !currentBanned
      });
      
      // If unbanning, also mark any pending appeals as approved
      if (currentBanned) {
        const pendingAppeals = appeals.filter(a => a.userId === uid && a.status === 'pending');
        for (const appeal of pendingAppeals) {
          await updateDoc(doc(db, 'appeals', appeal.id), { status: 'approved' });
        }
      }

      setSuccess(`User ${!currentBanned ? 'banned' : 'unbanned'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to ${!currentBanned ? 'ban' : 'unban'} user.`);
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!isSuperAdmin) return;
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    
    try {
      console.log(`[AdminDashboard] Deleting user ${uid}`);
      await deleteDoc(doc(db, 'users', uid));
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete user.');
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleAppealAction = async (appealId: string, userId: string, action: 'approved' | 'denied') => {
    try {
      await updateDoc(doc(db, 'appeals', appealId), { status: action });
      if (action === 'approved') {
        await updateDoc(doc(db, 'users', userId), { banned: false });
      }
      setSuccess(`Appeal ${action} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to ${action} appeal.`);
      handleFirestoreError(err, OperationType.UPDATE, `appeals/${appealId}`);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const email = newAdminEmail.trim().toLowerCase();
      await setDoc(doc(db, 'allowed_admins', email), {
        email: email,
        addedBy: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });

      // Update existing user role if they already have an account
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const updatePromises = querySnapshot.docs
        .filter(docSnap => docSnap.data().email?.toLowerCase() === email)
        .map(docSnap => updateDoc(doc(db, 'users', docSnap.id), { role: 'admin' }));
      await Promise.all(updatePromises);

      setNewAdminEmail('');
      setSuccess('Admin email added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add admin email. Check console for details.');
      handleFirestoreError(err, OperationType.CREATE, 'allowed_admins');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'allowed_admins', id));
      
      // Update existing user role back to user
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const updatePromises = querySnapshot.docs
        .filter(docSnap => docSnap.data().email?.toLowerCase() === id.toLowerCase())
        .map(docSnap => updateDoc(doc(db, 'users', docSnap.id), { role: 'user' }));
      await Promise.all(updatePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `allowed_admins/${id}`);
    }
  };

  const handleAddUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate.trim() || !newChanges.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const changesArray = newChanges.split('\n').filter(c => c.trim());
      
      // Auto-generate version if not provided
      let version = newVersion.trim();
      if (!version && updateLogs.length > 0) {
        // Get the latest version and increment patch number
        const latestLog = updateLogs[0];
        if (latestLog.version) {
          const versionParts = latestLog.version.split('.');
          if (versionParts.length === 3) {
            const [major, minor, patch] = versionParts.map(Number);
            version = `${major}.${minor}.${patch + 1}`;
          }
        }
      }
      if (!version) {
        version = '1.0.0'; // Default first version
      }
      
      await addDoc(collection(db, 'update_logs'), {
        version: version,
        date: newDate.trim(),
        changes: changesArray
      });
      setNewVersion('');
      setNewDate(new Date().toISOString().slice(0, 16)); // Reset to current time
      setNewChanges('');
      setSuccess('Update log added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add update log.');
      handleFirestoreError(err, OperationType.CREATE, 'update_logs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUpdateLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'update_logs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `update_logs/${id}`);
    }
  };

  const handleApproveHallRequest = async (request: HallRequest) => {
    try {
      // Add to Hall of Cornballs
      await addDoc(collection(db, 'hall_of_autism'), {
        name: request.name,
        imageUrl: request.imageUrl,
        description: request.description || '',
        createdAt: serverTimestamp(),
        uploadedBy: 'admin_approved',
      });
      
      // Update request status
      await updateDoc(doc(db, 'hall_of_autism_requests', request.id), {
        status: 'approved'
      });
      
      setSuccess('Request approved and added to Hall of Cornballs!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to approve request.');
      handleFirestoreError(err, OperationType.CREATE, 'hall_of_autism');
    }
  };

  const handleDenyHallRequest = async (id: string) => {
    try {
      await updateDoc(doc(db, 'hall_of_autism_requests', id), {
        status: 'denied'
      });
      setSuccess('Request denied.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to deny request.');
      handleFirestoreError(err, OperationType.UPDATE, `hall_of_autism_requests/${id}`);
    }
  };

  const handleDeleteHallRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hall_of_autism_requests', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hall_of_autism_requests/${id}`);
    }
  };

  const handleApproveTakedown = async (request: TakedownRequest) => {
    try {
      // Delete the entry from Hall of Cornballs
      await deleteDoc(doc(db, 'hall_of_autism', request.entryId));
      
      // Update takedown request status
      await updateDoc(doc(db, 'hall_of_autism_takedowns', request.id), {
        status: 'approved'
      });
      
      setSuccess('Takedown approved and entry removed from Hall of Cornballs!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to approve takedown.');
      handleFirestoreError(err, OperationType.DELETE, `hall_of_autism/${request.entryId}`);
    }
  };

  const handleDenyTakedown = async (id: string) => {
    try {
      await updateDoc(doc(db, 'hall_of_autism_takedowns', id), {
        status: 'denied'
      });
      setSuccess('Takedown request denied.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to deny takedown.');
      handleFirestoreError(err, OperationType.UPDATE, `hall_of_autism_takedowns/${id}`);
    }
  };

  const handleDeleteTakedown = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'hall_of_autism_takedowns', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `hall_of_autism_takedowns/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/20 border border-accent/30">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Admin Dashboard</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Authorized Personnel Only</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all border border-white/5"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 px-6 overflow-x-auto custom-scrollbar">
        {[
          { id: 'announcements', icon: Megaphone, label: 'Announcements' },
          { id: 'suggestions', icon: Send, label: 'Suggestions' },
          { id: 'appeals', icon: AlertCircle, label: 'Appeals' },
          { id: 'hallrequests', icon: Users, label: 'Hall Requests' },
          { id: 'takedowns', icon: AlertTriangle, label: 'Takedowns' },
          { id: 'updatelogs', icon: GitCommit, label: 'Update Logs' },
          { id: 'analytics', icon: Activity, label: 'Analytics' },
          { id: 'upload', icon: Upload, label: 'Upload' },
          ...(isSuperAdmin || isAdmin ? [
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'banned', icon: Ban, label: 'Banned Users' },
            { id: 'admins', icon: ShieldCheck, label: 'Manage Admins' }
          ] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-accent' : 'text-neutral-500 hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {isLoading && activeTab !== 'analytics' && activeTab !== 'upload' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
        )}

        {!isLoading && activeTab === 'upload' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Upload New Content</h3>
            {uploadSuccess && <p className="text-green-500">{uploadSuccess}</p>}
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white">
              <option value="movie">Movie</option>
              <option value="anime">Anime</option>
              <option value="manga">Manga</option>
              <option value="tv">TV Show</option>
            </select>
            <input type="text" placeholder="Title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white" />
            <input type="text" placeholder="Google Drive Link" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white" />
            <input type="text" placeholder="Image Link" value={imageLink} onChange={(e) => setImageLink(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl p-3 text-white" />
            <button onClick={handleUpload} className="w-full bg-accent text-black font-black uppercase py-3 rounded-xl hover:bg-accent/90 transition-all">Upload</button>
          </div>
        )}
        {!isLoading && activeTab === 'announcements' && (
          <div className="space-y-8">
            {/* New Announcement Form */}
            <form onSubmit={handleAddAnnouncement} className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} className="text-accent" />
                New Announcement
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
                <textarea
                  placeholder="Announcement Content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                    <CheckCircle2 size={14} />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Recent Announcements</h3>
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 italic text-sm">No announcements found.</div>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{ann.title}</h4>
                        {!ann.active && <span className="text-[8px] font-black uppercase tracking-widest bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">Inactive</span>}
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{ann.content}</p>
                      <p className="text-[9px] font-mono text-neutral-600">
                        {ann.createdAt?.toDate().toLocaleString() || 'Just now'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => toggleAnnouncementStatus(ann.id, ann.active)}
                        className={`p-2 rounded-lg transition-all ${ann.active ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                        title={ann.active ? 'Deactivate' : 'Activate'}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">User Suggestions</h3>
              <div className="flex gap-2">
                {(['all', 'pending', 'reviewed'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSuggestionFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      suggestionFilter === filter ? 'bg-accent text-white' : 'bg-white/5 text-neutral-500 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            {suggestions.filter(s => suggestionFilter === 'all' || s.status === suggestionFilter).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No suggestions found.</div>
            ) : (
              suggestions.filter(s => suggestionFilter === 'all' || s.status === suggestionFilter).map((suggestion) => (
                <div key={suggestion.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{suggestion.userEmail}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        suggestion.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                      }`}>
                        {suggestion.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed break-words">{suggestion.text}</p>
                    <p className="text-[9px] font-mono text-neutral-600">
                      {suggestion.createdAt?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    {suggestion.status === 'pending' && (
                      <button 
                        onClick={() => handleMarkSuggestionReviewed(suggestion.id)}
                        className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"
                        title="Mark as Reviewed"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteSuggestion(suggestion.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Delete Suggestion"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'updatelogs' && (
          <div className="space-y-8">
            {/* New Update Log Form */}
            <form onSubmit={handleAddUpdateLog} className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Plus size={16} className="text-accent" />
                New Update Log
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Version (auto-generated if empty)"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all"
                />
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all"
                  required
                />
                <textarea
                  placeholder="Changes (one per line)&#10;Example:&#10;Added new feature&#10;Fixed bug&#10;Improved performance"
                  value={newChanges}
                  onChange={(e) => setNewChanges(e.target.value)}
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent/80 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Adding...' : 'Add Update Log'}
              </button>
              
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-green-500 text-xs font-bold bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                    <CheckCircle2 size={14} />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* List */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Update History</h3>
              {updateLogs.length === 0 ? (
                <div className="text-center py-12 text-neutral-600 italic text-sm">No update logs found.</div>
              ) : (
                updateLogs.map((log) => (
                  <div key={log.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {log.version && <span className="text-accent font-bold text-xs bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">v{log.version}</span>}
                        <span className="text-[10px] text-neutral-500 font-mono">{log.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {log.changes.map((change, idx) => (
                          <li key={idx} className="text-xs text-neutral-300 leading-relaxed">• {change}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleDeleteUpdateLog(log.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'hallrequests' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Hall of Cornballs Requests</h3>
            {hallRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No pending requests.</div>
            ) : (
              hallRequests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex gap-4 group hover:border-white/10 transition-all">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-bg shrink-0">
                    <img
                      src={request.imageUrl}
                      alt={request.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + request.id + '/200/200';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-lg rainbow-text">{request.name}</h4>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    </div>
                    {request.description && (
                      <p className="text-sm text-neutral-300 leading-relaxed">{request.description}</p>
                    )}
                    <p className="text-[10px] text-neutral-500">
                      Requested by: <span className="text-white">{request.requestedByEmail}</span>
                    </p>
                    <p className="text-[9px] font-mono text-neutral-600">
                      {request.createdAt?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => handleApproveHallRequest(request)}
                      className="px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Approve & Add"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDenyHallRequest(request.id)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Deny Request"
                    >
                      <X size={14} />
                      Deny
                    </button>
                    <button 
                      onClick={() => handleDeleteHallRequest(request.id)}
                      className="px-4 py-2 rounded-lg bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Delete Request"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'takedowns' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Takedown Requests</h3>
            {takedownRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No pending takedown requests.</div>
            ) : (
              takedownRequests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-white/5 border border-red-500/20 rounded-2xl p-5 flex gap-4 group hover:border-red-500/30 transition-all">
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-bg shrink-0">
                    <img
                      src={request.entryImageUrl}
                      alt={request.entryName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + request.id + '/200/200';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-red-500" size={18} />
                      <h4 className="font-bold text-white text-lg">{request.entryName}</h4>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                        Takedown Request
                      </span>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Reason:</p>
                      <p className="text-sm text-neutral-300 leading-relaxed">{request.reason}</p>
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      Requested by: <span className="text-white">{request.requestedByEmail}</span>
                    </p>
                    <p className="text-[9px] font-mono text-neutral-600">
                      {request.createdAt?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => handleApproveTakedown(request)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Approve & Remove Entry"
                    >
                      <Check size={14} />
                      Remove Entry
                    </button>
                    <button 
                      onClick={() => handleDenyTakedown(request.id)}
                      className="px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Deny Takedown"
                    >
                      <X size={14} />
                      Keep Entry
                    </button>
                    <button 
                      onClick={() => handleDeleteTakedown(request.id)}
                      className="px-4 py-2 rounded-lg bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                      title="Delete Request"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(isSuperAdmin || isAdmin) && activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">User Management</h3>
              {isSuperAdmin && (
                <button onClick={handleRemoveAllAdmins} className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  Remove All Admins
                </button>
              )}
              <div className="flex gap-2">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="co-owner">Co-Owner</option>
                  <option value="owner">Owner</option>
                  <option value="donator">Donator</option>
                  <option value="tester">Tester</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by email or username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-accent/50 w-64"
                />
              </div>
            </div>
            {users.filter(user => {
              const matchesSearch = !userSearchQuery || user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) || user.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase());
              const matchesRole = roleFilter === 'all' || user.role === roleFilter;
              return matchesSearch && matchesRole && !user.banned;
            }).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No users found.</div>
            ) : (
              users.filter(user => {
                const matchesSearch = !userSearchQuery || user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) || user.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase());
                const matchesRole = roleFilter === 'all' || user.role === roleFilter;
                return matchesSearch && matchesRole && !user.banned;
              }).map((user) => (
                <div key={user.uid} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{user.displayName || 'Anonymous'}</h4>
                      <p className="text-xs text-neutral-400">{user.email}</p>
                      {user.createdAt && (
                        <p className="text-[10px] text-neutral-500 mt-1">
                          Joined: {user.createdAt.toDate().toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-2">
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as any)}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
                        disabled={!isSuperAdmin && (user.role === 'admin' || user.role === 'owner' || user.role === 'co-owner')}
                      >
                        <option value="user">User</option>
                        <option value="donator">Donator</option>
                        <option value="tester">Tester</option>
                        {isSuperAdmin && (
                          <>
                            <option value="admin">Admin</option>
                            <option value="co-owner">Co-Owner</option>
                            <option value="owner">Owner</option>
                          </>
                        )}
                      </select>
                      
                      {user.uid !== 'HfjrcUIslZPCvNI3fxiQJVK1ebB3' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleBan(user.uid, !!user.banned)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              user.banned 
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            }`}
                          >
                            {user.banned ? (
                              <>
                                <UserCheck size={12} />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban size={12} />
                                Ban User
                              </>
                            )}
                          </button>
                          
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.uid)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-red-600/10 text-red-600 hover:bg-red-600/20"
                              title="Permanently Delete Account"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {(isSuperAdmin || isAdmin) && activeTab === 'banned' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Banned Users</h3>
            {users.filter(user => user.banned).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No banned users found.</div>
            ) : (
              users.filter(user => user.banned).map((user) => (
                <div key={user.uid} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{user.displayName || 'Anonymous'}</h4>
                      <p className="text-xs text-neutral-400">{user.email}</p>
                      <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-widest">Banned</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBan(user.uid, !!user.banned)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  >
                    <UserCheck size={12} />
                    Unban
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {(isSuperAdmin || isAdmin) && activeTab === 'admins' && (
          <div className="space-y-6">
            <form onSubmit={handleAddAdmin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-accent">Add New Admin</h3>
              
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 size={16} />
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newAdminEmail.trim()}
                className="w-full py-3 rounded-xl bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={18} />
                    Add Admin
                  </>
                )}
              </button>
            </form>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Allowed Admins</h3>
                <button onClick={handleRemoveAllAdmins} className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  Remove All Admins
                </button>
              </div>
              {allowedAdmins.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm italic">
                  No additional admins added yet.
                </div>
              ) : (
                allowedAdmins.map((admin) => (
                  <div key={admin.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{admin.email}</h4>
                      <p className="text-xs text-neutral-500 mt-1">
                        Added: {admin.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove Admin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'appeals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Ban Appeals</h3>
              <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'denied'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setAppealFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      appealFilter === filter ? 'bg-accent text-white' : 'bg-white/5 text-neutral-500 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            {appeals.filter(a => appealFilter === 'all' || a.status === appealFilter).length === 0 ? (
              <div className="text-center py-12 text-neutral-600 italic text-sm">No appeals found.</div>
            ) : (
              appeals.filter(a => appealFilter === 'all' || a.status === appealFilter).map((appeal) => (
                <div key={appeal.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-start justify-between group hover:border-white/10 transition-all">
                  <div className="space-y-2 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{appeal.userEmail}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        appeal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                        appeal.status === 'approved' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {appeal.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed break-words">{appeal.reason}</p>
                    <p className="text-[9px] font-mono text-neutral-600">
                      {appeal.createdAt?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                  {appeal.status === 'pending' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button 
                        onClick={() => handleAppealAction(appeal.id, appeal.userId, 'approved')}
                        className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors"
                        title="Approve Appeal (Unban)"
                      >
                        <UserCheck size={14} />
                      </button>
                      <button 
                        onClick={() => handleAppealAction(appeal.id, appeal.userId, 'denied')}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                        title="Deny Appeal"
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsTab = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || window.location.origin;
        console.log('Fetching analytics from:', apiUrl);
        fetch(`${apiUrl}/api/analytics/data`)
            .then(res => {
                console.log('Response status:', res.status);
                if (!res.ok) throw new Error('Failed to fetch analytics');
                return res.json();
            })
            .then(data => {
                // Map GA4 data to a format Recharts can use
                const formattedData = data.rows?.map((row: any) => ({
                    date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    activeUsers: parseInt(row.metricValues[0].value, 10)
                })).sort((a: any, b: any) => a.date.localeCompare(b.date)) || [];
                
                setData(formattedData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load analytics data.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6 text-center text-neutral-500">Loading analytics...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-6">Active Users (Last 30 Days)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" fontSize={10} />
                        <YAxis stroke="#666" fontSize={10} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="activeUsers" stroke="#F27D26" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default AdminDashboard;
