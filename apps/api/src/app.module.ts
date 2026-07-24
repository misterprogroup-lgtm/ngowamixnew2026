import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/modules/redis/redis.module';
import { CloudinaryModule } from './common/modules/cloudinary/cloudinary.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ArtistsModule } from './modules/artists/artists.module';
import { MusicModule } from './modules/music/music.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { UploadModule } from './modules/upload/upload.module';
import { LikesModule } from './modules/likes/likes.module';
import { FollowsModule } from './modules/follows/follows.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConcertsModule } from './modules/concerts/concerts.module';
import { PaidLivesModule } from './modules/paid-lives/paid-lives.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { QrModule } from './modules/qr/qr.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot({
      throttlers: [],
    }),
    PrismaModule,
    RedisModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    ArtistsModule,
    MusicModule,
    AlbumsModule,
    PlaylistsModule,
    UploadModule,
    LikesModule,
    FollowsModule,
    NotificationsModule,
    ConcertsModule,
    PaidLivesModule,
    SubscriptionsModule,
    AdminModule,
    CommentsModule,
    ReportsModule,
    WalletModule,
    PaymentsModule,
    QrModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
