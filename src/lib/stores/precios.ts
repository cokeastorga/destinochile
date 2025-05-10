// src/lib/stores/precios.ts

// Calcula la tarifa final considerando conversiones, markup e IVA
export function calcularTarifaFinal(
	tarifaNeta: number,
	markupManual: number,
	tipoCliente: string,
	monedaOriginal: string,
	tipoCambioReceptivo: number,
	tipoCambioContable: number,
	tipoServicio?: string,
	servicioProducto?: string
): { tarifa: number; monedaFinal: string } {
	let tarifaConvertida = tarifaNeta;
	let monedaFinal = monedaOriginal;

	// Conversión de moneda
	if (tipoCliente === 'Extranjero' && monedaOriginal === 'PESO') {
		tarifaConvertida = tarifaNeta / tipoCambioReceptivo;
		monedaFinal = 'DÓLAR';
	} else if (tipoCliente === 'Nacional' && monedaOriginal === 'DÓLAR') {
		tarifaConvertida = tarifaNeta * tipoCambioContable;
		monedaFinal = 'PESO';
	}

	// Aplica IVA solo a clientes nacionales en hoteles (alojamiento)
	if (
		tipoCliente === 'Nacional' &&
		monedaFinal === 'PESO' &&
		tipoServicio?.toUpperCase() === 'ALOJAMIENTO' &&
		servicioProducto?.toUpperCase() === 'HOTEL'
	) {
		tarifaConvertida *= 1.19;
	}

	// Aplicar markup
	const markup = markupManual > 0 && markupManual <= 1 ? markupManual : 1;
	const tarifa = tarifaConvertida / markup;

	return { tarifa, monedaFinal };
}

// Calcula la capacidad total de alojamiento seleccionada
export function totalCapacidadAlojamiento(servicios: any[]): number {
	return servicios.reduce((total, s) => {
		if (
			s.tipoServicio?.toUpperCase() === 'ALOJAMIENTO' &&
			s.habitaciones &&
			s.ocupacion
		) {
			return total + parseInt(s.habitaciones) * parseInt(s.ocupacion);
		}
		return total;
	}, 0);
}



export function calcularSubtotalServicio(
	servicio: any,
	tipoCliente: string,
	tipoCambioReceptivo: number,
	tipoCambioContable: number
  ): { subtotal: number; monedaFinal: string } {
	let tarifaConvertida = servicio.tarifa_neta;
	let monedaFinal = servicio.moneda;
  
	// Conversión de moneda
	if (tipoCliente === 'Extranjero' && servicio.moneda === 'PESO') {
	  tarifaConvertida = servicio.tarifa_neta / tipoCambioReceptivo;
	  monedaFinal = 'DÓLAR';
	} else if (tipoCliente === 'Nacional' && servicio.moneda === 'DÓLAR') {
	  tarifaConvertida = servicio.tarifa_neta * tipoCambioContable;
	  monedaFinal = 'PESO';
	}
  
	// Aplica IVA solo a clientes nacionales en hoteles (alojamiento)
	if (
	  tipoCliente === 'Nacional' &&
	  monedaFinal === 'PESO' &&
	  servicio.tipoServicio?.toUpperCase() === 'ALOJAMIENTO' &&
	  servicio.servicioProducto?.toUpperCase() === 'HOTEL'
	) {
	  tarifaConvertida *= 1.19;
	}
  
	// Aplicar markup
	const markup = servicio.markupManual > 0 && servicio.markupManual <= 1 ? servicio.markupManual : 1;
	const tarifaConMarkup = tarifaConvertida / markup;
  
	const noches = parseInt(servicio.noches) || 1;
	const habitaciones = parseInt(servicio.habitaciones) || 1;
	const subtotalSinRedondear = tarifaConMarkup * noches * habitaciones;
  
	// Redondear al entero más cercano
	const subtotal = Math.round(subtotalSinRedondear);
  
	return { subtotal, monedaFinal };
  }
  