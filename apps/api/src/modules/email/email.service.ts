import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('smtp.port', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('smtp.user', ''),
          pass: this.configService.get<string>('smtp.pass', ''),
        },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"Ngowamix" <${this.configService.get<string>('smtp.user', 'noreply@ngowamix.com')}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}: ${info.messageId}`);
        return info;
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}: ${err}`);
      }
    }
    this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject} | Body: ${html}`);
  }

  async sendVerificationCode(to: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #ee683d; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Ngowamix</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111; margin-top: 0;">Vérification de votre email</h2>
          <p style="color: #555; line-height: 1.6;">Voici votre code de vérification :</p>
          <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ee683d;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px;">Ce code expire dans 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
        </div>
      </div>
    `;
    return this.sendEmail(to, 'Vérification de votre email - Ngowamix', html);
  }

  async sendPasswordResetCode(to: string, code: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #ee683d; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Ngowamix</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111; margin-top: 0;">Réinitialisation de mot de passe</h2>
          <p style="color: #555; line-height: 1.6;">Voici votre code de réinitialisation :</p>
          <div style="background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ee683d;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px;">Ce code expire dans 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      </div>
    `;
    return this.sendEmail(to, 'Réinitialisation de mot de passe - Ngowamix', html);
  }

  async sendWelcomeEmail(to: string, pseudo: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #ee683d; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Ngowamix</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
          <h2 style="color: #111; margin-top: 0;">Bienvenue ${pseudo} !</h2>
          <p style="color: #555; line-height: 1.6;">Merci de rejoindre Ngowamix. Explorez, écoutez et soutenez vos artistes préférés.</p>
          <a href="${this.configService.get<string>('appUrl', 'http://localhost:3000')}/decouverte"
             style="display: inline-block; background: #ee683d; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0;">
            Découvrir des morceaux
          </a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">L'équipe Ngowamix</p>
        </div>
      </div>
    `;
    return this.sendEmail(to, 'Bienvenue sur Ngowamix !', html);
  }
}
