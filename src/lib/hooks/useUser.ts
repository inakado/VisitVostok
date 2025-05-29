import { useEffect, useState } from "react";

export function useUser() {
  const [user, setUser] = useState<null | {
    id: string;
    name: string;
    avatarUrl?: string;
    role: "traveler" | "local" | null;
  }>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  return user;
}
