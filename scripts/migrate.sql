-- =====================================================
-- NGOWAMIX 2026 -- Migration: Old DB to New Schema
-- =====================================================
-- Usage: psql -h HOST -U USER -d DBNAME -f scripts/migrate.sql
-- The new DATABASE_URL should point to the new Neon DB
-- with the new schema already applied via prisma migrate.
-- =====================================================

BEGIN;

-- =====================================================
-- 2. USERS
-- =====================================================
INSERT INTO users (id, email, phone, "passwordHash", pseudo, role, "avatarUrl", country, city, "isVerified", "isActive", "createdAt", "updatedAt")
SELECT
  id,
  email,
  "phone",
  password AS "passwordHash",
  COALESCE(
    NULLIF("displayName", ''),
    NULLIF(TRIM(CONCAT(COALESCE("firstName", ''), ' ', COALESCE("lastName", ''))), ''),
    SPLIT_PART(email, '@', 1)
  ) AS pseudo,
  CASE
    WHEN "role" = 'LISTENER' THEN 'FAN'::"UserRole"
    WHEN "role" = 'ARTIST' THEN 'ARTISTE'::"UserRole"
    WHEN "role" = 'LABEL' THEN 'ARTISTE'::"UserRole"
    WHEN "role" = 'ADMIN' THEN 'ADMIN'::"UserRole"
    ELSE 'FAN'::"UserRole"
  END AS role,
  avatar AS "avatarUrl",
  NULL AS country,
  NULL AS city,
  COALESCE("emailVerified", false) AS "isVerified",
  true AS "isActive",
  "createdAt",
  "updatedAt"
FROM "User"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. ARTIST_PROFILES
-- =====================================================
INSERT INTO artist_profiles (id, "userId", slug, "artistName", bio, "bannerUrl", genres, "socialLinks", "followerCount", "createdAt", "updatedAt")
SELECT
  id,
  "userId",
  slug,
  name AS "artistName",
  bio,
  "coverImage" AS "bannerUrl",
  CASE
    WHEN genres IS NOT NULL AND TRIM(genres) != '' THEN
      STRING_TO_ARRAY(regexp_replace(genres, '\s*,\s*', ',', 'g'), ',')
    ELSE ARRAY[]::TEXT[]
  END AS genres,
  CASE
    WHEN "socialLinks" IS NOT NULL AND "socialLinks" != '' THEN "socialLinks"::JSONB
    ELSE NULL
  END AS "socialLinks",
  0 AS "followerCount",
  "createdAt",
  "updatedAt"
FROM "Artist"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. ALBUMS
-- =====================================================
INSERT INTO albums (id, "artistId", title, slug, description, "coverUrl", "releaseDate", price, "isFree", "createdAt", "updatedAt")
SELECT
  id,
  "artistId",
  title,
  slug,
  description,
  "coverImage" AS "coverUrl",
  "releaseDate",
  CASE WHEN price > 0 THEN price ELSE 0 END AS price,
  CASE WHEN price = 0 OR price IS NULL THEN true ELSE false END AS "isFree",
  "createdAt",
  "updatedAt"
FROM "Album"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. TRACKS
-- =====================================================
INSERT INTO tracks (id, "artistId", title, slug, description, "audioUrl", "audioSize", "audioDuration", "coverUrl", genre, tags, visibility, "playCount", "downloadCount", "likeCount", "isExplicit", "publishedAt", "createdAt", "updatedAt")
SELECT
  t.id,
  a."artistId",
  t.title,
  t.slug,
  NULL AS description,
  t."audioFile" AS "audioUrl",
  COALESCE(t."fileSize", 0) AS "audioSize",
  COALESCE(t.duration, 0) AS "audioDuration",
  al."coverImage" AS "coverUrl",
  al.genre,
  ARRAY[]::TEXT[] AS tags,
  CASE
    WHEN al.status = 'PUBLISHED' THEN 'PUBLIC'::"TrackVisibility"
    ELSE 'PRIVATE'::"TrackVisibility"
  END AS visibility,
  COALESCE(t."playCount", 0) AS "playCount",
  0 AS "downloadCount",
  0 AS "likeCount",
  COALESCE(t."isExplicit", false) AS "isExplicit",
  CASE WHEN al.status = 'PUBLISHED' THEN al."releaseDate" ELSE NULL END AS "publishedAt",
  t."createdAt",
  t."updatedAt"
FROM "Track" t
JOIN "Album" al ON t."albumId" = al.id
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. ALBUM_TRACKS
-- =====================================================
INSERT INTO album_tracks (id, "albumId", "trackId", position)
SELECT
  t.id,
  t."albumId",
  t.id AS "trackId",
  t."trackNumber" AS position
