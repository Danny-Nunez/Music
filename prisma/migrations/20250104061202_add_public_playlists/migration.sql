/*
  Warnings:

  - The primary key for the `Song` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `_PlaylistToSong` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[videoId]` on the table `Song` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `Song` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "_PlaylistToSong" DROP CONSTRAINT "_PlaylistToSong_A_fkey";

-- DropForeignKey
ALTER TABLE "_PlaylistToSong" DROP CONSTRAINT "_PlaylistToSong_B_fkey";

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Song" DROP CONSTRAINT "Song_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Song_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "_PlaylistToSong";

-- CreateTable
CREATE TABLE "PlaylistSong" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistSong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistSong_playlistId_songId_key" ON "PlaylistSong"("playlistId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "Song_videoId_key" ON "Song"("videoId");

-- AddForeignKey
ALTER TABLE "PlaylistSong" ADD CONSTRAINT "PlaylistSong_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistSong" ADD CONSTRAINT "PlaylistSong_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
