"use client";

import { useState, useEffect } from "react";
import MapLibreMap from "@/components/MapLibreMap";
import PlacesList from "@/components/PlacesList";
import RoleSelector from "@/components/RoleSelector";
import { Place } from "@prisma/client";
import BottomTabs from "@/components/BottomTabs";
import BottomSheet from "@/components/BottomSheet";

export default function HomePage() {
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

  return (
    <main className="min-h-screen flex flex-col bg-[#f0f2f8]">
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
  );
}