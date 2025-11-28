import React, { useState, useEffect, useRef } from 'react';
import { Camera, Warehouse, Zap, Gauge, DollarSign, X, Shield, Award, Car, ScanLine, Maximize2, Minimize2, LogOut, Lock, Mail, ChevronRight, User, Users, ShoppingBag, CheckCircle, Target, TrendingUp, Activity, Star, Copy, Key, Settings, Image as ImageIcon, Upload, Aperture, AlertTriangle, Save, Edit2, Trophy, BarChart3, Crown, Hexagon, Medal, Eye, ArrowLeft, Fuel, Trash2, AlertOctagon, MapPin, Heart, LayoutGrid, Grid, Calendar, Flag } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, where, getDocs, increment, deleteDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ==================================================================================
// CONFIGURAZIONE FIREBASE
// ==================================================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTjQYhYxwJ_CRtt4dbaCsc_JAkndIXZMQ",
  authDomain: "palmostreet.firebaseapp.com",
  projectId: "palmostreet",
  storageBucket: "palmostreet.firebasestorage.app",
  messagingSenderId: "944006205470",
  appId: "1:944006205470:web:825f46e49674d1269b1e0f",
  measurementId: "G-7WBYD0S53B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const appId = 'palmostreet-v16-garage-plus';

// --- UTILS & CONSTANTS ---
const API_KEY_STORAGE_KEY = 'palmostreet_gemini_key';

// Avatar di default
const DEFAULT_USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png"; 

const RARITY_CONFIG: any = {
  Vintage: { color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-950/80", shadow: "shadow-orange-500/50", gradient: "from-orange-900 via-black to-black" },
  Legendary: { color: "text-yellow-400", border: "border-yellow-400", bg: "bg-yellow-950/80", shadow: "shadow-yellow-500/50", gradient: "from-yellow-900 via-black to-black" },
  Epic: { color: "text-purple-500", border: "border-purple-500", bg: "bg-purple-950/80", shadow: "shadow-purple-500/50", gradient: "from-purple-900 via-black to-black" },
  SuperRare: { color: "text-blue-500", border: "border-blue-500", bg: "bg-blue-950/80", shadow: "shadow-blue-500/50", gradient: "from-blue-900 via-black to-black" },
  Rare: { color: "text-green-500", border: "border-green-500", bg: "bg-green-950/80", shadow: "shadow-green-500/50", gradient: "from-green-900 via-black to-black" },
  Common: { color: "text-white", border: "border-slate-500", bg: "bg-slate-900/80", shadow: "shadow-slate-500/20", gradient: "from-slate-800 via-black to-black" },
};

// --- HELPERS ---
const calculateLevel = (xp: number) => {
    let level = 1;
    let requiredXp = 1000; 
    while (xp >= requiredXp) {
        xp -= requiredXp;
        level++;
        if (level <= 30) requiredXp = Math.floor(requiredXp * 1.25); 
        else requiredXp = 20000; 
    }
    return { level, currentLevelXp: xp, nextLevelXp: requiredXp };
};

const getMedals = (level: number, carCount: number) => {
    const medals = [];
    if (carCount >= 3) medals.push({ name: "Principiante", color: "text-blue-400", icon: <Star size={16} /> });
    if (level >= 10) medals.push({ name: "Bronzo", color: "text-orange-700", icon: <Medal size={16} /> });
    if (level >= 20) medals.push({ name: "Argento", color: "text-slate-300", icon: <Medal size={16} /> });
    if (level >= 30) medals.push({ name: "Oro", color: "text-yellow-500", icon: <Crown size={16} /> });
    return medals;
};

const resizeImage = (file: File, maxWidth: number = 600): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); 
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// --- COMPONENTS ---

const LoadingScanner = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-[100] backdrop-blur-md w-screen h-screen">
    <div className="relative flex items-center justify-center">
       <div className="w-24 h-24 border-4 border-slate-800 rounded-full opacity-50"></div>
       <div className="absolute w-24 h-24 border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
       <div className="absolute w-16 h-16 border-2 border-b-white border-t-transparent border-l-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
       <div className="absolute"><Zap className="text-red-500 animate-pulse" size={24} /></div>
    </div>
    <div className="mt-8 space-y-2 text-center">
        <h2 className="font-orbitron text-white text-lg tracking-[0.3em] font-bold animate-pulse">SYSTEM PROCESSING</h2>
        <div className="h-1 w-32 bg-slate-800 rounded-full mx-auto overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-red-600 to-transparent animate-[shimmer_1.5s_infinite]"></div>
        </div>
    </div>
  </div>
);

