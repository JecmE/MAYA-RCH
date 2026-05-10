import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('MAIL_USER') || 'maya.rch.notificaciones@gmail.com',
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Conexión SMTP establecida correctamente.' };
    } catch (error) {
      console.error('[MAIL] Fallo en test de conexión:', error);
      return { success: false, message: error.message };
    }
  }

  async sendTestEmail(to: string) {
    const mailOptions = {
      from: `"Maya RCH - Prueba" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: 'Prueba de Conexión de Correo - Maya RCH',
      text: 'Este es un correo de prueba enviado desde el sistema Maya RCH para verificar la configuración SMTP.',
      html: '<p>Este es un correo de prueba enviado desde el sistema <b>Maya RCH</b> para verificar la configuración SMTP.</p>',
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: `Correo de prueba enviado a ${to}` };
    } catch (error) {
      console.error('[MAIL] Fallo en envío de prueba:', error);
      return { success: false, message: error.message };
    }
  }

  async sendLeaveRequestNotification(supervisorEmail: string, supervisorNombre: string, empleadoNombre: string, tipoPermiso: string, fechaInicio: string, fechaFin: string, motivo: string) {
    const mailOptions = {
      from: `"Maya RCH - Notificaciones" <${this.configService.get('MAIL_USER')}>`,
      to: supervisorEmail,
      subject: `Nueva solicitud de permiso: ${empleadoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${supervisorNombre}</h2>
            <p>El colaborador <b>${empleadoNombre}</b> ha enviado una nueva solicitud de permiso que requiere tu revisión.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Tipo de Permiso:</strong> ${tipoPermiso}</p>
              <p><strong>Periodo:</strong> del ${fechaInicio} al ${fechaFin}</p>
              <p><strong>Motivo:</strong> ${motivo}</p>
            </div>
            <p>Por favor, ingresa al sistema para aprobar o rechazar esta solicitud.</p>
          </div>
        </div>
      `,
    };
    return this.transporter.sendMail(mailOptions).catch(e => console.error('[MAIL] Error aviso solicitud permiso:', e));
  }

  async sendLeaveStatusNotification(empleadoEmail: string, empleadoNombre: string, estado: string, tipoPermiso: string, comentario: string) {
    const color = estado === 'aprobado' ? '#16a34a' : '#dc2626';
    const mailOptions = {
      from: `"Maya RCH - Notificaciones" <${this.configService.get('MAIL_USER')}>`,
      to: empleadoEmail,
      subject: `Estado de tu solicitud: ${estado.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${empleadoNombre}</h2>
            <p>Se ha procesado tu solicitud de <b>${tipoPermiso}</b>.</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="background-color: ${color}; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 1.1em; text-transform: uppercase;">${estado}</span>
            </div>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Observaciones:</strong> ${comentario || 'Sin comentarios adicionales.'}</p>
            </div>
          </div>
        </div>
      `,
    };
    return this.transporter.sendMail(mailOptions).catch(e => console.error('[MAIL] Error aviso estado permiso:', e));
  }

  async sendTimesheetRequestNotification(supervisorEmail: string, supervisorNombre: string, empleadoNombre: string, proyectoNombre: string, fecha: string, horas: number) {
    const fechaFormateada = this.formatMailDate(fecha);
    const mailOptions = {
      from: `"Maya RCH - Notificaciones" <${this.configService.get('MAIL_USER')}>`,
      to: supervisorEmail,
      subject: `Nuevo registro de tiempo: ${empleadoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${supervisorNombre}</h2>
            <p>El colaborador <b>${empleadoNombre}</b> ha registrado horas en un proyecto.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Proyecto:</strong> ${proyectoNombre}</p>
              <p><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p><strong>Horas:</strong> ${horas}h</p>
            </div>
            <p>Ingresa al panel de supervisor para validar este registro.</p>
          </div>
        </div>
      `,
    };
    return this.transporter.sendMail(mailOptions).catch(e => console.error('[MAIL] Error aviso registro tiempo:', e));
  }

  async sendTimesheetStatusNotification(empleadoEmail: string, empleadoNombre: string, estado: string, proyectoNombre: string, fecha: string, comentario: string) {
    const color = estado === 'aprobado' ? '#16a34a' : '#dc2626';
    const fechaFormateada = this.formatMailDate(fecha);

    const mailOptions = {
      from: `"Maya RCH - Notificaciones" <${this.configService.get('MAIL_USER')}>`,
      to: empleadoEmail,
      subject: `Estado de registro de tiempo: ${estado.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${empleadoNombre}</h2>
            <p>Se ha revisado tu registro de tiempo del día <b>${fechaFormateada}</b> en el proyecto <b>${proyectoNombre}</b>.</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="background-color: ${color}; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; font-size: 1.1em; text-transform: uppercase;">${estado}</span>
            </div>
            ${comentario ? `
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Comentarios:</strong> ${comentario}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `,
    };
    return this.transporter.sendMail(mailOptions).catch(e => console.error('[MAIL] Error aviso estado tiempo:', e));
  }

  private formatMailDate(dateInput: any): string {
    if (!dateInput) return '---';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return dateInput;
      // Usamos UTC para evitar desfases si solo es fecha sin hora
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateInput;
    }
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
              <a href="${this.configService.get('APP_PUBLIC_URL') || this.configService.get('FRONTEND_URL')}" style="background-color: #ea580c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder al Sistema</a>
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

  async sendCredentialsResetEmail(to: string, nombre: string, usuario: string, clave: string) {
    const mailOptions = {
      from: `"Maya RCH - Seguridad" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: 'Seguridad: Tu contraseña ha sido restablecida',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #1e293b;">Hola, ${nombre}</h2>
            <p>Un administrador ha restablecido tus credenciales de acceso al sistema.</p>
            <p>Tu nueva contraseña temporal es:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 0.9em; color: #64748b;">Contraseña Temporal:</p>
              <p style="margin: 10px 0 0 0;"><span style="font-family: monospace; font-size: 1.4em; color: #dc2626; font-weight: bold; letter-spacing: 2px;">${clave}</span></p>
            </div>
            <p style="color: #b91c1c; font-weight: bold;">Importante:</p>
            <p style="color: #4b5563; font-size: 0.9em;">Por razones de seguridad, el sistema te obligará a cambiar esta clave en tu próximo inicio de sesión.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${this.configService.get('APP_PUBLIC_URL') || this.configService.get('FRONTEND_URL')}" style="background-color: #1e293b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Entrar al Sistema</a>
            </div>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`[MAIL] Error enviando reset credentials a ${to}:`, error);
      return false;
    }
  }

  async sendVerificationCodeEmail(to: string, nombre: string, code: string) {
    const mailOptions = {
      from: `"Maya RCH - Seguridad" <${this.configService.get('MAIL_USER')}>`,
      to,
      subject: `${code} es tu código de verificación de Maya RCH`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #004f71; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Maya RCH</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #004f71;">Hola, ${nombre}</h2>
            <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código para validar tu identidad:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 25px 0; text-align: center;">
              <span style="font-family: monospace; font-size: 2.5em; color: #004f71; font-weight: bold; letter-spacing: 10px;">${code}</span>
            </div>
            <p style="color: #666; font-size: 0.9em;">Este código expirará en <strong>60 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error(`[MAIL] Error enviando código a ${to}:`, error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, nombre: string, token: string) {
    const publicUrl = this.configService.get('APP_PUBLIC_URL') || this.configService.get('FRONTEND_URL');
    const resetUrl = `${publicUrl}/reset-password?token=${token}`;
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
