import { useEffect, useState, useRef } from "react";
import "./leaderboard.css";

export default function LeaderboardPage() {
  const [data, setData] = useState({});
  const [teams, setTeams] = useState({});
  const [sorted, setSorted] = useState([]);
  const prevSortedRef = useRef([]);
  const ws = useRef(null);

  // ❗ Load teams once
  useEffect(() => {
    fetch("http://localhost:5000/teams")
      .then(res => res.json())
      .then(json => setTeams(json));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/leaderboard")
      .then(res => res.json())
      .then(initialData => {
        setData(initialData);

        const initialSorted = Object.entries(initialData).sort((a, b) => b[1] - a[1]);
        setSorted(initialSorted);
        prevSortedRef.current = initialSorted;
      });
  }, []);

  // WebSocket for live leaderboard updates
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => console.log("WebSocket connected");
    ws.current.onclose = () => console.log("WebSocket disconnected");

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.tables) return;

      const newData = message.tables;
      setData(newData);

      const newSorted = Object.entries(newData).sort((a, b) => b[1] - a[1]);
      detectPositionChanges(prevSortedRef.current, newSorted);
      setSorted(newSorted);
      prevSortedRef.current = newSorted;
    };

    return () => ws.current.close();
  }, []);

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Leaderboard</h1>

      <div className="leaderboard-list">
        {sorted.map(([table, total]) => (
          <div className="leaderboard-item" id={`table-${table}`} key={table}>
            <div className="leaderboard-rank">
              {teams[table] || "Onbekend team"}
            </div>
            <div className="leaderboard-score">€{total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