FROM "Track" t
WHERE t."albumId" IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. PLAYLISTS
-- =====================================================
INSERT INTO playlists (id, "userId", title, description, "coverUrl", "isPublic", "trackCount", "createdAt", "updatedAt")
SELECT
  p.id,
  p."userId",
  p.name AS title,
  p.description,
  p."coverImage" AS "coverUrl",
  COALESCE(p."isPublic", false) AS "isPublic",
  (SELECT COUNT(*) FROM "PlaylistTrack" pt WHERE pt."playlistId" = p.id)::INT AS "trackCount",
  p."createdAt",
  p."updatedAt"
FROM "Playlist" p
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. PLAYLIST_TRACKS
-- =====================================================
INSERT INTO playlist_tracks (id, "playlistId", "trackId", position, "addedAt")
SELECT
  id,
  "playlistId",
  "trackId",
  COALESCE("sortOrder", 0) AS position,
  COALESCE("addedAt", NOW()) AS "addedAt"
FROM "PlaylistTrack"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. LISTEN_HISTORY
-- =====================================================
INSERT INTO listen_history (id, "userId", "trackId", "listenedAt", duration)
SELECT
  id,
  "userId",
  "trackId",
  "playedAt" AS "listenedAt",
  0 AS duration
FROM "ListenHistory"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. TRACK_LIKES (from Favorite where trackId IS NOT NULL)
-- =====================================================
INSERT INTO track_likes (id, "userId", "trackId", "createdAt")
SELECT
  id,
  "userId",
  "trackId",
  "createdAt"
FROM "Favorite"
WHERE "trackId" IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 11. FOLLOWS (from Favorite where artistId IS NOT NULL)
-- =====================================================
INSERT INTO follows (id, "userId", "artistId", "createdAt")
SELECT
  f.id,
  f."userId",
  f."artistId",
  f."createdAt"
FROM "Favorite" f
WHERE f."artistId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM artist_profiles ap WHERE ap.id = f."artistId")
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. DOWNLOAD_HISTORY (from Download where trackId IS NOT NULL)
-- =====================================================
INSERT INTO download_history (id, "userId", "trackId", "downloadedAt")
SELECT
  id,
  "userId",
  "trackId",
  COALESCE("downloadedAt", NOW()) AS "downloadedAt"
FROM "Download"
WHERE "trackId" IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 13. CONCERTS
-- =====================================================
INSERT INTO concerts (id, "artistId", title, slug, description, "coverUrl", venue, city, country, "date", time, "ticketPrice", "totalSeats", "soldSeats", status, "createdAt", "updatedAt")
SELECT
  c.id,
  c."artistId",
  c.title,
  c.slug,
  c.description,
  c.poster AS "coverUrl",
  c.venue,
  c.city,
  c.country,
  c.date,
  c.time,
  c.price AS "ticketPrice",
  COALESCE(c."totalTickets", 0) AS "totalSeats",
  COALESCE(c."totalTickets", 0) - COALESCE(c."availableTickets", 0) AS "soldSeats",
  CASE
    WHEN c."isActive" = false THEN 'CANCELLED'
    WHEN c.date > NOW() THEN 'UPCOMING'
    ELSE 'COMPLETED'
  END AS status,
  c."createdAt",
  c."updatedAt"
FROM "Concert" c
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 14. TICKETS
-- =====================================================
INSERT INTO tickets (id, "userId", "concertId", quantity, "totalPaid", "qrCode", status, "createdAt")
SELECT
  t.id,
  t."userId",
  t."concertId",
  1 AS quantity,
  t.price AS "totalPaid",
  t."qrCode",
  CASE
    WHEN t.status = 'AVAILABLE' THEN 'ACTIVE'
    WHEN t.status = 'PURCHASED' THEN 'ACTIVE'
    WHEN t.status = 'USED' THEN 'USED'
    WHEN t.status = 'CANCELLED' THEN 'CANCELLED'
    ELSE 'ACTIVE'
  END AS status,
  t."purchasedAt" AS "createdAt"
FROM "Ticket" t
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 15. PAID_LIVES (from LiveStream)
-- =====================================================
INSERT INTO paid_lives (id, "artistId", title, slug, description, "coverUrl", "streamUrl", price, "scheduledAt", "isLive", "viewerCount", "createdAt", "updatedAt")
SELECT
  ls.id,
  ls."artistId",
  ls.title,
  LOWER(REPLACE(ls.title, ' ', '-')) AS slug,
  ls.description,
  ls.thumbnail AS "coverUrl",
  ls."streamUrl",
  0 AS price,
  ls."scheduledAt",
  CASE WHEN ls.status = 'LIVE' THEN true ELSE false END AS "isLive",
  COALESCE(ls."viewerCount", 0) AS "viewerCount",
  ls."createdAt",
  ls."updatedAt"
