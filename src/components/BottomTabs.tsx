"use client";

interface Props {
  view: "map" | "list";
  setView: (view: "map" | "list") => void;
}

export default function BottomTabs({ view, setView }: Props) {
  return (
    <div className="fixed bottom-6 left-0 right-0 bg-white border-[2px] border-gray-100 rounded-full shadow-xl flex justify-around items-center h-14 z-50 mx-auto md:mx-auto md:mb-12 max-w-xl md:max-w-xl w-[60%] md:w-full md:bottom-0 md:pb-0">
      <button
        onClick={() => setView("map")}
        className={`relative flex-1 text-center py-2 ${view === "map" ? "text-[#2C3347] font-bold" : "text-gray-500"}`}
      >
        КАРТА
        {view === "map" && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[32px] h-[6px] bg-blue-600 rounded-full" />
        )}
      </button>
      <button
        onClick={() => setView("list")}
        className={`relative flex-1 text-center py-2 ${view === "list" ? "text-[#2C3347] font-bold" : "text-gray-500"}`}
      >
        СПИСОК
        {view === "list" && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[32px] h-[6px] bg-blue-600 rounded-full" />
        )}
      </button>
    </div>
  );
}