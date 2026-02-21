import { useEffect, useState } from "react";
const host = window.location.hostname;
export function useServerIP() {
  const [ip, setIP] = useState("");

  useEffect(() => {
    fetch(`http://${host}:5000/ip`)
      .then(res => res.json())
      .then(data => setIP(data.ip));
  }, []);

  return ip;
}