const NotificationPopup = ({ type, title, subtitle, onClose }: any) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed top-20 left-4 right-4 z-[200] animate-in slide-in-from-top duration-500">
            <div className={`bg-slate-900/90 backdrop-blur-md border-2 ${type === 'levelup' ? 'border-yellow-500' : 'border-green-500'} p-4 rounded-2xl shadow-2xl flex items-center space-x-4`}>
                <div className={`p-3 rounded-full ${type === 'levelup' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                    {type === 'levelup' ? <Crown size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                    <h4 className={`font-orbitron font-bold text-sm ${type === 'levelup' ? 'text-yellow-500' : 'text-green-500'}`}>{title}</h4>
                    <p className="text-xs text-white">{subtitle}</p>
                </div>
            </div>
        </div>
    );
};

// --- IMAGE VIEWER MODAL (FULLSCREEN) ---
const ImageViewerModal = ({ imageUrl, timestamp, onClose }: any) => (
    <div className="fixed inset-0 z-[90] bg-black flex flex-col items-center justify-center animate-in zoom-in-95" onClick={onClose}>
        <img src={imageUrl} className="max-w-full max-h-full object-contain" />
        <div className="absolute bottom-10 left-0 right-0 text-center">
            <p className="text-xs text-zinc-500 font-mono bg-black/50 inline-block px-3 py-1 rounded-full backdrop-blur-md">
                SCATTATA IL: {timestamp?.toDate().toLocaleString()}
            </p>
        </div>
        <button className="absolute top-6 right-6 p-2 bg-black/50 rounded-full text-white"><X size={24} /></button>
    </div>
);

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError("Email o password errati.");
      else if (err.code === 'auth/email-already-in-use') setError("Email già registrata.");
      else if (err.code === 'auth/weak-password') setError("Password troppo debole.");
      else setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-exo overflow-y-auto">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 w-full h-full pointer-events-none"></div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
            <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                PALMO<span className="text-red-600">STREET</span>
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.4em]">Street Collection System</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl w-full">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
               <div className="relative group">
                 <Mail className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                 <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="Email" />
               </div>
               <div className="relative group">
                 <Lock className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors" size={18} />
                 <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="Password" />
               </div>
            </div>
            {error && <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-xs text-center flex items-center justify-center"><Shield size={14} className="mr-2" /> {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest font-orbitron transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50">{loading ? 'CARICAMENTO...' : (isLogin ? 'ACCEDI' : 'REGISTRATI')}</button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => {setIsLogin(!isLogin); setError('');}} className="text-xs text-zinc-400 hover:text-white transition-colors">{isLogin ? "Nuovo pilota? " : "Hai un account? "} <span className="text-red-500 font-bold underline decoration-red-500/50 underline-offset-4">{isLogin ? "Crea Account" : "Login"}</span></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSetup = async () => {
    if (!nickname) return; 
    const finalAvatar = avatar || DEFAULT_USER_AVATAR;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        email: user.email, nickname: nickname, avatar: finalAvatar, xp: 0, 
        joinedAt: serverTimestamp(), friends: [], objectives: {}
      });

      await updateProfile(user, { displayName: nickname, photoURL: finalAvatar });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const resized = await resizeImage(file, 300);
      setAvatar(resized);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-exo overflow-y-auto">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 w-full h-full pointer-events-none"></div>
        <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-white/10 z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-orbitron font-bold mb-2 text-center text-white italic">IDENTITÀ PILOTA</h2>
            <div className="flex justify-center mb-8 relative">
                <div 
                  className={`w-32 h-32 rounded-full overflow-hidden border-4 ${avatar ? 'border-red-600' : 'border-zinc-700 border-dashed'} bg-black cursor-pointer group shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center transition-all hover:scale-105`} 
                  onClick={() => fileInputRef.current?.click()}
                >
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500 group-hover:text-red-500 transition-colors">
                        <Upload size={32} className="mb-2" />
                        <span className="text-[10px] uppercase font-bold">Carica Foto</span>
                        <span className="text-[8px] text-zinc-600 mt-1">(Opzionale)</span>
                      </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            
            <div className="space-y-4">
                <input type="text" placeholder="Scegli il tuo Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white text-center font-bold focus:border-red-500 outline-none transition-colors" />
                <button onClick={handleProfileSetup} disabled={loading || !nickname} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold font-orbitron text-lg uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">{loading ? 'SALVATAGGIO...' : 'INIZIA CARRIERA'}</button>
            </div>
        </div>
    </div>
  );
};

// --- SETTINGS MODAL ---
const SettingsModal = ({ onClose, currentKey, onSaveKey, userProfile }: any) => {
  const [key, setKey] = useState(currentKey);
  const [newNickname, setNewNickname] = useState(userProfile?.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onSaveKey(key);
    if (newNickname !== userProfile?.nickname) {
        try {
            const user = auth.currentUser;
            if (user) {
                await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { nickname: newNickname });
                await updateProfile(user, { displayName: newNickname });
            }
        } catch(e) { console.error("Errore cambio nick:", e); }
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in w-screen h-screen">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
        <h3 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center"><Settings className="mr-2" /> IMPOSTAZIONI</h3>
        <div className="mb-6"><label className="text-xs uppercase text-zinc-500 font-bold mb-2 block flex items-center"><User size={12} className="mr-1"/> Nickname</label><input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3 rounded-lg text-white text-sm focus:border-red-500 outline-none" /></div>
        <div className="mb-6"><label className="text-xs uppercase text-zinc-500 font-bold mb-2 block flex items-center"><Key size={12} className="mr-1"/> Gemini API Key</label><input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Incolla qui la tua API Key..." className="w-full bg-black/50 border border-white/20 p-3 rounded-lg text-white text-sm focus:border-red-500 outline-none" /><p className="text-[10px] text-zinc-500 mt-2">Necessaria per il riconoscimento AI reale.</p></div>
        <div className="flex space-x-3"><button onClick={handleSave} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold text-white uppercase text-xs tracking-widest flex items-center justify-center">{saving ? 'SALVATAGGIO...' : 'SALVA MODIFICHE'}</button><button onClick={onClose} className="px-4 py-3 rounded-xl font-bold text-zinc-400 hover:text-white uppercase text-xs border border-white/10 hover:bg-white/5">CHIUDI</button></div>
        <div className="mt-6 pt-6 border-t border-white/10 text-center"><button onClick={() => {signOut(auth); window.location.reload();}} className="text-red-500 text-xs font-bold flex items-center justify-center mx-auto hover:text-red-400"><LogOut size={14} className="mr-2" /> DISCONNETTI</button></div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel, isDestructive = false }: any) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
        <div className={`bg-slate-900 border-2 ${isDestructive ? 'border-red-600' : 'border-white/20'} p-6 rounded-2xl w-full max-w-xs text-center shadow-2xl`}>
            {isDestructive && <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />}
            <h3 className="font-orbitron font-bold text-white text-lg mb-2">{title}</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">{message}</p>
            <div className="flex space-x-3">
                <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-zinc-400 border border-white/10 hover:bg-white/5">ANNULLA</button>
                <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-white ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600'}`}>CONFERMA</button>
            </div>
        </div>
    </div>
);

