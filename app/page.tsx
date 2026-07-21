"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Bubble = { id: number; x: number; y: number; size: number; color: string };

const COLORS = ["#ff7a9b", "#ffbf69", "#71d7c6", "#8e9cff", "#be8cff"];
const GAME_SECONDS = 45;

function makeBubble(id: number): Bubble {
  return {
    id,
    x: 8 + Math.random() * 76,
    y: 14 + Math.random() * 66,
    size: 58 + Math.random() * 45,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [seconds, setSeconds] = useState(GAME_SECONDS);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("准备好，把烦恼一个个戳走。");
  const nextId = useRef(0);
  const lastPop = useRef(0);

  const addBubble = useCallback(() => {
    setBubbles((current) => [...current.slice(-6), makeBubble(nextId.current++)]);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setSeconds(GAME_SECONDS);
    setBubbles(Array.from({ length: 4 }, () => makeBubble(nextId.current++)));
    setMessage("开始啦！快戳泡泡。 ");
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          setBubbles([]);
          setMessage("这一局结束。慢慢呼吸，你做得很好。 ");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const maker = window.setInterval(addBubble, 760);
    return () => window.clearInterval(maker);
  }, [addBubble, running]);

  const pop = (id: number) => {
    if (!running) return;
    const now = Date.now();
    const newCombo = now - lastPop.current < 900 ? combo + 1 : 1;
    lastPop.current = now;
    setCombo(newCombo);
    setScore((value) => value + 10 + Math.min(newCombo, 10));
    setBubbles((current) => current.filter((bubble) => bubble.id !== id));
    window.setTimeout(addBubble, 160);
  };

  return (
    <main>
      <section className="game-shell" aria-label="泡泡放空站小游戏">
        <header>
          <div>
            <p className="eyebrow">TODAY&apos;S LITTLE PAUSE</p>
            <h1>泡泡放空站</h1>
          </div>
          <button className="start" onClick={startGame}>{running ? "重新开始" : seconds === 0 ? "再玩一局" : "开始游戏"}</button>
        </header>

        <div className="stats" aria-live="polite">
          <div><span>得分</span><strong>{score}</strong></div>
          <div><span>连击</span><strong>{combo}×</strong></div>
          <div><span>时间</span><strong>{seconds}s</strong></div>
        </div>

        <div className="playground">
          <div className="soft-orb orb-one" />
          <div className="soft-orb orb-two" />
          {!running && <div className="welcome"><span>◌</span><p>{message}</p></div>}
          {bubbles.map((bubble) => (
            <button
              className="bubble"
              key={bubble.id}
              aria-label="戳破泡泡"
              onClick={() => pop(bubble.id)}
              style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: bubble.size, height: bubble.size, background: bubble.color }}
            ><i /></button>
          ))}
        </div>
        <p className="hint">点击出现的泡泡。越快连击，分数越高。</p>
      </section>
    </main>
  );
}
