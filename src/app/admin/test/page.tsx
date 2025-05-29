export default function AdminTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Админ панель работает!</h1>
      <p>Если ты видишь эту страницу, то middleware работает корректно.</p>
      <a href="/admin" className="text-blue-500 underline">
        Перейти к основной админ панели
      </a>
    </div>
  );
} 