// --- FRIEND GARAGE MODAL ---
const FriendGarageModal = ({ friendId, onClose }: any) => {
    const [friendCars, setFriendCars] = useState<any[]>([]);
    const [friendName, setFriendName] = useState('Amico');
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<any>(null); 
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null); 

    useEffect(() => {
        const loadFriendData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', friendId));
                if (userDoc.exists()) setFriendName(userDoc.data().nickname || 'Amico');
                const q = query(collection(db, 'artifacts', appId, 'users', friendId, 'garage'), orderBy('timestamp', 'desc'));
                const snapshot = await getDocs(q);
                setFriendCars(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        loadFriendData();
    }, [friendId]);

    return (
        <div className="fixed inset-0 z-[80] bg-slate-950 w-screen h-screen overflow-y-auto animate-in slide-in-from-right duration-300">
            {fullScreenImage && <ImageViewerModal imageUrl={fullScreenImage} timestamp={null} onClose={() => setFullScreenImage(null)} />}
            
            <div className="sticky top-0 bg-slate-900/90 backdrop-blur-md p-4 border-b border-white/10 flex items-center space-x-4 z-10">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><ArrowLeft className="text-white" /></button>
                <div><h2 className="font-orbitron font-bold text-white text-lg">GARAGE DI {friendName.toUpperCase()}</h2><p className="text-xs text-zinc-400">{friendCars.length} AUTO</p></div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                {loading ? (<div className="col-span-full text-center py-20 text-zinc-500">Caricamento garage...</div>) : friendCars.length === 0 ? (<div className="col-span-full text-center py-20 text-zinc-500">Questo garage è vuoto.</div>) : (
                    friendCars.map(car => (
                        <div key={car.id} className="relative bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden" onClick={() => setFullScreenImage(car.imageUrl)}>
                            <div className="h-40 w-full bg-black relative"><img src={car.imageUrl} className="w-full h-full object-cover opacity-80" /><div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white border border-white/20">{car.rarity}</div></div>
                            <div className="p-3"><h3 className="font-orbitron font-bold text-white leading-none">{car.model}</h3><p className="text-[10px] text-zinc-500 uppercase">{car.brand}</p><div className="mt-2 text-xs font-mono text-zinc-400">{car.hp} HP • €{car.value?.toLocaleString()}</div></div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const OBJECTIVES_LIST = [
    { id: 'first_scan', text: "Scansiona la tua prima auto", xp: 200, rarity: "Common" },
    { id: 'find_legendary', text: "Trova una Leggendaria", xp: 2000, rarity: "Legendary" },
    { id: 'find_vintage', text: "Trova una Vintage", xp: 1000, rarity: "Vintage" },
    { id: 'garage_value_100k', text: "Garage > 100k €", xp: 1000, rarity: "Epic" },
    { id: 'collector_10', text: "Possiedi 10 auto", xp: 1500, rarity: "SuperRare" },
    { id: 'find_italian', text: "Trova un'auto Italiana", xp: 800, rarity: "Rare" },
    { id: 'high_speed', text: "Trova auto Velocità 5/5", xp: 1200, rarity: "Epic" },
];

// --- MAIN APP ---
export default function PalmostreetApp() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [view, setView] = useState('garage');
  const [cars, setCars] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [friends, setFriends] = useState<any[]>([]); 
  const [notification, setNotification] = useState<any>(null);
  const [viewingFriend, setViewingFriend] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: 'car'|'friend', id: string} | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Garage View State
  const [gridColumns, setGridColumns] = useState(1); // 1 = large, 2 = compact

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const levelInfo = userData ? calculateLevel(userData.xp || 0) : { level: 1, currentLevelXp: 0, nextLevelXp: 100 };

  // Sort cars: Favorites first, then by timestamp
  const sortedCars = [...cars].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.timestamp - a.timestamp;
  });

  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) setApiKey(storedKey);
    const enterFullScreen = () => { if (!document.fullscreenElement && containerRef.current) { containerRef.current.requestFullscreen().catch(() => {}); } };
    document.addEventListener('click', enterFullScreen, { once: true });
    return () => document.removeEventListener('click', enterFullScreen);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const unsubUser = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid), (doc) => { 
            if (doc.exists()) { setUserData(doc.data()); setFriends(doc.data().friends || []); } else { setUserData(null); } 
        });
        const qCars = query(collection(db, 'artifacts', appId, 'users', u.uid, 'garage'), orderBy('timestamp', 'desc'));
        const unsubCars = onSnapshot(qCars, (snap) => { 
            const loadedCars = snap.docs.map(d => ({id: d.id, ...d.data()}));
            setCars(loadedCars);
        });
        return () => { unsubUser(); unsubCars(); };
      } else { setUserData(null); setCars([]); }
    });
    return () => unsubAuth();
  }, []); 

  useEffect(() => {
      if (user && userData && cars.length > 0) {
          const check = async () => {
              const updates: any = {};
              let xpGained = 0;
              let newNotification = null;
              const complete = (id: string, xp: number, text: string) => {
                  if (!userData.objectives?.[id]) {
                      updates[`objectives.${id}`] = true;
                      xpGained += xp;
                      newNotification = { type: 'objective', title: "OBIETTIVO COMPLETATO!", subtitle: `${text} (+${xp} XP)` };
                  }
              };
              if (cars.length > 0) complete('first_scan', 200, "Scansiona la tua prima auto");
              if (cars.some(c => c.rarity === 'Legendary')) complete('find_legendary', 2000, "Trova una Leggendaria");
              if (cars.some(c => c.rarity === 'Vintage')) complete('find_vintage', 1000, "Trova una Vintage");
              const totalValue = cars.reduce((acc, c) => acc + (c.value || 0), 0);
              if (totalValue > 100000) complete('garage_value_100k', 1000, "Garage > 100k");
              if (cars.length >= 10) complete('collector_10', 1500, "Possiedi 10 auto");
              if (cars.some(c => c.scores?.speed >= 5)) complete('high_speed', 1200, "Auto Velocità Max");
              const italianBrands = ['ferrari', 'lamborghini', 'maserati', 'fiat', 'alfa romeo', 'lancia', 'pagani'];
              if (cars.some(c => italianBrands.some(b => c.brand?.toLowerCase().includes(b)))) complete('find_italian', 800, "Trova Auto Italiana");
              if (xpGained > 0) {
                  updates['xp'] = increment(xpGained);
                  await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), updates);
                  if (newNotification) setNotification(newNotification);
              }
          };
          check();
      }
  }, [cars.length, userData?.xp]); 

  useEffect(() => {
      if (userData?.xp) {
          const currentLevel = calculateLevel(userData.xp).level;
          const prevXp = userData.xp - 1; 
          const prevLevel = calculateLevel(prevXp).level;
          if (currentLevel > prevLevel && prevLevel > 0) setNotification({ type: 'levelup', title: "LEVEL UP!", subtitle: `Hai raggiunto il livello ${currentLevel}` });
      }
  }, [userData?.xp]);

  const saveApiKey = (key: string) => { setApiKey(key); localStorage.setItem(API_KEY_STORAGE_KEY, key); };
  const determineRarity = (year: number, value: number, hp: number) => { if (year < 1990) return "Vintage"; if (value > 200000 || hp > 600) return "Legendary"; if (value > 80000 || hp > 400) return "Epic"; if (value > 40000 || hp > 300) return "SuperRare"; if (value > 20000 || hp > 180) return "Rare"; return "Common"; };

  const handleScan = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
        const compressedBase64 = await resizeImage(file, 600);
        const base64Data = compressedBase64.split(',')[1];
        let aiResult;
        if (apiKey) {
           try {
             const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: "Analyze this car image. Return strictly JSON with: brand (string), model (string), year (number), hp (number), value_eur (number estimated market value), list_price_eur (number original list price), engine_type (string e.g. V8, I4 Turbo), nationality (string e.g. Italy, Germany), history (string short fun fact/history 1 sentence), description (italian string), scores: { speed (1-5), versatility (1-5), quality_price (1-5), durability (1-5) }" }, { inlineData: { mimeType: 'image/jpeg', data: base64Data } }] }] }) });
             const data = await response.json();
             const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
             if(text) { const jsonMatch = text.match(/\{[\s\S]*\}/); aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null; }
           } catch (err) { console.error("API Error", err); }
        }
        if (!aiResult) { 
            await new Promise(r => setTimeout(r, 2000)); 
            aiResult = { brand: "Simulazione", model: "Auto Demo", year: 2024, hp: 200, value_eur: 30000, list_price_eur: 35000, engine_type: "4 Cilindri Turbo", nationality: "Italia", history: "Auto di test simulata dal sistema.", description: "Modalità simulazione attiva. Configura la API Key nelle Impostazioni per l'AI reale.", scores: { speed: 3, versatility: 4, quality_price: 5, durability: 4 }, isSimulation: true }; 
        }
        const rarity = determineRarity(aiResult.year, aiResult.value_eur, aiResult.hp);
        const newCar = { ...aiResult, value: aiResult.value_eur, list_price: aiResult.list_price_eur, engine: aiResult.engine_type, nationality: aiResult.nationality, history: aiResult.history, rarity: rarity, imageUrl: compressedBase64, timestamp: serverTimestamp(), method: 'AI_VISION', isFavorite: false };
        setSelectedCar({ ...newCar, isPreview: true });
    } catch (error: any) { console.error("Error:", error); alert("Errore durante l'analisi: " + error.message); } finally { setLoading(false); }
  };

  const saveCarToGarage = async () => {
    if (!selectedCar || !user) { alert("Errore: Utente non loggato o dati auto mancanti."); return; }
    setLoading(true);
    try { const { isPreview, ...carData } = selectedCar; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'garage'), carData); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { xp: increment(50) }); setSelectedCar(null); setView('garage'); } catch (e: any) { console.error(e); alert("Errore salvataggio garage: " + e.message); } finally { setLoading(false); }
  };

  const addFriend = async (friendId: string) => { if (!friendId) return; const newFriend = { id: friendId, addedAt: new Date().toISOString() }; const updatedFriends = [...friends, newFriend]; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { friends: updatedFriends }); };
  const handleDeleteCar = async () => { if (!itemToDelete || itemToDelete.type !== 'car' || !selectedCar) return; setLoading(true); try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'garage', itemToDelete.id)); setItemToDelete(null); setSelectedCar(null); } catch(e: any) { console.error(e); alert("Errore rottamazione: " + e.message); } finally { setLoading(false); } };
  const handleDeleteFriend = async () => { if (!itemToDelete || itemToDelete.type !== 'friend') return; setLoading(true); try { const updatedFriends = friends.filter(f => f.id !== itemToDelete.id); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { friends: updatedFriends }); setItemToDelete(null); } catch(e: any) { console.error(e); alert("Errore rimozione amico: " + e.message); } finally { setLoading(false); } };
  const toggleFavorite = async (car: any) => { if(!car || !car.id) return; const newFavStatus = !car.isFavorite; try { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'garage', car.id), { isFavorite: newFavStatus }); if(selectedCar && selectedCar.id === car.id) setSelectedCar({...selectedCar, isFavorite: newFavStatus}); } catch(e) { console.error("Error toggling fav", e); } };

  const calculateGarageValue = () => cars.reduce((acc, car) => acc + (car.value || 0), 0);
  const countRarity = (rarity: string) => cars.filter(c => c.rarity === rarity).length;
  const medals = getMedals(levelInfo.level, cars.length);

  if (!user) return <AuthScreen />;
  if (userData === null) return <ProfileWizard onComplete={() => {}} />;

  return (
    <div ref={containerRef} className="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-200 font-exo selection:bg-red-500/30 overflow-hidden">
      <style>{` @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Orbitron:wght@400;700;900&display=swap'); .font-orbitron { font-family: 'Orbitron', sans-serif; } .font-exo { font-family: 'Exo 2', sans-serif; } .perspective-card { perspective: 1000px; } @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } `}</style>

      {notification && <NotificationPopup type={notification.type} title={notification.title} subtitle={notification.subtitle} onClose={() => setNotification(null)} />}

      {itemToDelete && <ConfirmationModal title={itemToDelete.type === 'car' ? "ROTTAMAZIONE" : "RIMUOVI AMICO"} message={itemToDelete.type === 'car' ? "Rottamando il veicolo lo perderai definitivamente. Il valore di mercato dell'auto non influirà più sul valore del tuo garage totale." : "Sei sicuro di voler rimuovere questo pilota dalla tua lista amici?"} isDestructive={true} onConfirm={itemToDelete.type === 'car' ? handleDeleteCar : handleDeleteFriend} onCancel={() => setItemToDelete(null)} />}
      {loading && <LoadingScanner />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} currentKey={apiKey} onSaveKey={saveApiKey} userProfile={userData} />}
      {viewingFriend && <FriendGarageModal friendId={viewingFriend} onClose={() => setViewingFriend(null)} />}
      {fullScreenImage && <ImageViewerModal imageUrl={fullScreenImage} timestamp={selectedCar?.timestamp} onClose={() => setFullScreenImage(null)} />}

      {selectedCar && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom duration-300 w-full h-full">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !selectedCar.isPreview && setSelectedCar(null)}></div>
            <div className={`relative w-full max-w-lg bg-gradient-to-b ${RARITY_CONFIG[selectedCar.rarity].gradient} rounded-t-3xl sm:rounded-3xl overflow-hidden border-t-2 sm:border-2 ${RARITY_CONFIG[selectedCar.rarity].border} shadow-2xl h-[90vh] sm:h-auto overflow-y-auto z-10`}>
                <div className="relative h-64 w-full bg-black group" onClick={() => !selectedCar.isPreview && setFullScreenImage(selectedCar.imageUrl)}>
                    <img src={selectedCar.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCar(null); }} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-red-600 transition-colors z-10"><X size={24} className="text-white" /></button>
                    {!selectedCar.isPreview && <button onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedCar); }} className={`absolute top-4 left-4 p-2 rounded-full transition-colors z-10 ${selectedCar.isFavorite ? 'bg-red-600 text-white' : 'bg-black/50 text-zinc-400 hover:text-white'}`}><Heart size={24} fill={selectedCar.isFavorite ? "currentColor" : "none"} /></button>}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end"><div><span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/80 border ${RARITY_CONFIG[selectedCar.rarity].color} ${RARITY_CONFIG[selectedCar.rarity].border} mb-2 inline-block`}>{selectedCar.rarity}</span><h2 className="text-3xl font-orbitron font-black text-white italic uppercase leading-none">{selectedCar.model}</h2><p className="text-zinc-400 font-bold uppercase tracking-widest flex items-center">{selectedCar.brand} {selectedCar.nationality && <span className="ml-2 text-[10px] border border-white/20 px-1 rounded flex items-center"><Flag size={10} className="mr-1"/> {selectedCar.nationality}</span>}</p></div></div>
                </div>
                <div className="p-6 space-y-6">
                    {selectedCar.isSimulation && (<div className="bg-yellow-900/30 border border-yellow-500/50 p-3 rounded-lg flex items-start space-x-3"><Key className="text-yellow-500 shrink-0 mt-1" size={18} /><div><h4 className="text-sm font-bold text-yellow-500">MODALITÀ SIMULAZIONE</h4><p className="text-xs text-zinc-400 mt-1">Vai in Impostazioni e inserisci API Key per dati reali.</p></div></div>)}
                    
                    {/* INFO GRID */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Valore Mercato</span><span className="text-lg font-mono text-green-400">€{selectedCar.value?.toLocaleString()}</span></div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Potenza</span><span className="text-lg font-mono text-red-400">{selectedCar.hp} HP</span></div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Listino Originale</span><span className="text-sm font-mono text-zinc-300">€{selectedCar.list_price?.toLocaleString() || 'N/A'}</span></div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Motore</span><span className="text-sm font-mono text-zinc-300 flex items-center"><Fuel size={12} className="mr-1"/> {selectedCar.engine || 'N/A'}</span></div>
                    </div>

                    {/* HISTORY SECTION */}
                    {selectedCar.history && (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center"><Activity size={14} className="mr-1"/> LO SAPEVI CHE?</h4>
                            <p className="text-xs text-zinc-300 italic leading-relaxed">"{selectedCar.history}"</p>
                        </div>
                    )}

                    <div className="space-y-3"><h3 className="font-orbitron text-sm text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-1">Performance Index</h3>{selectedCar.scores && Object.entries(selectedCar.scores).map(([key, score]) => (<div key={key} className="flex items-center justify-between"><span className="text-xs uppercase text-zinc-300 font-bold w-24">{(key as string).replace('_', ' ')}</span><div className="flex-1 h-2 bg-black rounded-full mx-3 overflow-hidden"><div className={`h-full ${(score as number) >= 4 ? 'bg-green-500' : (score as number) >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${((score as number)/5)*100}%`}}></div></div><span className="text-xs font-mono font-bold w-6 text-right">{score as number}/5</span></div>))}</div>
                    
                    {/* BUTTON VAI AL GARAGE OR ROTTAMA */}
                    {selectedCar.isPreview ? (
                        <button onClick={saveCarToGarage} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest font-orbitron shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse flex items-center justify-center space-x-2 active:scale-95 transition-transform"><span>VAI AL GARAGE</span><ChevronRight size={20} /></button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-center"><span className="text-[10px] font-mono text-zinc-600 flex items-center"><Calendar size={12} className="mr-1"/> {selectedCar.timestamp?.toDate().toLocaleDateString()}</span></div>
                            <button onClick={() => setItemToDelete({type: 'car', id: selectedCar.id})} className="w-full border border-red-900/50 bg-red-950/20 text-red-700 py-3 rounded-xl font-bold uppercase text-xs flex items-center justify-center hover:bg-red-900/40 hover:text-red-500 transition-colors"><Trash2 size={14} className="mr-2" /> ROTTAMA AUTOMOBILE</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-gradient-to-b from-slate-950 to-transparent p-4 z-30 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex items-center space-x-3 cursor-pointer" onClick={() => setView('profile')}>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500 bg-black"><img src={userData?.avatar} alt="Profile" className="w-full h-full object-cover" /></div>
            <div>
                <div className="text-xs font-bold text-white uppercase">{userData?.nickname}</div>
                <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
                    <span className="font-orbitron font-bold text-yellow-500">LVL {levelInfo.level}</span>
                    <span>•</span>
                    <span className="text-blue-400">{userData?.xp || 0} XP</span>
                </div>
            </div>
        </div>
        <div className="flex items-start space-x-2 pointer-events-auto">
             <button onClick={() => setShowSettings(true)} className="bg-slate-900/80 backdrop-blur border border-white/10 p-2 rounded-full hover:bg-white/10 text-zinc-400"><Settings size={18} /></button>
        </div>
      </header>

      {/* VIEWS (Scrollable Container) */}
      <main className="absolute inset-0 pt-20 pb-24 px-4 w-full h-full overflow-y-auto">
        
        {/* VIEW: GARAGE */}
        {view === 'garage' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 w-full pb-8">
                <div className="flex justify-between items-end w-full">
                    <h2 className="text-2xl font-orbitron font-bold text-white">GARAGE</h2>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setGridColumns(gridColumns === 1 ? 2 : 1)} className="text-zinc-400 hover:text-white p-1 rounded border border-white/10 bg-slate-900">{gridColumns === 1 ? <Grid size={16} /> : <LayoutGrid size={16} />}</button>
                        <span className="text-xs font-mono text-zinc-500">{cars.length} AUTO</span>
                    </div>
                </div>
                <div className={`grid gap-4 w-full ${gridColumns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {sortedCars.map(car => (
                        <div key={car.id} onClick={() => setSelectedCar(car)} className="perspective-card group cursor-pointer w-full">
                            <div className={`relative bg-slate-900 border-2 ${RARITY_CONFIG[car.rarity].border} rounded-xl overflow-hidden transform transition-transform duration-300 group-hover:scale-[1.02] shadow-2xl w-full`}>
                                {car.isFavorite && <div className="absolute top-2 left-2 z-20"><Heart size={16} className="text-red-600 fill-red-600 drop-shadow-md" /></div>}
                                <div className={`${gridColumns === 1 ? 'h-48' : 'h-32'} w-full bg-black relative overflow-hidden`}><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.2),transparent)]"></div><img src={car.imageUrl} className="w-full h-full object-contain mix-blend-normal z-10 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" /><div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-0"></div></div>
                                <div className="p-3 bg-slate-900 relative z-20">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="overflow-hidden"><h3 className={`font-orbitron font-bold text-white leading-none truncate ${gridColumns === 1 ? 'text-lg' : 'text-sm'}`}>{car.model}</h3><span className="text-[10px] uppercase text-zinc-500 tracking-wider truncate block">{car.brand}</span></div>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${RARITY_CONFIG[car.rarity].color} ${RARITY_CONFIG[car.rarity].border} shrink-0 ml-1`}>{gridColumns === 1 ? car.rarity : car.rarity.slice(0,1)}</span>
                                    </div>
                                    {gridColumns === 1 && <><div className="w-full h-[1px] bg-white/10 mb-2 mt-1"></div><div className="flex justify-between text-xs font-mono text-zinc-400"><span>{car.year}</span><span>{car.hp} HP</span></div></>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {cars.length === 0 && (<div className="col-span-full py-20 text-center opacity-50 w-full"><Warehouse size={48} className="mx-auto mb-4 text-zinc-600" /><p>IL TUO GARAGE È VUOTO</p><p className="text-xs mt-2">Usa lo scanner per iniziare</p></div>)}
                </div>
            </div>
        )}

        {/* VIEW: SCANNER */}
        {view === 'scan' && (
            <div className="flex flex-col items-center justify-center min-h-full w-full space-y-6 py-10">
                <label className="w-full max-w-sm bg-red-600/10 border-2 border-red-600 rounded-2xl p-6 flex items-center space-x-4 cursor-pointer active:scale-95 transition-transform hover:bg-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                    <div className="bg-red-600 p-4 rounded-full text-white shadow-lg"><Camera size={32} /></div>
                    <div className="text-left flex-1"><h3 className="font-orbitron font-bold text-white text-xl">SCATTA FOTO</h3><p className="text-xs text-zinc-400">Fotocamera</p></div>
                    <ChevronRight className="text-red-600" />
                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleScan} />
                </label>
                <label className="w-full max-w-sm bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-6 flex items-center space-x-4 cursor-pointer active:scale-95 transition-transform hover:bg-slate-700/50">
                    <div className="bg-slate-700 p-4 rounded-full text-white shadow-lg"><ImageIcon size={32} /></div>
                    <div className="text-left flex-1"><h3 className="font-orbitron font-bold text-white text-xl">GALLERIA</h3><p className="text-xs text-zinc-400">Carica foto</p></div>
                    <ChevronRight className="text-slate-500" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleScan} />
                </label>
                <p className="text-xs text-zinc-500 mt-4 text-center max-w-xs px-4 border-t border-white/5 pt-4">L'AI analizzerà la foto per determinare modello, valore e rarità.</p>
            </div>
        )}

        {/* VIEW: SOCIAL & SEASON */}
        {view === 'social' && (
            <div className="space-y-8 animate-in slide-in-from-right w-full pb-8">
                <div>
                    <h3 className="font-orbitron font-bold text-white mb-4 flex items-center"><Target className="mr-2 text-red-500" /> STAGIONE 1</h3>
                    <div className="space-y-3">
                        {OBJECTIVES_LIST.map(obj => {
                            const isDone = userData?.objectives?.[obj.id];
                            return (
                                <div key={obj.id} className={`p-4 rounded-xl border ${isDone ? 'border-green-500 bg-green-900/20' : 'border-white/10 bg-gradient-to-r ' + RARITY_CONFIG[obj.rarity].bg} flex justify-between items-center w-full relative overflow-hidden`}>
                                    {isDone && <div className="absolute inset-0 bg-green-500/10 pointer-events-none"></div>}
                                    <div><div className="font-bold text-sm text-white">{obj.text}</div><div className="text-[10px] text-zinc-400 mt-1 flex space-x-3"><span className="text-blue-400 font-bold">+{obj.xp} XP</span></div></div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>{isDone && <CheckCircle size={14} className="text-black" />}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4 w-full"><h3 className="font-orbitron font-bold text-white flex items-center"><Users className="mr-2 text-blue-500" /> AMICI</h3><button onClick={() => {const friendId = prompt("Inserisci ID amico:"); if(friendId) addFriend(friendId);}} className="text-[10px] bg-white/10 px-3 py-1 rounded hover:bg-white/20">AGGIUNGI</button></div>
                    {friends.length === 0 ? (<div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs w-full">Nessun amico seguito</div>) : (
                        <div className="space-y-2 w-full">
                            {friends.map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-white/5 w-full">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><User size={14} /></div>
                                        <span className="text-sm font-bold">ID: {f.id.slice(0,6)}...</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => setViewingFriend(f.id)} className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full flex items-center"><Eye size={12} className="mr-1"/> GARAGE</button>
                                        <button onClick={() => setItemToDelete({type: 'friend', id: f.id})} className="text-[10px] bg-red-900/50 hover:bg-red-600 text-white p-1.5 rounded-full flex items-center"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW: DASHBOARD (PROFILO) - NEW FULL VIEW */}
        {view === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-right w-full pb-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-3xl border border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-red-600 overflow-hidden mb-4 shadow-[0_0_20px_rgba(220,38,38,0.3)]"><img src={userData?.avatar} className="w-full h-full object-cover" /></div>
                    <h2 className="text-2xl font-orbitron font-bold text-white">{userData?.nickname}</h2>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-6 flex justify-center items-center">ID: {user.uid.slice(0,8)} <Copy size={10} className="ml-1 cursor-pointer" onClick={() => navigator.clipboard.writeText(user.uid)}/></p>
                    <div className="bg-black/40 rounded-full h-4 w-full mb-2 overflow-hidden border border-white/10"><div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(levelInfo.currentLevelXp / levelInfo.nextLevelXp) * 100}%` }}></div></div>
                    <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-6"><span>LIV {levelInfo.level}</span><span>{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP</span><span>LIV {levelInfo.level + 1}</span></div>
                    <div className="flex justify-center space-x-2">{medals.map((m: any, i: number) => (<div key={i} className="flex flex-col items-center"><div className={`w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center ${m.color} shadow-lg mb-1`}>{m.icon}</div><span className="text-[8px] uppercase text-zinc-500">{m.name}</span></div>))}{medals.length === 0 && <span className="text-xs text-zinc-600 italic">Nessuna medaglia</span>}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex items-center justify-between"><div className="flex items-center space-x-3"><div className="bg-green-900/20 p-2 rounded-lg"><DollarSign className="text-green-500" /></div><div><div className="text-xs text-zinc-400 uppercase">Valore Garage</div><div className="text-xl font-bold text-white font-mono">€{calculateGarageValue().toLocaleString()}</div></div></div><TrendingUp className="text-green-500/20" size={48} /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-yellow-500/20"><div className="text-[10px] text-zinc-500 uppercase mb-1">Leggendarie</div><div className="text-2xl font-bold text-yellow-500">{countRarity('Legendary')}</div></div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-purple-500/20"><div className="text-[10px] text-zinc-500 uppercase mb-1">Epiche</div><div className="text-2xl font-bold text-purple-500">{countRarity('Epic')}</div></div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-orange-500/20"><div className="text-[10px] text-zinc-500 uppercase mb-1">Vintage</div><div className="text-2xl font-bold text-orange-500">{countRarity('Vintage')}</div></div>
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-blue-500/20"><div className="text-[10px] text-zinc-500 uppercase mb-1">Super Rare</div><div className="text-2xl font-bold text-blue-500">{countRarity('SuperRare')}</div></div>
                </div>
            </div>
        )}

      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-lg border-t border-white/10 pb-6 pt-2 px-6 flex justify-between items-end z-40">
        <button onClick={() => setView('garage')} className={`flex flex-col items-center space-y-1 transition-all ${view === 'garage' ? 'text-red-500 -translate-y-2' : 'text-zinc-600'}`}><Warehouse size={view === 'garage' ? 28 : 24} /><span className="text-[9px] font-bold tracking-widest">GARAGE</span></button>
        <div className="relative -top-6"><button onClick={() => setView('scan')} className="w-16 h-16 bg-red-600 rounded-full border-4 border-slate-950 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 transition-transform"><ScanLine size={32} /></button></div>
        <button onClick={() => setView('social')} className={`flex flex-col items-center space-y-1 transition-all ${view === 'social' ? 'text-blue-500 -translate-y-2' : 'text-zinc-600'}`}><TrendingUp size={view === 'social' ? 28 : 24} /><span className="text-[9px] font-bold tracking-widest">STAGIONE</span></button>
      </nav>
    </div>
  );
}