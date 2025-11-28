import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Warehouse,
  Zap,
  Gauge,
  DollarSign,
  X,
  Shield,
  Award,
  Car,
  ScanLine,
  Maximize2,
  Minimize2,
  LogOut,
  Lock,
  Mail,
  ChevronRight,
  User,
  Users,
  ShoppingBag,
  CheckCircle,
  Target,
  TrendingUp,
  Activity,
  Star,
  Copy,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  where,
  getDocs,
  increment,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ==================================================================================
// ⚠️  AREA DI CONFIGURAZIONE  ⚠️
// Incolla qui sotto il blocco 'const firebaseConfig' copiato da Firebase.
// Assicurati di copiare TUTTO, comprese le parentesi graffe { e }.
// ==================================================================================

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyBTjQYhYxwJ_CRtt4dbaCsc_JAkndIXZMQ',
  authDomain: 'palmostreet.firebaseapp.com',
  projectId: 'palmostreet',
  storageBucket: 'palmostreet.firebasestorage.app',
  messagingSenderId: '944006205470',
  appId: '1:944006205470:web:825f46e49674d1269b1e0f',
  measurementId: 'G-7WBYD0S53B',
};

// ==================================================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = 'palmostreet-v4-login';

// --- UTILS & CONSTANTS ---
const API_KEY_STORAGE_KEY = 'palmostreet_gemini_key';

const RARITY_CONFIG = {
  Vintage: {
    color: 'text-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-950/80',
    shadow: 'shadow-orange-500/50',
    gradient: 'from-orange-900 via-black to-black',
  },
  Legendary: {
    color: 'text-yellow-400',
    border: 'border-yellow-400',
    bg: 'bg-yellow-950/80',
    shadow: 'shadow-yellow-500/50',
    gradient: 'from-yellow-900 via-black to-black',
  },
  Epic: {
    color: 'text-purple-500',
    border: 'border-purple-500',
    bg: 'bg-purple-950/80',
    shadow: 'shadow-purple-500/50',
    gradient: 'from-purple-900 via-black to-black',
  },
  SuperRare: {
    color: 'text-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-950/80',
    shadow: 'shadow-blue-500/50',
    gradient: 'from-blue-900 via-black to-black',
  },
  Rare: {
    color: 'text-green-500',
    border: 'border-green-500',
    bg: 'bg-green-950/80',
    shadow: 'shadow-green-500/50',
    gradient: 'from-green-900 via-black to-black',
  },
  Common: {
    color: 'text-white',
    border: 'border-slate-500',
    bg: 'bg-slate-900/80',
    shadow: 'shadow-slate-500/20',
    gradient: 'from-slate-800 via-black to-black',
  },
};

const DEFAULT_AVATARS = [
  'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Racer Helmet
  'https://cdn-icons-png.flaticon.com/512/1995/1995666.png', // Pistons
  'https://cdn-icons-png.flaticon.com/512/5717/5717315.png', // Turbo
  'https://cdn-icons-png.flaticon.com/512/3093/3093121.png', // Steering Wheel
];

// --- COMPONENTS ---

const LoadingScanner = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50 backdrop-blur-md">
    <div className="relative w-72 h-72 border-2 border-red-600 rounded-full overflow-hidden animate-spin-slow">
      <div className="absolute inset-0 border-t-4 border-red-500 rounded-full"></div>
    </div>
    <div className="absolute">
      <Car className="w-24 h-24 text-red-600 animate-pulse" />
    </div>
    <div className="mt-8 font-orbitron text-red-500 text-xl animate-pulse tracking-widest">
      ANALYZING SPECS...
    </div>
  </div>
);

