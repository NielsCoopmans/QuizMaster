import { useState, useEffect, useRef } from "react";
import { useServerIP } from "../hooks/useServerIP";
import "./orderpage.css";

export default function OrderPage() {
  const [table, setTable] = useState("");
  const [drinks, setDrinks] = useState([]);
  const [cart, setCart] = useState({});
  const ws = useRef(null);
  const serverIP = useServerIP();

  // Load drinks from server
  useEffect(() => {
    if (!serverIP) return;
    fetch(`http://${serverIP}:5000/drinks`)
      .then(res => res.json())
      .then(setDrinks);
  }, [serverIP]);

  // Connect to WebSocket
  useEffect(() => {
    if (!serverIP) return;

    ws.current = new WebSocket(`ws://${serverIP}:5000`);

    ws.current.onopen = () => console.log("WS connected");
    ws.current.onclose = () => console.log("WS closed");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // optional: handle server push (e.g., running orders updates)
      // console.log("WS message:", data);
    };

    return () => ws.current.close();
  }, [serverIP]);

  const addItem = (item) =>
    setCart(prev => ({
      ...prev,
      [item.name]: { item, quantity: (prev[item.name]?.quantity || 0) + 1 }
    }));

  const removeItem = (item) => setCart(prev => {
    const qty = prev[item.name]?.quantity || 0;
    if (qty <= 1) {
      const copy = { ...prev };
      delete copy[item.name];
      return copy;
    }
    return { ...prev, [item.name]: { item, quantity: qty - 1 } };
  });

  const sendOrder = () => {
    if (!table || Object.keys(cart).length === 0) return;

    const itemsToSend = Object.values(cart).flatMap(c =>
      Array(c.quantity).fill({ name: c.item.name, price: c.item.price })
    );

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "new_order", table, items: itemsToSend }));
      setCart({});
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return (
    <div className="orderpage-container">
      <h1>Bestelling invoeren</h1>

      <input
        className="table-input"
        type="number"
        min="1"
        placeholder="Tafelnummer"
        value={table}
        onChange={e => setTable(e.target.value)}
      />

      <h2>Menu</h2>
      <div className="menu-grid">
        {drinks.map(d => (
          <div key={d.name} className="menu-item">
            <div className="menu-name">{d.name}</div>
            <div className="menu-price">€{d.price}</div>
            <div className="menu-buttons">
              <button onClick={() => removeItem(d)}>-</button>
              <span>{cart[d.name]?.quantity || 0}</span>
              <button onClick={() => addItem(d)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <h2>Mandje</h2>
      <div className="cart-container">
        {Object.values(cart).map(c => (
          <div className="cart-item" key={c.item.name}>
            {c.item.name} × {c.quantity}
          </div>
        ))}
      </div>

      <button
        className="send-order"
        disabled={!table || Object.keys(cart).length === 0}
        onClick={sendOrder}
      >
        Bestelling versturen
      </button>
    </div>
  );
}
