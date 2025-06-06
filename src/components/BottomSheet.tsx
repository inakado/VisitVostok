"use client";

import { useState, useEffect } from "react";
import { Place } from "@prisma/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Props {
  place: Place | null;
  onClose: () => void;
}

export default function BottomSheet({ place, onClose }: Props) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      const desktop = window.innerWidth >= 1024; // lg breakpoint
      setIsDesktop(desktop);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Сброс ошибки изображения при смене места
  useEffect(() => {
    setImageError(false);
  }, [place?.id]);

  if (!place) return null;
  
  // Валидируем данные места
  if (!place.id || !place.title) {
    console.error('❌ Некорректные данные места в BottomSheet:', place);
    return null;
  }

  const sheetSide = isDesktop ? "right" : "bottom";
  const sheetClassName = isDesktop 
    ? "w-[420px] h-full rounded-none border-l bg-white p-0" 
    : "h-[70vh] rounded-tl-2xl rounded-tr-2xl bg-white p-0";

  return (
    <Sheet open={!!place} onOpenChange={onClose}>
      <SheetContent 
        side={sheetSide}
        className={`${sheetClassName} [&>button]:hidden`}
      >
        {/* Скрытый заголовок для accessibility */}
        <SheetTitle className="sr-only">{place.title}</SheetTitle>
        
        <div className="flex flex-col h-full">
          {/* Заголовок с кастомным крестиком */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                  {place.title}
                </h2>
                {place.categoryName && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {place.categoryName}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 shrink-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          
          {/* Контент с прокруткой */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 space-y-6">
              {/* Изображение или placeholder */}
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-50">
                {place.imageUrl && !imageError ? (
                  <Image
                    src={place.imageUrl}
                    alt={place.title}
                    fill
                    className="object-cover"
                    onError={() => {
                      console.warn('⚠️ Не удалось загрузить изображение:', place.imageUrl);
                      setImageError(true);
                    }}
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Фото недоступно</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о месте */}
              <div className="space-y-4">
                {/* Адрес */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Адрес</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {place.city}{place.street && `, ${place.street}`}
                    </p>
                  </div>
                </div>

                {/* Рейтинг */}
                {place.totalScore && (
                  <div className="flex items-start space-x-4 p-4 bg-amber-50 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Рейтинг</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-amber-600">
                          {place.totalScore.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-600">из 5</span>
                        {place.reviewsCount && (
                          <span className="text-xs text-gray-500">
                            ({place.reviewsCount} отзывов)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Описание */}
                {place.description && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Описание</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {place.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Фиксированная кнопка внизу */}
          <div className="flex-shrink-0 p-6 border-t border-gray-100 bg-white">
            <Link href={`/places/${place.id}`} className="block w-full">
              <Button 
                size="lg"
                className="w-full text-base font-semibold rounded-xl shadow-sm transition-all duration-200"
              >
                Подробнее о месте
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}