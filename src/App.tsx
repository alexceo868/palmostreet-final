import React, { useState, useEffect, useRef } from 'react';
import { Camera, Warehouse, Zap, Gauge, DollarSign, X, Shield, Award, Car, ScanLine, Maximize2, Minimize2, LogOut, Lock, Mail, ChevronRight, User, Users, ShoppingBag, CheckCircle, Target, TrendingUp, Activity, Star, Copy, Key, Settings, Image as ImageIcon, Upload } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, setDoc, getDoc, updateDoc, where, getDocs, increment } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ==================================================================================
// CONFIGURAZIONE FIREBASE (Inserita dal tuo screenshot)
// ==================================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBTjQYhYxwJ_CRtt4dbaCsc_JAKndIXZMQ", 
  authDomain: "palmostreet.firebaseapp.com",
  projectId: "palmostreet",
  storageBucket: "palmostreet.firebasestorage.app",
  messagingSenderId: "944006205470",
  appId: "1:944006205470:web:825f46e49674d1269b1e0f",
  measurementId: "G-7WBYD0S53B"
};

// ==================================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 
const appId = 'palmostreet-v5-final';

const API_KEY_STORAGE_KEY = 'palmostreet_gemini_key';

const RARITY_CONFIG: any = {
  Vintage: { color: "text-orange-500", border: "border-orange-500", bg: "bg-orange-950/80", shadow: "shadow-orange-500/50", gradient: "from-orange-900 via-black to-black" },
  Legendary: { color: "text-yellow-400", border: "border-yellow-400", bg: "bg-yellow-950/80", shadow: "shadow-yellow-500/50", gradient: "from-yellow-900 via-black to-black" },
  Epic: { color: "text-purple-500", border: "border-purple-500", bg: "bg-purple-950/80", shadow: "shadow-purple-500/50", gradient: "from-purple-900 via-black to-black" },
  SuperRare: { color: "text-blue-500", border: "border-blue-500", bg: "bg-blue-950/80", shadow: "shadow-blue-500/50", gradient: "from-blue-900 via-black to-black" },
  Rare: { color: "text-green-500", border: "border-green-500", bg: "bg-green-950/80", shadow: "shadow-green-500/50", gradient: "from-green-900 via-black to-black" },
  Common: { color: "text-white", border: "border-slate-500", bg: "bg-slate-900/80", shadow: "shadow-slate-500/20", gradient: "from-slate-800 via-black to-black" },
};

