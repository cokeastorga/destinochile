import * as functions from 'firebase-functions';
import nodemailer from 'nodemailer';
import { onCall } from 'firebase-functions/v1/https';

interface EnviarCorreoData {
  para: string;
  asunto: string;
  mensaje: string;
  pdfBase64?: string;
  nombreArchivo?: string;
}

export const enviarCorreo = onCall(
  async (data: EnviarCorreoData, context) => {
    const { para, asunto, mensaje, pdfBase64, nombreArchivo } = data;

    if (!para || !asunto || !mensaje) {
      throw new functions.https.HttpsError('invalid-argument', 'Faltan campos obligatorios');
    }

    const transporter = nodemailer.createTransport({
  host: 'mail.destinochile.cl',
  port: 465,
  secure: true,
  auth: {
    user: functions.config().correo.usuario,
    pass: functions.config().correo.clave
  }
});


    const mailOptions: any = {
      from: 'sigtur@destinochile.cl',
      to: para,
      subject: asunto,
      html: mensaje
    };

    if (pdfBase64 && nombreArchivo) {
      mailOptions.attachments = [
        {
          filename: nombreArchivo,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ];
    }

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Correo enviado correctamente' };
    } catch (error: any) {
      console.error('❌ Error al enviar correo:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  }
);
