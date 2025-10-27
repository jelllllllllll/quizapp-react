import React, { useEffect, useState, useRef } from "react";
import "./index.css";

const LS_USER = "quiz_user_v2";
const LS_QUIZ = "quiz_state_v2";

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function Login({ onLogin }) {
  const [name, setName] = useState("");
  return (
    <div className="card center">
      <h2>Login</h2>
      <input
        placeholder="Masukkan nama"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            if (!name.trim()) return alert("Masukkan nama dulu!");
            const u = { name: name.trim(), createdAt: Date.now() };
            localStorage.setItem(LS_USER, JSON.stringify(u));
            onLogin(u);
          }}
        >
          Start
        </button>
      </div>
      <p className="muted small">Soal diambil dari OpenTDB (public API)</p>
    </div>
  );
}

function Config({
  user,
  amount,
  setAmount,
  qtype,
  setQtype,
  minutes,
  setMinutes,
  onStart,
  onLogout,
  loading,
}) {
  return (
    <div className="card center">
      <h2>Halo {user.name} </h2>
      <p className="muted">Konfigurasi kuis sebelum mulai</p>

      <label>Jumlah soal</label>
      <input
        type="number"
        min={1}
        max={50}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <label>Tipe soal</label>
      <select value={qtype} onChange={(e) => setQtype(e.target.value)}>
        <option value="">Any</option>
        <option value="multiple">Multiple Choice</option>
        <option value="boolean">True / False</option>
      </select>

      <label>Waktu (menit)</label>
      <input
        type="number"
        min={1}
        max={120}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
      />

      <div className="row">
        <button className="btn" onClick={() => onStart()} disabled={loading}>
          {loading ? "Memuat..." : "Mulai Kuis"}
        </button>
        <button
          className="btn outline"
          onClick={() => {
            localStorage.removeItem(LS_USER);
            onLogout();
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function ResumePrompt({ onResume, onDiscard }) {
  return (
    <div className="card center">
      <h3>Resume kuis ditemukan</h3>
      <p className="muted">Ada kuis yang belum selesai. Mau dilanjutkan?</p>
      <div className="row">
        <button className="btn" onClick={onResume}>
          Lanjutkan
        </button>
        <button className="btn outline" onClick={onDiscard}>
          Hapus & Mulai Baru
        </button>
      </div>
    </div>
  );
}

function QuizPage({ quizState, setQuizState, onFinish }) {
  const { questions, currentIndex, answers, endAt } = quizState;
  const q = questions[currentIndex];
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((endAt - Date.now()) / 1000)));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((endAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        onFinish();
      }
    }, 300);
    return () => clearInterval(timerRef.current);
  }, [endAt, onFinish]);

  function selectAnswer(choiceIdx) {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = choiceIdx;
    const nextIndex = currentIndex + 1;
    const newState = { ...quizState, answers: newAnswers, currentIndex: nextIndex };
    setQuizState(newState);
    localStorage.setItem(LS_QUIZ, JSON.stringify(newState));

    if (nextIndex >= questions.length) {
      onFinish();
    }
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="card quiz">
      <div className="topbar">
        <div className="small">Soal {currentIndex + 1} / {questions.length}</div>
        <div className="timer">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
      </div>

      <h3 dangerouslySetInnerHTML={{ __html: q.question }} />

      <div className="options">
        {q.allChoices.map((c, idx) => (
          <button
            key={idx}
            className="option"
            onClick={() => selectAnswer(idx)}
            dangerouslySetInnerHTML={{ __html: c }}
          />
        ))}
      </div>
    </div>
  );
}

function Result({ quizState, onReset }) {
  const questions = quizState?.questions || [];
  const answers = quizState?.answers || [];
  const total = questions.length;
  const answered = answers.filter((a) => a !== null && a !== undefined).length;
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] == null) continue;
    const q = questions[i];
    if (q.correct_answer === q.allChoices[answers[i]]) correct++;
  }
  const wrong = answered - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="card center">
      <div className="resultHeader">
        <h2>Hasil Kuis</h2>
      </div>

      <div className="resultStats">
        <div><strong>Benar:</strong> {correct}</div>
        <div><strong>Salah:</strong> {wrong}</div>
        <div><strong>Dijawab:</strong> {answered}</div>
        <div><strong>Total Soal:</strong> {total}</div>
        <div><strong>Skor:</strong> {percent}%</div>
      </div>

      <div className="row">
        <button className="btn" onClick={onReset}>Main Lagi</button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_USER)) || null;
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState("welcome");
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState(5);
  const [qtype, setQtype] = useState("");
  const [minutes, setMinutes] = useState(5);

  const [quizState, setQuizState] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(LS_QUIZ);
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.questions && s.questions.length) {
          setQuizState(s);
          setScreen("resumePrompt");
        }
      } catch (e) {
        // ignore
      }
    } else {
      if (user) setScreen("config");
      else setScreen("welcome");
    }
  }, [user]);

  function handleLogin(u) {
    setUser(u);
    setScreen("config");
  }

  function handleLogout() {
    localStorage.clear();
    setUser(null);
    setQuizState(null);
    setScreen("welcome");
  }

  async function startQuiz() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("amount", amount);
      if (qtype) params.append("type", qtype);
      const url = `https://opentdb.com/api.php?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data || data.response_code !== 0) {
        alert("Gagal mengambil soal dari OpenTDB. Coba ulang.");
        setLoading(false);
        return;
      }
      const questions = data.results.map((q) => {
        const allChoices = [...q.incorrect_answers, q.correct_answer];
        for (let i = allChoices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
        }
        return { ...q, allChoices };
      });

      const now = Date.now();
      const endAt = now + minutes * 60 * 1000;
      const state = { questions, currentIndex: 0, answers: new Array(questions.length).fill(null), endAt, createdAt: now };

      setQuizState(state);
      localStorage.setItem(LS_QUIZ, JSON.stringify(state));
      setScreen("quiz");
    } catch (err) {
      alert("Terjadi error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function resumeQuiz() {
    if (quizState) setScreen("quiz");
  }

  function discardQuiz() {
    localStorage.removeItem(LS_QUIZ);
    setQuizState(null);
    setScreen("config");
  }

  function finishQuiz() {
    setScreen("result");
    localStorage.removeItem(LS_QUIZ);
  }

  function resetAllAndConfig() {
    localStorage.removeItem(LS_QUIZ);
    setQuizState(null);
    setScreen("config");
  }

  if (!user && screen === "welcome") {
    return <div className="wrap"><Login onLogin={handleLogin} /></div>;
  }

  if (screen === "resumePrompt") {
    return <div className="wrap"><ResumePrompt onResume={resumeQuiz} onDiscard={discardQuiz} /></div>;
  }

  if (screen === "config") {
    return (
      <div className="wrap">
        <Config
          user={user}
          amount={amount}
          setAmount={setAmount}
          qtype={qtype}
          setQtype={setQtype}
          minutes={minutes}
          setMinutes={setMinutes}
          onStart={startQuiz}
          onLogout={handleLogout}
          loading={loading}
        />
      </div>
    );
  }

  if (screen === "quiz" && quizState) {
    return <div className="wrap"><QuizPage quizState={quizState} setQuizState={setQuizState} onFinish={finishQuiz} /></div>;
  }

  if (screen === "result" && quizState) {
    return <div className="wrap"><Result quizState={quizState} onReset={resetAllAndConfig} /></div>;
  }

  return <div className="wrap"><div className="card center">Loading...</div></div>;
}
