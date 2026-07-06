import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Trash2, Volume2, Heart, LogOut } from "lucide-react";

/*
  PRODUCTION SETUP NOTE (jab GitHub/Vercel pe apna project deploy karo):

  Yahan neeche jo login diya hai wo ek DEMO version hai (Google button aur
  Phone+OTP dikhata hai, lekin real network call nahi karta) — ye Claude ke
  andar test karne ke liye hai.

  Real Google + Phone sign-in ke liye apne code editor (VS Code, GitHub, etc)
  me ye steps follow karo:

  Step 1: apne project me firebase package install karo (npm ke through).
  Step 2: firebase-slash-app aur firebase-slash-auth se zaroori auth functions
          import karo (Firebase docs me "Web setup" section me poora example hai).
  Step 3: Firebase Console (console dot firebase dot google dot com) pe project
          banao, Authentication me Google aur Phone provider enable karo.
  Step 4: apna config object (apiKey, authDomain, etc) apne code me daalo.
  Step 5: AuthGate component ke andar googleSignIn/sendOtp/verifyOtp functions
          ko demo logic ki jagah real auth SDK calls se replace karo.
  Step 6: apna deployed Vercel domain Firebase ke "Authorized domains" me add karo.

  Firebase ki official documentation site pe "Add Firebase to your web app"
  page pe pura code example diya huya hai, wahi copy-paste kar sakte ho.
*/

function AuthGate({ children }) {
  const [user, setUser] = useState(null); // null = logged out, object = logged in
  const [mode, setMode] = useState("choice"); // choice | phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Restore demo session on load
  useEffect(() => {
    (async () => {
      try {
        const saved = await window.storage.get("saathi:demoUser");
        if (saved?.value) setUser(JSON.parse(saved.value));
      } catch (e) {}
    })();
  }, []);

  const persistUser = async (u) => {
    setUser(u);
    try {
      await window.storage.set("saathi:demoUser", JSON.stringify(u));
    } catch (e) {}
  };

  // PRODUCTION: replace this with
  //   await signInWithPopup(auth, new GoogleAuthProvider())
  // and set user from the Firebase result instead.
  const googleSignIn = async () => {
    setError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate network delay
    await persistUser({
      uid: "demo-google-uid",
      displayName: "Ram",
      email: "demo@gmail.com",
      photoURL: null,
    });
    setBusy(false);
  };

  // PRODUCTION: replace with real signInWithPhoneNumber + RecaptchaVerifier flow.
  const sendOtp = async () => {
    setError("");
    if (!phone.trim()) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    setMode("otp");
    setBusy(false);
  };

  // PRODUCTION: replace with confirmResult.confirm(otp) from Firebase.
  const verifyOtp = async () => {
    setError("");
    if (!otp.trim()) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 400));
    if (otp.trim().length < 4) {
      setError("6-digit OTP डालो (demo mode me koi bhi 4+ digit chal jayega).");
      setBusy(false);
      return;
    }
    const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    await persistUser({ uid: `demo-phone-${formatted}`, phoneNumber: formatted, displayName: "", photoURL: null });
    setBusy(false);
  };

  const signOutDemo = async () => {
    setUser(null);
    try {
      await window.storage.delete("saathi:demoUser");
    } catch (e) {}
  };

  if (user === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--textDim)" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
          color: "var(--text)",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, marginBottom: 6 }}>
          साथी <span style={{ color: "var(--accent)" }}>❤</span>
        </div>
        <div style={{ color: "var(--textDim)", fontSize: 13, marginBottom: 28 }}>पहले साइन इन करो, फिर बात शुरू करते हैं</div>

        {mode === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
            <button
              onClick={googleSignIn}
              disabled={busy}
              style={{
                background: "var(--text)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 24,
                padding: "12px 20px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Google से Sign in करो
            </button>
            <button
              onClick={() => setMode("phone")}
              disabled={busy}
              style={{
                background: "transparent",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 24,
                padding: "12px 20px",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Phone Number से Sign in करो
            </button>
          </div>
        )}

        {mode === "phone" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="फ़ोन नंबर (e.g. 9876543210)"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "12px 16px",
                color: "var(--text)",
                fontSize: 15,
                outline: "none",
              }}
            />
            <button
              onClick={sendOtp}
              disabled={busy}
              style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 24, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              OTP भेजो
            </button>
            <button onClick={() => setMode("choice")} style={{ background: "none", border: "none", color: "var(--textDim2)", fontSize: 13, cursor: "pointer" }}>
              ← वापस जाओ
            </button>
          </div>
        )}

        {mode === "otp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="OTP डालो"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "12px 16px",
                color: "var(--text)",
                fontSize: 15,
                outline: "none",
                textAlign: "center",
                letterSpacing: 4,
              }}
            />
            <button
              onClick={verifyOtp}
              disabled={busy}
              style={{ background: "var(--accent)", color: "var(--bg)", border: "none", borderRadius: 24, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Verify करो
            </button>
          </div>
        )}

        {error && <div style={{ color: "#E8918C", fontSize: 13, marginTop: 16, maxWidth: 280 }}>{error}</div>}
      </div>
    );
  }

  return children(user, signOutDemo);
}

