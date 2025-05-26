<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
	import ServiciosSeleccionados from '$lib/components/ServiciosSeleccionados.svelte';
	import { calcularTarifaFinal } from '$lib/stores/precios';
	import SearchFilter from '$lib/components/SearchFilters.svelte';
	import ClientSelector from '$lib/components/ClientSelector.svelte';
	import { setDoc, serverTimestamp } from 'firebase/firestore';
	import ListaPasajeros from '$lib/components/ListaPasajeros.svelte';
	




	let clientes: any[] = [];
	let clienteSeleccionado = '';
	let ejecutivo = '';
	let email = '';
	let referenciaPasajero = '';
	let tipoCliente = 'Extranjero';
	let idReserva = '';


	let cantidadPasajeros = 1;
	let editando = false;

	let categoriaHotel = '';
	let tourPrivado = ''; // "PRIVADO" o "REGULAR"
	let duracionTour = ''; // "HALF DAY" o "FULL DAY"
	let pasajeros: any[] = []; // o estructura según tu componente


	let cargando = false;

	let filtroPrecioMin = 0;
	let filtroPrecioMax = 1000000;

	let destino = '';
	let fechaInicio = '';
	let fechaFin = '';
	let tipoServicio = '';
	let servicio = '';

	let markups: any[] = [];
	let tipoCambioReceptivo = 950; // Puedes ajustar el valor predeterminado
	let tipoCambioContable = 960; // Puedes ajustar el valor predeterminado

	let configuraciones: any[] = [];
	let tiposDeServicio: string[] = [];
	let serviciosPorTipo: { [tipo: string]: string[] } = {};

	let resultados: any[] = [];
	let serviciosSeleccionados: any[] = [];

	onMount(async () => {
	// Fetch clients
	const snapshotClientes = await getDocs(collection(db, 'clientes'));
	clientes = snapshotClientes.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

	// Obtener referencia al documento 'global' dentro de la colección 'configuracion'
	const docRef = doc(db, 'configuracion', 'global');
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		const data = docSnap.data();
		configuraciones = data?.tiposServicio || [];
		markups = data?.tiposServicio || [];
		tipoCambioReceptivo = data?.cambioReceptivo || 950;
		tipoCambioContable = data?.cambioContable || 960;

		tiposDeServicio = [...new Set(configuraciones.map((c) => c.categoria))].filter(Boolean);
		serviciosPorTipo = configuraciones.reduce((acc, c) => {
			if (!c.categoria || !c.servicio) return acc;
			if (!acc[c.categoria]) acc[c.categoria] = [];
			if (!acc[c.categoria].includes(c.servicio)) acc[c.categoria].push(c.servicio);
			return acc;
		}, {});
	} else {
		console.warn('No se encontró el documento "global" en la colección "configuracion".');
	}

	// 3. Si venimos desde ?edit=ID, precargar datos
	const params = new URLSearchParams(window.location.search);
	const editId = params.get('edit');

	if (editId) {
		editando = true;
		idReserva = editId;

		const ref = doc(db, 'reservas', editId);
		const snap = await getDoc(ref);

		if (snap.exists()) {
			const data = snap.data();

			clienteSeleccionado = data.clienteId || '';
			destino = data.destino || '';
			fechaInicio = data.fechaInicio || '';
			fechaFin = data.fechaFin || '';
			tipoCliente = data.tipoCliente || 'Extranjero';
			email = data.email || '';
			ejecutivo = data.ejecutivo || '';
			referenciaPasajero = data.referenciaPasajero || '';
			cantidadPasajeros = data.cantidadPasajeros || 1;

			if (Array.isArray(data.servicios)) {
				serviciosSeleccionados = data.servicios.map((s) => {
					const { tarifa } = calcularTarifaFinal(
						s.tarifaNeta ?? s.tarifa_neta ?? 0,
						s.markupManual ?? 0.8,
						tipoCliente,
						s.monedaOriginal ?? '',
						tipoCambioReceptivo,
						tipoCambioContable,
						s.tipoServicio ?? '',
						s.servicioProducto ?? ''
					);
					const noches = Number(s.noches ?? 1);
					const habitaciones = Number(s.habitaciones ?? 1);
					const subtotal = Math.round(tarifa * noches * habitaciones);

					return {
						...s,
						noches,
						habitaciones,
						subtotal
					};
				});
			}
		} else {
			console.warn(`No se encontró la reserva con ID ${editId}`);
		}
	}
});



	let proveedorAbierto: string | null = null;

	function generarIdReserva(): string {
	const numero = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios
	return `FF-DCH${numero}`;
}

