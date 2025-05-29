"use client";

import Script from "next/script";

export default function TelegramLogin() {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-widget.js?22"
        strategy="afterInteractive"
      />
      <div
        className="mt-6 items-center"
        dangerouslySetInnerHTML={{
          __html: `
            <script async src="https://telegram.org/js/telegram-widget.js?22"
              data-telegram-login="${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}"
              data-size="large"
              data-userpic="true"
              data-radius="10"
              data-request-access="write"
              data-auth-url="/api/auth/telegram"
            ></script>
          `,
        }}
      />
    </>
  );
}