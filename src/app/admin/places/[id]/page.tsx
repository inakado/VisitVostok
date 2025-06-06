"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, MapPin, ExternalLink } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminSimple } from "@/lib/hooks";
import { Place } from "@/types";

export default function PlaceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAdminSimple();
  
  // Обрабатываем async params для Next.js 15
  const resolvedParams = use(params);
  
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных места
  useEffect(() => {
    const fetchPlace = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/places/${resolvedParams.id}`);
        const data = await response.json();

        if (response.ok) {
          setPlace(data);
        } else {
          setError(data.error || 'Место не найдено');
        }
      } catch {
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchPlace();
  }, [resolvedParams.id]);

  // Редирект, если не авторизован
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleDelete = async () => {
    if (place && confirm(`Удалить место "${place.title}"?`)) {
      try {
        const response = await fetch(`/api/admin/places/${place.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          router.push('/admin/places');
        } else {
          alert('Ошибка удаления места');
        }
      } catch {
        alert('Ошибка удаления места');
      }
    }
  };

  // Показываем загрузку авторизации
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Проверка авторизации...</div>
      </div>
    );
  }

  // Если не авторизован, компонент не рендерится (происходит редирект)
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Загрузка места...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin/places")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
                  <strong>Ошибка:</strong> {error}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Шапка */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/admin/places")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Просмотр места</h1>
                <p className="text-slate-600">{place.title}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/admin/places/${place.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete}
              className="hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </Button>
          </div>
        </div>

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Название</label>
                  <p className="text-lg font-semibold text-slate-900">{place.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Город</label>
                  <p className="text-slate-900">{place.city}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Категория</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                      {place.categoryName}
                    </Badge>
                  </div>
                </div>

                {place.street && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Улица</label>
                    <p className="text-slate-900">{place.street}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Координаты</label>
                  <div className="font-mono text-slate-900">
                    <div>Широта: {place.lat}</div>
                    <div>Долгота: {place.lng}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.open(`https://maps.google.com/?q=${place.lat},${place.lng}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Открыть на карте
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Регион</label>
                  <p className="text-slate-900">{place.state}</p>
                </div>

                {place.temporarilyClosed && (
                  <div>
                    <Badge variant="destructive">
                      Временно закрыто
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {place.address && (
              <div>
                <label className="text-sm font-medium text-slate-700">Полный адрес</label>
                <p className="text-slate-900">{place.address}</p>
              </div>
            )}

            {place.description && (
              <div>
                <label className="text-sm font-medium text-slate-700">Описание</label>
                <p className="text-slate-900 whitespace-pre-wrap">{place.description}</p>
              </div>
            )}

            {place.price && (
              <div>
                <label className="text-sm font-medium text-slate-700">Цена</label>
                <p className="text-slate-900">{place.price}</p>
              </div>
            )}

            {place.imageUrl && place.imageUrl.trim() !== '' && place.imageUrl !== 'null' && (
              <div>
                <label className="text-sm font-medium text-slate-700">Изображение</label>
                <div className="mt-2">
                  <Image 
                    src={place.imageUrl} 
                    alt={place.title}
                    width={400}
                    height={300}
                    className="max-w-sm h-auto rounded-lg border"
                    onError={(e) => {
                      console.warn('⚠️ Не удалось загрузить изображение в админке:', place.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    unoptimized={true}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <Card>
          <CardHeader>
            <CardTitle>Техническая информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-slate-700">ID места:</label>
                <p className="font-mono text-slate-600">{place.id}</p>
              </div>
              <div>
                <label className="font-medium text-slate-700">Дата создания:</label>
                <p className="text-slate-600">
                  {place.createdAt ? new Date(place.createdAt).toLocaleString('ru-RU') : 'Не указана'}
                </p>
              </div>
              {place.totalScore && (
                <div>
                  <label className="font-medium text-slate-700">Рейтинг:</label>
                  <p className="text-slate-600">{place.totalScore}</p>
                </div>
              )}
              {place.reviewsCount && (
                <div>
                  <label className="font-medium text-slate-700">Количество отзывов:</label>
                  <p className="text-slate-600">{place.reviewsCount}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 