function actualizarPasajeros(nuevosPasajeros: any[]) {
	pasajeros = [...nuevosPasajeros];
}


async function guardarReserva() {
	if (!clienteSeleccionado || !fechaInicio || !fechaFin) {
		alert('Por favor selecciona cliente y fechas válidas.');
		return;
	}
	console.log('serviciosSeleccionados:', serviciosSeleccionados)

	const serviciosConSubtotales = serviciosSeleccionados
	
	.filter((s) => s && (s.tarifaNeta !== undefined || s.tarifa_neta !== undefined))
	.map((s) => {
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

		const subtotal = Math.round(tarifa * (s.noches || 1) * (s.habitaciones || 1));

		return {
			id: s.id ?? '',
			proveedor: s.proveedor ?? '',
			tipoServicio: s.tipoServicio ?? '',
			servicioProducto: s.servicioProducto ?? '',
			nombreProducto: s.nombreProducto ?? '',
			tipoHabitacion: s.tipoHabitacion ?? '',
			ocupacion: s.ocupacion ?? '',
			categoria: s.categoria ?? '',
			segmento: s.segmento ?? '',
			tourPrivado: s.tourPrivado ?? '',
			halfDay: s.halfDay ?? '',
			temporada: s.temporada ?? '',
			descripcion: s.descripcion ?? '',
			tarifaNeta: s.tarifa_neta ?? 0,
			monedaOriginal: s.monedaOriginal ?? '',
			markupManual: s.markupManual ?? 0.8,
			noches: s.noches ?? 1,
			habitaciones: s.habitaciones ?? 1,
			checkin: s.checkin ?? null,
			checkout: s.checkout ?? null,
			subtotal
		};
	});
const totalGeneral = serviciosConSubtotales.reduce((acc, s) => acc + (s.subtotal || 0), 0);

	// ID final: nuevo o el existente si estamos editando
	const idFinal = editando && idReserva ? idReserva : generarIdReserva();

	const reserva = {
		id: idFinal,
		clienteId: clienteSeleccionado ?? '',
		email: email ?? '',
		ejecutivo: ejecutivo ?? '',
		destino: destino ?? '',
		referenciaPasajero: referenciaPasajero ?? '',
		tipoCliente: tipoCliente ?? 'Extranjero',
		fechaInicio: fechaInicio ?? '',
		fechaFin: fechaFin ?? '',
		cantidadPasajeros: cantidadPasajeros ?? 1,
		creadoEn: serverTimestamp(),
		creadoPor: email || 'usuario-desconocido',
		totalGeneral,
		estado: 'Pendiente',
		servicios: serviciosConSubtotales,
		pasajeros: pasajeros ?? []
	};

	try {
		const docRef = doc(db, 'reservas', idFinal);
		await setDoc(docRef, reserva);
		alert(editando ? 'Reserva actualizada correctamente.' : `Reserva guardada con éxito. ID: ${idFinal}`);
		serviciosSeleccionados = [];
	} catch (error) {
		console.error('Error al guardar la Reserva:', error);
		alert('Ocurrió un error al guardar la Reserva.');
	}
}


function toggleProveedor(nombre: string) {
	proveedorAbierto = proveedorAbierto === nombre ? null : nombre;
}

