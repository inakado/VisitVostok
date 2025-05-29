import { Metadata } from "next";
import ClientActivitiesPage from "./ClientActivitiesPage";

// Metadata для страницы активностей
export const metadata: Metadata = {
  title: "Что поделать? - Активности и события на Дальнем Востоке",
  description: "Найдите интересные активности, туры и события в Приморском крае. Походы, водные виды спорта, экскурсии, культурные мероприятия и приключения на любой вкус.",
  keywords: [
    "активности Приморский край",
    "туры Дальний Восток",
    "походы Приморье",
    "водный спорт Владивосток",
    "экскурсии ДВ",
    "события Приморский край",
    "развлечения Дальний Восток"
  ],
  openGraph: {
    title: "Что поделать? - Активности и события на Дальнем Востоке | ВИЗИТВОСТОК",
    description: "Найдите интересные активности и события в Приморском крае. Походы, водные виды спорта, экскурсии и приключения.",
    url: "https://visitvostok.ru/activities",
  },
  twitter: {
    title: "Что поделать? - Активности и события на Дальнем Востоке",
    description: "Активности, туры и события в Приморском крае для незабываемых приключений",
  },
  alternates: {
    canonical: "https://visitvostok.ru/activities",
  },
};

export default function ActivitiesPage() {
  return <ClientActivitiesPage />;
}