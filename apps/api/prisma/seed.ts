import { PrismaClient, UserRole, SubscriptionPlan, TrackVisibility } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ngowamix.com' },
    update: {},
    create: {
      email: 'admin@ngowamix.com',
      pseudo: 'admin',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isVerified: true,
      country: "Côte d'Ivoire",
      city: 'Abidjan',
      subscription: { create: { plan: SubscriptionPlan.PRO_MENSUEL, status: 'ACTIVE' } },
    },
  });

  const artist1User = await prisma.user.upsert({
    where: { email: 'amadou@ngowamix.com' },
    update: {},
    create: {
      email: 'amadou@ngowamix.com',
      pseudo: 'djalo_ivoire',
      passwordHash: userPassword,
      role: UserRole.ARTISTE,
      isVerified: true,
      country: "Côte d'Ivoire",
      city: 'Abidjan',
      subscription: { create: { plan: SubscriptionPlan.PRO_MENSUEL, status: 'ACTIVE' } },
    },
  });

  const artist1Profile = await prisma.artistProfile.upsert({
    where: { slug: 'djalo' },
    update: {},
    create: {
      userId: artist1User.id,
      slug: 'djalo',
      artistName: 'Djalo',
      bio: "Chanteur ivoirien de coupé-décalé et afrobeat, voix puissante de la scène abidjanaise.",
      genres: ['Afrobeat', 'Coupé-Décalé', 'Pop'],
      followerCount: 18200,
    },
  });

  const artist2User = await prisma.user.upsert({
    where: { email: 'angelique@ngowamix.com' },
    update: {},
    create: {
      email: 'angelique@ngowamix.com',
      pseudo: 'marie_houon',
      passwordHash: userPassword,
      role: UserRole.ARTISTE,
      isVerified: true,
      country: "Côte d'Ivoire",
      city: 'Bouaké',
      subscription: { create: { plan: SubscriptionPlan.PRO_ANNUEL, status: 'ACTIVE' } },
    },
  });

  const artist2Profile = await prisma.artistProfile.upsert({
    where: { slug: 'marie-houon' },
    update: {},
    create: {
      userId: artist2User.id,
      slug: 'marie-houon',
      artistName: 'Marie Houon',
      bio: 'Auteure-compositrice de Bouaké, entre zouglou moderne et afropop.',
      genres: ['Afropop', 'Zouglou', 'R&B'],
      followerCount: 27500,
    },
  });

  const artist3User = await prisma.user.upsert({
    where: { email: 'youssou@ngowamix.com' },
    update: {},
    create: {
      email: 'youssou@ngowamix.com',
      pseudo: 'koffi_ivoire',
      passwordHash: userPassword,
      role: UserRole.ARTISTE,
      isVerified: true,
      country: "Côte d'Ivoire",
      city: 'Yamoussoukro',
      subscription: { create: { plan: SubscriptionPlan.PRO_MENSUEL, status: 'ACTIVE' } },
    },
  });

  const artist3Profile = await prisma.artistProfile.upsert({
    where: { slug: 'koffi-le-rapide' },
    update: {},
    create: {
      userId: artist3User.id,
      slug: 'koffi-le-rapide',
      artistName: 'Koffi le Rapide',
      bio: "Rappeur de Yamoussoukro, mélange ndombolo et hip-hop ivoirien.",
      genres: ['Hip-Hop', 'Ndombolo', 'World'],
      followerCount: 52300,
    },
  });

  const fanUser = await prisma.user.upsert({
    where: { email: 'fan@ngowamix.com' },
    update: {},
    create: {
      email: 'fan@ngowamix.com',
      pseudo: 'fanmusic',
      passwordHash: userPassword,
      role: UserRole.FAN,
      isVerified: true,
      country: "Côte d'Ivoire",
      city: 'Cocody',
      subscription: { create: { plan: SubscriptionPlan.GRATUIT, status: 'ACTIVE' } },
    },
  });

  // --- Tracks ---
  const tracksData = [
    { title: "Soleil d'Abidjan", genre: 'Afrobeat', artistId: artist1Profile.id, playCount: 14200, tags: ['afrobeat', 'abidjan', 'soleil'] },
    { title: 'Rythmes de Bouaké', genre: 'Pop', artistId: artist2Profile.id, playCount: 9800, tags: ['pop', 'bouaké'] },
    { title: 'Nuit Cocody', genre: 'R&B', artistId: artist1Profile.id, playCount: 7600, tags: ['r&b', 'cocody', 'nuit'] },
    { title: 'Danse du Monde', genre: 'World', artistId: artist2Profile.id, playCount: 6900, tags: ['world', 'danse'] },
    { title: 'Feu de Camp', genre: 'Blues', artistId: artist1Profile.id, playCount: 5100, tags: ['blues', 'camp'] },
    { title: 'Bélo', genre: 'Afropop', artistId: artist2Profile.id, playCount: 4700, tags: ['afropop'] },
    { title: 'Étoile de Yamoussoukro', genre: 'World', artistId: artist3Profile.id, playCount: 4300, tags: ['world', 'yamoussoukro'] },
    { title: 'Coupé-Décalé Freestyle', genre: 'Hip-Hop', artistId: artist3Profile.id, playCount: 3900, tags: ['hip-hop', 'coupé-décalé'] },
  ];

  const createdTracks: { id: string; artistId: string }[] = [];
  for (const trackData of tracksData) {
    const existing = await prisma.track.findFirst({ where: { title: trackData.title } });
    if (existing) {
      createdTracks.push({ id: existing.id, artistId: existing.artistId });
      continue;
    }
    const track = await prisma.track.create({
      data: {
        artistId: trackData.artistId,
        title: trackData.title,
        slug: slugify(trackData.title),
        audioUrl: '/uploads/audio/placeholder.mp3',
        audioSize: 5000000,
        audioDuration: 200 + Math.floor(Math.random() * 120),
        genre: trackData.genre,
        tags: trackData.tags,
        visibility: TrackVisibility.PUBLIC,
        playCount: trackData.playCount,
        isExplicit: false,
        publishedAt: new Date(),
      },
    });
    createdTracks.push({ id: track.id, artistId: track.artistId });
  }

  // --- Albums ---
  const album1Tracks = createdTracks.filter((t) => t.artistId === artist1Profile.id);
  const album2Tracks = createdTracks.filter((t) => t.artistId === artist2Profile.id);

  const existingAlbum1 = await prisma.album.findFirst({ where: { title: 'Cœur d\'Abidjan' } });
  const album1 = existingAlbum1 ?? await prisma.album.create({
    data: {
      artistId: artist1Profile.id,
      title: "Cœur d'Abidjan",
      slug: slugify("Cœur d'Abidjan"),
      description: "Un voyage sonore au cœur de la nuit abidjanaise.",
      releaseDate: new Date('2025-03-15'),
      price: 5000,
      isFree: false,
    },
  });

  const existingAlbum2 = await prisma.album.findFirst({ where: { title: 'Voix de Bouaké' } });
  const album2 = existingAlbum2 ?? await prisma.album.create({
    data: {
      artistId: artist2Profile.id,
      title: 'Voix de Bouaké',
      slug: slugify('Voix de Bouaké'),
      description: "Les sons de Bouaké, du zouglou à l'afropop moderne.",
      releaseDate: new Date('2025-06-01'),
      price: 0,
      isFree: true,
    },
  });

  for (let i = 0; i < album1Tracks.length; i++) {
    const exists = await prisma.albumTrack.findFirst({ where: { albumId: album1.id, trackId: album1Tracks[i].id } });
    if (!exists) {
      await prisma.albumTrack.create({
        data: { albumId: album1.id, trackId: album1Tracks[i].id, position: i + 1 },
      });
    }
  }

  for (let i = 0; i < album2Tracks.length; i++) {
    const exists = await prisma.albumTrack.findFirst({ where: { albumId: album2.id, trackId: album2Tracks[i].id } });
    if (!exists) {
      await prisma.albumTrack.create({
        data: { albumId: album2.id, trackId: album2Tracks[i].id, position: i + 1 },
      });
    }
  }

  // --- Concerts ---
  const concertsData = [
    {
      artistId: artist1Profile.id,
      title: "Djalo — Tour Côte d'Ivoire 2026",
      slug: slugify("Djalo — Tour Côte d'Ivoire 2026"),
      description: "Le roi du coupé-décalé en tournée nationale.",
      venue: 'Palais de la Culture',
      city: 'Abidjan',
      country: "Côte d'Ivoire",
      date: new Date('2026-09-15T20:00:00'),
      time: '20:00',
      ticketPrice: 15000,
      totalSeats: 5000,
      soldSeats: 1890,
      status: 'UPCOMING',
    },
    {
      artistId: artist2Profile.id,
      title: 'Marie Houon — Concert Célébration',
      slug: slugify('Marie Houon — Concert Célébration'),
      description: "Un concert unique célébrant 15 ans de carrière.",
      venue: 'Stade de la Paix',
      city: 'Bouaké',
      country: "Côte d'Ivoire",
      date: new Date('2026-10-22T19:30:00'),
      time: '19:30',
      ticketPrice: 20000,
      totalSeats: 3000,
      soldSeats: 1120,
      status: 'UPCOMING',
    },
    {
      artistId: artist3Profile.id,
      title: 'Koffi le Rapide — Yamoussoukro Live',
      slug: slugify('Koffi le Rapide — Yamoussoukro Live'),
      description: "Une soirée de hip-hop et ndombolo dans la capitale politique.",
      venue: 'Centre Culturel',
      city: 'Yamoussoukro',
      country: "Côte d'Ivoire",
      date: new Date('2026-08-10T21:00:00'),
      time: '21:00',
      ticketPrice: 10000,
      totalSeats: 2000,
      soldSeats: 870,
      status: 'UPCOMING',
    },
    {
      artistId: artist1Profile.id,
      title: 'Djalo — San-Pédro Acoustique',
      slug: slugify('Djalo — San-Pédro Acoustique'),
      description: "Séance acoustique au port de San-Pédro.",
      venue: 'Port Autonome Hall',
      city: 'San-Pédro',
      country: "Côte d'Ivoire",
      date: new Date('2026-11-05T19:00:00'),
      time: '19:00',
      ticketPrice: 5000,
      totalSeats: 500,
      soldSeats: 190,
      status: 'UPCOMING',
    },
  ];

  for (const c of concertsData) {
    const existing = await prisma.concert.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.concert.create({ data: c });
    }
  }

  // --- Paid Lives ---
  const livesData = [
    {
      artistId: artist3Profile.id,
      title: 'Koffi le Rapide — Live from Yamoussoukro',
      slug: slugify('Koffi le Rapide — Live from Yamoussoukro'),
      description: "Concert en direct depuis Yamoussoukro. Q&A avec les fans après le show.",
      price: 2500,
      scheduledAt: new Date('2026-08-01T20:00:00'),
      isLive: false,
      viewerCount: 0,
    },
    {
      artistId: artist2Profile.id,
      title: 'Marie Houon — Sessions Acoustiques Bouaké',
      slug: slugify('Marie Houon — Sessions Acoustiques Bouaké'),
      description: "Sessions acoustiques intimes avec Marie, en direct de Bouaké.",
      price: 3000,
      scheduledAt: new Date('2026-09-12T19:00:00'),
      isLive: false,
      viewerCount: 0,
    },
    {
      artistId: artist1Profile.id,
      title: 'Djalo — Jam Session Plateau',
      slug: slugify('Djalo — Jam Session Plateau'),
      description: "Jam session improvisée au cœur du Plateau. Gratuit pour tous les fans!",
      price: 0,
      scheduledAt: new Date('2026-07-25T20:00:00'),
      isLive: false,
      viewerCount: 0,
    },
  ];

  for (const l of livesData) {
    const existing = await prisma.paidLive.findFirst({ where: { title: l.title } });
    if (!existing) {
      await prisma.paidLive.create({ data: l });
    }
  }

  // --- Follows & Likes ---
  const existingFollow = await prisma.follow.findFirst({
    where: { userId: fanUser.id, artistId: artist3Profile.id },
  });
  if (!existingFollow) {
    await prisma.follow.create({
      data: { userId: fanUser.id, artistId: artist3Profile.id },
    });
  }

  const existingLike = await prisma.trackLike.findFirst({
    where: { userId: fanUser.id, trackId: createdTracks[0]?.id },
  });
  if (!existingLike && createdTracks[0]) {
    await prisma.trackLike.create({
      data: { userId: fanUser.id, trackId: createdTracks[0].id },
    });
  }

  // --- Wallets for artists ---
  for (const userId of [artist1User.id, artist2User.id, artist3User.id]) {
    const existingWallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!existingWallet) {
      await prisma.wallet.create({
        data: { userId, balance: 0, income: 0, pending: 0 },
      });
    }
  }

  console.log('✅ Seed completed!');
  console.log('   Admin: admin@ngowamix.com / Admin@123');
  console.log('   Artist 1: amadou@ngowamix.com / User@123');
  console.log('   Artist 2: angelique@ngowamix.com / User@123');
  console.log('   Artist 3: youssou@ngowamix.com / User@123');
  console.log('   Fan: fan@ngowamix.com / User@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
