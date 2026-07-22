import pg from 'pg';

const OLD_URL = 'postgresql://neondb_owner:npg_FQUVi1fDvgc5@ep-red-hall-aque2rgh-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';
const NEW_URL = 'postgresql://neondb_owner:npg_ViKbDZS4rUp3@ep-aged-grass-awoue37n-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

const oldPool = new pg.Pool({ connectionString: OLD_URL, max: 5 });
const newPool = new pg.Pool({ connectionString: NEW_URL, max: 5 });

async function batchInsert(client, table, columns, rows, conflictCols = 'id') {
  if (rows.length === 0) return;
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const vals = [];
    const params = [];
    let idx = 1;
    for (const row of batch) {
      const placeholders = columns.map(() => `$${idx++}`);
      vals.push(`(${placeholders.join(',')})`);
      params.push(...row);
    }
    await client.query(`INSERT INTO ${table} (${columns.map(c => `"${c}"`).join(',')}) VALUES ${vals.join(',')} ON CONFLICT (${conflictCols}) DO NOTHING`, params);
  }
}

async function migrate() {
  console.log('=== NGOWAMIX 2026 Migration ===');
  const old = await oldPool.connect();
  const nw = await newPool.connect();
  console.log('Connected to both databases.\n');

  try {
    await nw.query('BEGIN');

    // 1. USERS
    console.log('[1/17] Users...');
    const users = await old.query(`SELECT id, email, "phone", password, "displayName", "firstName", "lastName", role, avatar, "emailVerified", "createdAt", "updatedAt" FROM "User"`);
    const usedPseudos = new Set();
    const userRows = [];
    for (const u of users.rows) {
      let pseudo = u.displayName || (u.firstName ? `${u.firstName} ${u.lastName}`.trim() : null) || u.email.split('@')[0];
      if (usedPseudos.has(pseudo.toLowerCase())) pseudo = pseudo + '-' + u.id.slice(0, 8);
      usedPseudos.add(pseudo.toLowerCase());
      const role = u.role === 'LISTENER' ? 'FAN' : u.role === 'ARTIST' ? 'ARTISTE' : u.role === 'LABEL' ? 'ARTISTE' : 'ADMIN';
      userRows.push([u.id, u.email, u.phone, u.password, pseudo, role, u.avatar, u.emailVerified || false, true, u.createdAt, u.updatedAt]);
    }
    await batchInsert(nw, 'users', ['id','email','phone','passwordHash','pseudo','role','avatarUrl','isVerified','isActive','createdAt','updatedAt'], userRows);
    console.log(`  -> ${userRows.length} users`);

    // 2. ARTIST_PROFILES
    console.log('[2/17] Artist profiles...');
    const artists = await old.query(`SELECT id, "userId", slug, name, bio, "coverImage", genres, "socialLinks", "createdAt", "updatedAt" FROM "Artist"`);
    const artistRows = artists.rows.map(a => {
      const genresArr = a.genres ? a.genres.split(',').map(g => g.trim()).filter(Boolean) : [];
      return [a.id, a.userId, a.slug, a.name, a.bio, a.coverImage, genresArr, a.socialLinks ? JSON.stringify(a.socialLinks) : null, 0, a.createdAt, a.updatedAt];
    });
    await batchInsert(nw, 'artist_profiles', ['id','userId','slug','artistName','bio','bannerUrl','genres','socialLinks','followerCount','createdAt','updatedAt'], artistRows);
    console.log(`  -> ${artistRows.length} artist_profiles`);

    // 3. ALBUMS
    console.log('[3/17] Albums...');
    const albums = await old.query(`SELECT id, "artistId", title, slug, description, "coverImage", "releaseDate", price, "createdAt", "updatedAt" FROM "Album"`);
    const albumRows = albums.rows.map(al => [al.id, al.artistId, al.title, al.slug, al.description, al.coverImage, al.releaseDate, al.price || 0, !al.price || al.price === 0, al.createdAt, al.updatedAt]);
    await batchInsert(nw, 'albums', ['id','artistId','title','slug','description','coverUrl','releaseDate','price','isFree','createdAt','updatedAt'], albumRows);
    console.log(`  -> ${albumRows.length} albums`);

    // 4. TRACKS
    console.log('[4/17] Tracks...');
    const tracks = await old.query(`SELECT t.id, al."artistId", t.title, t.slug, t."audioFile", t."fileSize", t.duration, al."coverImage" AS "albumCover", al.genre, al.status, al."releaseDate", t."playCount", t."isExplicit", t."createdAt", t."updatedAt" FROM "Track" t JOIN "Album" al ON t."albumId" = al.id`);
    const trackRows = tracks.rows.map(t => [t.id, t.artistId, t.title, t.slug, t.audioFile, t.fileSize || 0, t.duration || 0, t.albumCover, t.genre, [], t.status === 'PUBLISHED' ? 'PUBLIC' : 'PRIVATE', t.playCount || 0, 0, 0, t.isExplicit || false, t.status === 'PUBLISHED' ? t.releaseDate : null, t.createdAt, t.updatedAt]);
    await batchInsert(nw, 'tracks', ['id','artistId','title','slug','audioUrl','audioSize','audioDuration','coverUrl','genre','tags','visibility','playCount','downloadCount','likeCount','isExplicit','publishedAt','createdAt','updatedAt'], trackRows);
    console.log(`  -> ${trackRows.length} tracks`);

    // 5. ALBUM_TRACKS
    console.log('[5/17] Album tracks...');
    const atRes = await old.query(`SELECT id, "albumId", "trackNumber" FROM "Track"`);
    const atRows = atRes.rows.map(at => [at.id, at.albumId, at.id, at.trackNumber]);
    await batchInsert(nw, 'album_tracks', ['id','albumId','trackId','position'], atRows);
    console.log(`  -> ${atRows.length} album_tracks`);

    // 6. PLAYLISTS
    console.log('[6/17] Playlists...');
    const playlists = await old.query(`SELECT * FROM "Playlist"`);
    const plRows = [];
    for (const p of playlists.rows) {
      const tc = await old.query(`SELECT COUNT(*)::int AS cnt FROM "PlaylistTrack" WHERE "playlistId" = $1`, [p.id]);
      plRows.push([p.id, p.userId, p.name, p.description, p.coverImage, p.isPublic || false, tc.rows[0].cnt, p.createdAt, p.updatedAt]);
    }
    await batchInsert(nw, 'playlists', ['id','userId','title','description','coverUrl','isPublic','trackCount','createdAt','updatedAt'], plRows);
    console.log(`  -> ${plRows.length} playlists`);

    // 7. PLAYLIST_TRACKS
    console.log('[7/17] Playlist tracks...');
    const ptRes = await old.query(`SELECT id, "playlistId", "trackId", "sortOrder", "addedAt" FROM "PlaylistTrack"`);
    const ptRows = ptRes.rows.map(pt => [pt.id, pt.playlistId, pt.trackId, pt.sortOrder || 0, pt.addedAt || new Date()]);
    await batchInsert(nw, 'playlist_tracks', ['id','playlistId','trackId','position','addedAt'], ptRows);
    console.log(`  -> ${ptRows.length} playlist_tracks`);

    // 8. LISTEN_HISTORY
    console.log('[8/17] Listen history...');
    const lhRes = await old.query(`SELECT id, "userId", "trackId", "playedAt" FROM "ListenHistory"`);
    const lhRows = lhRes.rows.map(lh => [lh.id, lh.userId, lh.trackId, lh.playedAt, 0]);
    await batchInsert(nw, 'listen_history', ['id','userId','trackId','listenedAt','duration'], lhRows);
    console.log(`  -> ${lhRows.length} listen_history`);

    // 9. TRACK_LIKES
    console.log('[9/17] Track likes...');
    const tlRes = await old.query(`SELECT id, "userId", "trackId", "createdAt" FROM "Favorite" WHERE "trackId" IS NOT NULL`);
    const tlRows = tlRes.rows.map(tl => [tl.id, tl.userId, tl.trackId, tl.createdAt]);
    await batchInsert(nw, 'track_likes', ['id','userId','trackId','createdAt'], tlRows);
    console.log(`  -> ${tlRows.length} track_likes`);

    // 10. FOLLOWS
    console.log('[10/17] Follows...');
    const fRes = await old.query(`SELECT f.id, f."userId", f."artistId", f."createdAt" FROM "Favorite" f WHERE f."artistId" IS NOT NULL`);
    const fRows = [];
    for (const f of fRes.rows) {
      const exists = await nw.query(`SELECT 1 FROM artist_profiles WHERE id = $1`, [f.artistId]);
      if (exists.rows.length > 0) fRows.push([f.id, f.userId, f.artistId, f.createdAt]);
    }
    await batchInsert(nw, 'follows', ['id','userId','artistId','createdAt'], fRows);
    console.log(`  -> ${fRows.length} follows`);

    // 11. DOWNLOAD_HISTORY
    console.log('[11/17] Download history...');
    const dhRes = await old.query(`SELECT id, "userId", "trackId", "downloadedAt" FROM "Download" WHERE "trackId" IS NOT NULL`);
    const dhRows = dhRes.rows.map(dh => [dh.id, dh.userId, dh.trackId, dh.downloadedAt || new Date()]);
    await batchInsert(nw, 'download_history', ['id','userId','trackId','downloadedAt'], dhRows);
    console.log(`  -> ${dhRows.length} download_history`);

    // 12. CONCERTS
    console.log('[12/17] Concerts...');
    const concRes = await old.query(`SELECT * FROM "Concert"`);
    const concRows = concRes.rows.map(c => {
      const soldSeats = (c.totalTickets || 0) - (c.availableTickets || 0);
      const status = c.isActive === false ? 'CANCELLED' : (new Date(c.date) > new Date() ? 'UPCOMING' : 'COMPLETED');
      return [c.id, c.artistId, c.title, c.slug, c.description, c.poster, c.venue, c.city, c.country, c.date, c.time, c.price, c.totalTickets || 0, soldSeats, status, c.createdAt, c.updatedAt];
    });
    await batchInsert(nw, 'concerts', ['id','artistId','title','slug','description','coverUrl','venue','city','country','date','time','ticketPrice','totalSeats','soldSeats','status','createdAt','updatedAt'], concRows);
    console.log(`  -> ${concRows.length} concerts`);

    // 13. TICKETS
    console.log('[13/17] Tickets...');
    const tickRes = await old.query(`SELECT * FROM "Ticket"`);
    const tickRows = tickRes.rows.map(t => {
      const status = t.status === 'PURCHASED' ? 'ACTIVE' : t.status;
      return [t.id, t.userId, t.concertId, 1, t.price, t.qrCode, status, t.purchasedAt];
    });
    await batchInsert(nw, 'tickets', ['id','userId','concertId','quantity','totalPaid','qrCode','status','createdAt'], tickRows);
    console.log(`  -> ${tickRows.length} tickets`);

    // 14. PAID_LIVES
    console.log('[14/17] Paid lives...');
    const lsRes = await old.query(`SELECT * FROM "LiveStream"`);
    const lsRows = lsRes.rows.map(ls => {
      const slug = ls.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return [ls.id, ls.artistId, ls.title, slug, ls.description, ls.thumbnail, ls.streamUrl, 0, ls.scheduledAt, ls.status === 'LIVE', ls.viewerCount || 0, ls.createdAt, ls.updatedAt];
    });
    await batchInsert(nw, 'paid_lives', ['id','artistId','title','slug','description','coverUrl','streamUrl','price','scheduledAt','isLive','viewerCount','createdAt','updatedAt'], lsRows);
    console.log(`  -> ${lsRows.length} paid_lives`);

    // 15. NOTIFICATIONS
    console.log('[15/17] Notifications...');
    const notifRes = await old.query(`SELECT * FROM "Notification" WHERE "userId" IS NOT NULL`);
    const typeMap = { ALBUM_SUBMISSION: 'system', CONCERT_CREATION: 'concert', SYSTEM: 'system', NEW_FOLLOWER: 'follow', NEW_REPOST: 'system', NEW_TRACK_FROM_ARTIST: 'system', NEW_ALBUM_FROM_ARTIST: 'system', DIRECT_MESSAGE: 'system' };
    const notifRows = notifRes.rows.map(n => [n.id, n.userId, typeMap[n.type] || 'system', n.title, n.message, n.referenceId, n.status === 'READ', n.createdAt]);
    await batchInsert(nw, 'notifications', ['id','userId','type','title','message','linkUrl','isRead','createdAt'], notifRows);
    console.log(`  -> ${notifRows.length} notifications`);

    // 16. PAYMENTS
    console.log('[16/17] Payments...');
    const payRes = await old.query(`SELECT * FROM "Transaction" WHERE "userId" IS NOT NULL`);
    const payRows = payRes.rows.map(p => {
      const method = p.paymentMethod === 'MOBILE_MONEY' ? 'orange_money' : p.paymentMethod === 'CARD' ? 'carte_bancaire' : 'orange_money';
      const status = p.status === 'PAID' ? 'COMPLETED' : p.status === 'PENDING' ? 'PENDING' : 'FAILED';
      const targetType = { SUBSCRIPTION: 'subscription', ALBUM_PURCHASE: 'album_purchase', TICKET_PURCHASE: 'concert_ticket', TIP: 'tip', PROMOTION: 'promotion' }[p.type] || 'subscription';
      return [p.id, p.userId, p.amount, method, status, targetType, p.productId, p.providerTransactionId, p.createdAt];
    });
    await batchInsert(nw, 'payments', ['id','userId','amount','method','status','targetType','targetId','reference','createdAt'], payRows);
    console.log(`  -> ${payRows.length} payments`);

    // 17. SUBSCRIPTIONS
    console.log('[17/17] Subscriptions...');
    const subRes = await old.query(`SELECT * FROM "Subscription"`);
    const subRows = subRes.rows.map(s => {
      const statusMap = { ACTIVE: 'ACTIVE', EXPIRED: 'EXPIREE', CANCELLED: 'ANNULEE', PENDING: 'ACTIVE' };
      return [s.id, s.userId, 'GRATUIT', statusMap[s.status] || 'ACTIVE', s.startDate, s.endDate, s.autoRenew, s.createdAt, s.updatedAt];
    });
    await batchInsert(nw, 'subscriptions', ['id','userId','plan','status','startDate','endDate','autoRenew','createdAt','updatedAt'], subRows);
    console.log(`  -> ${subRows.length} subscriptions`);

    await nw.query('COMMIT');
    console.log('\n=== Migration COMPLETE ===\n');

    // Verification
    console.log('=== Verification ===');
    const tables = ['users','artist_profiles','albums','tracks','album_tracks','playlists','playlist_tracks','listen_history','track_likes','follows','download_history','concerts','tickets','paid_lives','notifications','payments','subscriptions'];
    for (const tbl of tables) {
      const res = await nw.query(`SELECT COUNT(*)::int AS cnt FROM ${tbl}`);
      console.log(`  ${tbl}: ${res.rows[0].cnt}`);
    }
  } catch (err) {
    await nw.query('ROLLBACK');
    console.error('Migration FAILED:', err.message);
    process.exit(1);
  } finally {
    old.release();
    nw.release();
    await oldPool.end();
    await newPool.end();
  }
}

migrate();
