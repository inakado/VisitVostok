"use client";

export const dynamic = 'force-dynamic';

import { useRouter } from "next/navigation";
import { 
  LogOut, 
  MapPin, 
  Activity, 
  Users, 
  Database,
  Settings,
  BarChart3,
  FileText,
  Wrench,
  Home,
  TrendingUp,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminSimple } from "@/lib/hooks/admin/useAdminSimple";
import { useAdminStats } from "@/lib/hooks/admin/useAdminStats";

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAdminSimple();
  const { stats, isLoading: statsLoading, error: statsError, refetch } = useAdminStats();

  // Если не загружена авторизация
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Проверка авторизации...</div>
      </div>
    );
  }

  // Если не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ ограничен</h1>
          <p className="text-gray-600 mb-6">Для доступа к админ панели требуется авторизация</p>
          <button
            onClick={() => router.push("/admin/login")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6 pt-16 sm:pt-24">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Шапка */}
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Админ панель</h1>
                <p className="text-sm sm:text-base text-slate-600">Управление приложением VisitVostok</p>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit">
              <Database className="w-3 h-3 mr-1" />
              Система активна
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:self-end sm:-mt-16">
            <Button variant="outline" onClick={() => window.open('/', '_blank')} size="sm">
              <Home className="w-4 h-4 mr-2" />
              На сайт
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Основная статистика */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Места в базе</p>
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-blue-600">---</div>
                  ) : statsError ? (
                    <div className="text-2xl font-bold text-red-600">Ошибка</div>
                  ) : (
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalPlaces || 0}</div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Приморский край</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Категории</p>
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-green-600">---</div>
                  ) : (
                    <div className="text-2xl font-bold text-green-600">{stats?.totalCategories || 0}</div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Типов мест</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">С отзывами</p>
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-purple-600">---</div>
                  ) : (
                    <div className="text-2xl font-bold text-purple-600">{stats?.placesWithReviews || 0}</div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Имеют рейтинг</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">За неделю</p>
                  {statsLoading ? (
                    <div className="text-2xl font-bold text-orange-600">---</div>
                  ) : (
                    <div className="text-2xl font-bold text-orange-600">{stats?.recentPlaces || 0}</div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Новых мест</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Топ категории */}
        {stats?.topCategories && stats.topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Топ категории
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCategories.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary">{category.count} мест</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Основные действия */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Основные действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 lg:h-24 flex-col gap-1 sm:gap-2 relative group hover:shadow-md transition-all border-blue-200 hover:border-blue-300"
                onClick={() => router.push('/admin/places')}
              >
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span className="text-sm sm:text-base font-medium text-center px-2">Управление местами</span>
                <Badge variant="secondary" className="absolute top-1 sm:top-2 right-1 sm:right-2 text-xs">
                  {statsLoading ? '---' : stats?.totalPlaces || 0}
                </Badge>
              </Button>

              <Button 
                variant="outline" 
                className="h-16 sm:h-20 lg:h-24 flex-col gap-1 sm:gap-2 hover:shadow-md transition-all border-purple-200 hover:border-purple-300"
                onClick={() => window.open('/activities', '_blank')}
              >
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span className="text-sm sm:text-base font-medium text-center px-2">Страница активностей</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-16 sm:h-20 lg:h-24 flex-col gap-1 sm:gap-2 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1"
                disabled
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                <span className="text-sm sm:text-base font-medium text-gray-400 text-center px-2">Пользователи</span>
                <Badge variant="outline" className="text-xs">Скоро</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ошибка загрузки статистики */}
        {statsError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-red-700">
                  <p className="font-medium">Ошибка загрузки статистики</p>
                  <p className="text-sm">{statsError}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={refetch}
                  className="border-red-200 text-red-700 hover:bg-red-100"
                >
                  Повторить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Информация о системе - компактная версия */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Информация о системе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-slate-700">Версия</div>
                <Badge variant="outline" className="mt-1">1.0.0</Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-slate-700">База данных</div>
                <Badge variant="secondary" className="text-green-700 bg-green-50 mt-1">
                  ✅ Активна
                </Badge>
              </div>
              <div className="text-center">
                <div className="font-medium text-slate-700">Регион</div>
                <div className="text-slate-600 mt-1">Дальний Восток</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-slate-700">Статус</div>
                <Badge variant="secondary" className="text-blue-700 bg-blue-50 mt-1">
                  🟢 Онлайн
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 