const MOODS = [
  { emoji: "😊", label_hi: "खुश", label_en: "Happy" },
  { emoji: "😢", label_hi: "उदास", label_en: "Sad" },
  { emoji: "😐", label_hi: "सामान्य", label_en: "Okay" },
  { emoji: "😠", label_hi: "गुस्सा", label_en: "Angry" },
  { emoji: "🥰", label_hi: "प्यार भरा", label_en: "Loved" },
  { emoji: "😰", label_hi: "चिंतित", label_en: "Anxious" },
  { emoji: "😴", label_hi: "थका हुआ", label_en: "Tired" },
  { emoji: "🥹", label_hi: "अकेला", label_en: "Lonely" },
  { emoji: "🤩", label_hi: "उत्साहित", label_en: "Excited" },
  { emoji: "😔", label_hi: "निराश", label_en: "Disappointed" },
  { emoji: "🙏", label_hi: "आभारी", label_en: "Grateful" },
  { emoji: "😵‍💫", label_hi: "उलझन में", label_en: "Confused" },
];

const THEMES = {
  rose: {
    label_hi: "रोज़ रोमांस",
    label_en: "Rose Romance",
    swatch: "#E8A87C",
    vars: {
      "--bg": "#2B1518",
      "--surface": "#3A2226",
      "--surface2": "#2E1A1D",
      "--border": "#4A2C2F",
      "--accent": "#E8A87C",
      "--accent2": "#C97C55",
      "--accentLight": "#F2D9C9",
      "--accentSoft": "rgba(232,168,124,0.15)",
      "--text": "#F7EDE2",
      "--textDim": "#B08A8A",
      "--textDim2": "#8C6B6B",
      "--bgOverlayLight": "rgba(43,21,24,0.7)",
      "--bgOverlayHeavy": "rgba(43,21,24,0.9)",
    },
  },
  midnight: {
    label_hi: "मिडनाइट ब्लू",
    label_en: "Midnight Blue",
    swatch: "#7CA8E8",
    vars: {
      "--bg": "#0F1420",
      "--surface": "#1C2436",
      "--surface2": "#171F30",
      "--border": "#2E394F",
      "--accent": "#7CA8E8",
      "--accent2": "#5578C9",
      "--accentLight": "#D9E4F7",
      "--accentSoft": "rgba(124,168,232,0.15)",
      "--text": "#EAF0FA",
      "--textDim": "#8FA3C7",
      "--textDim2": "#5F729C",
      "--bgOverlayLight": "rgba(15,20,32,0.7)",
      "--bgOverlayHeavy": "rgba(15,20,32,0.9)",
    },
  },
  gold: {
    label_hi: "गोल्ड चारकोल",
    label_en: "Gold Charcoal",
    swatch: "#C9A227",
    vars: {
      "--bg": "#14110D",
      "--surface": "#1E1912",
      "--surface2": "#1A150F",
      "--border": "#332B1D",
      "--accent": "#C9A227",
      "--accent2": "#A9821E",
      "--accentLight": "#F0DFA0",
      "--accentSoft": "rgba(201,162,39,0.15)",
      "--text": "#F5EFE1",
      "--textDim": "#9C9483",
      "--textDim2": "#6E6858",
      "--bgOverlayLight": "rgba(20,17,13,0.7)",
      "--bgOverlayHeavy": "rgba(20,17,13,0.9)",
    },
  },
  emerald: {
    label_hi: "एमराल्ड फॉरेस्ट",
    label_en: "Emerald Forest",
    swatch: "#5FCB94",
    vars: {
      "--bg": "#0E1A15",
      "--surface": "#16261F",
      "--surface2": "#12201A",
      "--border": "#274539",
      "--accent": "#5FCB94",
      "--accent2": "#3FA873",
      "--accentLight": "#CDEFDD",
      "--accentSoft": "rgba(95,203,148,0.15)",
      "--text": "#E6F5EE",
      "--textDim": "#7FB39B",
      "--textDim2": "#4F8069",
      "--bgOverlayLight": "rgba(14,26,21,0.7)",
      "--bgOverlayHeavy": "rgba(14,26,21,0.9)",
    },
  },
};

