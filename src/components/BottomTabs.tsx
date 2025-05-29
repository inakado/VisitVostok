"use client";

interface Props {
  view: "map" | "list";
  setView: (view: "map" | "list") => void;
}

export default function BottomTabs({ view, setView }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 rounded-full flex justify-around items-center h-14 z-50 mx-4 md:mx-auto mb-12 max-w-xl">
      <button
        onClick={() => setView("map")}
        className={`flex-1 text-center py-2 ${view === "map" ? "text-[#2C3347] font-bold" : "text-gray-500"}`}
      >
        КАРТА
      </button>
      <button
        onClick={() => setView("list")}
        className={`flex-1 text-center py-2 ${view === "list" ? "text-[#2C3347] font-bold" : "text-gray-500"}`}
      >
        СПИСОК
      </button>
    </div>
  );
}