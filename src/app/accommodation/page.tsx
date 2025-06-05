"use client";

import { useEffect } from 'react';

export default function AccommodationPage() {

  useEffect(() => {
    // Удаляем предыдущие скрипты, если они были добавлены
    const existingScript1 = document.querySelector('script[src="https://aflt.travel.yandex.ru/widgets/api.js"]');
    if (existingScript1) existingScript1.remove();
    const existingScript2 = document.querySelector('script[data-widget-init]'); // Добавим атрибут для идентификации скрипта инициализации
    if (existingScript2) existingScript2.remove();

    // Загружаем основной скрипт API Яндекс Путешествий
    const apiScript = document.createElement('script');
    apiScript.async = true;
    apiScript.src = "https://aflt.travel.yandex.ru/widgets/api.js";
    apiScript.type = "text/javascript";
    document.body.appendChild(apiScript);

    // Скрипт инициализации виджетов
    const initScript = document.createElement('script');
    initScript.type = "text/javascript";
    initScript.setAttribute('data-widget-init', 'true'); // Помечаем для очистки
    initScript.innerHTML = `
      (function (w) {
          function start() {
              w.removeEventListener('YaTravelAffiliateLoaded', start);
              
              // Инициализация виджета карты
              w.YaTravelAffiliate.createWidget({
                  "type": "hotelsOnMap",
                  "containerId": "travelWidgetMap", // Новый ID контейнера для карты
                  "widgetParams": {
                      "geoId": 75,
                      "affiliateClid": "12945199"
                  },
                  "urlParams": {
                      "origin": "https://travel.yandex.ru",
                      "partner": "distribution",
                      "params": {
                          "affiliate_clid": "12945199",
                          "service": "hotelsOnMap",
                          "utm_source": "distribution",
                          "utm_medium": "cpa"
                      }
                  },
                  "theme": "light"
              });

              // Инициализация виджета карусели
              w.YaTravelAffiliate.createWidget({
                  "type": "topHotels",
                  "containerId": "travelWidgetCarousel", // ID контейнера для карусели
                  "widgetParams": {
                      "geoId": 75,
                      "sorting": "high_rating",
                      "affiliateClid": "12945199"
                  },
                  "urlParams": {
                      "origin": "https://travel.yandex.ru/", // Исправлено на / в конце
                      "partner": "distribution",
                      "params": {
                          "affiliate_clid": "12945199",
                          "service": "topHotels",
                          "utm_source": "distribution",
                          "utm_medium": "cpa"
                      }
                  },
                  "theme": "light"
              });
          }

          w.YaTravelAffiliate
              ? start()
              : w.addEventListener('YaTravelAffiliateLoaded', start);
      })(window);
    `;
    document.body.appendChild(initScript);

    return () => {
      // Очистка скриптов при уходе со страницы
      const apiScriptEl = document.querySelector('script[src="https://aflt.travel.yandex.ru/widgets/api.js"]');
      if (apiScriptEl) apiScriptEl.remove();
      const initScriptEl = document.querySelector('script[data-widget-init]');
      if (initScriptEl) initScriptEl.remove();
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 p-4 pt-20 h-full"> {/* Контейнер для обоих виджетов, занимает всю доступную высоту */}
      {/* Контейнер для виджета карты. Занимает большую часть пространства. */}
      <div id="travelWidgetMap" className="w-full flex-1 shadow-xl rounded-lg mb-4"></div> {/* Добавлен mb-4 для отступа между виджетами */}

      {/* Контейнер для виджета карусели. Фиксированная высота. */}
      <div id="travelWidgetCarousel" className="w-full h-96 shadow-xl rounded-lg"></div> {/* Фиксированная высота h-96 */}
    </div>
  );
} 