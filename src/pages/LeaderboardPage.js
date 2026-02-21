import { useEffect, useState, useRef } from "react";
import { useServerIP } from "../hooks/useServerIP";
import "./leaderboard.css";

export default function LeaderboardPage() {
  const [teams, setTeams] = useState({});
  const [sorted, setSorted] = useState([]);
  const prevSortedRef = useRef([]);
  const ws = useRef(null);
  const serverIP = useServerIP();

  // Effect: load teams, initial leaderboard, and setup WebSocket
  useEffect(() => {
    if (!serverIP) return;

    // Load teams
    fetch(`http://${serverIP}:5000/teams`)
      .then(res => res.json())
      .then(json => setTeams(json))
      .catch(err => console.error("Failed to load teams:", err));

    // Load initial leaderboard
    fetch(`http://${serverIP}:5000/leaderboard`)
      .then(res => res.json())
      .then(initialData => {
        const initialSorted = Object.entries(initialData).sort((a, b) => b[1] - a[1]);
        setSorted(initialSorted);
        prevSortedRef.current = initialSorted;
      })
      .catch(err => console.error("Failed to load leaderboard:", err));

    // Setup WebSocket
    ws.current = new WebSocket(`ws://${serverIP}:5000`);

    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => console.log("WebSocket disconnected");

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!message.tables) return;

        const newSorted = Object.entries(message.tables).sort((a, b) => b[1] - a[1]);
        detectPositionChanges(prevSortedRef.current, newSorted);
        setSorted(newSorted);
        prevSortedRef.current = newSorted;
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    return () => ws.current?.close();
  }, [serverIP]);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>

      <div className="leaderboard-list">
      {sorted.map(([table, total], index) => (
        <div
          className={`leaderboard-item ${index === 0 ? "top-team" : ""}`}
          id={`table-${table}`}
          key={table}
        >
          <div className="leaderboard-rank">
            {teams[table] || `Tafel ${table}`}
          </div>
          <div className="leaderboard-score">€{total}</div>
        </div>
      ))}
</div>

    </div>
  );
}

// Animate leaderboard position changes
function detectPositionChanges(prev, next) {
  if (!prev.length) return;

  const prevPositions = Object.fromEntries(prev.map(([t], i) => [t, i]));
  const nextPositions = Object.fromEntries(next.map(([t], i) => [t, i]));

  next.forEach(([table]) => {
    if (prevPositions[table] > nextPositions[table]) {
      const el = document.getElementById(`table-${table}`);
      if (!el) return;

      el.classList.add("leaderboard-up");
      setTimeout(() => el.classList.remove("leaderboard-up"), 1200);
    }
  });
}
