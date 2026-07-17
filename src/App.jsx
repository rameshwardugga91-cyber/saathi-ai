import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

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
const provider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a2e', color: 'white' }}>
      <h2>Loading...</h2>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
      {!user ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ color: '#e94560', fontSize: '48px', marginBottom: '10px' }}>Feeling.L</h1>
          <p style={{ color: '#aaa', marginBottom: '30px' }}>Apna emotional companion</p>
          <button onClick={handleLogin} style={{ padding: '14px 32px', fontSize: '16px', background: 'white', color: '#333', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto' }}>
            🔐 Google se Sign In karo
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
          <h1 style={{ color: '#e94560' }}>Feeling.L</h1>
          <p style={{ fontSize: '20px' }}>Namaste, {user.displayName}! 👋</p>
          <img src={user.photoURL} alt="profile" style={{ borderRadius: '50%', width: '80px', margin: '20px auto', display: 'block' }} />
          <button onClick={handleLogout} style={{ padding: '12px 28px', background: '#e94560', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
