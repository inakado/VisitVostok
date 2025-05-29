/*
  Warnings:

  - You are about to drop the column `category` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Place` table. All the data in the column will be lost.
  - Added the required column `categoryName` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `temporarilyClosed` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Place` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Place" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "images",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "name",
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "categoryName" TEXT NOT NULL,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "price" TEXT,
ADD COLUMN     "reviewsCount" INTEGER,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "temporarilyClosed" BOOLEAN NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "totalScore" DOUBLE PRECISION;
