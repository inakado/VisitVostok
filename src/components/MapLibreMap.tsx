"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol, PMTiles } from "pmtiles";
import type { FeatureCollection, Point } from "geojson";
import { Place } from "@prisma/client";


interface Props {
  places: Place[];
  onPlaceSelect: (place: Place | null) => void;
}

function placesToGeoJSON(places: Place[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: places
      .filter((place) => typeof place.lat === "number" && typeof place.lng === "number")
      .map((place) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [place.lng, place.lat],
        },
        properties: {
          ...place,
        },
      })),
  };
}

export default function MapLibreMap({ places, onPlaceSelect }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // PMTiles protocol
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
    const pm = new PMTiles("https://s3.ru1.storage.beget.cloud/b8118b5036f9-vv-map/pm-tiles-area/my_area.pmtiles");
    protocol.add(pm);

    // Init map
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "style.json",
      center: [135.0, 48.5],
      zoom: 4,
      minZoom: 4,
      maxZoom: 15,
    });
    mapInstanceRef.current = map;

    // Слушаем событие, когда изображению не удалось загрузиться
    map.on("styleimagemissing", (e) => {
      const id = e.id; // Получаем ID недостающего изображения

      if (id === "custom-marker") {
        // @ts-expect-error maplibre-gl types issue
        map.loadImage("/custom-marker.png", function (
          error: Error | null,
          image: HTMLImageElement | ImageBitmap | undefined
        ) {
          if (error || !image) {
            console.error("Ошибка загрузки иконки:", error);
            return;
          }
          // Добавляем изображение в реестр MapLibre
          if (!map.hasImage(id)) {
             map.addImage(id, image, { sdf: false });
          }
        });
      }
    });

    map.on("load", () => {
      // Добавляем GeoJSON-источник с кластеризацией
      map.addSource("places", {
        type: "geojson",
        data: placesToGeoJSON(places),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Слой кластеров (круги)
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#5783FF",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            15,
            10, 20,
            30, 25
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": [
            "step",
            ["get", "point_count"],
            0.6,
            10, 0.8,
            30, 1.0
          ]
        }
      });

      // Слой текста для кластеров
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Bold"],
          "text-size": 14
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1
        }
      });

      // Слой одиночных маркеров (окружности)
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#5783FF",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff"
        }
      });

      // Слой текста для маркеров
      map.addLayer({
        id: "unclustered-point-text",
        type: "symbol",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "title"],
          "text-font": ["Noto Sans Bold"],
          "text-offset": [0, 1.2],
          "text-size": 12
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1
        }
      });
      
      // Добавляем курсор-палец при наведении на кликабельные слои
      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "unclustered-point", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "unclustered-point", () => { map.getCanvas().style.cursor = ""; });

      // Обработчик кликов по кластерам
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("places") as maplibregl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId).then(zoom => {
          map.easeTo({
            center: (features[0].geometry as Point).coordinates as [number, number],
            zoom: zoom,
          });
        });
      });

      // Обработчик кликов по одиночным маркерам
      map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        });
        if (!features.length) return;

        const clickedPlace = features[0].properties as Place;
        onPlaceSelect(clickedPlace);
        
        // Не перемещаем карту, просто выбираем место
      });
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    return () => {
      if (mapInstanceRef.current) {
        map.off("styleimagemissing", handleStyleImageMissing);
        mapInstanceRef.current.remove();
      }
    };
  }, [onPlaceSelect, places]);

  // Отдельная функция для обработчика styleimagemissing для удобства удаления
  const handleStyleImageMissing = (e: { id: string }) => {
    const id = e.id;
     if (id === "custom-marker") {
        // @ts-expect-error maplibre-gl types issue
        mapInstanceRef.current?.loadImage("/custom-marker.png", function (
          error: Error | null,
          image: HTMLImageElement | ImageBitmap | undefined
        ) {
          if (error || !image) {
            console.error("Ошибка загрузки иконки в styleimagemissing:", error);
            return;
          }
          if (mapInstanceRef.current && !mapInstanceRef.current.hasImage(id)) {
             mapInstanceRef.current.addImage(id, image, { sdf: false });
          }
        });
      }
  };

  useEffect(() => {
      if (mapInstanceRef.current) {
           mapInstanceRef.current.on("styleimagemissing", handleStyleImageMissing);
      }

      return () => {
          if (mapInstanceRef.current) {
               mapInstanceRef.current.off("styleimagemissing", handleStyleImageMissing);
          }
      }
  }, [places]);

  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.getSource("places")) {
      const source = mapInstanceRef.current.getSource("places") as maplibregl.GeoJSONSource;
      source.setData(placesToGeoJSON(places));
    }
  }, [places]);

  return <div ref={mapRef} className="w-full h-[100vh]" />;
} 