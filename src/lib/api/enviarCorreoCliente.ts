import { httpsCallable } from 'firebase/functions';
import { functions } from '$lib/firebase';

export async function enviarCotizacionPorCorreo({ para, asunto, mensaje, pdfBlob }: {
  para: string;
  asunto: string;
  mensaje: string;
  pdfBlob: Blob;
}) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(',')[1];

      try {
        const enviarCorreo = httpsCallable(functions, 'enviarCorreo');
        const result = await enviarCorreo({
          para,
          asunto,
          mensaje,
          nombreArchivo: 'cotizacion.pdf',
          pdfBase64: base64
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(pdfBlob);
  });
}
