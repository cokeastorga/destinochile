import nodemailer from 'nodemailer';

export interface EnviarCorreoData {
  para: string;
  asunto: string;
  mensaje: string;
  pdfBase64?: string;
  nombreArchivo?: string;
}

export async function enviarCorreoCotizacion(data: EnviarCorreoData): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: 'mail.destinochile.cl',
      port: 465,
      secure: true,
      auth: {
        user: 'sigtur@destinochile.cl',
        pass: 'x8hVgSh7GyX',
      },
    });

    const attachments = data.pdfBase64 && data.nombreArchivo
      ? [{
          filename: data.nombreArchivo,
          content: Buffer.from(data.pdfBase64, 'base64'),
          contentType: 'application/pdf',
        }]
      : [];

    await transporter.sendMail({
      from: '"Destino Chile" <sigtur@destinochile.cl>',
      to: data.para,
      subject: data.asunto,
      text: data.mensaje,
      html: `<p>${data.mensaje}</p>`,
      attachments,
    });

    return { success: true, message: 'Correo enviado correctamente.' };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, message: 'Fallo al enviar el correo.' };
  }
}