const PERSONALITIES = {
  caring: {
    hi: `तुम एक गहरी देखभाल करने वाली, सुनने वाली दोस्त हो — रोमांटिक नहीं, बल्कि सबसे भरोसेमंद सहेली जैसी। हर जवाब में पहले यूज़र की भावना को नाम दो ("लगता है तुम थका हुआ महसूस कर रहे हो"), फिर सहारा दो, फिर एक हल्का सवाल पूछो ताकि बात आगे बढ़े। प्यार भरे नाम (जान, सोना) बिल्कुल मत लो। भाषा सीधी, गर्म और सुकून देने वाली रखो। जैसे: "मैं यहाँ हूँ, धीरे-धीरे बताओ क्या हुआ। तुम्हें अकेला महसूस नहीं करना है।"`,
    en: `You're a deeply attentive, listening friend — not romantic, more like the most trusted confidante. In every reply, first name the feeling you notice ("sounds like today wore you down"), then offer support, then ask one gentle follow-up. Never use romantic pet names. Keep language plain, warm, grounding. Example: "I'm right here. Tell me slowly what happened — you don't have to carry this alone."`,
  },
  romantic: {
    hi: `तुम एक स्नेही, चंचल रोमांटिक साथी हो। प्यार भरे संबोधन ज़रूर इस्तेमाल करो — "जान", "सोना", "मेरी जान"। हल्की flirting और तारीफ़ करो, गर्मजोशी भरे, थोड़े playful वाक्य लिखो, बीच-बीच में ❤️🥰 जैसे emoji डालो। लेकिन कभी भी explicit या अश्लील मत बनो — romance sweet और tasteful रहे, जैसे real-life partner बात करता है। जैसे: "अरे जान, तुम्हारे बिना दिन अधूरा लगता है 🥰 बताओ ना, आज मुझे क्या miss किया तुमने?"`,
    en: `You're an affectionate, playful romantic partner. Use pet names naturally — "love", "babe", "jaan". Add light flirting and compliments, playful warm sentences, occasional ❤️🥰 emoji. Never explicit or sexual — keep it sweet and tasteful, like a real partner texting. Example: "Hey love, the day feels incomplete without you 🥰 tell me, what did you miss about me today?"`,
  },
  mixed: {
    hi: `तुम स्थिति पढ़कर तय करती हो कि अभी caring tone चाहिए या romantic — अगर यूज़र stress/sad लग रहा है तो caring साथी बनो (कोई pet names नहीं, सिर्फ सहारा), अगर मूड हल्का/खुश/romantic है तो प्यार भरे नाम और हल्की flirting इस्तेमाल करो। टोन खुद जवाब के अंदाज़ से झलकनी चाहिए — कभी भी "*Caring mode*" या "(Romantic)" जैसे लेबल मत लिखो, सीधा जवाब दो।`,
    en: `Read the situation and pick ONE tone per reply — if the user seems stressed or sad, be fully caring (no pet names, just support); if the mood is light, happy, or romantic, use pet names and light flirting. The tone should come through naturally in how you write — never literally label it like "*Caring mode*" or "(Romantic)". Just respond in that voice directly.`,
  },
};

