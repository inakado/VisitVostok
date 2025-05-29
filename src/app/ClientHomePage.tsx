"use client";

import { useState, useEffect } from "react";
import MapLibreMap from "@/components/MapLibreMap";
import PlacesList from "@/components/PlacesList";
import RoleSelector from "@/components/RoleSelector";
import { Place } from "@prisma/client";
import BottomTabs from "@/components/BottomTabs";
import BottomSheet from "@/components/BottomSheet";

export default function ClientHomePage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    fetch("/api/places")
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePlaceSelect = (place: Place | null) => {
    setSelectedPlace(place);
  };

  const handleCloseBottomSheet = () => {
    setSelectedPlace(null);
  };

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen flex flex-col bg-[#f0f2f8]">
        <h1 className="sr-only">Куда поехать? Достопримечательности и места Дальнего Востока России</h1>
        <RoleSelector />
        <BottomTabs view={view} setView={setView} />
        <div className="flex-1">
          {loading ? (
            <div className="text-center text-gray-500 mt-12">Загрузка...</div>
          ) : view === "map" ? (
            <MapLibreMap places={places} onPlaceSelect={handlePlaceSelect} />
          ) : (
            <PlacesList />
          )}
        </div>
        <BottomSheet place={selectedPlace} onClose={handleCloseBottomSheet} />
      </main>
    </>
  );
} 