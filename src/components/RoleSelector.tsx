"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

export default function RoleSelector() {
  const router = useRouter();
  const user = useUser();

  if (!user || user.role) return null;

  const chooseRole = async (role: "traveler" | "local") => {
    await fetch("/api/user/role", {
      method: "POST",
      body: JSON.stringify({ role }),
      headers: { "Content-Type": "application/json" },
    });

    router.refresh();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center space-y-4 max-w-sm">
        <h2 className="text-xl font-semibold">Кто вы?</h2>
        <button
          onClick={() => chooseRole("traveler")}
          className="w-full bg-blue-600 text-white p-2 rounded-xl"
        >
          Путешественник
        </button>
        <button
          onClick={() => chooseRole("local")}
          className="w-full bg-green-600 text-white p-2 rounded-xl"
        >
          Местный
        </button>
      </div>
    </div>
  );
}