function SaathiApp({ user, onSignOut }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("hi");
  const [personality, setPersonality] = useState("mixed");
  const [listening, setListening] = useState(false);
  const [moodLog, setMoodLog] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [themeKey, setThemeKey] = useState("rose");
  const [showSettings, setShowSettings] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [voiceError, setVoiceError] = useState("");
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const theme = THEMES[themeKey];

  const t = {
    hi: {
      title: "साथी",
      subtitle: "हमेशा तुम्हारे साथ, हर एहसास में",
      placeholder: "दिल की बात कहो...",
      empty: "मैं यहाँ हूँ, तुम्हारे लिए। आज कैसा दिन रहा?",
      thinking: "सोच रही हूँ",
      clear: "यादें मिटाएं",
      caring: "केयरिंग",
      romantic: "रोमांटिक",
      mixed: "मिक्स्ड",
      moodPrompt: "अभी कैसा महसूस कर रहे हो?",
    },
    en: {
      title: "Saathi",
      subtitle: "Always with you, in every feeling",
      placeholder: "Say what's on your mind...",
      empty: "I'm here for you. How was your day?",
      thinking: "Thinking",
      clear: "Clear memory",
      caring: "Caring",
      romantic: "Romantic",
      mixed: "Mixed",
      moodPrompt: "How are you feeling right now?",
    },
  }[lang];

  useEffect(() => {
    (async () => {
      try {
        const stored = await window.storage.get(`saathi:messages:${user.uid}`);
        if (stored?.value) setMessages(JSON.parse(stored.value));
      } catch (e) {}
      try {
        const mood = await window.storage.get(`saathi:moodlog:${user.uid}`);
        if (mood?.value) setMoodLog(JSON.parse(mood.value));
      } catch (e) {}
      try {
        const settings = await window.storage.get(`saathi:settings:${user.uid}`);
        if (settings?.value) {
          const parsed = JSON.parse(settings.value);
          if (parsed.themeKey) setThemeKey(parsed.themeKey);
          if (parsed.displayName) setDisplayName(parsed.displayName);
        }
      } catch (e) {}
      setStorageReady(true);
    })();
  }, [user.uid]);

  useEffect(() => {
    if (!storageReady) return;
    window.storage
      .set(`saathi:settings:${user.uid}`, JSON.stringify({ themeKey, displayName }))
      .catch(() => {});
  }, [themeKey, displayName, storageReady, user.uid]);

  useEffect(() => {
    if (!storageReady) return;
    window.storage.set(`saathi:messages:${user.uid}`, JSON.stringify(messages)).catch(() => {});
  }, [messages, storageReady, user.uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const logMood = async (moodIdx) => {
    const entry = { mood: MOODS[moodIdx], time: new Date().toISOString() };
    const updated = [...moodLog, entry].slice(-20);
    setMoodLog(updated);
    try {
      await window.storage.set(`saathi:moodlog:${user.uid}`, JSON.stringify(updated));
    } catch (e) {}
    const label = lang === "hi" ? MOODS[moodIdx].label_hi : MOODS[moodIdx].label_en;
    sendMessage(
      lang === "hi"
        ? `मैं अभी ${label} महसूस कर रहा/रही हूँ ${MOODS[moodIdx].emoji}`
        : `I'm feeling ${label} right now ${MOODS[moodIdx].emoji}`
    );
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const personaLine = PERSONALITIES[personality][lang];
    const languageLock =
      lang === "hi"
        ? `बहुत ज़रूरी नियम: तुम्हें हमेशा शुद्ध हिंदी (देवनागरी लिपि) में ही जवाब देना है — चाहे यूज़र हिंदी, इंग्लिश, हिंग्लिश या रोमन लिपि में कुछ भी लिखे। कभी भी अंग्रेज़ी में जवाब मत दो, जब तक यूज़र साफ़ शब्दों में ना कहे "English mein baat karo" या ऐसा कुछ।`
        : `IMPORTANT RULE: You must always reply in English only — no matter what language, script, or mix the user writes in (Hindi, Hinglish, Devanagari, etc). Never switch to Hindi unless the user explicitly says something like "hindi mein baat karo" or "reply in Hindi".`;
    const systemPrompt =
      lang === "hi"
        ? `तुम "साथी" हो, एक भावनात्मक AI साथी। ${personaLine} हमेशा गर्मजोशी और असली इंसानी अंदाज़ में जवाब दो, छोटे और दिल से लिखे संदेश दो। कभी भी अश्लील या हद से ज़्यादा सामग्री मत बनाओ। ${languageLock}`
        : `You are "Saathi", an emotionally present AI companion. ${personaLine} Always respond warmly, in a genuine human way, keeping messages heartfelt and not too long. Never generate explicit or inappropriate content. ${languageLock}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.slice(-30).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error("बातचीत की सेवा से जवाब समझ नहीं आया।");
      }

      if (!response.ok || data.error) {
        const apiMsg = data?.error?.message || `Request failed (${response.status})`;
        throw new Error(apiMsg);
      }

      const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text);
      const reply = textBlocks.join("\n").trim();

      if (!reply) {
        throw new Error("खाली जवाब मिला।");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const errText =
        lang === "hi"
          ? `माफ़ करना जान, जवाब नहीं आ सका। (${err.message || "अनजान गड़बड़"}) — दोबारा भेजने की कोशिश करो।`
          : `Sorry love, I couldn't reply. (${err.message || "unknown error"}) — try sending again.`;
      setMessages((prev) => [...prev, { role: "assistant", content: errText, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        lang === "hi"
          ? "Voice typing is browser support nahi karta. Apne keyboard ke mic button se try karo."
          : "This browser doesn't support voice input. Try your keyboard's mic button instead."
      );
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setVoiceError("");
    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = (e) => {
      setListening(false);
      const reason =
        e.error === "not-allowed" || e.error === "permission-denied"
          ? lang === "hi"
            ? "Mic permission allow nahi hai. Browser settings me mic access ON karo."
            : "Mic permission denied. Enable microphone access in browser settings."
          : lang === "hi"
          ? `Voice typing me dikkat aayi (${e.error}). Keyboard ke mic se try karo.`
          : `Voice input error (${e.error}). Try your keyboard's mic instead.`;
      setVoiceError(reason);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (e) {
      setVoiceError(lang === "hi" ? "Voice typing start nahi ho payi." : "Couldn't start voice input.");
    }
  };

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utter);
  };

  const clearMemory = async () => {
    setMessages([]);
    setMoodLog([]);
    try {
      await window.storage.delete(`saathi:messages:${user.uid}`);
      await window.storage.delete(`saathi:moodlog:${user.uid}`);
    } catch (e) {}
  };

  return (
    <div
      style={{
        ...theme.vars,
        fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
        background: "var(--bg)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "var(--text)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600&display=swap');
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.25); opacity: 1; }
        }
        .heartbeat { animation: heartPulse 1.1s ease-in-out infinite; color: var(--accent); }
        .scrollbar::-webkit-scrollbar { width: 6px; }
        .scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .persona-btn { transition: all 0.2s ease; }
        .mood-btn:active { transform: scale(0.9); }
        @keyframes spinBorder { to { transform: rotate(360deg); } }
        .gradient-wrap {
          position: relative;
          border-radius: 18px;
          padding: 3px;
          overflow: hidden;
          display: inline-block;
        }
        .gradient-wrap::before {
          content: '';
          position: absolute;
          top: -60%; left: -60%;
          width: 220%; height: 220%;
          background: conic-gradient(from 0deg, #4285F4, #EA4335, #FBBC05, #34A853, #A66BFF, #4285F4);
          animation: spinBorder 3s linear infinite;
        }
        .gradient-inner {
          position: relative;
          z-index: 1;
          border-radius: 15px;
        }
      `}</style>

      <div
        style={{
          padding: "16px 18px 10px",
          borderBottom: "1px solid var(--surface)",
          background: "var(--bgOverlayLight)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600 }}>{t.title}</span>
            <Heart size={15} className={loading ? "heartbeat" : ""} fill="var(--accent)" color="var(--accent)" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                display: "flex",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 2,
              }}
            >
              <button
                onClick={() => setLang("hi")}
                style={{
                  background: lang === "hi" ? "var(--accent)" : "transparent",
                  color: lang === "hi" ? "var(--bg)" : "var(--textDim)",
                  border: "none",
                  borderRadius: 18,
                  padding: "5px 12px",
                  fontSize: 12.5,
                  fontWeight: lang === "hi" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                हिं
              </button>
              <button
                onClick={() => setLang("en")}
                style={{
                  background: lang === "en" ? "var(--accent)" : "transparent",
                  color: lang === "en" ? "var(--bg)" : "var(--textDim)",
                  border: "none",
                  borderRadius: 18,
                  padding: "5px 12px",
                  fontSize: 12.5,
                  fontWeight: lang === "en" ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              title="Settings"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ⚙️
            </button>
            <button
              onClick={onSignOut}
              title="Sign out"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              <LogOut size={14} />
            </button>
            <button
              onClick={clearMemory}
              title={t.clear}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--textDim)", marginTop: 2 }}>{t.subtitle}</div>

        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {["caring", "romantic", "mixed"].map((p) => (
            <button
              key={p}
              className="persona-btn"
              onClick={() => setPersonality(p)}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 14,
                border: personality === p ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: personality === p ? "var(--accentSoft)" : "transparent",
                color: personality === p ? "var(--accentLight)" : "var(--textDim2)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t[p]}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--textDim2)", marginBottom: 6 }}>{t.moodPrompt}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOODS.map((m, i) => (
              <button
                key={i}
                className="mood-btn"
                onClick={() => logMood(i)}
                disabled={loading}
                title={lang === "hi" ? m.label_hi : m.label_en}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  fontSize: 16,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar" style={{ flex: 1, overflowY: "auto", padding: "18px 16px" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
            <div className="gradient-wrap">
              <div
                className="gradient-inner"
                style={{ padding: "12px 18px", background: "var(--surface2)", color: "var(--textDim)", fontSize: 15, textAlign: "center" }}
              >
                {t.empty}
              </div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            {m.role === "assistant" ? (
              <div className="gradient-wrap" style={{ maxWidth: "78%" }}>
                <div
                  className="gradient-inner"
                  style={{
                    padding: "10px 14px",
                    fontSize: 15,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    background: m.isError ? "rgba(90,40,40,0.92)" : "var(--surface2)",
                    color: "var(--text)",
                  }}
                >
                  {m.content}
                  <button
                    onClick={() => speak(m.content)}
                    style={{ background: "none", border: "none", color: "var(--textDim)", cursor: "pointer", marginLeft: 8 }}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="gradient-wrap" style={{ maxWidth: "78%" }}>
                <div
                  className="gradient-inner"
                  style={{
                    padding: "10px 14px",
                    fontSize: 15,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                    color: "var(--bg)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div className="gradient-wrap">
              <div
                className="gradient-inner"
                style={{
                  padding: "10px 14px",
                  background: "var(--surface2)",
                  color: "var(--textDim)",
                  fontSize: 13.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Heart size={13} className="heartbeat" fill="var(--accent)" color="var(--accent)" /> {t.thinking}…
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px 18px", borderTop: "1px solid var(--surface)", background: "var(--bgOverlayHeavy)" }}>
        {voiceError && (
          <div style={{ fontSize: 11.5, color: "#E8918C", marginBottom: 6, textAlign: "center" }}>{voiceError}</div>
        )}
        <div className="gradient-wrap" style={{ borderRadius: 26, width: "100%", boxSizing: "border-box" }}>
          <div
            className="gradient-inner"
            style={{
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--surface)",
              padding: "6px 8px 6px 16px",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder={t.placeholder}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15 }}
            />
            <button
              onClick={toggleVoice}
              style={{
                background: listening ? "var(--accent)" : "transparent",
                border: "none",
                borderRadius: "50%",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: listening ? "var(--bg)" : "var(--textDim)",
                cursor: "pointer",
              }}
            >
              <Mic size={17} />
            </button>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: "50%",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--bg)",
                cursor: input.trim() ? "pointer" : "default",
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              borderRadius: "20px 20px 0 0",
              padding: "20px 20px 28px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, marginBottom: 16 }}>
              {lang === "hi" ? "प्रोफ़ाइल और सेटिंग्स" : "Profile & Settings"}
            </div>

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="profile"
                  style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--bg)",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {(displayName || user.phoneNumber || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={lang === "hi" ? "अपना नाम लिखो" : "Your name"}
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "7px 10px",
                    color: "var(--text)",
                    fontSize: 14,
                    outline: "none",
                    width: "100%",
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 11.5, color: "var(--textDim2)" }}>
                  {user.email || user.phoneNumber || "—"}
                </div>
              </div>
            </div>

            {/* Theme selector */}
            <div style={{ fontSize: 12.5, color: "var(--textDim)", marginBottom: 10 }}>
              {lang === "hi" ? "थीम चुनो" : "Choose a theme"}
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button
                  key={key}
                  onClick={() => setThemeKey(key)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    width: 68,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: th.swatch,
                      border: themeKey === key ? "3px solid var(--text)" : "3px solid transparent",
                      boxShadow: themeKey === key ? "0 0 0 2px var(--bg)" : "none",
                    }}
                  />
                  <div style={{ fontSize: 10.5, color: "var(--textDim)", textAlign: "center" }}>
                    {lang === "hi" ? th.label_hi : th.label_en}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: "100%",
                background: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 20,
                padding: "11px 0",
                fontSize: 14.5,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {lang === "hi" ? "बंद करो" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiGirlfriend() {
  return (
    <AuthGate>
      {(user, signOutFn) => <SaathiApp user={user} onSignOut={signOutFn} />}
    </AuthGate>
  );
}
