"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  MapPin, 
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSimple, useAdminPlaces } from "@/lib/hooks";

export default function AdminPlacesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminSimple();
  
  // Состояние фильтров и сортировки
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Хук для мест с бесконечной прокруткой
  const { 
    places, 
    pagination, 
    filters,
    isLoading, 
    isLoadingMore,
    hasNextPage,
    error, 
    loadMore,
    deletePlace 
  } = useAdminPlaces({ 
    page: 1, 
    limit: 30, // Увеличиваем лимит для бесконечной прокрутки
    search, 
    category: category === 'all' ? '' : category, 
    subcategory: subcategory === 'all' ? '' : subcategory,
    sortBy,
    sortOrder,
    infiniteScroll: true 
  });

  // Ref для наблюдения за scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Бесконечная прокрутка
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isLoadingMore, loadMore]);

  // Проверка авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Проверка авторизации...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/admin/login");
    return null;
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Удалить место "${title}"?`)) {
      const result = await deletePlace(id);
      if (!result.success) {
        alert(`Ошибка: ${result.error}`);
      }
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Управление местами</h1>
                <p className="text-slate-600">
                  {pagination && `${pagination.total} мест в базе данных`}
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push("/admin/places/new")} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Добавить место
          </Button>
        </div>

        {/* Фильтры и сортировка */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Поиск, фильтры и сортировка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Поиск */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Поиск по названию, городу, адресу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Фильтр по категории */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {filters?.categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Фильтр по подкатегории */}
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все подкатегории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все подкатегории</SelectItem>
                  {filters?.subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Сортировка */}
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value: string) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Новые сначала</SelectItem>
                  <SelectItem value="createdAt-asc">Старые сначала</SelectItem>
                  <SelectItem value="title-asc">По названию (А-Я)</SelectItem>
                  <SelectItem value="title-desc">По названию (Я-А)</SelectItem>
                  <SelectItem value="city-asc">По городу (А-Я)</SelectItem>
                  <SelectItem value="totalScore-desc">По рейтингу ↓</SelectItem>
                  <SelectItem value="reviewsCount-desc">По отзывам ↓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Активные фильтры */}
            {(search || category !== 'all' || subcategory !== 'all') && (
              <div className="flex flex-wrap gap-2 mt-4">
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Поиск: {search}
                    <button onClick={() => setSearch('')} className="text-xs hover:text-red-600">×</button>
                  </Badge>
                )}
                {category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Категория: {category}
                    <button onClick={() => setCategory('all')} className="text-xs hover:text-red-600">×</button>
                  </Badge>
                )}
                {subcategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Подкатегория: {subcategory}
                    <button onClick={() => setSubcategory('all')} className="text-xs hover:text-red-600">×</button>
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                    setSubcategory('all');
                  }}
                  className="h-6 text-xs"
                >
                  Очистить все
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Таблица мест */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Список мест</span>
              {pagination && (
                <Badge variant="secondary">
                  Показано {places.length} из {pagination.total}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка мест...
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
                  <strong>Ошибка:</strong> {error}
                </div>
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Места не найдены</p>
                <p className="text-gray-400 text-sm">Попробуйте изменить параметры поиска</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Заголовки с сортировкой */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 rounded-lg font-medium text-sm border">
                  <button 
                    onClick={() => toggleSort('title')}
                    className="col-span-4 text-left text-slate-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    Название и адрес {getSortIcon('title')}
                  </button>
                  <button 
                    onClick={() => toggleSort('city')}
                    className="col-span-2 text-left text-slate-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    Город {getSortIcon('city')}
                  </button>
                  <button 
                    onClick={() => toggleSort('categoryName')}
                    className="col-span-2 text-left text-slate-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    Категория {getSortIcon('categoryName')}
                  </button>
                  <div className="col-span-2 text-slate-700">Координаты</div>
                  <div className="col-span-2 text-center text-slate-700">Действия</div>
                </div>
                
                {/* Строки данных */}
                {places.map((place, index) => {
                  // Проверка наличия ID для безопасности
                  if (!place.id) {
                    console.error('Place без id:', place, 'index:', index);
                    return null;
                  }
                  
                  return (
                    <div key={place.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors bg-white">
                      <div className="col-span-4">
                        <div className="font-medium text-slate-900">{place.title}</div>
                        {place.address && (
                          <div className="text-sm text-slate-500 mt-1">{place.address}</div>
                        )}
                        {place.totalScore && (
                          <div className="text-xs text-green-600 mt-1">
                            ⭐ {place.totalScore.toFixed(1)} ({place.reviewsCount || 0} отзывов)
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-700">{place.city}</span>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                          {place.categoryName}
                        </Badge>
                        {place.categories && place.categories.length > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            +{place.categories.length} подкат.
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-sm font-mono text-slate-600">
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </div>
                      <div className="col-span-2 flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-200"
                          onClick={() => router.push(`/admin/places/${place.id}`)}
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-amber-50 hover:border-amber-200"
                          onClick={() => router.push(`/admin/places/${place.id}/edit`)}
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4 text-amber-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                          onClick={() => handleDelete(place.id, place.title)}
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* Индикатор загрузки для бесконечной прокрутки */}
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isLoadingMore && (
                    <div className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка еще...
                    </div>
                  )}
                  {!hasNextPage && places.length > 0 && (
                    <div className="text-slate-500 text-sm">
                      Все места загружены
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 