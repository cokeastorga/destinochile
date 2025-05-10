import { writable, derived } from 'svelte/store';

export const serviciosSeleccionados = writable([]);

export const totalCotizacion = derived(serviciosSeleccionados, ($servicios) =>
  $servicios.reduce((acc, s) => acc + s.subtotal, 0)
);
export const clienteSeleccionado = writable('');
export const destino = writable('');
export const fechaInicio = writable('');
export const fechaFin = writable('');
export const tipoCliente = writable('Extranjero');
