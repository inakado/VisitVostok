export default function AdminDebugPage() {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Отладка админ панели</h1>
      <div className="mt-4 space-y-2">
        <p><strong>ADMIN_PASSWORD установлен:</strong> {process.env.ADMIN_PASSWORD ? "Да" : "Нет"}</p>
        <p><strong>Используемый пароль:</strong> {adminPassword}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      </div>
      <div className="mt-6">
        <a href="/admin/login" className="text-blue-500 underline">
          Перейти к странице логина
        </a>
      </div>
    </div>
  );
} 