FROM "LiveStream" ls
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 16. NOTIFICATIONS
-- =====================================================
INSERT INTO notifications (id, "userId", type, title, message, "linkUrl", "isRead", "createdAt")
SELECT
  id,
  "userId",
  CASE
    WHEN "type" = 'ALBUM_SUBMISSION' THEN 'system'
    WHEN "type" = 'CONCERT_CREATION' THEN 'concert'
    WHEN "type" = 'SYSTEM' THEN 'system'
    WHEN "type" = 'NEW_FOLLOWER' THEN 'follow'
    WHEN "type" = 'NEW_REPOST' THEN 'system'
    WHEN "type" = 'NEW_TRACK_FROM_ARTIST' THEN 'system'
    WHEN "type" = 'NEW_ALBUM_FROM_ARTIST' THEN 'system'
    WHEN "type" = 'DIRECT_MESSAGE' THEN 'system'
    ELSE 'system'
  END AS type,
  title,
  message,
  "referenceId" AS "linkUrl",
  CASE WHEN "status" = 'READ' THEN true ELSE false END AS "isRead",
  "createdAt"
FROM "Notification"
WHERE "userId" IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 17. PAYMENTS (from Transaction)
-- =====================================================
INSERT INTO payments (id, "userId", amount, method, status, "targetType", "targetId", "reference", "createdAt")
SELECT
  t.id,
  t."userId",
  t.amount,
  CASE
    WHEN t."paymentMethod" = 'MOBILE_MONEY' THEN 'orange_money'
    WHEN t."paymentMethod" = 'CARD' THEN 'carte_bancaire'
    ELSE 'orange_money'
  END AS method,
  CASE
    WHEN t.status = 'PAID' THEN 'COMPLETED'
    WHEN t.status = 'PENDING' THEN 'PENDING'
    WHEN t.status = 'FAILED' THEN 'FAILED'
    WHEN t.status = 'CANCELLED' THEN 'FAILED'
    WHEN t.status = 'REFUNDED' THEN 'FAILED'
    ELSE 'PENDING'
  END AS status,
  CASE
    WHEN t.type = 'SUBSCRIPTION' THEN 'subscription'
    WHEN t.type = 'ALBUM_PURCHASE' THEN 'album_purchase'
    WHEN t.type = 'TICKET_PURCHASE' THEN 'concert_ticket'
    WHEN t.type = 'TIP' THEN 'tip'
    WHEN t.type = 'PROMOTION' THEN 'promotion'
    ELSE 'subscription'
  END AS "targetType",
  t."productId" AS "targetId",
  t."providerTransactionId" AS reference,
  t."createdAt"
FROM "Transaction" t
WHERE t."userId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = t."userId")
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 18. SUBSCRIPTIONS
-- =====================================================
INSERT INTO subscriptions (id, "userId", plan, status, "startDate", "endDate", "autoRenew", "createdAt", "updatedAt")
SELECT
  s.id,
  s."userId",
  'GRATUIT'::"SubscriptionPlan" AS plan,
  CASE
    WHEN s.status = 'ACTIVE' THEN 'ACTIVE'::"SubscriptionStatus"
    WHEN s.status = 'EXPIRED' THEN 'EXPIREE'::"SubscriptionStatus"
    WHEN s.status = 'CANCELLED' THEN 'ANNULEE'::"SubscriptionStatus"
    WHEN s.status = 'PENDING' THEN 'ACTIVE'::"SubscriptionStatus"
    ELSE 'ACTIVE'::"SubscriptionStatus"
  END AS status,
  s."startDate",
  s."endDate",
  COALESCE(s."autoRenew", true) AS "autoRenew",
  s."createdAt",
  s."updatedAt"
FROM "Subscription" s
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = s."userId")
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Done!
-- =====================================================
COMMIT;

-- Verification queries
SELECT 'users' AS tbl, COUNT(*) AS migrated FROM users
UNION ALL SELECT 'artist_profiles', COUNT(*) FROM artist_profiles
UNION ALL SELECT 'albums', COUNT(*) FROM albums
UNION ALL SELECT 'tracks', COUNT(*) FROM tracks
UNION ALL SELECT 'album_tracks', COUNT(*) FROM album_tracks
UNION ALL SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL SELECT 'playlist_tracks', COUNT(*) FROM playlist_tracks
UNION ALL SELECT 'listen_history', COUNT(*) FROM listen_history
UNION ALL SELECT 'track_likes', COUNT(*) FROM track_likes
UNION ALL SELECT 'follows', COUNT(*) FROM follows
UNION ALL SELECT 'download_history', COUNT(*) FROM download_history
UNION ALL SELECT 'concerts', COUNT(*) FROM concerts
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'paid_lives', COUNT(*) FROM paid_lives
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
ORDER BY 1;