// --- AUTH SCREEN (Login/Register) ---
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential')
        setError('Email o password errati.');
      else if (err.code === 'auth/email-already-in-use')
        setError('Email già registrata.');
      else if (err.code === 'auth/weak-password')
        setError('Password troppo debole (min 6 caratteri).');
      else if (err.code === 'auth/api-key-not-valid')
        setError('ERRORE CONFIG: Hai incollato le chiavi Firebase nel codice?');
      else setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 relative overflow-hidden font-exo">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-orbitron font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            PALMO<span className="text-red-600">STREET</span>
          </h1>
          <p className="text-zinc-500 text-xs uppercase tracking-[0.4em]">
            Street Collection System
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Email"
                />
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3.5 text-zinc-500 group-focus-within:text-red-500 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-xs text-center flex items-center justify-center">
                <Shield size={14} className="mr-2" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest font-orbitron transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50"
            >
              {loading ? 'CARICAMENTO...' : isLogin ? 'ACCEDI' : 'REGISTRATI'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Nuovo pilota? ' : 'Hai un account? '}{' '}
              <span className="text-red-500 font-bold underline decoration-red-500/50 underline-offset-4">
                {isLogin ? 'Crea Account' : 'Login'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PROFILE WIZARD (Identità Giocatore) ---
const ProfileWizard = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileSetup = async () => {
    if (!nickname) return;
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user found');

      // Save user data to Firestore
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        email: user.email,
        nickname: nickname,
        avatar: avatar,
        tickets: 50, // Bonus benvenuto
        xp: 0,
        level: 1,
        joinedAt: serverTimestamp(),
        friends: [],
      });

      await updateProfile(user, { displayName: nickname, photoURL: avatar });
      // Il listener nel componente principale rileverà i dati e cambierà vista
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-exo text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur p-6 rounded-2xl border border-white/10 z-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <h2 className="text-3xl font-orbitron font-bold mb-2 text-center text-white italic">
          IDENTITÀ PILOTA
        </h2>
        <p className="text-center text-zinc-500 text-xs mb-8">
          Configura il tuo passaporto Palmostreet
        </p>

        <div className="flex justify-center mb-6 relative">
          <div
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-600 bg-black cursor-pointer group shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            onClick={() => fileInputRef.current.click()}
          >
            <img
              src={avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera size={20} />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {DEFAULT_AVATARS.map((av, i) => (
            <div
              key={i}
              onClick={() => setAvatar(av)}
              className={`p-1 rounded-lg border-2 cursor-pointer transition-all ${
                avatar === av
                  ? 'border-red-500 bg-white/10 scale-105'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img src={av} alt="Preset" className="w-full h-full" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Scegli il tuo Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-black/50 border border-white/20 p-4 rounded-xl text-white text-center font-bold focus:border-red-500 outline-none transition-colors"
          />

          <button
            onClick={handleProfileSetup}
            disabled={loading || !nickname}
            className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-xl font-bold font-orbitron text-lg uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            {loading ? 'SALVATAGGIO...' : 'INIZIA CARRIERA'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function PalmostreetApp() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('garage');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem(API_KEY_STORAGE_KEY) || ''
  );
  const [friends, setFriends] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- FULLSCREEN ---
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current
        ?.requestFullscreen()
        .catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch User Data Realtime
        const unsubUser = onSnapshot(
          doc(db, 'artifacts', appId, 'users', u.uid),
          (doc) => {
            if (doc.exists()) {
              setUserData(doc.data());
              setFriends(doc.data().friends || []);
            } else {
              setUserData(null); // Trigger Profile Wizard
            }
          }
        );

        // Fetch Cars
        const qCars = query(
          collection(db, 'artifacts', appId, 'users', u.uid, 'garage'),
          orderBy('timestamp', 'desc')
        );
        const unsubCars = onSnapshot(qCars, (snap) => {
          setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        // Generate Daily Objectives (Mock)
        setObjectives([
          {
            id: 1,
            text: 'Trova una Leggendaria',
            reward: 100,
            xp: 500,
            done: false,
            rarity: 'Legendary',
          },
          {
            id: 2,
            text: 'Colleziona 3 auto oggi',
            reward: 20,
            xp: 100,
            done: false,
            rarity: 'Common',
          },
          {
            id: 3,
            text: 'Trova una Vintage',
            reward: 50,
            xp: 250,
            done: false,
            rarity: 'Vintage',
          },
        ]);

        return () => {
          unsubUser();
          unsubCars();
        };
      } else {
        setUserData(null);
        setCars([]);
      }
    });
    return () => unsubAuth();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload(); // Refresh to clean state
  };

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  };

  // --- LOGIC: RARITY & STATS ---
  const determineRarity = (year, value, hp) => {
    if (year < 1990) return 'Vintage';
    if (value > 200000 || hp > 600) return 'Legendary';
    if (value > 80000 || hp > 400) return 'Epic';
    if (value > 40000 || hp > 300) return 'SuperRare';
    if (value > 20000 || hp > 180) return 'Rare';
    return 'Common';
  };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      const imageUrl = reader.result;

      try {
        let aiResult;

        if (apiKey) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: 'Analyze this car. Return strictly JSON with: brand, model, year (number), hp (number), value_eur (number), list_value (number), description (italian), scores: { speed (1-5), versatility (1-5), quality_price (1-5), durability (1-5) }',
                        },
                        {
                          inlineData: { mimeType: file.type, data: base64Data },
                        },
                      ],
                    },
                  ],
                }),
              }
            );
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const jsonMatch = text.match(/\{[\s\S]*\}/);
              aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            }
          } catch (err) {
            console.error('API Error', err);
          }
        }

        // Fallback Simulation if no API or Error
        if (!aiResult) {
          await new Promise((r) => setTimeout(r, 2000));
          aiResult = {
            brand: 'Simulazione',
            model: 'Auto Demo',
            year: 2024,
            hp: 200,
            value_eur: 30000,
            list_value: 35000,
            description:
              'Modalità simulazione attiva. Inserisci API Key per dati reali.',
            scores: {
              speed: 3,
              versatility: 4,
              quality_price: 5,
              durability: 4,
            },
          };
        }

        const rarity = determineRarity(
          aiResult.year,
          aiResult.value_eur,
          aiResult.hp
        );

        const newCar = {
          ...aiResult,
          value: aiResult.value_eur,
          rarity: rarity,
          imageUrl: imageUrl,
          timestamp: serverTimestamp(),
          method: 'AI_VISION',
        };

        // Temporarily store scan to show in modal BEFORE saving
        setSelectedCar({ ...newCar, isPreview: true });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveCarToGarage = async () => {
    if (!selectedCar || !user) return;
    setLoading(true);
    try {
      const { isPreview, ...carData } = selectedCar;
      await addDoc(
        collection(db, 'artifacts', appId, 'users', user.uid, 'garage'),
        carData
      );

      // XP & Objective Logic could go here
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        xp: increment(100),
        tickets: increment(10), // Small reward for scanning
      });

      setSelectedCar(null);
      setView('garage');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (friendId) => {
    if (!friendId) return;
    const newFriend = { id: friendId, addedAt: new Date().toISOString() };
    const updatedFriends = [...friends, newFriend];
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
      friends: updatedFriends,
    });
  };

  const buyItem = async (cost) => {
    if (userData.tickets >= cost) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
        tickets: increment(-cost),
      });
      alert('Oggetto acquistato!');
    } else {
      alert('Ticket insufficienti!');
    }
  };

  // --- RENDER ---

  // 1. Not Logged In -> Show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  // 2. Logged In but No Profile Data -> Show Wizard
  if (userData === null) {
    // If it takes too long, we assume it's a new user and waiting for wizard
    return <ProfileWizard onComplete={() => {}} />;
  }

  // 3. Main App
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-200 font-exo selection:bg-red-500/30 overflow-x-hidden pb-24 relative"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Orbitron:wght@400;700;900&display=swap');
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-exo { font-family: 'Exo 2', sans-serif; }
        .perspective-card { perspective: 1000px; }
        .holographic {
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%);
            box-shadow: inset 0 0 20px rgba(255,255,255,0.05);
        }
      `}</style>

      {/* LOADING */}
      {loading && <LoadingScanner />}

      {/* CAR DETAIL MODAL */}
      {selectedCar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in slide-in-from-bottom duration-300">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !selectedCar.isPreview && setSelectedCar(null)}
          ></div>
          <div
            className={`relative w-full max-w-lg bg-gradient-to-b ${
              RARITY_CONFIG[selectedCar.rarity].gradient
            } rounded-t-3xl sm:rounded-3xl overflow-hidden border-t-2 sm:border-2 ${
              RARITY_CONFIG[selectedCar.rarity].border
            } shadow-2xl h-[90vh] sm:h-auto overflow-y-auto`}
          >
            {/* Header Image */}
            <div className="relative h-64 w-full bg-black group">
              <img
                src={selectedCar.imageUrl}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              <button
                onClick={() => setSelectedCar(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-red-600 transition-colors z-10"
              >
                <X size={24} className="text-white" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider bg-black/80 border ${
                      RARITY_CONFIG[selectedCar.rarity].color
                    } ${
                      RARITY_CONFIG[selectedCar.rarity].border
                    } mb-2 inline-block`}
                  >
                    {selectedCar.rarity}
                  </span>
                  <h2 className="text-3xl font-orbitron font-black text-white italic uppercase leading-none">
                    {selectedCar.model}
                  </h2>
                  <p className="text-zinc-400 font-bold uppercase tracking-widest">
                    {selectedCar.brand}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">
                    Valore Mercato
                  </span>
                  <span className="text-lg font-mono text-green-400">
                    €{selectedCar.value?.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase text-zinc-500 font-bold">
                    Potenza
                  </span>
                  <span className="text-lg font-mono text-red-400">
                    {selectedCar.hp} HP
                  </span>
                </div>
              </div>

              {/* Detailed Scores 1-5 */}
              <div className="space-y-3">
                <h3 className="font-orbitron text-sm text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-1">
                  Performance Index
                </h3>
                {selectedCar.scores &&
                  Object.entries(selectedCar.scores).map(([key, score]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs uppercase text-zinc-300 font-bold w-24">
                        {key.replace('_', ' ')}
                      </span>
                      <div className="flex-1 h-2 bg-black rounded-full mx-3 overflow-hidden">
                        <div
                          className={`h-full ${
                            score >= 4
                              ? 'bg-green-500'
                              : score >= 3
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${(score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold w-6 text-right">
                        {score}/5
                      </span>
                    </div>
                  ))}
              </div>

              {/* Description */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-zinc-400 italic leading-relaxed">
                  "{selectedCar.description}"
                </p>
              </div>

              {/* Actions */}
              {selectedCar.isPreview ? (
                <button
                  onClick={saveCarToGarage}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl uppercase tracking-widest font-orbitron shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse"
                >
                  AGGIUNGI AL GARAGE
                </button>
              ) : (
                <div className="flex justify-center">
                  <span className="text-[10px] font-mono text-zinc-600">
                    ACQUISITA IL:{' '}
                    {selectedCar.timestamp?.toDate().toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full bg-gradient-to-b from-slate-950 to-transparent p-4 z-30 pointer-events-none flex justify-between items-start">
        <div className="pointer-events-auto flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500 bg-black">
            <img
              src={userData?.avatar || DEFAULT_AVATARS[0]}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase">
              {userData?.nickname}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
              <span>LVL {userData?.level || 1}</span>
              <span>•</span>
              <span
                onClick={() => {
                  navigator.clipboard.writeText(user.uid);
                  alert('ID Copiato!');
                }}
                className="cursor-pointer hover:text-white flex items-center"
              >
                ID: {user.uid.slice(0, 6)}... <Copy size={8} className="ml-1" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-start space-x-2 pointer-events-auto">
          <button
            onClick={toggleFullScreen}
            className="bg-slate-900/80 backdrop-blur border border-white/10 p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className="bg-slate-900/80 backdrop-blur border border-white/10 p-1.5 rounded-full hover:bg-red-900/50 text-zinc-400 hover:text-red-500"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
          <div className="bg-slate-900/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-full flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-sm rotate-45"></div>
            <span className="font-orbitron font-bold text-yellow-500 text-sm">
              {userData?.tickets || 0}
            </span>
          </div>
        </div>
      </header>

      {/* VIEWS */}
      <main className="pt-20 px-4">
        {/* GARAGE VIEW */}
        {view === 'garage' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-orbitron font-bold text-white">
                GARAGE
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                {cars.length} AUTO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  onClick={() => setSelectedCar(car)}
                  className="perspective-card group cursor-pointer"
                >
                  <div
                    className={`relative bg-slate-900 border-2 ${
                      RARITY_CONFIG[car.rarity].border
                    } rounded-xl overflow-hidden transform transition-transform duration-300 group-hover:rotate-x-2 group-hover:scale-[1.02] shadow-2xl`}
                  >
                    {/* Render-like Image Area */}
                    <div className="h-48 w-full bg-black relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.2),transparent)]"></div>
                      <img
                        src={car.imageUrl}
                        className="w-full h-full object-contain mix-blend-normal z-10 relative drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                      />
                      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent z-0"></div>
                    </div>
                    {/* Info Plate */}
                    <div className="p-4 bg-slate-900 relative z-20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-orbitron font-bold text-white text-lg leading-none">
                            {car.model}
                          </h3>
                          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                            {car.brand}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            RARITY_CONFIG[car.rarity].color
                          } ${RARITY_CONFIG[car.rarity].border}`}
                        >
                          {car.rarity}
                        </span>
                      </div>
                      <div className="w-full h-[1px] bg-white/10 mb-2"></div>
                      <div className="flex justify-between text-xs font-mono text-zinc-400">
                        <span>{car.year}</span>
                        <span>{car.hp} HP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cars.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-50">
                  <Warehouse size={48} className="mx-auto mb-4 text-zinc-600" />
                  <p>IL TUO GARAGE È VUOTO</p>
                  <p className="text-xs mt-2">Usa lo scanner per iniziare</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCANNER VIEW */}
        {view === 'scan' && (
          <div className="h-[70vh] flex flex-col items-center justify-center animate-in zoom-in-95">
            <input
              type="password"
              placeholder="Inserisci API Key Gemini"
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              className="mb-8 bg-black/50 border border-white/10 p-2 rounded text-xs text-center w-64"
            />
            <div
              onClick={() => fileInputRef.current.click()}
              className="w-64 h-64 border-2 border-dashed border-red-500/50 rounded-full flex flex-col items-center justify-center bg-red-900/10 cursor-pointer hover:bg-red-900/20 hover:scale-105 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(220,38,38,0.5)_360deg)] animate-[spin_4s_linear_infinite] opacity-50"></div>
              <div className="absolute inset-1 bg-slate-950 rounded-full z-10 flex flex-col items-center justify-center">
                <Camera
                  size={48}
                  className="text-white mb-2 group-hover:text-red-500 transition-colors"
                />
                <span className="font-orbitron font-bold text-white tracking-widest">
                  SCANNER
                </span>
                <span className="text-[10px] text-zinc-500 mt-1 uppercase">
                  Solo AI Vision
                </span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleScan}
            />
            <p className="text-xs text-zinc-500 mt-8 text-center max-w-xs">
              Scatta una foto a un'auto reale. L'AI ne determinerà modello,
              valore e rarità.
            </p>
          </div>
        )}

        {/* SOCIAL & OBJECTIVES VIEW */}
        {view === 'social' && (
          <div className="space-y-8 animate-in slide-in-from-right">
            {/* Objectives Section */}
            <div>
              <h3 className="font-orbitron font-bold text-white mb-4 flex items-center">
                <Target className="mr-2 text-red-500" /> OBIETTIVI GIORNALIERI
              </h3>
              <div className="space-y-3">
                {objectives.map((obj) => (
                  <div
                    key={obj.id}
                    className={`p-4 rounded-xl border border-white/10 bg-gradient-to-r ${
                      RARITY_CONFIG[obj.rarity].bg
                    } flex justify-between items-center`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white">
                        {obj.text}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 flex space-x-3">
                        <span className="text-yellow-500 font-bold">
                          +{obj.reward} TICKET
                        </span>
                        <span className="text-blue-400 font-bold">
                          +{obj.xp} XP
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        obj.done
                          ? 'bg-green-500 border-green-500'
                          : 'border-zinc-600'
                      }`}
                    >
                      {obj.done && (
                        <CheckCircle size={14} className="text-black" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Friends Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-orbitron font-bold text-white flex items-center">
                  <Users className="mr-2 text-blue-500" /> AMICI
                </h3>
                <button
                  onClick={() => {
                    const friendId = prompt('Inserisci ID amico:');
                    if (friendId) addFriend(friendId);
                  }}
                  className="text-[10px] bg-white/10 px-3 py-1 rounded hover:bg-white/20"
                >
                  AGGIUNGI
                </button>
              </div>
              {friends.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-zinc-500 text-xs">
                  Nessun amico seguito
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-white/5"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-bold">
                          ID: {f.id.slice(0, 6)}...
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">AMICO</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shop Teaser */}
            <div className="p-4 bg-gradient-to-r from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-orbitron font-bold text-yellow-500 mb-1">
                    PALMOS SHOP
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Spendi i tuoi ticket per nuove icone
                  </p>
                </div>
                <ShoppingBag className="text-yellow-500" />
              </div>
              <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    onClick={() => buyItem(100)}
                    className="min-w-[80px] bg-black/40 p-2 rounded border border-white/10 text-center cursor-pointer hover:border-yellow-500"
                  >
                    <div className="w-8 h-8 mx-auto bg-zinc-800 rounded-full mb-2"></div>
                    <div className="text-[10px] text-yellow-500 font-bold">
                      100 T
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NAVBAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-lg border-t border-white/10 pb-6 pt-2 px-6 flex justify-between items-end z-40">
        <button
          onClick={() => setView('garage')}
          className={`flex flex-col items-center space-y-1 transition-all ${
            view === 'garage' ? 'text-red-500 -translate-y-2' : 'text-zinc-600'
          }`}
        >
          <Warehouse size={view === 'garage' ? 28 : 24} />
          <span className="text-[9px] font-bold tracking-widest">GARAGE</span>
        </button>

        <div className="relative -top-6">
          <button
            onClick={() => setView('scan')}
            className="w-16 h-16 bg-red-600 rounded-full border-4 border-slate-950 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 transition-transform"
          >
            <ScanLine size={32} />
          </button>
        </div>

        <button
          onClick={() => setView('social')}
          className={`flex flex-col items-center space-y-1 transition-all ${
            view === 'social' ? 'text-blue-500 -translate-y-2' : 'text-zinc-600'
          }`}
        >
          <TrendingUp size={view === 'social' ? 28 : 24} />
          <span className="text-[9px] font-bold tracking-widest">SOCIAL</span>
        </button>
      </nav>
    </div>
  );
}
