import { functions } from '$lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface EnviarCorreoInput {
  para: string;
  asunto: string;
  mensaje: string;
  // pdfBlob?: Blob;  // Ignorado por ahora
  // nombreArchivo?: string;
}

export async function enviarCotizacionPorCorreo({
  para,
  asunto,
  mensaje
}: EnviarCorreoInput): Promise<void> {
  const enviarCorreo = httpsCallable(functions, 'enviarCorreo');

  await enviarCorreo({
    para,
    asunto,
    mensaje
  });
}
