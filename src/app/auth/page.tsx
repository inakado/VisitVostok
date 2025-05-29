import TelegramLogin from "@/components/TelegramLogin";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
      <div className="text-center">
        <h1 className="text-2xl text-gray-600 font-bold mb-4">Присоединиться через Telegram</h1>
        <h2 className="text-xl text-gray-600 font-medium mb-4">Станьте частью большого сообщества путешественников по всему Дальнему Востоку!</h2>
        <TelegramLogin />
      </div>
    </main>
  );
}