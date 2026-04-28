import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendWelcomeEmail(to: string, nombre: string, usuario: string, clave: string) {
    const mailOptions = {
      from: `"Maya RCH - Notificaciones" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: 'Bienvenido a Maya RCH - Tus credenciales de acceso',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">¡Bienvenido, ${nombre}!</h2>
            <p>Tu cuenta en el sistema de gestión de Maya RCH ha sido creada exitosamente.</p>
            <p>Puedes acceder al sistema utilizando las siguientes credenciales:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${usuario}</p>
              <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> <span style="font-family: monospace; font-size: 1.1em; color: #ea580c; background: #fff; padding: 2px 6px; border: 1px solid #ddd; border-radius: 4px;">${clave}</span></p>
            </div>
            <p style="color: #666; font-size: 0.9em;"><em>* Por seguridad, se te solicitará cambiar esta contraseña en tu primer inicio de sesión.</em></p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${this.configService.get('FRONTEND_URL')}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 0.8em; color: #888;">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; 2026 Maya RCH. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[MAIL] Correo de bienvenida enviado a ${to}`);
      return true;
    } catch (error) {
      console.error(`[MAIL] Error enviando correo a ${to}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, nombre: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    const mailOptions = {
      from: `"Maya RCH - Seguridad" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: 'Recuperación de Contraseña - Maya RCH',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${nombre}</h2>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
            </div>
            <p>Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`[MAIL] Error enviando correo de reset a ${to}:`, error);
      return false;
    }
  }
}