function groupByProveedor(servicios: any[]) {
	return servicios.reduce((acc, servicio) => {
		if (!acc[servicio.proveedor]) acc[servicio.proveedor] = [];
		acc[servicio.proveedor].push(servicio);
		return acc;
	}, {} as Record<string, any[]>);
}


	function seleccionarCliente(id: string) {
		const cliente = clientes.find((c) => c.id === id);
		if (cliente) {
			clienteSeleccionado = id;
			email = cliente.correo1 || '';
			ejecutivo = cliente.ejecutivo1 || '';
			referenciaPasajero = cliente.referencia || '';
		}
	}

	function obtenerMarkup(tipo: string, servicio: string): number {
		return (
			markups.find(
				(m) =>
					m.categoria.toUpperCase() === tipo.toUpperCase() &&
					m.servicio.toUpperCase() === servicio.toUpperCase()
			)?.markup ?? 0
		);
	}


	function actualizarMarkup(index: number, nuevoValor: number) {
		serviciosSeleccionados[index].markupManual = nuevoValor;
		serviciosSeleccionados = [...serviciosSeleccionados]; // fuerza reactividad
	}


	async function buscarServicios() {
		resultados = [];
		cargando = true;
		

	

		if (!destino || !tipoServicio || !servicio || !fechaInicio || !fechaFin) {
			cargando = false;
		
			return;
		}


		const snapshotProveedores = await getDocs(collection(db, 'proveedores'));
		const candidatosAjustados = [];

		// Normaliza fechas del viaje
		const inicioBusqueda = new Date(fechaInicio);
		const finBusqueda = new Date(fechaFin);

		for (const proveedorDoc of snapshotProveedores.docs) {
			const serviciosRef = collection(db, `proveedores/${proveedorDoc.id}/servicios`);
			const serviciosSnap = await getDocs(serviciosRef);

			for (const docu of serviciosSnap.docs) {
				const data = docu.data();

				const ciudadServicio = (data.CIUDAD || '').toUpperCase();
				const destinoNormalizado = destino.toUpperCase();
				const tipoServicioUpper = (data['TIPO DE SERVICIO'] || '').toUpperCase();
				const servicioUpper = (data['SERVICIO/PRODUCTO/ F.I.T'] || '').toUpperCase();
				const servicioBuscado = servicio.toUpperCase();

				const inicioServicio = data['FECHA_INICIO']
					? new Date(data['FECHA_INICIO'].split('T')[0])
					: null;
				const finServicio = data['FECHA_FIN']
					? new Date(data['FECHA_FIN'].split('T')[0])
					: null;

				const coincideUbicacion = ciudadServicio === destinoNormalizado;
				const coincideTipo = tipoServicioUpper === tipoServicio.toUpperCase();
				const coincideServicio = servicioUpper === servicioBuscado;

				const cubreFechas =
					inicioServicio &&
					finServicio &&
					inicioServicio <= inicioBusqueda &&
					finServicio >= finBusqueda;

				if (!(coincideUbicacion && coincideTipo && coincideServicio && cubreFechas)) continue;

				const sobraAntes =
					(inicioBusqueda.getTime() - inicioServicio.getTime()) / (1000 * 60 * 60 * 24);
				const sobraDespues =
					(finServicio.getTime() - finBusqueda.getTime()) / (1000 * 60 * 60 * 24);
				const ajusteTotal = sobraAntes + sobraDespues;

				const markup = obtenerMarkup(tipoServicio, servicio);
				const markupManual = 1 - (markup ?? 0) / 100;

				const capacidad = parseInt(data['OCUPACION DE HAB O PAX']) || 0;

				// Validación por tipo de servicio
				if (tipoServicio.toUpperCase() === 'ALOJAMIENTO') {
					if (capacidad < 1) continue;
				} else if (tipoServicio.toUpperCase() === 'TRANSPORTE') {
					const rangoValido =
						(cantidadPasajeros >= 1 && cantidadPasajeros <= 4 && capacidad >= 1 && capacidad <= 4) ||
						(cantidadPasajeros >= 5 && cantidadPasajeros <= 7 && capacidad >= 5 && capacidad <= 7) ||
						(cantidadPasajeros >= 8 && cantidadPasajeros <= 11 && capacidad >= 8 && capacidad <= 11) ||
						(cantidadPasajeros >= 12 && cantidadPasajeros <= 19 && capacidad >= 12 && capacidad <= 19) ||
						(cantidadPasajeros >= 20 && capacidad >= 20);

					if (!rangoValido) continue;
				} else {
					if (capacidad !== cantidadPasajeros) continue;
				}

				// Llamamos al store para calcular la tarifa final y moneda
				const { tarifa: tarifaCalculada, monedaFinal } = calcularTarifaFinal(
					data['TARIFA NETA'],
					markupManual,
					tipoCliente,
					data.MONEDA,
					tipoCambioReceptivo,
					tipoCambioContable,
					data['TIPO DE SERVICIO'],
					data['SERVICIO/PRODUCTO/ F.I.T']
				);

				// Filtros extra
				if (categoriaHotel && (data['CATEGORÍA HOTEL'] || '').toUpperCase() !== categoriaHotel.toUpperCase()) continue;
				if (tarifaCalculada < filtroPrecioMin || tarifaCalculada > filtroPrecioMax) continue;
				if (tourPrivado && (data['TOUR PRIVADO REGULAR'] || '').toUpperCase() !== tourPrivado.toUpperCase()) continue;
				if (duracionTour && (data['HALF DAY FULL DAY'] || '').toUpperCase() !== duracionTour.toUpperCase()) continue;

				candidatosAjustados.push({
					id: docu.id,
					proveedor: data.PROVEEDOR,
					descripcion: data.DESCRIPCIÓN,
					tarifa_neta: data['TARIFA NETA'],
					monedaOriginal: data.MONEDA,
					moneda: monedaFinal,
					ciudad: data['CIUDAD'],
					pais: data['PAIS'],
					tipoServicio: data['TIPO DE SERVICIO'],
					servicioProducto: data['SERVICIO/PRODUCTO/ F.I.T'],
					nombreProducto: data['NOMBRE PRODUCTO SERVICIO'],
					tipoHabitacion: data['TIPO DE HABITACIÓN'],
					ocupacion: data['OCUPACION DE HAB O PAX'],
					porPaxoCapac: data['POR PAX O POR CAPAC'],
					categoria: data['CATEGORÍA HOTEL'],
					segmento: data['SEGMENTO CATEGORÍA HOTEL'],
					tourPrivado: data['TOUR PRIVADO REGULAR'],
					halfDay: data['HALF DAY FULL DAY'],
					temporada: data['TEMPORADA'],
					fechaIni: data['FECHA_INICIO'],
					fechaF: data['FECHA_FIN'],
					ajusteTotal,
					markupManual
				});
			}
		}

		// Ordena y filtra
		if (candidatosAjustados.length > 0) {
			const minimoAjuste = Math.min(...candidatosAjustados.map((c) => c.ajusteTotal));
			resultados = candidatosAjustados.filter((c) => c.ajusteTotal === minimoAjuste);
		} else {
			resultados = [];
		}

		candidatosAjustados.sort((a, b) => {
			const capA = parseInt(a.ocupacion) || 0;
			const capB = parseInt(b.ocupacion) || 0;
			return capA - capB;
		});

		resultados = [...candidatosAjustados];
		cargando = false;
	}


	function toggleServicio(servicio: any) {
		const index = serviciosSeleccionados.findIndex((s) => s.id === servicio.id);
		if (servicio.tipoServicio.toUpperCase() === 'ALOJAMIENTO') {
			servicio.noches = 1;
		}
		if (index === -1) {
			serviciosSeleccionados = [
				...serviciosSeleccionados,
				{
					...servicio,
					noches: servicio.tipoServicio.toUpperCase() === 'ALOJAMIENTO' ? 1 : null,
					habitaciones: servicio.tipoServicio.toUpperCase() === 'ALOJAMIENTO' ? 1 : null,
					markupManual: 1 - (obtenerMarkup(servicio.tipoServicio, servicio.servicioProducto) / 100)
				}
			];
		} else {
			serviciosSeleccionados = serviciosSeleccionados.filter((_, i) => i !== index);
		}
	}



