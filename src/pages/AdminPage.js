import { useState, useEffect, useRef } from "react";
import "./adminpage.css";

export default function AdminPage() {
  const [tables, setTables] = useState({}); // table totals
  const [teams, setTeams] = useState({});
  const [drinks, setDrinks] = useState([]);
  const [orders, setOrders] = useState([]);
  const ws = useRef(null);

  // Load initial data
  useEffect(() => {
    fetch("http://localhost:5000/leaderboard")
      .then(res => res.json())
      .then(setTables);

    fetch("http://localhost:5000/teams")
      .then(res => res.json())
      .then(setTeams);

    fetch("http://localhost:5000/drinks")
      .then(res => res.json())
      .then(setDrinks);

    fetch("http://localhost:5000/allorders")
      .then(res => res.json())
      .then(setOrders);
  }, []);

  // WebSocket for live updates
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000");

    ws.current.onopen = () => console.log("Admin WS connected");
    ws.current.onclose = () => console.log("Admin WS disconnected");

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.tables) setTables(message.tables);
      if (message.orders) setOrders(message.orders);
    };

    return () => ws.current.close();
  }, []);

  // Update functions
  const updateTeamName = (table, name) => {
    ws.current.send(JSON.stringify({ type: "update_team", table, name }));
  };

  const updateDrinkPrice = (name, price) => {
    ws.current.send(JSON.stringify({ type: "update_drink", name, price }));
  };

  const deleteOrder = (id) => {
    ws.current.send(JSON.stringify({ type: "delete_order", id }));
  };

  const updateOrderItemQty = (orderId, itemName, newQty) => {
    ws.current.send(JSON.stringify({ type: "update_order_item", orderId, itemName, quantity: newQty }));
  };

  const changeOrderTable = (orderId, newTable) => {
    ws.current.send(JSON.stringify({ type: "update_order_table", orderId, table: newTable }));
  };

  return (
        <div className="admin-container">
        <h1>Admin Dashboard</h1>

        {/* Leaderboard/Table Totals */}
        <section className="admin-section">
    <h2>Leaderboard / Tafels</h2>
    <div className="admin-leaderboard">
        {Object.entries(tables).map(([table, total]) => (
        <div key={table} className="leaderboard-item">
            <span>
            Tafel {table} - {teams[table] || "Onbekend team"}
            </span>
            <input
            type="number"
            min="0"
            value={total}
            onChange={(e) =>
                ws.current.send(
                JSON.stringify({
                    type: "update_table_total",
                    table,
                    total: Number(e.target.value),
                })
                )
            }
            style={{ width: "100px", marginLeft: "10px" }}
            />
        </div>
        ))}
    </div>
    </section>


      {/* Teams */}
      <section className="admin-section">
        <h2>Teams</h2>
        <div className="admin-grid">
          {Object.entries(teams).map(([table, name]) => (
            <div key={table} className="admin-card">
              <span className="admin-label">Tafel {table}</span>
              <input
                type="text"
                value={name}
                onChange={e => updateTeamName(table, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Drinks */}
      <section className="admin-section">
        <h2>Dranken</h2>
        <div className="admin-grid">
          {drinks.map(d => (
            <div key={d.name} className="admin-card">
              <span className="admin-label">{d.name}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={d.price}
                onChange={e => updateDrinkPrice(d.name, parseFloat(e.target.value))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Orders */}
      <section className="admin-section">
        <h2>Open Orders</h2>
        <div className="admin-orders">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <strong>Order #{order.id}</strong>
                <input
                  type="number"
                  min="1"
                  value={order.table}
                  onChange={e => changeOrderTable(order.id, Number(e.target.value))}
                  style={{ width: "80px", marginLeft: "10px" }}
                />
                <button onClick={() => deleteOrder(order.id)}>Verwijder</button>
              </div>

              <ul>
                {order.items.map((i, idx) => (
                  <li key={idx} className="order-item">
                    {i.name} (€{i.price}) ×
                    <input
                      type="number"
                      min="1"
                      value={i.quantity || 1}
                      onChange={e => updateOrderItemQty(order.id, i.name, Number(e.target.value))}
                      style={{ width: "60px", marginLeft: "5px" }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
