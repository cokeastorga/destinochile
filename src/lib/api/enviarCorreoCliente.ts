import { functions } from '$lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface EnviarCorreoInput {
  para: string;
  asunto: string;
  mensaje: string;
  pdfBlob?: Blob;
  nombreArchivo?: string;
}

export async function enviarCotizacionPorCorreo({
  para,
  asunto,
  mensaje,
  pdfBlob,
  nombreArchivo = 'cotizacion.pdf'
}: EnviarCorreoInput): Promise<void> {
  const enviarCorreo = httpsCallable(functions, 'enviarCorreo');

  let pdfBase64: string | undefined;

  if (pdfBlob) {
    const base64 = await blobToBase64(pdfBlob);
    pdfBase64 = base64.split(',')[1]; // quitar "data:application/pdf;base64,"
  }

  await enviarCorreo({
    para,
    asunto,
    mensaje,
    pdfBase64,
    nombreArchivo
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject('Error al convertir el PDF a base64');
      }
    };
    reader.readAsDataURL(blob);
  });
}
