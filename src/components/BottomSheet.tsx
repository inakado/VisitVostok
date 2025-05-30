"use client";

import { Place } from "@prisma/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface Props {
  place: Place | null;
  onClose: () => void;
}

export default function BottomSheet({ place, onClose }: Props) {
  if (!place) return null;

  return (
    <Sheet open={!!place} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[60vh] flex flex-col rounded-tl-xl rounded-tr-xl bg-white"
      >
        <SheetHeader>
          <SheetTitle>{place.title}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          {place.imageUrl && (
            <div className="mt-4 w-full max-h-[240px] overflow-hidden rounded-lg">
              <div className="relative w-full h-full">
                <Image
                  src={place.imageUrl}
                  alt={place.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <div className="mt-4 py-2 space-y-2">
            <p className="text-sm text-gray-500">{place.categoryName}</p>
            <p className="text-sm">{place.city}, {place.street}</p>
            {place.totalScore && (
              <p className="text-sm">Рейтинг: {place.totalScore.toFixed(1)}</p>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Link href={`/places/${place.id}`} className="w-full">
            <Button className="w-full">Подробнее</Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}