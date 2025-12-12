import React, { useState, useEffect, useRef } from "react";

// ForgiveMe.jsx
// Single-file React component (default export) that implements:
// - Landing page asking "Forgive me?" with two buttons: "Yes, I forgot" and "No"
//  - If user clicks Yes: navigate to a celebration page with heart + particles, play a music track
//   and show a typed message: "Break your promise if you think I'm truly in love with you" (editable)
// - All responses are stored locally (localStorage) with timestamp and optionally POSTed to a webhook
// - A small admin/responses panel lets you view collected responses (protected by a simple pin)
// Styling: Tailwind classes (assumes Tailwind is available in the project). Uses simple canvas particle system.
// Deployment notes (in comments below):
// 1) This is a frontend-only component. To receive responses server-side, set `WEBHOOK_URL` to a working
//    endpoint that accepts POST JSON (e.g. a Zapier webhook, Netlify function, or your server).
// 2) Browsers typically block autoplaying audio. We start playback after user interaction (the click on Yes).
// 3) To use: place this component in a React app (create-react-app / Vite) and ensure Tailwind is configured.

const STORAGE_KEY = "forgive_me_responses_v1";
const WEBHOOK_URL = ""; // OPTIONAL: set to your server/webhook URL to receive responses remotely
const ADMIN_PIN = "1234"; // change for your deployed site if you want a tiny gate to the responses panel

export default function ForgiveMe() {
  const [page, setPage] = useState("landing"); // 'landing' | 'celebrate' | 'no'
  const [responses, setResponses] = useState(() => loadResponses());
  const [name, setName] = useState("");
  const [note, setNote] = useState("Break your promise if you think I'm truly in love with you");
  const [showAdmin, setShowAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    // save responses to localStorage when responses change
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
    } catch (e) {}
  }, [responses]);

  useEffect(() => {
    if (page === "celebrate") {
      // try to play audio on celebrate page; browser requires user gesture (we clicked Yes)
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const p = audioRef.current.play();
        if (p && p.catch) p.catch(() => {
          /* autoplay blocked; that's okay */
        });
      }
    }
  }, [page]);

  function handleResponse(answer) {
    const entry = {
      id: Date.now(),
      name: name ? String(name).trim() : "",

      answer,
      time: new Date().toISOString(),
      pageAt: page,
    };
    setResponses((s) => [entry, ...s]);

    // try to POST to webhook if set
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => {
        // ignore network errors in this sample
      });
    }

    if (answer === "yes") {
      setPage("celebrate");
    } else {
      setPage("no");
    }
  }

  function handleSubmitName(e) {
    e.preventDefault();
    // simply keep name in state; when user clicks yes/no, it's recorded
  }

  function clearResponses() {
    if (!confirm("Clear all stored responses?")) return;
    setResponses([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-pink-700">Forgive Me?</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowAdmin((v) => !v)}
              className="text-sm px-3 py-1 rounded-full border border-pink-200"
            >
              {showAdmin ? "Close" : "Responses"}
            </button>
            <button
              onClick={() => { setPage("landing"); setShowAdmin(false); }}
              className="text-sm px-3 py-1 rounded-full border"
            >
              Home
            </button>
          </div>
        </header>

        <main>
          {showAdmin ? (
            <AdminPanel
              responses={responses}
              pin={pin}
              setPin={setPin}
              onClear={clearResponses}
            />
          ) : (
            <>
              {page === "landing" && (
                <Landing
                  name={name}
                  setName={setName}
                  onSubmitName={handleSubmitName}
                  onAnswer={handleResponse}
                />
              )}

              {page === "celebrate" && (
                <Celebrate
                  note={note}
                  setNote={setNote}
                  audioRef={audioRef}
                />
              )}

              {page === "no" && (
                <NoPage onBack={() => setPage("landing")} />
              )}
            </>
          )}
        </main>

        {/* Decorative hearts in the corner */}
        <div aria-hidden className="pointer-events-none absolute bottom-6 right-6 opacity-30">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-pink-300">
            <path d="M12 21s-6-4.35-9-7.5A5.5 5.5 0 0 1 3 5.5C3 3.5 5 2 6.8 2c1.4 0 2.4.9 3.2 1.8C11 2.9 12 2 13.4 2 15.2 2 17.2 3.5 17.2 5.5c0 2.8-2.3 5.9-5.2 9.5z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

function loadResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // Normalize entries so r.name is always a string (never undefined/null)
    return arr.map(r => ({
      ...r,
      name: (typeof r.name === 'string') ? r.name : ""
    }));
  } catch (e) {
    return [];
  }
}


function Landing({ name, setName, onSubmitName, onAnswer }) {
  const handleAnswer = (ans) => {
    if (!name || !name.trim()) {
      alert("Please enter your name first.");
      return;
    }
    onAnswer(ans);
  };

  return (
    <div className="text-center">
      <p className="text-lg text-pink-600 mb-4">I am sorry. Will you forgive me?</p>

      <form onSubmit={onSubmitName} className="mb-4 flex flex-col items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="px-4 py-2 rounded-lg border w-64 text-center"
          required
        />
      </form>

      <div className="flex justify-center gap-6 mt-4">
        <button
          onClick={() => handleAnswer("yes")}
          className="px-6 py-3 rounded-full bg-pink-600 text-white font-semibold shadow hover:scale-105 transform transition"
        >
          Yes, I forgot
        </button>

        <button
          onClick={() => handleAnswer("no")}
          className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
        >
          No
        </button>
      </div>

      <p className="mt-6 text-sm text-gray-500">(Your answer will be recorded on this site.)</p>
    </div>
  );
}

function NoPage({ onBack }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">I understand.</h2>
      <p className="text-gray-600 mb-6">If You Really Don't Want To Talk With You Think Im True Or Not, If You Think It Was True Then Break Your Promise And Come To Me Im Still Here For You.</p>
      <button onClick={onBack} className="px-5 py-2 border rounded">Go back</button>
    </div>
  );
}

