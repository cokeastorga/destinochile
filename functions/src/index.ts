import * as functions from 'firebase-functions';
import { enviarCorreoCotizacion } from './lib/api/enviarCorreo';

export const enviarCorreo = functions.https.onCall(async (data, context) => {
  return await enviarCorreoCotizacion(data);
});
