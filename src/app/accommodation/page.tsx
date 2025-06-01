"use client";

import { useEffect } from 'react';

export default function AccommodationPage() {

  useEffect(() => {
    // Скрипты Яндекс Путешествий
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = "https://aflt.travel.yandex.ru/widgets/api.js";
    script1.type = "text/javascript";
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.type = "text/javascript";
    script2.innerHTML = `
      (function (w) {
          function start() {
              w.removeEventListener('YaTravelAffiliateLoaded', start);
              w.YaTravelAffiliate.createWidget({
        "type": "hotelsOnMap",
        "containerId": "travelWidget",
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
          }

          w.YaTravelAffiliate
              ? start()
              : w.addEventListener('YaTravelAffiliateLoaded', start);
      })(window);
    `;
     document.body.appendChild(script2);

    return () => {
      // Очистка скриптов при уходе со страницы
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  return (
    <div className="h-full p-4 pt-20">
      {/* Здесь будет вижет Яндекс Путешествий */}
      <div id="travelWidget" className="h-full shadow-2xl rounded-xl"></div>
    </div>
  );
} 