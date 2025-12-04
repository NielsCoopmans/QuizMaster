import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import LeaderboardPage from "./pages/LeaderboardPage.js";
import BarPage from "./pages/BarPage";
import AdminPage from "./pages/AdminPage.js";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order" element={<OrderPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/bar" element={<BarPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
