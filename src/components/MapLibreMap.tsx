"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// Импортируем MapLibre Inspector только для development
import "@maplibre/maplibre-gl-inspect/dist/maplibre-gl-inspect.css";
import MaplibreInspect from "@maplibre/maplibre-gl-inspect";
import { Protocol, PMTiles } from "pmtiles";
import type { FeatureCollection, Point } from "geojson";
import { Place } from "@prisma/client";

interface Props {
  places: Place[];
  onPlaceSelect: (place: Place | null) => void;
}

// Ключи для localStorage
const MAP_STATE_KEY = 'visitvostok_map_state';

// Утилита для отладки данных места
function debugPlaceData(place: Place | Record<string, unknown>, context: string) {
  console.log(`🔍 [${context}] Данные места:`, {
    id: place?.id,
    title: place?.title,
    lat: place?.lat,
    lng: place?.lng,
    categoryName: place?.categoryName,
    hasValidId: !!place?.id,
    hasValidTitle: !!place?.title,
    hasValidCoords: typeof place?.lat === 'number' && typeof place?.lng === 'number' &&
                   !isNaN(place.lat as number) && !isNaN(place.lng as number) &&
                   (place.lat as number) >= -90 && (place.lat as number) <= 90 &&
                   (place.lng as number) >= -180 && (place.lng as number) <= 180
  });
}

// Сохранение состояния карты
function saveMapState(center: [number, number], zoom: number) {
  if (typeof window === 'undefined') return;
  
  // Валидируем данные перед сохранением
  if (!center || center.length !== 2 || 
      isNaN(center[0]) || isNaN(center[1]) ||
      center[0] < -180 || center[0] > 180 ||
      center[1] < -90 || center[1] > 90 ||
      isNaN(zoom) || zoom < 0 || zoom > 24) {
    console.warn('⚠️ Некорректные данные для сохранения состояния карты:', { center, zoom });
    return;
  }
  
  const mapState = {
    center,
    zoom,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(mapState));
  } catch (error) {
    console.warn('⚠️ Не удалось сохранить состояние карты:', error);
  }
}

// Загрузка состояния карты
function loadMapState(): { center: [number, number]; zoom: number } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(MAP_STATE_KEY);
    if (!saved) return null;
    
    const mapState = JSON.parse(saved);
    
    // Проверяем, что состояние не старше 24 часов
    const maxAge = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    if (Date.now() - mapState.timestamp > maxAge) {
      localStorage.removeItem(MAP_STATE_KEY);
      return null;
    }
    
    return {
      center: mapState.center,
      zoom: mapState.zoom
    };
  } catch {
    return null;
  }
}

