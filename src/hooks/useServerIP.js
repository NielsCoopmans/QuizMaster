import { useEffect, useState } from "react";

export function useServerIP() {
  const [ip, setIP] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/ip")
      .then(res => res.json())
      .then(data => setIP(data.ip));
  }, []);

  return ip;
}