const LoadingScanner = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 z-50 backdrop-blur-md w-screen h-screen">
    <div className="relative w-72 h-72 border-2 border-red-600 rounded-full overflow-hidden animate-spin-slow">
       <div className="absolute inset-0 border-t-4 border-red-500 rounded-full"></div>
    </div>
    <div className="absolute">
        <Car className="w-24 h-24 text-red-600 animate-pulse" />
    </div>
    <div className="mt-8 font-orbitron text-red-500 text-xl animate-pulse tracking-widest">ANALYZING SPECS...</div>
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
      else if (err.code === 'auth/weak-password') setError("Password troppo debole (min 6 caratteri).");
      else if (err.code === 'auth/api-key-not-valid') setError("Errore API Key. Controlla le impostazioni su Firebase.");
      else setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-exo">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 w-full h-full"></div>
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
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
    if (!nickname || !avatar) return; 
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        email: user.email, nickname: nickname, avatar: avatar, xp: 0, level: 1, joinedAt: serverTimestamp(), friends: []
      });
      await updateProfile(user, { displayName: nickname, photoURL: avatar });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-exo text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 w-full h-full"></div>
        <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-white/10 z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-orbitron font-bold mb-2 text-center text-white italic">IDENTITÀ PILOTA</h2>
            <div className="flex justify-center mb-8 relative">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${avatar ? 'border-red-600' : 'border-zinc-700 border-dashed'} bg-black cursor-pointer group shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center transition-all hover:scale-105`} onClick={() => fileInputRef.current?.click()}>
                    {avatar ? (<img src={avatar} alt="Avatar" className="w-full h-full object-cover" />) : (<div className="flex flex-col items-center text-zinc-500 group-hover:text-red-500 transition-colors"><Upload size={32} className="mb-2" /><span className="text-[10px] uppercase font-bold">Carica Foto</span></div>)}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            <div className="space-y-4">
                <input type="text" placeholder="Scegli il tuo Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white text-center font-bold focus:border-red-500 outline-none transition-colors" />
                <button onClick={handleProfileSetup} disabled={loading || !nickname || !avatar} className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold font-orbitron text-lg uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">{loading ? 'SALVATAGGIO...' : 'INIZIA CARRIERA'}</button>
            </div>
        </div>
    </div>
  );
};

const SettingsModal = ({ onClose, currentKey, onSaveKey }: any) => {
  const [key, setKey] = useState(currentKey);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in w-screen h-screen">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
        <h3 className="font-orbitron text-xl font-bold text-white mb-4 flex items-center"><Settings className="mr-2" /> IMPOSTAZIONI</h3>
        <div className="mb-6"><label className="text-xs uppercase text-zinc-500 font-bold mb-2 block">Gemini API Key</label><input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Incolla qui la tua API Key..." className="w-full bg-black/50 border border-white/20 p-3 rounded-lg text-white text-sm focus:border-red-500 outline-none" /><p className="text-[10px] text-zinc-500 mt-2">Necessaria per il riconoscimento AI reale. <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-red-400 underline">Ottieni qui</a>.</p></div>
        <div className="flex space-x-3"><button onClick={() => {onSaveKey(key); onClose();}} className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold text-white uppercase text-xs tracking-widest">SALVA</button><button onClick={onClose} className="px-4 py-3 rounded-xl font-bold text-zinc-400 hover:text-white uppercase text-xs border border-white/10 hover:bg-white/5">CHIUDI</button></div>
        <div className="mt-6 pt-6 border-t border-white/10 text-center"><button onClick={() => {signOut(auth); window.location.reload();}} className="text-red-500 text-xs font-bold flex items-center justify-center mx-auto hover:text-red-400"><LogOut size={14} className="mr-2" /> DISCONNETTI</button></div>
      </div>
    </div>
  );
};

export default function PalmostreetApp() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [view, setView] = useState('garage');
  const [cars, setCars] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [friends, setFriends] = useState<any[]>([]); 
  const [objectives, setObjectives] = useState<any[]>([]); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

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
        const unsubUser = onSnapshot(doc(db, 'artifacts', appId, 'users', u.uid), (doc) => { if (doc.exists()) { setUserData(doc.data()); setFriends(doc.data().friends || []); } else { setUserData(null); } });
        const qCars = query(collection(db, 'artifacts', appId, 'users', u.uid, 'garage'), orderBy('timestamp', 'desc'));
        const unsubCars = onSnapshot(qCars, (snap) => { setCars(snap.docs.map(d => ({id: d.id, ...d.data()}))); });
        setObjectives([{ id: 1, text: "Trova una Leggendaria", xp: 500, done: false, rarity: "Legendary" }, { id: 2, text: "Colleziona 3 auto oggi", xp: 100, done: false, rarity: "Common" }, { id: 3, text: "Trova una Vintage", xp: 250, done: false, rarity: "Vintage" }]);
        return () => { unsubUser(); unsubCars(); };
      } else { setUserData(null); setCars([]); }
    });
    return () => unsubAuth();
  }, []);

  const saveApiKey = (key: string) => { setApiKey(key); localStorage.setItem(API_KEY_STORAGE_KEY, key); };
  const determineRarity = (year: number, value: number, hp: number) => { if (year < 1990) return "Vintage"; if (value > 200000 || hp > 600) return "Legendary"; if (value > 80000 || hp > 400) return "Epic"; if (value > 40000 || hp > 300) return "SuperRare"; if (value > 20000 || hp > 180) return "Rare"; return "Common"; };

  const handleScan = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const imageUrl = reader.result as string;
      try {
        let aiResult;
        if (apiKey) {
           try {
             const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: "Analyze this car. Return strictly JSON with: brand, model, year (number), hp (number), value_eur (number), list_value (number), description (italian), scores: { speed (1-5), versatility (1-5), quality_price (1-5), durability (1-5) }" }, { inlineData: { mimeType: file.type, data: base64Data } }] }] }) });
             const data = await response.json();
             const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
             if(text) { const jsonMatch = text.match(/\{[\s\S]*\}/); aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null; }
           } catch (err) { console.error("API Error", err); }
        }
        if (!aiResult) { await new Promise(r => setTimeout(r, 2000)); aiResult = { brand: "Simulazione", model: "Auto Demo", year: 2024, hp: 200, value_eur: 30000, description: "Modalità simulazione attiva. Configura la API Key nelle Impostazioni per l'AI reale.", scores: { speed: 3, versatility: 4, quality_price: 5, durability: 4 }, isSimulation: true }; }
        const rarity = determineRarity(aiResult.year, aiResult.value_eur, aiResult.hp);
        const newCar = { ...aiResult, value: aiResult.value_eur, rarity: rarity, imageUrl: imageUrl, timestamp: serverTimestamp(), method: 'AI_VISION' };
        setSelectedCar({ ...newCar, isPreview: true });
      } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const saveCarToGarage = async () => {
    if (!selectedCar || !user) return;
    setLoading(true);
    try { const { isPreview, ...carData } = selectedCar; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'garage'), carData); await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { xp: increment(100) }); setSelectedCar(null); setView('garage'); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const addFriend = async (friendId: string) => { if (!friendId) return; const newFriend = { id: friendId, addedAt: new Date().toISOString() }; const updatedFriends = [...friends, newFriend]; await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), { friends: updatedFriends }); };

  if (!user) return <AuthScreen />;
  if (userData === null) return <ProfileWizard onComplete={() => {}} />;

  return (
    <div ref={containerRef} className="min-h-screen w-screen bg-slate-950 text-slate-200 font-exo selection:bg-red-500/30 overflow-x-hidden pb-24 relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Orbitron:wght@400;700;900&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-exo { font-family: 'Exo 2', sans-serif; }
        .perspective-card { perspective: 1000px; }
      `}</style>

      {/* LOADING */}
      {loading && <LoadingScanner />}

      {/* SETTINGS MODAL */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} currentKey={apiKey} onSaveKey={saveApiKey} />}

      {/* CAR DETAIL MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom duration-300 w-full h-full">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !selectedCar.isPreview && setSelectedCar(null)}></div>
            <div className={`relative w-full max-w-lg bg-gradient-to-b ${RARITY_CONFIG[selectedCar.rarity].gradient} rounded-t-3xl sm:rounded-3xl overflow-hidden border-t-2 sm:border-2 ${RARITY_CONFIG[selectedCar.rarity].border} shadow-2xl h-[90vh] sm:h-auto overflow-y-auto`}>
                <div className="relative h-64 w-full bg-black group"><img src={selectedCar.imageUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div><button onClick={() => setSelectedCar(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-red-600 transition-colors z-10"><X size={24} className="text-white" /></button><div className="absolute bottom-4 left-4 right-4 flex justify-between items-end"><div><span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/80 border ${RARITY_CONFIG[selectedCar.rarity].color} ${RARITY_CONFIG[selectedCar.rarity].border} mb-2 inline-block`}>{selectedCar.rarity}</span><h2 className="text-3xl font-orbitron font-black text-white italic uppercase leading-none">{selectedCar.model}</h2><p className="text-zinc-400 font-bold uppercase tracking-widest">{selectedCar.brand}</p></div></div></div>
                <div className="p-6 space-y-6">
                    {selectedCar.isSimulation && (<div className="bg-yellow-900/30 border border-yellow-500/50 p-3 rounded-lg flex items-start space-x-3"><Key className="text-yellow-500 shrink-0 mt-1" size={18} /><div><h4 className="text-sm font-bold text-yellow-500">MODALITÀ SIMULAZIONE</h4><p className="text-xs text-zinc-400 mt-1">Vai in Impostazioni e inserisci API Key per dati reali.</p></div></div>)}
                    <div className="grid grid-cols-2 gap-3"><div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Valore Mercato</span><span className="text-lg font-mono text-green-400">€{selectedCar.value?.toLocaleString()}</span></div><div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between"><span className="text-[10px] uppercase text-zinc-500 font-bold">Potenza</span><span className="text-lg font-mono text-red-400">{selectedCar.hp} HP</span></div></div>
                    <div className="space-y-3"><h3 className="font-orbitron text-sm text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-1">Performance Index</h3>{selectedCar.scores && Object.entries(selectedCar.scores).map(([key, score]) => (<div key={key} className="flex items-center justify-between"><span className="text-xs uppercase text-zinc-300 font-bold w-24">{(key as string).replace('_', ' ')}</span><div className="flex-1 h-2 bg-black rounded-full mx-3 overflow-hidden"><div className={`h-full ${(score as number) >= 4 ? 'bg-green-500' : (score as number) >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${((score as number)/5)*100}%`}}></div></div><span className="text-xs font-mono font-bold w-6 text-right">{score as number}/5</span></div>))}</div>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5"><p className="text-xs text-zinc-400 italic leading-relaxed">"{selectedCar.description}"</p></div>
                    {selectedCar.isPreview ? (<button onClick={saveCarToGarage} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest font-orbitron shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">AGGIUNGI AL GARAGE</button>) : (<div className="flex justify-center"><span className="text-[10px] font-mono text-zinc-600">ACQUISITA IL: {selectedCar.timestamp?.toDate().toLocaleDateString()}</span></div>)}
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-gradient-to-b from-slate-950 to-transparent p-4 z-30 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500 bg-black"><img src={userData?.avatar} alt="Profile" className="w-full h-full object-cover" /></div>
            <div>
                <div className="text-xs font-bold text-white uppercase">{userData?.nickname}</div>
                <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1"><span>LVL {userData?.level || 1}</span><span>•</span><span onClick={() => {navigator.clipboard.writeText(user.uid); alert("ID Copiato!")}} className="cursor-pointer hover:text-white flex items-center">ID: {user.uid.slice(0,6)}... <Copy size={8} className="ml-1"/></span></div>
            </div>
        </div>
        <div className="flex items-start space-x-2 pointer-events-auto">
             <button onClick={() => setShowSettings(true)} className="bg-slate-900/80 backdrop-blur border border-white/10 p-2 rounded-full hover:bg-white/10 text-zinc-400"><Settings size={18} /></button>
        </div>
      </header>

      {/* VIEWS */}
      <main className="pt-20 px-4 w-full">
        {view === 'garage' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 w-full">
                <div className="flex justify-between items-end w-full"><h2 className="text-2xl font-orbitron font-bold text-white">GARAGE</h2><span className="text-xs font-mono text-zinc-500">{cars.length} AUTO</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {cars.map(car => (
                        <div key={car.id} onClick={() => setSelectedCar(car)} className="perspective-card group cursor-pointer w-full">
                            <div className={`relative bg-slate-900 border-2 ${RARITY_CONFIG[car.rarity].border} rounded-xl overflow-hidden transform transition-transform duration-300 group-hover:rotate-x-2 group-hover:scale-[1.02] shadow-2xl w-full`}>
                                <div className="h-48 w-full bg-black relative overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.2),transparent)]"></div><img src={car.imageUrl} className="w-full h-full object-contain mix-blend-normal z-10 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" /><div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-0"></div></div>
                                <div className="p-4 bg-slate-900 relative z-20"><div className="flex justify-between items-start mb-2"><div><h3 className="font-orbitron font-bold text-white text-lg leading-none">{car.model}</h3><span className="text-[10px] uppercase text-zinc-500 tracking-wider">{car.brand}</span></div><span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${RARITY_CONFIG[car.rarity].color} ${RARITY_CONFIG[car.rarity].border}`}>{car.rarity}</span></div><div className="w-full h-[1px] bg-white/10 mb-2"></div><div className="flex justify-between text-xs font-mono text-zinc-400"><span>{car.year}</span><span>{car.hp} HP</span></div></div>
                            </div>
                        </div>
                    ))}
                    {cars.length === 0 && (<div className="col-span-full py-20 text-center opacity-50 w-full"><Warehouse size={48} className="mx-auto mb-4 text-zinc-600" /><p>IL TUO GARAGE È VUOTO</p><p className="text-xs mt-2">Usa lo scanner per iniziare</p></div>)}
                </div>
            </div>
        )}

        {view === 'scan' && (
            <div className="h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95 w-full">
                <div onClick={() => fileInputRef.current?.click()} className="w-64 h-64 border-2 border-dashed border-red-500/50 rounded-full flex flex-col items-center justify-center bg-red-900/10 cursor-pointer hover:bg-red-900/20 hover:scale-105 transition-all relative overflow-hidden group shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(220,38,38,0.5)_360deg)] animate-[spin_4s_linear_infinite] opacity-50"></div>
                    <div className="absolute inset-1 bg-slate-950 rounded-full z-10 flex flex-col items-center justify-center"><Camera size={48} className="text-white mb-2 group-hover:text-red-500 transition-colors" /><span className="font-orbitron font-bold text-white tracking-widest">SCANNER</span><span className="text-[10px] text-zinc-500 mt-1 uppercase">Solo AI Vision</span></div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScan} />
                <p className="text-xs text-zinc-500 mt-8 text-center max-w-xs px-4">Scatta una foto a un'auto reale. L'AI ne determinerà modello, valore e rarità. Se non hai l'API Key, verrà usata la simulazione.</p>
            </div>
        )}

        {view === 'social' && (
            <div className="space-y-8 animate-in slide-in-from-right w-full">
                <div>
                    <h3 className="font-orbitron font-bold text-white mb-4 flex items-center"><Target className="mr-2 text-red-500" /> OBIETTIVI GIORNALIERI</h3>
                    <div className="space-y-3">
                        {objectives.map(obj => (
                            <div key={obj.id} className={`p-4 rounded-xl border border-white/10 bg-gradient-to-r ${RARITY_CONFIG[obj.rarity].bg} flex justify-between items-center w-full`}><div><div className="font-bold text-sm text-white">{obj.text}</div><div className="text-[10px] text-zinc-400 mt-1 flex space-x-3"><span className="text-blue-400 font-bold">+{obj.xp} XP</span></div></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${obj.done ? 'bg-green-500 border-green-500' : 'border-zinc-600'}`}>{obj.done && <CheckCircle size={14} className="text-black" />}</div></div>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-4 w-full"><h3 className="font-orbitron font-bold text-white flex items-center"><Users className="mr-2 text-blue-500" /> AMICI</h3><button onClick={() => {const friendId = prompt("Inserisci ID amico:"); if(friendId) addFriend(friendId);}} className="text-[10px] bg-white/10 px-3 py-1 rounded hover:bg-white/20">AGGIUNGI</button></div>
                    {friends.length === 0 ? (<div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs w-full">Nessun amico seguito</div>) : (<div className="space-y-2 w-full">{friends.map((f, i) => (<div key={i} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-white/5 w-full"><div className="flex items-center space-x-3"><div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><User size={14} /></div><span className="text-sm font-bold">ID: {f.id.slice(0,6)}...</span></div><span className="text-[10px] text-zinc-500">AMICO</span></div>))}</div>)}
                </div>
            </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-lg border-t border-white/10 pb-6 pt-2 px-6 flex justify-between items-end z-40">
        <button onClick={() => setView('garage')} className={`flex flex-col items-center space-y-1 transition-all ${view === 'garage' ? 'text-red-500 -translate-y-2' : 'text-zinc-600'}`}><Warehouse size={view === 'garage' ? 28 : 24} /><span className="text-[9px] font-bold tracking-widest">GARAGE</span></button>
        <div className="relative -top-6"><button onClick={() => setView('scan')} className="w-16 h-16 bg-red-600 rounded-full border-4 border-slate-950 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 transition-transform"><ScanLine size={32} /></button></div>
        <button onClick={() => setView('social')} className={`flex flex-col items-center space-y-1 transition-all ${view === 'social' ? 'text-blue-500 -translate-y-2' : 'text-zinc-600'}`}><TrendingUp size={view === 'social' ? 28 : 24} /><span className="text-[9px] font-bold tracking-widest">SOCIAL</span></button>
      </nav>
    </div>
  );
}