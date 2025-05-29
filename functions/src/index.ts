import * as functions from 'firebase-functions';
import nodemailer from 'nodemailer';
import { onCall, CallableRequest } from 'firebase-functions/v2/https';

interface EnviarCorreoData {
  para: string;
  asunto: string;
  mensaje: string;
}

export const enviarCorreo = onCall(
  async (request: CallableRequest<EnviarCorreoData>) => {
    const { para, asunto, mensaje } = request.data;

    if (!para || !asunto || !mensaje) {
      throw new functions.https.HttpsError('invalid-argument', 'Faltan campos obligatorios');
    }

    const transporter = nodemailer.createTransport({
      host: 'mail.destinochile.cl',
      port: 587,
      secure: false,
      auth: {
        user: functions.config().correo.usuario,
        pass: functions.config().correo.clave
      }
    });

    const mailOptions = {
      from: 'sigtur@destinochile.cl',
      to: para,
      subject: asunto,
      html: mensaje
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Correo enviado correctamente (sin PDF)' };
    } catch (error: any) {
      console.error('❌ Error al enviar correo:', error, error?.response);
      throw new functions.https.HttpsError('internal', error.message || 'Error desconocido');
    }
  }
);
