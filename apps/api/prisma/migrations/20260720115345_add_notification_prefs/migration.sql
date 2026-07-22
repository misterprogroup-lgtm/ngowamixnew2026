-- CreateTable
CREATE TABLE "notification_prefs" (
    "userId" TEXT NOT NULL,
    "emailFollows" BOOLEAN NOT NULL DEFAULT true,
    "emailLikes" BOOLEAN NOT NULL DEFAULT true,
    "emailPurchases" BOOLEAN NOT NULL DEFAULT true,
    "emailConcerts" BOOLEAN NOT NULL DEFAULT true,
    "emailLives" BOOLEAN NOT NULL DEFAULT true,
    "emailSystem" BOOLEAN NOT NULL DEFAULT true,
    "pushFollows" BOOLEAN NOT NULL DEFAULT true,
    "pushLikes" BOOLEAN NOT NULL DEFAULT true,
    "pushPurchases" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_prefs_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