</script>
<hr class="my-1" />

<div class="mx-auto w-full p-3">
	{#if cargando}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 bg-white bg-opacity-60">
		<div class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
		<p class="font-semibold text-blue-700">Buscando servicios, por favor espera...</p>
	</div>
	{/if}


	<h4 class="mb-6 text-4xl font-bold">Reserva</h4>


	<ClientSelector {clientes} bind:clienteSeleccionado bind:ejecutivo bind:email bind:referenciaPasajero
		bind:tipoCliente onClientSelect={seleccionarCliente} />

	<hr class="my-4" />

	<SearchFilter bind:destino bind:fechaInicio bind:fechaFin bind:cantidadPasajeros {tiposDeServicio} bind:tipoServicio
		{serviciosPorTipo} bind:servicio bind:categoriaHotel bind:tourPrivado bind:duracionTour bind:filtroPrecioMin
		bind:filtroPrecioMax onSearch={buscarServicios} />
	<hr class="my-4" />


	<!-- Servicios Seleccionados -->
	<div class="mt-10">
		<h2 class="mb-4 text-xl font-semibold">Servicios Seleccionados</h2>

		

	<hr class="my-4" />

	{#if serviciosSeleccionados.length > 0}
  <ServiciosSeleccionados
    {serviciosSeleccionados}
    {tipoCliente}
    {cantidadPasajeros}
    {tipoCambioReceptivo}
    {tipoCambioContable}
    onActualizarMarkup={actualizarMarkup}
  />

  <div class="mt-6 text-right">
    <button
      on:click={guardarReserva}
      class="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
    >
      Guardar reserva
    </button>
  </div>
{/if}
</div>
<hr class="my-4" />

	{#if resultados.length > 0}
<h2 class="mb-4 mt-8 text-xl font-bold">Resultados de Servicios Disponibles</h2>

{#each Object.entries(groupByProveedor(resultados)) as [proveedor, servicios]}
	<div class="mb-4 rounded border border-gray-300 bg-white shadow">
		<button
			class="w-full px-4 py-3 text-left font-semibold text-blue-600 hover:bg-gray-100"
			on:click={() => toggleProveedor(proveedor)}
		>
			{proveedor}
		</button>

		{#if proveedorAbierto === proveedor}
		<table class="w-full border-t border-gray-300 text-left text-sm text-gray-700">
			<thead class="bg-gray-100 text-xs uppercase text-gray-700">
				<tr>
					<th class="px-2 py-1">Ciudad</th>
					<th class="px-2 py-1">Tipo de Servicio</th>
					<th class="px-2 py-1">Servicio / Producto</th>
					<th class="px-2 py-1">Nombre Producto</th>
					<th class="px-2 py-1">Tipo de Habitación</th>
					<th class="px-2 py-1">Capacidad</th>
					<th class="px-2 py-1">Categoría</th>
				<!--	<th class="px-2 py-1">Segmento</th>
					<th class="px-2 py-1">Privado/ Regular</th>
					<th class="px-2 py-1">Half/ Full Day</th> -->
					<th class="px-2 py-1">Descripción</th>
					<th class="px-2 py-1">Temporada</th>
			<!--		<th class="px-2 py-1">Moneda</th>
					<th class="px-2 py-1">Tarifa Neta</th> -->
					<th class="px-2 py-1">Tarifa Final</th>
					<th class="px-2 py-1">Seleccionar</th>
				</tr>
			</thead>
			<tbody>
				{#each servicios as servicio, index (servicio.id)}
				<tr class="border-t">
					<td class="px-2 py-1">{servicio.ciudad}</td>
					<td class="px-2 py-1">{servicio.tipoServicio}</td>
					<td class="px-2 py-1">{servicio.servicioProducto}</td>
					<td class="px-2 py-1">{servicio.nombreProducto}</td>
					<td class="px-2 py-1">{servicio.tipoHabitacion}</td>
					<td class="px-2 py-1">{servicio.ocupacion}</td>
					<td class="px-2 py-1">{servicio.categoria}</td>
				<!--	<td class="px-2 py-1">{servicio.segmento}</td> -->
				<!--	<td class="px-2 py-1">{servicio.tourPrivado}</td> 
					<td class="px-2 py-1">{servicio.halfDay}</td> -->
					<td class="px-2 py-1">{servicio.descripcion}</td>
					<td class="px-2 py-1">{servicio.temporada}</td>
				<!--	<td class="px-2 py-1">{servicio.monedaOriginal}</td>-->
			<!--		<td class="px-2 py-1">{servicio.tarifa_neta} {servicio.monedaOriginal}</td> -->
					<td class="px-2 py-1">
						{#key servicio.id}
						{(() => {
							const { tarifa, monedaFinal } = calcularTarifaFinal(
								servicio.tarifa_neta,
								servicio.markupManual,
								tipoCliente,
								servicio.monedaOriginal,
								tipoCambioReceptivo,
								tipoCambioContable,
								servicio.tipoServicio,
								servicio.servicioProducto
							);
							return `${monedaFinal === 'DÓLAR' ? 'U$' : '$'}${Math.round(tarifa).toLocaleString('es-CL')}`;
						})()}
						{/key}
					</td>
					<td class="px-4 py-2 text-center">
						<input
							type="checkbox"
							checked={serviciosSeleccionados.some((s) => s.id === servicio.id)}
							on:change={() => toggleServicio(servicio)}
							class="cursor-pointer"
						/>
					</td>
				</tr>
				{/each}
			</tbody>
		</table>
		{/if}
	</div>
{/each}
{:else}
<div class="mt-8 rounded border border-gray-300 bg-white p-6 text-center text-gray-600 shadow">
	<p class="mb-2 text-lg font-semibold">No se encontraron servicios que coincidan.</p>
	<p class="text-sm">
		Prueba ajustando los filtros como fechas, cantidad de pasajeros, categoría de hotel o rango de precio.
	</p>
</div>
{/if}
<hr class="my-6" />
<h2 class="mb-4 text-xl font-semibold">Información de Pasajeros</h2>
<ListaPasajeros {pasajeros} onChange={actualizarPasajeros} />


</div>

<hr class="my-4" />

<style>
	:global(body) {
		@apply bg-gray-100 text-gray-900;
	}

	table {
		width: 100%;
		background-color: white;
		color: black;
		border-collapse: collapse;
		margin-top: 1rem;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	thead {
		background-color: #f3f4f6;
		/* gris clarito */
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb;
		/* Tailwind gray-200 */
	}

	tr:hover {
		background-color: #f9fafb;
		/* efecto hover clarito */
	}

	input[type='checkbox'] {
		transform: scale(1.2);
		accent-color: #3b82f6;
		/* azul Tailwind */
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>