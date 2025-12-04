import { useEffect, useState, useRef } from "react";
import { useServerIP } from "../hooks/useServerIP";
import "./barpage.css";

export default function BarPage() {
  const [orders, setOrders] = useState([]);
  const ws = useRef(null);
  const serverIP = useServerIP();

  // Load running orders on mount
  useEffect(() => {
    if (!serverIP) return;
    fetch(`http://${serverIP}:5000/allorders`)
      .then(res => res.json())
      .then(setOrders);
  }, [serverIP]);

  // WebSocket for live updates
  useEffect(() => {
    if (!serverIP) return;

    ws.current = new WebSocket(`ws://${serverIP}:5000`);

    ws.current.onopen = () => console.log("WS connected");
    ws.current.onclose = () => console.log("WS disconnected");

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.orders) setOrders(message.orders);
    };

    return () => ws.current.close();
  }, [serverIP]);

  // Delete all orders for a table
  const deleteTableOrders = (table) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({ type: "delete_table", table })
    );
  };

  const grouped = groupOrders(orders);

  return (
    <div className="bar-container">
      <h1>Bar Overzicht</h1>

      {Object.entries(grouped).map(([table, entry]) => (
        <div key={table} className="table-container">
          <h2>Tafel {table}</h2>

          <div className="items-group">
            {Object.entries(entry.items).map(([name, count]) => (
              <span key={name} className="item-badge-large">
                {name} × {count}
              </span>
            ))}
          </div>

          <button
            className="table-clear-button"
            onClick={() => deleteTableOrders(table)}
          >
            Klaar
          </button>
        </div>
      ))}
    </div>
  );
}

// Groepering van orders per tafel + items
function groupOrders(orders) {
  const res = {};

  orders.forEach(order => {
    if (!res[order.table]) {
      res[order.table] = { items: {}, orders: [] };
    }

    order.items.forEach(i => {
      res[order.table].items[i.name] =
        (res[order.table].items[i.name] || 0) + 1;
    });

    res[order.table].orders.push(order);
  });

  return res;
}
