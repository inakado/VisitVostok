// src/app/places/[id]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Place, Review } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ArrowLeft, ImageIcon } from "lucide-react";
import Image from 'next/image';

interface PlaceWithDetails extends Place {
  reviews: Review[];
}

export default function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [place, setPlace] = useState<PlaceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetch(`/api/places/${id}`)
      .then(res => res.json())
      .then(data => {
        setPlace(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  // Сброс ошибки изображения при смене места
  useEffect(() => {
    setImageError(false);
  }, [place?.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-24 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!place) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto pt-24 px-4">
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Место не найдено</h1>
            <p className="text-gray-600 mb-6">Возможно, место было удалено или URL неверный</p>
            <Button 
              variant="default" 
              className="bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900 transition-all duration-200"
              onClick={() => {
                try {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/');
                  }
                } catch (error) {
                  console.error('Ошибка навигации:', error);
                  router.push('/');
                }
              }}
            >
              Вернуться назад
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 hover:shadow-sm mt-16"
          onClick={() => {
            try {
              // Проверяем есть ли история для возврата
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                // Если нет истории, переходим на главную
                router.push('/');
              }
            } catch (error) {
              console.error('Ошибка навигации:', error);
              // Fallback - переход на главную страницу
              router.push('/');
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
          Назад
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Заголовок и основная информация */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Изображение с правильными пропорциями */}
          <div className="relative w-full h-48 sm:h-64 md:h-80 bg-gray-100">
            {place.imageUrl && place.imageUrl.trim() !== '' && place.imageUrl !== 'null' && !imageError ? (
              <Image
                src={place.imageUrl}
                alt={place.title}
                fill
                className="object-cover"
                priority
                onError={() => {
                  console.warn('⚠️ Не удалось загрузить изображение на странице места:', place.imageUrl);
                  setImageError(true);
                }}
                unoptimized={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Фото недоступно</p>
                </div>
              </div>
            )}
          </div>

          {/* Информация о месте */}
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                  {place.title}
                </h1>
                {place.categoryName && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {place.categoryName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Рейтинг */}
            {place.totalScore && (
              <div className="flex items-center space-x-3 p-3 sm:p-4 bg-amber-50 rounded-xl mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl sm:text-2xl font-bold text-amber-600">
                      {place.totalScore.toFixed(1)}
                    </span>
                    <span className="text-sm sm:text-base text-gray-600">из 5</span>
                  </div>
                  {place.reviewsCount && (
                    <p className="text-sm text-gray-500">
                      Основано на {place.reviewsCount} отзывах
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Описание */}
            {place.description && (
              <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Описание</h2>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">
                    {place.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Информационные блоки */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Адрес */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Адрес</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {place.city}{place.street && `, ${place.street}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{place.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Цена (если есть) */}
          {place.price && (
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl font-bold text-green-600">₽</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Стоимость</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {place.price}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Дополнительная информация */}
        {place.categories && place.categories.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Категории</h3>
              <div className="flex flex-wrap gap-2">
                {place.categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Отзывы */}
        {place.reviews && place.reviews.length > 0 && (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Отзывы ({place.reviews.length})
              </h3>
              <div className="space-y-4">
                {place.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'text-amber-400 fill-amber-400' 
                                : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{review.text}</p>
                  </div>
                ))}
                {place.reviews.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    И еще {place.reviews.length - 5} отзывов...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Пустое место внизу для удобства */}
        <div className="h-8"></div>
      </div>
    </main>
  );
}