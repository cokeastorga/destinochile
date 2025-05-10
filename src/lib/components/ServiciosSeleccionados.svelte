<script lang="ts">
  import {  calcularTarifaFinal, calcularSubtotalServicio } from '$lib/stores/precios';


  export let fechaInicio = '';
  export let fechaFin = '';  
  export let serviciosSeleccionados;
  export let tipoCliente;
  export let cantidadPasajeros;
  export let tipoCambioReceptivo;
  export let tipoCambioContable;
  export let onActualizarMarkup;

  
  function validarFechas(servicio, index) {
	const inicioBusqueda = new Date(fechaInicio);
	const finBusqueda = new Date(fechaFin);

	const checkin = new Date(servicio.checkin);
	const checkout = new Date(servicio.checkout);

	// Validar Check-in
	if (isNaN(checkin.getTime()) || checkin < inicioBusqueda) {
		servicio.checkin = fechaInicio;
	}

	// Validar Check-out
	if (isNaN(checkout.getTime()) || checkout > finBusqueda) {
		servicio.checkout = fechaFin;
	}

	// Validación cruzada
	if (new Date(servicio.checkin) >= new Date(servicio.checkout)) {
		// Si son iguales o mal ordenados, ajustamos checkout +1 día
		const nuevaSalida = new Date(servicio.checkin);
		nuevaSalida.setDate(nuevaSalida.getDate() + 1);
		if (nuevaSalida <= finBusqueda) {
			servicio.checkout = nuevaSalida.toISOString().split('T')[0];
		} else {
			// Si ya no cabe, retrocedemos checkin
			const nuevoIngreso = new Date(servicio.checkout);
			nuevoIngreso.setDate(nuevoIngreso.getDate() - 1);
			servicio.checkin = nuevoIngreso >= inicioBusqueda
				? nuevoIngreso.toISOString().split('T')[0]
				: fechaInicio;
		}
	}

	// Calcular noches
	const diff = new Date(servicio.checkout).getTime() - new Date(servicio.checkin).getTime();
	const noches = Math.ceil(diff / (1000 * 60 * 60 * 24));
	servicio.noches = noches;

	onActualizarMarkup(index, servicio.markupManual);
}



</script>

<table class="table-auto w-full text-center border text-sm">
  <thead class="bg-gray-100">
    <tr>
     <th class="px-4 py-2">Ciudad</th>
     <th class="px-4 py-2">Proveedor</th>
     <th class="px-4 py-2">Servicio</th>
     <th class="px-4 py-2">Tipo de Habitación</th>   
     <th class="px-4 py-2">Capacidad</th>
     <th class="px-4 py-2">Descripción</th>
     <th class="px-4 py-2">Categoria</th>
     <th class="px-4 py-2">Segmento</th>
		 <th class="px-4 py-2">Tour Privado o Regular </th>
		 <th class="px-4 py-2">Half Day Full Day</th>
     <th class="px-4 py-2">Check-in</th>
     <th class="px-4 py-2">Check-out</th>        
     <th class="px-4 py-2">Markup</th>
     <th class="px-4 py-2">Noches</th>
     <th class="px-4 py-2">Habitaciones</th>
     <th class="px-4 py-2">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    {#each serviciosSeleccionados as servicio, index}
    <tr class="border-t">
      <td class="px-4 py-2">{servicio.ciudad}</td>
      <td class="px-4 py-2">{servicio.proveedor}</td>
      <td class="px-4 py-2">{servicio.nombreProducto}</td>
      <td class="px-4 py-2">{servicio.tipoHabitacion}</td>    
      <td class="px-4 py-2">{servicio.ocupacion}</td>
      <td class="px-4 py-2">{servicio.descripcion}</td>
      <td class="px-4 py-2">{servicio.categoria}</td>
      <td class="px-4 py-2">{servicio.segmento}</td>
			<td class="px-4 py-2">{servicio.tourPrivado}</td>
			<td class="px-4 py-2">{servicio.halfDay}</td>
      <td class="px-4 py-2">
        <input
          type="date"
          bind:value={servicio.checkin}
          min={fechaInicio}
          max={servicio.checkout || fechaFin}
          on:change={() => validarFechas(servicio, index)}
          class="rounded border px-2 py-1 text-sm"
        />
      </td>
      <td class="px-4 py-2">
        <input
          type="date"
          bind:value={servicio.checkout}
          min={servicio.checkin || fechaInicio}
          max={fechaFin}
          on:change={() => validarFechas(servicio, index)}
          class="rounded border px-2 py-1 text-sm"
        />
      </td>
      
      
      <td class="px-4 py-2">
        <input type="number" step="0.01" min="0.01" max="1" bind:value={servicio.markupManual} on:input={(e)=>
        onActualizarMarkup(index, parseFloat(e.target.value))}
        class="w-20 text-center border rounded"/></td>
      <td class="px-4 py-2">
        <input type="number" min="1" bind:value={servicio.noches} on:input={()=> onActualizarMarkup(index,
        servicio.markupManual)}
        class="w-16 text-center border rounded"
        />
      </td>
      <td class="px-4 py-2">
        <input type="number" min="1" bind:value={servicio.habitaciones} on:input={()=> onActualizarMarkup(index,
        servicio.markupManual)}
        class="w-16 text-center border rounded"
        />
      </td>
        <td class="px-4 py-2">
          {#key servicio.id}
            {(() => {
              const { tarifa, monedaFinal } = calcularTarifaFinal(
 servicio.tarifaNeta ?? servicio.tarifa_neta ?? 0,
  servicio.markupManual,
                tipoCliente,
                servicio.monedaOriginal,
                tipoCambioReceptivo,
                tipoCambioContable,
                servicio.tipoServicio,
                servicio.servicioProducto
              );
        
              const subtotal = tarifa * (servicio.noches || 1) * (servicio.habitaciones || 1);
              return `${monedaFinal === 'DÓLAR' ? 'U$' : '$'}${Math.round(subtotal).toLocaleString('es-CL')}`;
            })()}
          {/key}
        </td>
        
        
      
      
      
      
    </tr>
    {/each}
  </tbody>
</table>

{#if serviciosSeleccionados.length > 0}
	<div class="mt-4 text-right">
		<p class="text-lg font-bold">
			Total General: 
			{(() => {
				let total = 0;
				for (const s of serviciosSeleccionados) {
					const { tarifa } = calcularTarifaFinal(
						s.tarifaNeta ?? s.tarifa_neta ?? 0,
						s.markupManual,
						tipoCliente,
						s.monedaOriginal,
						tipoCambioReceptivo,
						tipoCambioContable,
						s.tipoServicio,
						s.servicioProducto
					);
					const subtotal = tarifa * (s.noches || 1) * (s.habitaciones || 1);
					total += subtotal;
				}
				return `$${Math.round(total).toLocaleString('es-CL')}`;
			})()}
		</p>
	</div>
{/if}