function placesToGeoJSON(places: Place[]): FeatureCollection<Point> {
  // Валидация входных данных
  if (!Array.isArray(places)) {
    console.warn('⚠️ placesToGeoJSON: некорректные данные places');
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  return {
    type: "FeatureCollection",
    features: places
      .filter((place) => {
        // Валидируем, что у места есть все необходимые данные
        const hasValidCoords = typeof place.lat === "number" && typeof place.lng === "number" 
          && !isNaN(place.lat) && !isNaN(place.lng)
          && place.lat >= -90 && place.lat <= 90 
          && place.lng >= -180 && place.lng <= 180;
        const hasId = place.id;
        const hasTitle = place.title;
        
        if (!hasValidCoords) {
          console.warn('⚠️ Место с некорректными координатами:', {
            id: place.id,
            title: place.title,
            lat: place.lat,
            lng: place.lng
          });
        }
        
        if (!hasId) {
          console.warn('⚠️ Место без ID:', place);
        }
        
        if (!hasTitle) {
          console.warn('⚠️ Место без названия:', place.id);
        }
        
        return hasValidCoords && hasId && hasTitle;
      })
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
  const [mapReady, setMapReady] = useState(false);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sourceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Фильтрация через GPU когда карта готова
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Устанавливаем небольшую задержку для предотвращения множественных срабатываний
    filterTimeoutRef.current = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map || !mapReady) {
        console.log('⏳ Ждем готовности карты:', { 
          mapExists: !!map, 
          mapReady, 
        });
        return;
      }

      // Для первого рендера не применяем фильтры для избежания мерцания
      if (isFirstRender) {
        console.log('🎬 Первый рендер - пропускаем фильтрацию');
        setIsFirstRender(false);
        return;
      }

      console.log('🎯 Применяем фильтрацию:', {
        filteredPlaces: places.length
      });

      // Для простоты показываем все переданные места без дополнительной фильтрации
      // Строим MapLibre expression для фильтрации на GPU
      const filterExpression = null; // Показываем все места
      console.log('🔍 Filter expression:', filterExpression);
      
      // Применяем фильтр ко всем слоям одновременно с дополнительными проверками
      ['unclustered-point', 'clusters', 'cluster-count', 'unclustered-point-text'].forEach(layerId => {
        // Дополнительная проверка карты перед каждым использованием
        const currentMap = mapInstanceRef.current;
        if (currentMap && currentMap.getLayer && currentMap.getLayer(layerId)) {
          console.log('🎨 Applying filter to layer:', layerId);
          try {
            currentMap.setFilter(layerId, filterExpression);
          } catch (error) {
            console.error('❌ Ошибка применения фильтра к слою:', layerId, error);
          }
        } else {
          console.log('⚠️ Слой не найден или карта недоступна:', layerId);
        }
      });
    }, isFirstRender ? 0 : 50); // Для первого рендера без задержки, потом 50ms
    
    // Cleanup функция
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [places, mapReady, isFirstRender]); // Добавляем isFirstRender в зависимости

  // Обновляем источник данных карты при изменении places
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (sourceUpdateTimeoutRef.current) {
      clearTimeout(sourceUpdateTimeoutRef.current);
    }
    
    // Устанавливаем задержку для предотвращения race conditions
    sourceUpdateTimeoutRef.current = setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map || !mapReady) {
        console.log('⏳ Карта еще не готова для обновления данных');
        return;
      }
      
      try {
        const source = map.getSource("places") as maplibregl.GeoJSONSource;
        if (source && source.setData) {
          console.log('🔄 Обновляем источник карты с данными:', places.length, 'мест');
          // Используем актуальные places напрямую
          source.setData(placesToGeoJSON(places));
        } else {
          console.log('⚠️ Источник данных карты не найден');
        }
      } catch (error) {
        console.error('❌ Ошибка обновления источника карты:', error);
      }
    }, 50); // Уменьшаем задержку
    
    // Cleanup функция
    return () => {
      if (sourceUpdateTimeoutRef.current) {
        clearTimeout(sourceUpdateTimeoutRef.current);
      }
    };
  }, [mapReady, places]); // Реагируем на готовность карты И сами places

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Проверяем, что контейнер имеет корректные размеры
    const container = mapRef.current;
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('⚠️ Контейнер карты имеет нулевые размеры, откладываем инициализацию');
      // Попробуем позже
      const retryTimeout = setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          // Повторно запускаем эффект
          container.dispatchEvent(new Event('resize'));
        }
      }, 100);
      return () => clearTimeout(retryTimeout);
    }

    // PMTiles protocol
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
    const pm = new PMTiles("https://s3.ru1.storage.beget.cloud/b8118b5036f9-vv-map/pm-tiles-area/my_area.pmtiles");
    protocol.add(pm);

    // Загружаем сохраненное состояние карты
    const savedState = loadMapState();
    const defaultCenter: [number, number] = [135.0, 48.5];
    const defaultZoom = 4;

    // Валидируем сохраненное состояние
    const validCenter = savedState?.center && 
      !isNaN(savedState.center[0]) && 
      !isNaN(savedState.center[1]) && 
      savedState.center[0] >= -180 && 
      savedState.center[0] <= 180 && 
      savedState.center[1] >= -90 && 
      savedState.center[1] <= 90 
      ? savedState.center 
      : defaultCenter;
    
    const validZoom = savedState?.zoom && 
      !isNaN(savedState.zoom) && 
      savedState.zoom >= 4 && 
      savedState.zoom <= 18 
      ? savedState.zoom 
      : defaultZoom;

    // Init map
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "style.json",
      center: validCenter,
      zoom: validZoom,
      minZoom: 4,
      maxZoom: 18,
    });
    mapInstanceRef.current = map;

    // Сохраняем состояние карты при изменении центра или зума
    const saveCurrentState = () => {
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        // Дополнительная валидация получаемых данных
        if (!center || isNaN(center.lng) || isNaN(center.lat) || isNaN(zoom)) {
          console.warn('⚠️ Некорректные данные карты при сохранении:', { center, zoom });
          return;
        }
        
        saveMapState([center.lng, center.lat], zoom);
      } catch (error) {
        console.warn('⚠️ Ошибка при получении состояния карты:', error);
      }
    };

    // Слушаем события изменения карты (с дебаунсом для производительности)
    let saveTimeout: NodeJS.Timeout;
    const debouncedSave = () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveCurrentState, 1000); // Сохраняем через 1 секунду после остановки движения
    };

    map.on('moveend', debouncedSave);
    map.on('zoomend', debouncedSave);

    // Слушаем событие, когда изображению не удалось загрузиться
    map.on("styleimagemissing", handleStyleImageMissing);

    // Добавляем обработчик ошибок карты
    map.on('error', (e) => {
      console.warn('⚠️ Ошибка карты:', e.error);
    });

    map.on("load", () => {
      console.log('🗺️ Инициализируем карту');
      
      // Проверяем, что источник еще не существует
      if (!map.getSource("places")) {
        // Добавляем GeoJSON-источник с кластеризацией
        map.addSource("places", {
          type: "geojson",
          data: placesToGeoJSON([]), // Начинаем с пустых данных
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        console.log('✅ Источник данных "places" добавлен');
      }

      // Добавляем слои только если они еще не существуют
      // ВАЖНО: Порядок слоев критически важен! Кластеры ВЫШЕ одиночных точек
      
      if (!map.getLayer("unclustered-point")) {
        // Слой одиночных маркеров - ДОБАВЛЯЕМ ПЕРВЫМ (нижний уровень)
        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#3B82F6",
              "#5783FF"
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4, 7,
              10, 9,
              15, 12
            ],
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 0.9,
              22, 1
            ],
            "circle-stroke-width": 0,
            "circle-stroke-opacity": 0
          }
        });
        console.log('✅ Слой "unclustered-point" добавлен (нижний уровень)');
      }

      if (!map.getLayer("clusters")) {
        // Слой кластеров - ДОБАВЛЯЕМ ВТОРЫМ (выше одиночных точек)
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
              16,
              10, 22,
              30, 28
            ],
            "circle-opacity": [
              "step",
              ["get", "point_count"],
              0.9,
              10, 0.95,
              30, 1.0
            ],
            "circle-stroke-width": 0,
            "circle-stroke-opacity": 0
          },
          layout: {
            "circle-sort-key": ["get", "point_count"]
          }
        });
        console.log('✅ Слой "clusters" добавлен (верхний уровень)');
      }

      // ТЕКСТОВЫЕ СЛОИ - добавляем поверх всех circle слоев
      
      if (!map.getLayer("unclustered-point-text")) {
        // Слой текста для маркеров
        map.addLayer({
          id: "unclustered-point-text",
          type: "symbol",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "text-field": ["get", "title"],
            "text-font": ["Noto Sans Bold"],
            "text-offset": [0, 1.5],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8, 11,
              12, 13,
              15, 16
            ],
            "text-anchor": "top",
            "text-max-width": 10,
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "symbol-sort-key": ["literal", 999]
          },
          paint: {
            "text-color": "#1F2937",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-halo-blur": 1,
            "text-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8, 0,
              10, 0.9,
              22, 1
            ]
          }
        });
        console.log('✅ Слой "unclustered-point-text" добавлен');
      }

      if (!map.getLayer("cluster-count")) {
        // Слой текста для кластеров - ВЕРХНИЙ уровень
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "places",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Noto Sans Bold"],
            "text-size": [
              "step",
              ["get", "point_count"],
              13,
              10, 15,
              30, 17
            ],
            "symbol-sort-key": ["literal", 1000],
            "text-allow-overlap": true,
            "text-ignore-placement": true
          },
          paint: {
            "text-color": "#ffffff",
            "text-opacity": 1.0,
            "text-halo-width": 0
          }
        });
        console.log('✅ Слой "cluster-count" добавлен (топ уровень)');
      }

            // ============================================================================
      // 🎯 БЕЗОПАСНЫЙ ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ - БЕЗ РЕКУРСИИ
      // ============================================================================
      
      // Флаг защиты от повторных вызовов
      let isProcessingClick = false;
      
      map.on("click", (e) => {
        // ЗАЩИТА ОТ РЕКУРСИИ - если уже обрабатываем клик, игнорируем
        if (isProcessingClick) {
          console.log('⚠️ Клик уже обрабатывается - игнорируем');
          return;
        }
        
        console.log('🎯 БЕЗОПАСНЫЙ обработчик кликов');
        isProcessingClick = true;
        
        try {
          // Останавливаем всплытие
          e.originalEvent.stopImmediatePropagation();
          e.originalEvent.preventDefault();
          
          // Получаем features ТОЛЬКО нужных слоев
          const clusterFeatures = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"]
          });
          
          const placeFeatures = map.queryRenderedFeatures(e.point, {
            layers: ["unclustered-point"]
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Clusters:', clusterFeatures.length, 'Places:', placeFeatures.length);
          }
          
          // ПРИОРИТЕТ 1: Кластеры
          if (clusterFeatures.length > 0) {
            const cluster = clusterFeatures[0];
            if (cluster.properties?.cluster === true) {
              console.log('🎯 Обрабатываем КЛАСТЕР');
              handleClusterClick(cluster);
            }
          }
          // ПРИОРИТЕТ 2: Места (только если НЕТ кластеров)
          else if (placeFeatures.length > 0) {
            const place = placeFeatures[0];
            if (place.properties?.id && place.properties?.title) {
              console.log('🎯 Обрабатываем МЕСТО');
              handlePlaceClick(place);
            }
          }
          
        } catch (error) {
          console.error('❌ Ошибка в обработчике кликов:', error);
        } finally {
          // Сбрасываем флаг через небольшую задержку
          setTimeout(() => {
            isProcessingClick = false;
          }, 100);
        }
      });

      // Функция обработки кликов по кластерам
      const handleClusterClick = (feature: maplibregl.MapGeoJSONFeature) => {
        console.log('🔧 Обрабатываем клик по кластеру');
        
        // Валидируем geometry кластера
        if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
          console.error('❌ Некорректная геометрия кластера:', feature.geometry);
          return;
        }
        
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1])) {
          console.error('❌ Некорректные координаты кластера:', coords);
          return;
        }
        
        const clusterId = feature.properties?.cluster_id;
        if (!clusterId && clusterId !== 0) {
          console.error('❌ Отсутствует cluster_id:', feature.properties);
          return;
        }

        const currentMap = mapInstanceRef.current;
        if (!currentMap || !currentMap.getSource || typeof currentMap.getSource !== 'function') {
          console.log('⚠️ Карта недоступна для обработки клика по кластеру');
          return;
        }
        
        try {
          const source = currentMap.getSource("places") as maplibregl.GeoJSONSource;
          if (source && source.getClusterExpansionZoom && typeof source.getClusterExpansionZoom === 'function') {
            source.getClusterExpansionZoom(clusterId).then(zoom => {
              // Валидируем полученный зум
              if (typeof zoom !== 'number' || isNaN(zoom) || zoom < 4 || zoom > 18) {
                console.error('❌ getClusterExpansionZoom вернул некорректный зум:', zoom, 'для кластера:', clusterId);
                return;
              }
              
              setTimeout(() => {
                const finalMap = mapInstanceRef.current;
                if (finalMap && finalMap.easeTo && finalMap.getCanvas && finalMap.isStyleLoaded()) {
                  try {
                    const canvas = finalMap.getCanvas();
                    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
                      console.warn('⚠️ Canvas карты недоступен для анимации кластера');
                      return;
                    }
                    
                    const currentZoom = finalMap.getZoom();
                    if (isNaN(currentZoom)) {
                      console.error('❌ Текущий зум карты некорректен:', currentZoom);
                      return;
                    }
                    
                    const centerCoords = coords as [number, number];
                    if (centerCoords[0] < -180 || centerCoords[0] > 180 || 
                        centerCoords[1] < -90 || centerCoords[1] > 90) {
                      console.error('❌ Координаты кластера вне допустимого диапазона:', centerCoords);
                      return;
                    }
                    
                    finalMap.easeTo({
                      center: centerCoords,
                      zoom: zoom,
                      duration: 500
                    });
                  } catch (animationError) {
                    console.error('❌ Ошибка анимации при раскрытии кластера:', animationError);
                  }
                }
              }, 100);
            }).catch(error => {
              console.error('❌ Ошибка при раскрытии кластера:', error);
            });
          }
        } catch (error) {
          console.error('❌ Ошибка при обработке клика по кластеру:', error);
        }
      };

      // Функция обработки кликов по местам
      const handlePlaceClick = (feature: maplibregl.MapGeoJSONFeature) => {
        console.log('🔧 Обрабатываем клик по месту');
        
        // Валидируем geometry маркера
        if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
          console.error('❌ Некорректная геометрия маркера:', feature.geometry);
          return;
        }
        
        const coords = feature.geometry.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1])) {
          console.error('❌ Некорректные координаты маркера:', coords);
          return;
        }
        
        if (coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) {
          console.error('❌ Координаты маркера вне допустимого диапазона:', coords);
          return;
        }

        // Валидируем properties места
        const clickedPlace = feature.properties as Place;
        if (!clickedPlace || !clickedPlace.id) {
          console.error('❌ Некорректные properties места:', clickedPlace);
          debugPlaceData(clickedPlace, 'Ошибка в обработчике клика');
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          debugPlaceData(clickedPlace, 'Клик по маркеру');
        }

        // Вызываем функцию выбора места для открытия боттом-шита
        onPlaceSelect(clickedPlace);
        
        const clickedLngLat = coords as [number, number];

        setTimeout(() => {
          const currentMap = mapInstanceRef.current;
          if (currentMap && currentMap.getCanvas && currentMap.panTo && currentMap.isStyleLoaded()) {
            try {
              const canvas = currentMap.getCanvas();
              if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
                console.warn('⚠️ Canvas карты недоступен для анимации');
                return;
              }
              
              const currentZoom = currentMap.getZoom();
              const currentCenter = currentMap.getCenter();
              if (isNaN(currentZoom) || !currentCenter || 
                  isNaN(currentCenter.lng) || isNaN(currentCenter.lat)) {
                console.error('❌ Текущее состояние карты некорректно:', { currentZoom, currentCenter });
                return;
              }
              
              const mapContainerHeight = canvas.clientHeight;
              if (mapContainerHeight <= 0) {
                console.warn('⚠️ Некорректная высота контейнера карты');
                return;
              }
              
              const offsetPixels = -mapContainerHeight * 0.3;
              currentMap.panTo(clickedLngLat, { offset: [0, offsetPixels], duration: 500 });
            } catch (error) {
              console.error('❌ Ошибка при перемещении карты к пину:', error);
            }
          }
        }, 50);
      };

      // Добавляем курсор-палец при наведении на кликабельные слои
      ['clusters', 'unclustered-point', 'cluster-count'].forEach(layerId => {
        map.on("mouseenter", layerId, () => { 
          const canvas = map.getCanvas();
          if (canvas) canvas.style.cursor = "pointer"; 
        });
        map.on("mouseleave", layerId, () => { 
          const canvas = map.getCanvas();
          if (canvas) canvas.style.cursor = ""; 
        });
      });

      // Карта полностью готова к работе
      console.log('✅ Карта инициализирована и готова к фильтрации');
      setMapReady(true);
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    // Добавляем MapLibre Inspector только в режиме разработки и после полной инициализации
    if (process.env.NODE_ENV === "development") {
      // Добавляем с небольшой задержкой для гарантии готовности карты
      setTimeout(() => {
        const currentMap = mapInstanceRef.current;
        if (currentMap && currentMap.isStyleLoaded && currentMap.isStyleLoaded()) {
          try {
            currentMap.addControl(
              new MaplibreInspect({
                popup: new maplibregl.Popup({
                  closeButton: false,
                  closeOnClick: false
                }),
                showInspectButton: true,
                showInspectMap: false,
                showMapPopup: true,
                showMapPopupOnHover: true,
                showInspectMapPopupOnHover: true
              }),
              "top-right"
            );
            console.log('🔧 MapLibre Inspector добавлен');
          } catch (error) {
            console.warn('⚠️ Не удалось добавить MapLibre Inspector:', error);
          }
        }
      }, 1000); // 1 секунда задержки для полной готовности
    }

    return () => {
      // Очищаем таймер фильтрации
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
      
      // Очищаем таймер обновления источника
      if (sourceUpdateTimeoutRef.current) {
        clearTimeout(sourceUpdateTimeoutRef.current);
        sourceUpdateTimeoutRef.current = null;
      }
      
      const mapInstance = mapInstanceRef.current;
      if (mapInstance) {
        try {
          // Проверяем, что карта еще доступна для операций
          if (mapInstance.getCanvas && mapInstance.getCanvas()) {
            // Сохраняем состояние перед уничтожением карты
            saveCurrentState();
          }
          
          // Очищаем обработчики событий
          if (mapInstance.off) {
            mapInstance.off('moveend', debouncedSave);
            mapInstance.off('zoomend', debouncedSave);
            mapInstance.off("styleimagemissing", handleStyleImageMissing);
          }
          
          // Удаляем карту
          if (mapInstance.remove) {
            mapInstance.remove();
          }
          mapInstanceRef.current = null;
          
          // Очищаем таймер
          clearTimeout(saveTimeout);
        } catch (error) {
          console.error('❌ Ошибка при очистке карты:', error);
          // Принудительно очищаем ссылку даже при ошибке
          mapInstanceRef.current = null;
        }
      }
    };
  }, [onPlaceSelect]); // Убираем places из dependency!

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

  return <div 
    ref={mapRef} 
    className="h-[100vh] w-full map-no-flicker" 
    style={{
      transition: 'opacity 0.15s ease-in-out',
      minHeight: '200px', // Минимальная высота для предотвращения проблем с размерами
      minWidth: '200px'   // Минимальная ширина
    }} 
  />;
} 