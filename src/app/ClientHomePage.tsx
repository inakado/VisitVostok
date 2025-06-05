"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Place } from '@/types';
import MapLibreMap from "@/components/MapLibreMap";
import MapFilter from "@/components/MapFilter";
import PlacesList from "@/components/PlacesList";
import BottomTabs from "@/components/BottomTabs";
import BottomSheet from "@/components/BottomSheet";
import { useHomePageData } from "@/lib/hooks";
import { useMapFilters } from "@/lib/hooks/useMapFilters";

export default function ClientHomePage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Используем составной хук вместо прямого fetch
  const { places, isLoading, error, refetch } = useHomePageData();

  // Хук для фильтрации
  const {
    filters,
    setFilters,
    categories,
    filteredPlaces,
    totalFilteredPlaces,
    toggleCategoryExpansion,
  } = useMapFilters(places);

  // Мемоизируем filteredPlaces для стабилизации и предотвращения мерцания
  const stablePlaces = useMemo(() => {
    // Просто возвращаем filteredPlaces для стабилизации ссылки
    return filteredPlaces;
  }, [filteredPlaces]);

  // Логгируем изменения фильтрации
  useEffect(() => {
    console.log('🏠 ClientHomePage - изменились фильтрованные места:', {
      всего: places.length,
      отфильтровано: stablePlaces.length,
      фильтры: {
        поиск: filters.searchQuery,
        категории: filters.selectedCategories.length,
        подкатегории: filters.selectedSubcategories.length
      }
    });
  }, [stablePlaces.length, places.length, filters]);

  const handlePlaceSelect = useCallback((place: Place | null) => {
    setSelectedPlace(place);
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  // Структурированные данные для главной страницы
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: "Приморский край - Дальний Восток России",
    description: "Уникальный регион России с богатой природой, историей и культурой",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.1056,
      longitude: 131.8735
    },
    includesAttraction: places.slice(0, 10).map(place => ({
      "@type": "TouristAttraction",
      name: place.title,
      description: place.categoryName,
      geo: {
        "@type": "GeoCoordinates", 
        latitude: place.lat,
        longitude: place.lng
      }
    }))
  };

  // Показываем ошибку с кнопкой повтора
  if (error) {
    return (
      <main className="min-h-screen flex flex-col bg-[#f0f2f8]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-[#2C3347] mb-4">Что-то пошло не так</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={refetch}
              className="bg-[#5783FF] text-white px-6 py-3 rounded-lg hover:bg-[#4a71e8] transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen flex flex-col bg-[#f0f2f8]">
        <h1 className="sr-only">Куда поехать? Достопримечательности и места Дальнего Востока России</h1>
        <BottomTabs view={view} setView={setView} />
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="text-center text-gray-500 mt-12">Загрузка...</div>
          ) : view === "map" ? (
            <>
              {/* Карта */}
              <MapLibreMap places={stablePlaces} onPlaceSelect={handlePlaceSelect} />
              
              {/* Фильтр */}
              <div className="absolute top-20 left-4 z-10 hidden lg:block">
                <MapFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  totalPlaces={totalFilteredPlaces}
                  onToggleCategoryExpansion={toggleCategoryExpansion}
                />
              </div>
              
              {/* Мобильный фильтр */}
              <div className="absolute top-20 left-4 z-10 lg:hidden">
                <MapFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  totalPlaces={totalFilteredPlaces}
                  onToggleCategoryExpansion={toggleCategoryExpansion}
                />
              </div>
            </>
          ) : (
            <PlacesList />
          )}
        </div>
        <BottomSheet place={selectedPlace} onClose={handleCloseBottomSheet} />
      </main>
    </>
  );
} 