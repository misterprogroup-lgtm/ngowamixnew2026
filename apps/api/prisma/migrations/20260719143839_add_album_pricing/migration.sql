-- AlterTable
ALTER TABLE "albums" ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "album_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_purchases_userId_idx" ON "album_purchases"("userId");

-- CreateIndex
CREATE INDEX "album_purchases_albumId_idx" ON "album_purchases"("albumId");

-- CreateIndex
CREATE UNIQUE INDEX "album_purchases_userId_albumId_key" ON "album_purchases"("userId", "albumId");

-- AddForeignKey
ALTER TABLE "album_purchases" ADD CONSTRAINT "album_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_purchases" ADD CONSTRAINT "album_purchases_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