function Celebrate({ note, setNote, audioRef }) {
  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Particle canvas */}
      <ParticleField />

      <div className="z-10 text-center px-6">
        <div className="inline-flex items-center gap-3 mb-4">
          <HeartPulse />
          <h2 className="text-3xl font-bold text-pink-700">Thank you ❤️</h2>
        </div>
        <TypedNote initialText={note || ""} />



        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => {
              // replay audio if needed
              if (audioRef.current) audioRef.current.play().catch(()=>{});
            }}
            className="px-4 py-2 rounded-full bg-white border"
          >Replay music</button>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigator.clipboard?.writeText(window.location.href); alert('Link copied!'); }}
            className="px-4 py-2 rounded-full border"
          >Share</a>
        </div>

        <audio ref={audioRef} src={"/assets/celebration.mp3"} preload="auto" />

      </div>
    </div>
  );
}

function TypedNote({ initialText }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const txt = String(initialText || "");
    let i = 0;
    setDisplay("");
    if (!txt || txt.length === 0) return;
    const t = setInterval(() => {
      if (i >= txt.length) { clearInterval(t); return; }
      const char = txt[i];
      setDisplay((s) => s + char);
      i++;
      if (i >= txt.length) clearInterval(t);
    }, 60);
    return () => clearInterval(t);
  }, [initialText]);

  return (
    <div className="bg-white/90 p-4 rounded-lg shadow-md max-w-xl mx-auto">
      <p className="text-center text-gray-800">{display}<span className="blinking-caret">|</span></p>
      <style>{`.blinking-caret{animation: blink 1s steps(2, start) infinite;} @keyframes blink{50%{opacity:0}}`}</style>
    </div>
  );
}

function HeartPulse(
) {
  return (
    <div className="w-12 h-12 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-10 h-10 animate-pulse text-pink-500">
        <path fill="currentColor" d="M12 21s-6-4.35-9-7.5A5.5 5.5 0 0 1 3 5.5C3 3.5 5 2 6.8 2c1.4 0 2.4.9 3.2 1.8C11 2.9 12 2 13.4 2 15.2 2 17.2 3.5 17.2 5.5c0 2.8-2.3 5.9-5.2 9.5z"/>
      </svg>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const particles = [];

    function rand(min, max) { return Math.random() * (max - min) + min; }

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: rand(0, w), y: rand(0, h), vx: rand(-0.4, 0.4), vy: rand(-0.6, -0.2), r: rand(4, 10), life: rand(80, 200)
      });
    }

    let raf;
    function loop() {
      ctx.clearRect(0, 0, w, h);
      for (let p of particles) {
        p.x += p.vx; p.y += p.vy; p.life -= 1;
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, p.life / 200);
        ctx.fillStyle = "rgba(255, 105, 180, 1)"; // pink hearts
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.life <= 0 || p.y < -20) {
          p.x = rand(0, w); p.y = h + 20; p.vx = rand(-0.4,0.4); p.vy = rand(-0.8, -0.2); p.life = rand(80,200);
        }
      }
      raf = requestAnimationFrame(loop);
    }

    function handleResize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
    window.addEventListener("resize", handleResize);
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", handleResize); };
  }, []);

  return (
    <div className="absolute inset-0 -z-0">
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function AdminPanel({ responses, pin, setPin, onClear }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (pin === ADMIN_PIN) setAuthorized(true);
  }, [pin]);

  if (!authorized) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">Responses (admin)</h3>
        <p className="text-sm text-gray-600 mb-3">Enter admin pin to view stored answers.</p>
        <input value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="Enter pin" className="px-3 py-2 rounded border" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold">Collected responses</h3>
        <div className="flex gap-2">
          <button onClick={onClear} className="px-3 py-1 border rounded">Clear</button>
        </div>
      </div>

      {responses.length === 0 ? (
        <p className="text-sm text-gray-500">No responses yet.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {responses.map(r => (
            <div key={r.id} className="p-3 bg-white rounded shadow-sm border">
              <div className="font-bold text-pink-700 mb-1">{r.name || "Anonymous"}</div>
              <div className="text-sm text-gray-700"><strong>Answer:</strong> {r.answer}</div>
              <div className="text-xs text-gray-500 mt-1">At: {new Date(r.time).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
