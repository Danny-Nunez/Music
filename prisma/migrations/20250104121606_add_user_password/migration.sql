/*
  Warnings:

  - The primary key for the `Song` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Song` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlaylistSong" DROP CONSTRAINT "PlaylistSong_songId_fkey";

-- DropIndex
DROP INDEX "Song_videoId_key";

-- AlterTable
ALTER TABLE "Song" DROP CONSTRAINT "Song_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Song_pkey" PRIMARY KEY ("videoId");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- AddForeignKey
ALTER TABLE "PlaylistSong" ADD CONSTRAINT "PlaylistSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;
