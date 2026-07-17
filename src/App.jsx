import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const moods = [
  { emoji: '😄', label: 'Khush', color: '#FFD700', value: 5 },
  { emoji: '🙂', label: 'Theek', color: '#90EE90', value: 4 },
  { emoji: '😐', label: 'Normal', color: '#87CEEB', value: 3 },
  { emoji: '😔', label: 'Udaas', color: '#DDA0DD', value: 2 },
  { emoji: '😢', label: 'Bahut Udaas', color: '#FF6B6B', value: 1 },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('home');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [journalText, setJournalText] = useState('');
  const [journals, setJournals] = useState([]);
  const [moodNote, setMoodNote] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        loadMoodHistory(u.uid);
        loadJournals(u.uid);
        setMessages([{ role: 'assistant', text: `Namaste ${u.displayName?.split(' ')[0]}! 💙 Main Feeling.L hun — tumhara personal emotional companion. Aaj tum kaisa mehsoos kar rahe ho? 🌸` }]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadMoodHistory = async (uid) => {
    try {
      const q = query(collection(db, `users/${uid}/moods`), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setMoodHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  };

  const loadJournals = async (uid) => {
    try {
      const q = query(collection(db, `users/${uid}/journals`), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  };

  const handleLogin = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (e) { alert('Login error: ' + e.message); }
  };

  const handleLogout = async () => { await signOut(auth); setScreen('home'); setMessages([]); };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAiLoading(true);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: `Tu Feeling.L hai — ek warm, empathetic emotional AI companion. Tu Hinglish mein baat karta hai. Tu user ki feelings ko deeply samjhta hai. User ka naam ${user?.displayName?.split(' ')[0]} hai.` },
            ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: input }
          ],
          max_tokens: 300,
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.choices?.[0]?.message?.content || 'Main yahan hun 💙' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Thodi problem aa gayi 💙' }]);
    }
    setAiLoading(false);
  };

  const saveMood = async () => {
    if (!selectedMood) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/moods`), { mood: selectedMood, note: moodNote, createdAt: serverTimestamp() });
      setSelectedMood(null); setMoodNote(''); loadMoodHistory(user.uid);
      alert('Mood save ho gaya! 🌟');
    } catch (e) {}
  };

  const saveJournal = async () => {
    if (!journalText.trim()) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/journals`), { text: journalText, createdAt: serverTimestamp() });
      setJournalText(''); loadJournals(user.uid);
      alert('Journal save ho gaya! 📔');
    } catch (e) {}
  };

  const S = {
    app: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', fontFamily: "'Segoe UI', sans-serif", color: 'white' },
    header: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' },
    card: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', margin: '12px 16px' },
    primaryBtn: { background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none', borderRadius: '12px', padding: '14px', color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', width: '100%' },
    input: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '12px 18px', color: 'white', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
    navbar: { display: 'flex', justifyContent: 'space-around', background: 'rgba(15,12,41,0.95)', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '10px 0', position: 'fixed', bottom: 0, left: 0, right: 0 },
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0c29', color: 'white', flexDirection: 'column', gap: '16px' }}><div style={{ fontSize: '48px' }}>💙</div><p>Loading...</p></div>;

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', padding: '20px' }}>
      <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', maxWidth: '360px', width: '100%' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>💙</div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', background: 'linear-gradient(135deg, #f093fb, #f5576c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px' }}>Feeling.L</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '36px', fontSize: '14px', lineHeight: '1.6' }}>Apna personal emotional companion<br/>Jo hamesha tumhare saath hai 🌸</p>
        <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: 'white', color: '#333', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '20px' }}>Sign in karke aap Terms & Privacy se agree karte hain</p>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <div style={{ paddingBottom: screen === 'chat' ? '0' : '70px' }}>
        {screen === 'home' && (
          <div>
            <div style={S.header}>
              <div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Namaste 👋</div><div style={{ fontSize: '20px', fontWeight: '700' }}>{user.displayName?.split(' ')[0]}</div></div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={user.photoURL} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #f093fb' }} />
                <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
              </div>
            </div>
            <div style={S.card}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>Aaj kaisa feel kar rahe ho?</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {moods.map(m => (
                  <button key={m.value} onClick={() => { setSelectedMood(m); setScreen('mood'); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 6px', cursor: 'pointer', flex: 1, fontSize: '22px' }}>{m.emoji}</button>
                ))}
              </div>
            </div>
            {[{ icon: '💬', title: 'AI se baat karo', sub: 'Apni feelings share karo', s: 'chat' }, { icon: '😊', title: 'Mood Track karo', sub: 'Daily mood log', s: 'mood' }, { icon: '📔', title: 'Journal likho', sub: 'Private diary', s: 'journal' }].map(item => (
              <button key={item.s} onClick={() => setScreen(item.s)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px', margin: '0 0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', color: 'white' }}>
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <div style={{ textAlign: 'left' }}><div style={{ fontWeight: '600' }}>{item.title}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{item.sub}</div></div>
                <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: '20px' }}>›</span>
              </button>
            ))}
          </div>
        )}

        {screen === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ ...S.header, background: 'rgba(15,12,41,0.95)', position: 'sticky', top: 0, zIndex: 10 }}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>←</button>
              <div style={{ textAlign: 'center' }}><div style={{ fontWeight: '700' }}>💙 Feeling.L</div><div style={{ fontSize: '11px', color: '#43e97b' }}>● Online</div></div>
              <div style={{ width: '32px' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '12px 0', paddingBottom: '130px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'linear-gradient(135deg, #f093fb, #f5576c)' : 'rgba(255,255,255,0.1)', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px', maxWidth: '75%', margin: '4px 16px', fontSize: '14px', lineHeight: '1.5' }}>{m.text}</div>
              ))}
              {aiLoading && <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', margin: '4px 16px', fontSize: '14px' }}>💙 Soch raha hun...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', gap: '8px', padding: '12px 16px', background: 'rgba(15,12,41,0.95)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <input style={{ ...S.input, flex: 1, width: 'auto' }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Kuch bhi share karo..." />
              <button onClick={sendMessage} style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '16px', color: 'white', flexShrink: 0 }}>➤</button>
            </div>
          </div>
        )}

        {screen === 'mood' && (
          <div>
            <div style={S.header}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>←</button>
              <div style={{ fontWeight: '700' }}>😊 Mood Tracker</div>
              <div style={{ width: '32px' }} />
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: '600', marginBottom: '16px' }}>Aaj kaisa feel kar rahe ho?</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {moods.map(m => (
                  <button key={m.value} onClick={() => setSelectedMood(m)} style={{ background: selectedMood?.value === m.value ? m.color + '33' : 'rgba(255,255,255,0.06)', border: `2px solid ${selectedMood?.value === m.value ? m.color : 'transparent'}`, borderRadius: '14px', padding: '12px 6px', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>{m.emoji}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>{m.label}</div>
                  </button>
                ))}
              </div>
              <input style={{ ...S.input, marginBottom: '12px' }} value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Note (optional)..." />
              <button onClick={saveMood} style={S.primaryBtn}>Save Mood 💾</button>
            </div>
            {moodHistory.length > 0 && <div style={S.card}>
              <div style={{ fontWeight: '600', marginBottom: '12px' }}>History</div>
              {moodHistory.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '22px' }}>{m.mood?.emoji}</span>
                  <div><div style={{ fontSize: '14px' }}>{m.mood?.label}</div>{m.note && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{m.note}</div>}</div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {screen === 'journal' && (
          <div>
            <div style={S.header}>
              <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '22px', cursor: 'pointer' }}>←</button>
              <div style={{ fontWeight: '700' }}>📔 Journal</div>
              <div style={{ width: '32px' }} />
            </div>
            <div style={S.card}>
              <div style={{ fontWeight: '600', marginBottom: '12px' }}>Aaj kya hua? ✍️</div>
              <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', color: 'white', fontSize: '14px', outline: 'none', minHeight: '150px', resize: 'none', boxSizing: 'border-box' }} value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Apni feelings, thoughts sab yahan likho 🔒" />
              <button onClick={saveJournal} style={{ ...S.primaryBtn, marginTop: '12px' }}>Save 📔</button>
            </div>
            {journals.map(j => (
              <div key={j.id} style={S.card}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>{j.createdAt?.toDate?.()?.toLocaleDateString('hi-IN') || 'Abhi'}</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>{j.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {screen !== 'chat' && (
        <div style={S.navbar}>
          {[{ icon: '🏠', label: 'Home', s: 'home' }, { icon: '💬', label: 'Chat', s: 'chat' }, { icon: '😊', label: 'Mood', s: 'mood' }, { icon: '📔', label: 'Journal', s: 'journal' }].map(n => (
            <button key={n.s} onClick={() => setScreen(n.s)} style={{ background: 'none', border: 'none', color: screen === n.s ? '#f093fb' : 'rgba(255,255,255,0.4)', fontSize: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 16px' }}>
              <span style={{ fontSize: '22px' }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
