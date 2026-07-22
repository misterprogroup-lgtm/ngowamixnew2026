import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from './dto/forgot-password.dto';
import { UserRole, VerificationType } from '@prisma/client';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { pseudo: dto.pseudo }],
      },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
      throw new ConflictException('Ce pseudo est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        pseudo: dto.pseudo,
        passwordHash,
        phone: dto.phone,
        country: dto.country,
        city: dto.city,
        role: dto.role === 'ARTISTE' ? UserRole.ARTISTE : UserRole.FAN,
        subscription: {
          create: {
            plan: 'GRATUIT',
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        createdAt: true,
      },
    });

    const code = this.generateVerificationCode();
    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type: VerificationType.EMAIL,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Send welcome and verification emails
    this.emailService.sendWelcomeEmail(user.email, user.pseudo).catch(() => {});

    return {
      user,
      ...tokens,
      verificationCode: code,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte a été désactivé');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        pseudo: user.pseudo,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    if (refreshTokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expiré');
    }

    await this.prisma.refreshToken.delete({
      where: { id: refreshTokenRecord.id },
    });

    const { user } = refreshTokenRecord;
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Déconnexion réussie' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'Si cet email existe, un code de réinitialisation a été envoyé' };
    }

    const code = this.generateVerificationCode();
    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        type: VerificationType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    this.emailService.sendPasswordResetCode(dto.email, code).catch(() => {});
    this.emailService.sendVerificationCode(dto.email, code).catch(() => {});

    return { message: 'Si cet email existe, un code a été envoyé' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        code: dto.code,
        type: VerificationType.PASSWORD_RESET,
        used: false,
        expiresAt: { gt: new Date() },
        user: { email: dto.email },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  async verifyEmail(userId: string, code: string) {
    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type: VerificationType.EMAIL,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      }),
      this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Email vérifié avec succès' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('jwt.expiration', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret') + '-refresh',
        expiresIn: this.configService.get('jwt.refreshExpiration', '7d'),
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
