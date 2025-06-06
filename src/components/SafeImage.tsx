"use client";

import Image from "next/image";
import { useState } from "react";

interface SafeImageProps {
  src: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  fallbackSrc?: string;
  onError?: () => void;
}

export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  fallbackSrc = '/placeholder-image.jpg',
  onError,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  // Безопасная инициализация - проверяем на null/undefined/пустую строку
  const [imageSrc, setImageSrc] = useState(() => {
    if (!src || src.trim() === '' || src === 'null') {
      return fallbackSrc;
    }
    return src;
  });

  const handleError = () => {
    if (!hasError && imageSrc !== fallbackSrc) {
      console.warn('⚠️ Не удалось загрузить изображение:', src);
      setHasError(true);
      setImageSrc(fallbackSrc);
      onError?.();
    }
  };

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      onError={handleError}
      unoptimized={true}
    />
  );
} 