<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

	let clientes: any[] = [];
	let clienteSeleccionado = '';
	let ejecutivo = '';
	let email = '';
	let referenciaPasajero = '';
	let cantidadPasajeros = 1;

	let categoriaHotel = '';
	let precioMin = 0;
	let precioMax = 1000000;

	let tourPrivado = ''; // "PRIVADO" o "REGULAR"
	let duracionTour = ''; // "HALF DAY" o "FULL DAY"

	let cargando = false;

	let filtroPrecioMin = 0;
	let filtroPrecioMax = 1000000;

	let destino = '';
	let fechaInicio = '';
	let fechaFin = '';
	let tipoCliente = 'Extranjero';
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

			// Extract tiposDeServicio and serviciosPorTipo
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
	});

	function seleccionarCliente(id: string) {
		const cliente = clientes.find((c) => c.id === id);
		if (cliente) {
			clienteSeleccionado = id;
			email = cliente.correo1 || '';
			ejecutivo = cliente.ejecutivo1 || '';
			referenciaPasajero = cliente.referencia || '';
		}
	}

	function totalCapacidadAlojamiento(servicios: any[]) {
		let total = 0;
		for (const s of servicios) {
			if (s.tipoServicio?.toUpperCase() === 'ALOJAMIENTO' && s.habitaciones && s.ocupacion) {
				total += parseInt(s.habitaciones) * parseInt(s.ocupacion);
			}
		}
		return total;
	}
	function calcularTarifaFinal(
		neta: number,
		markup: number,
		tipoCliente: string,
		moneda: string
	): number {
		let netaConvertida = neta;

		if (tipoCliente === 'Extranjero' && moneda === 'PESO') {
			netaConvertida = neta / tipoCambioReceptivo;
			moneda = 'DÓLAR';
		} else if (tipoCliente === 'Nacional' && moneda === 'DÓLAR') {
			netaConvertida = neta * tipoCambioContable;
			moneda = 'PESO';
		}

		let tarifaFinal = Math.round(netaConvertida / markup);

		if (tipoCliente === 'Nacional' && moneda === 'PESO') {
			tarifaFinal = Math.round(tarifaFinal * 1.19);
			moneda = 'CLP';
		}

		return tarifaFinal;
	}

	function obtenerMarkup(tipo: string, servicio: string): number {
		return markups.find((m) => m.categoria === tipo && m.servicio === servicio)?.markup ?? 0;
	}

	function actualizarMarkup(index: number, nuevoValor: number) {
		serviciosSeleccionados[index].markupManual = nuevoValor;
		serviciosSeleccionados = [...serviciosSeleccionados]; // fuerza reactividad
	}

	async function buscarServicios() {
		resultados = [];
		cargando = true;

		if (!destino || !tipoServicio || !servicio || !fechaInicio || !fechaFin) return;

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

				// Normaliza fechas del servicio
				const inicioServicio = data['FECHA_INICIO']
					? new Date(data['FECHA_INICIO'].split('T')[0] + 'T00:00:00')
					: null;
				const finServicio = data['FECHA_FIN']
					? new Date(data['FECHA_FIN'].split('T')[0] + 'T00:00:00')
					: null;

				const coincideUbicacion = ciudadServicio === destinoNormalizado;
				const coincideTipo = tipoServicioUpper === tipoServicio.toUpperCase();
				const coincideServicio = servicioUpper === servicioBuscado;

				const cubreFechas =
					inicioServicio &&
					finServicio &&
					inicioServicio <= inicioBusqueda &&
					finServicio >= finBusqueda;

				if (coincideUbicacion && coincideTipo && coincideServicio && cubreFechas) {
					const sobraAntes =
						(inicioBusqueda.getTime() - inicioServicio.getTime()) / (1000 * 60 * 60 * 24);
					const sobraDespues =
						(finServicio.getTime() - finBusqueda.getTime()) / (1000 * 60 * 60 * 24);
					const ajusteTotal = sobraAntes + sobraDespues;

					const markup = markups.find(
						(m) => m.categoria === tipoServicio && m.servicio === servicio
					)?.markup;
					const markupManual = markup ?? 0;

					const capacidad = parseInt(data['OCUPACION DE HAB O PAX']) || 0;

					if (tipoServicio.toUpperCase() === 'ALOJAMIENTO') {
						if (capacidad < 1) continue;
					} else if (tipoServicio.toUpperCase() === 'TRANSPORTE') {
						const rangoValido =
							(cantidadPasajeros >= 1 &&
								cantidadPasajeros <= 4 &&
								capacidad >= 1 &&
								capacidad <= 4) ||
							(cantidadPasajeros >= 5 &&
								cantidadPasajeros <= 7 &&
								capacidad >= 5 &&
								capacidad <= 7) ||
							(cantidadPasajeros >= 8 &&
								cantidadPasajeros <= 11 &&
								capacidad >= 8 &&
								capacidad <= 11) ||
							(cantidadPasajeros >= 12 &&
								cantidadPasajeros <= 19 &&
								capacidad >= 12 &&
								capacidad <= 19) ||
							(cantidadPasajeros >= 20 && capacidad >= 20);

						if (!rangoValido) continue;
					} else {
						if (capacidad !== cantidadPasajeros) continue;
					}

					let tarifaFinal = data['TARIFA NETA'];
					let moneda = data.MONEDA;

					if (markup) {
						let neta = data['TARIFA NETA'];
						let netaConvertida = neta;
						let porcentaje = markupManual;
						tarifaFinal = Math.round(netaConvertida / markup);

						if (tipoCliente === 'Extranjero' && moneda === 'PESO') {
							netaConvertida = neta / tipoCambioReceptivo;
							moneda = 'USD';
						} else if (tipoCliente === 'Nacional' && moneda === 'DÓLAR') {
							netaConvertida = neta * tipoCambioContable;
							moneda = 'CLP';
						}

						tarifaFinal = Math.round(netaConvertida / porcentaje);

						if (tipoCliente === 'Nacional' && moneda === 'PESO') {
							tarifaFinal = Math.round(tarifaFinal * 1.19);
						}
					}
					// Si se seleccionó una categoría, validar
					if (
						categoriaHotel &&
						(data['CATEGORÍA HOTEL'] || '').toUpperCase() !== categoriaHotel.toUpperCase()
					)
						continue;

					if (tarifaFinal < filtroPrecioMin || tarifaFinal > filtroPrecioMax) continue;

					if (
						tourPrivado &&
						(data['TOUR PRIVADO REGULAR'] || '').toUpperCase() !== tourPrivado.toUpperCase()
					)
						continue;

					if (
						duracionTour &&
						(data['HALF DAY FULL DAY'] || '').toUpperCase() !== duracionTour.toUpperCase()
					)
						continue;

					candidatosAjustados.push({
						id: docu.id,
						proveedor: data.PROVEEDOR,
						descripcion: data.DESCRIPCIÓN,
						moneda,
						tarifa_neta: data['TARIFA NETA'],
						tarifaFinal: tarifaFinal,
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
						ajusteTotal
					});
				}
			}
		}

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
					markupManual: 1 - obtenerMarkup(servicio.tipoServicio, servicio.servicioProducto) / 100
				}
			];
		} else {
			// Quitar servicio si ya estaba seleccionado
			serviciosSeleccionados = serviciosSeleccionados.filter((_, i) => i !== index);
		}
	}
</script>

<div class="mx-auto w-full p-6">
	{#if cargando}
		<div
			class="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 bg-white bg-opacity-60"
		>
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="font-semibold text-blue-700">Buscando servicios, por favor espera...</p>
		</div>
	{/if}

	<h4 class="mb-6 text-4xl font-bold">Cotización</h4>
	<h1 class="mb-6 text-2xl font-bold">Datos Cliente</h1>
	<div class="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
		
		<select
			bind:value={clienteSeleccionado}
			on:change={(e) => seleccionarCliente(e.target.value)}
			class="w-full rounded border px-2 py-1"
		>
			<option value="">Seleccione cliente</option>
			{#each clientes as c}
				<option value={c.id}>{c.nombre}</option>
			{/each}
		</select>
		<input
			type="text"
			placeholder="Ejecutivo"
			bind:value={ejecutivo}
			class="w-full rounded border px-2 py-1"
			disabled
		/>
		<input
			type="email"
			placeholder="Correo electrónico"
			bind:value={email}
			class="w-full rounded border px-2 py-1"
			disabled
		/>
		<input
			type="text"
			placeholder="Referencia pasajero"
			bind:value={referenciaPasajero}
			class="w-full rounded border px-2 py-1"
		/>
		<select bind:value={tipoCliente} class="w-full rounded border px-2 py-1">
			<option>Extranjero</option>
			<option>Nacional</option>
		</select>
	</div>

	<hr class="my-4" />
	<h1 class="mb-6 text-2xl font-bold">Filtros de Busqueda</h1>

	<div class="mb-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-6">
		<input
			type="text"
			placeholder="Destino"
			bind:value={destino}
			class="w-full rounded border px-2 py-1"
		/>
		<input type="date" bind:value={fechaInicio} class="w-full rounded border px-2 py-1" />
		<input type="date" bind:value={fechaFin} class="w-full rounded border px-2 py-1" />
		<input
			type="number"
			min="1"
			placeholder="Pasajeros"
			bind:value={cantidadPasajeros}
			class="w-full rounded border px-2 py-1"
		/>

		<select bind:value={tipoServicio} class="w-full rounded border px-2 py-1">
			<option value="">Tipo de Servicio</option>
			{#each tiposDeServicio as tipo}
				<option value={tipo}>{tipo}</option>
			{/each}
		</select>
		<select bind:value={servicio} class="w-full rounded border px-2 py-1">
			<option value="">Servicio</option>
			{#if serviciosPorTipo[tipoServicio]}
				{#each serviciosPorTipo[tipoServicio] as s}
					<option value={s}>{s}</option>
				{/each}
			{/if}
		</select>
		<select bind:value={categoriaHotel} class="w-full rounded border px-2 py-1">
			<option value="">Todas las categorías</option>
			<option value="1 ESTRELLA">1 ESTRELLA</option>
			<option value="2 ESTRELLAS">2 ESTRELLAS</option>
			<option value="3 ESTRELLAS">3 ESTRELLAS</option>
			<option value="4 ESTRELLAS">4 ESTRELLAS</option>
			<option value="5 ESTRELLAS">5 ESTRELLAS</option>
		</select>

		<select bind:value={tourPrivado} class="w-full rounded border px-2 py-1">
			<option value="">Privado o Regular</option>
			<option value="PRIVADO">PRIVADO</option>
			<option value="REGULAR">REGULAR</option>
		</select>

		<select bind:value={duracionTour} class="w-full rounded border px-2 py-1">
			<option value="">Duración (Half/Full)</option>
			<option value="HALF DAY">HALF DAY</option>
			<option value="FULL DAY">FULL DAY</option>
		</select>

		<div class="col-span-1 sm:col-span-2 lg:col-span-3">
			<label class="mb-1 block text-sm font-semibold">Rango de precio</label>
			<div class="flex items-center gap-4">
				<input
					type="range"
					min="0"
					max="1000000"
					step="10000"
					bind:value={filtroPrecioMin}
					class="w-full"
				/>
				<span>${filtroPrecioMin.toLocaleString()}</span>
				<span>–</span>
				<input
					type="range"
					min="0"
					max="1000000"
					step="10000"
					bind:value={filtroPrecioMax}
					class="w-full"
				/>
				<span>${filtroPrecioMax.toLocaleString()}</span>
			</div>
		</div>
	</div>

	<div class="mb-8 text-center">
		<button
			on:click={buscarServicios}
			class="rounded bg-blue-500 px-8 py-2 text-lg text-white hover:bg-blue-600">Buscar</button
		>
	</div>

	<!-- Servicios Seleccionados -->
	<div class="mt-10">
		<h2 class="mb-4 text-lg font-semibold">Servicios Seleccionados</h2>

		{#if serviciosSeleccionados.length > 0}
			<table class="w-full rounded border border-gray-300 bg-white text-sm text-gray-700 shadow">
				<thead class="bg-gray-100 text-xs uppercase">
					<tr>
						<th class="px-4 py-2">Tipo Servicio</th>
						<th class="px-4 py-2">Producto</th>
						<th class="px-4 py-2">Proveedor</th>
						<th class="px-4 py-2">Fecha Inicio</th>
						<th class="px-4 py-2">Fecha Fin</th>
						<th class="px-4 py-2">Noches</th>
						<th class="px-4 py-2">Habitaciones</th>
						<th class="px-4 py-2">Markup %</th>

						<th class="px-4 py-2">Subtotal</th>

						<th class="px-4 py-2">Acción</th>
					</tr>
				</thead>
				<tbody>
					{#each serviciosSeleccionados as s, index (s.nombreProducto + s.proveedor + index)}
						<tr class="border-t hover:bg-gray-50">
							<!-- Tipo, Producto y Proveedor -->
							<td class="px-4 py-2">{s.tipoServicio}</td>
							<td class="px-4 py-2">{s.nombreProducto}</td>
							<td class="px-4 py-2">{s.proveedor}</td>

							<!-- Inputs de fechas para el servicio -->
							<td class="px-4 py-2">
								<input type="date" bind:value={s.fechaIni} class="rounded border px-2 py-1" />
							</td>
							<td class="px-4 py-2">
								<input type="date" bind:value={s.fechaF} class="rounded border px-2 py-1" />
							</td>

							{#if s.tipoServicio.toUpperCase() === 'ALOJAMIENTO'}
								<!-- Input para número de noches -->
								<td class="px-4 py-2">
									<input
										type="number"
										min="1"
										bind:value={s.noches}
										class="w-16 rounded border px-2 py-1 text-center"
									/>
								</td>
								<!-- Selector para cantidad de habitaciones -->
								<td class="px-4 py-2">
									{#if s.ocupacion}
										<select bind:value={s.habitaciones} class="w-20 rounded border px-2 py-1">
											{#each Array.from({ length: Math.ceil(cantidadPasajeros / parseInt(s.ocupacion)) }, (_, i) => i + 1) as op}
												<option value={op}>{op}</option>
											{/each}
										</select>
									{:else}
										<span class="text-gray-400">No asignado</span>
									{/if}
								</td>
							{:else}
								<!-- Para otros servicios, se muestran dashes -->
								<td class="px-4 py-2">—</td>
								<td class="px-4 py-2">—</td>
							{/if}
							<td class="px-4 py-2">
								<input
									type="number"
									min="0"
									max="1"
									step="0.01"
									bind:value={s.markupManual}
									class="w-20 rounded border px-2 py-1 text-center"
								/>
							</td>

							<!-- Subtotal -->
							<td class="px-4 py-2 font-semibold">
								{#if s.tipoServicio.toUpperCase() === 'ALOJAMIENTO'}
									{#if s.noches && s.habitaciones}
										{(
											calcularTarifaFinal(s.tarifa_neta, s.markupManual, tipoCliente, s.moneda) *
											s.noches *
											s.habitaciones
										).toLocaleString()}
										{s.moneda}
									{:else}
										0 {s.moneda}
									{/if}
								{:else}
									{calcularTarifaFinal(
										s.tarifa_neta,
										s.markupManual,
										tipoCliente,
										s.moneda
									).toLocaleString()}
									{s.moneda}
								{/if}
							</td>

							<!-- Botón para quitar servicio -->
							<td class="px-4 py-2 text-center">
								<button
									on:click={() =>
										(serviciosSeleccionados = serviciosSeleccionados.filter((_, i) => i !== index))}
									class="font-bold text-red-600 hover:underline"
								>
									✕
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Mensaje de advertencia: calcular capacidad total cubierta por alojamientos -->
			{#if totalCapacidadAlojamiento(serviciosSeleccionados) < cantidadPasajeros}
				<div class="mt-4 text-sm font-medium text-red-600">
					⚠️ La capacidad total de los alojamientos seleccionados (<span
						>{totalCapacidadAlojamiento(serviciosSeleccionados)}</span
					>) no cubre a {cantidadPasajeros} pasajeros.
				</div>
			{/if}

			<!-- Total general (suma de subtotales de todos los servicios) -->
			<div class="mt-4 text-right font-semibold">
				Total Cotización:
				{serviciosSeleccionados
					.reduce((sum, s) => {
						let subtotal = 0;
						if (s.tipoServicio.toUpperCase() === 'ALOJAMIENTO') {
							const noches = s.noches ? parseInt(s.noches) : 1;
							const habs = s.habitaciones ? parseInt(s.habitaciones) : 1;
							subtotal =
								calcularTarifaFinal(s.tarifa_neta, s.markupManual, tipoCliente, s.moneda) *
								noches *
								habs;
						} else {
							subtotal = calcularTarifaFinal(s.tarifa_neta, s.markupManual, tipoCliente, s.moneda);
						}
						return sum + subtotal;
					}, 0)
					.toLocaleString()}
				{serviciosSeleccionados[0]?.moneda}
			</div>
		{:else}
			<p class="mt-4 text-sm text-gray-500">No hay servicios seleccionados.</p>
		{/if}
	</div>

	{#if resultados.length > 0}
		<h2 class="mb-4 mt-8 text-xl font-bold">Resultados de Servicios Disponibles</h2>

		<table class="w-full border border-gray-300 text-left text-sm text-gray-700">
			<thead class="bg-gray-100 text-xs uppercase text-gray-700">
				<tr>
					<th class="px-4 py-2">Ciudad</th>
					<th class="px-4 py-2">Proveedor</th>
					<th class="px-4 py-2">Tipo de Servicio</th>
					<th class="px-4 py-2">Nombre Producto</th>
					<th class="px-4 py-2">Tipo de Habitación</th>
					<th class="px-4 py-2">Capacidad</th>
					<th class="px-4 py-2">Categoria</th>
					<th class="px-4 py-2">Segmento</th>
					<th class="px-4 py-2">Tour Privado o Regular </th>
					<th class="px-4 py-2">Half Day Full Day</th>
					<th class="px-4 py-2">Descripción</th>
					<th class="px-4 py-2">Temporada</th>
					<th class="px-4 py-2">Moneda</th>
					<th class="px-4 py-2">Tarifa Neta</th>
					<th class="px-4 py-2">Tarifa Final</th>
					<th class="px-4 py-2">FECHA INICIO</th>
					<th class="px-4 py-2">FECHA FIN</th>
					<th class="px-4 py-2">Seleccionar</th>
				</tr>
			</thead>
			<tbody>
				{#each resultados as servicio, index (servicio.nombre + servicio.proveedor + index)}
					<tr class="border-t">
						<td class="px-4 py-2">{servicio.ciudad}</td>
						<td class="px-4 py-2">{servicio.proveedor}</td>
						<td class="px-4 py-2">{servicio.tipoServicio}</td>
						<td class="px-4 py-2">{servicio.nombreProducto}</td>
						<td class="px-4 py-2">{servicio.tipoHabitacion}</td>
						<td class="px-4 py-2">{servicio.ocupacion}</td>
						<td class="px-4 py-2">{servicio.categoria}</td>
						<td class="px-4 py-2">{servicio.segmento}</td>
						<td class="px-4 py-2">{servicio.tourPrivado}</td>
						<td class="px-4 py-2">{servicio.halfDay}</td>
						<td class="px-4 py-2">{servicio.descripcion}</td>
						<td class="px-4 py-2">{servicio.temporada}</td>
						<td class="px-4 py-2">{servicio.moneda}</td>
						<td class="px-4 py-2">{servicio.tarifa_neta}</td>
						<td class="px-4 py-2">{servicio.tarifaFinal}</td>
						<td class="px-4 py-2">{servicio.fechaIni}</td>
						<td class="px-4 py-2">{servicio.fechaF}</td>
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
	{:else}
		<div class="mt-8 rounded border border-gray-300 bg-white p-6 text-center text-gray-600 shadow">
			<p class="mb-2 text-lg font-semibold">No se encontraron servicios que coincidan.</p>
			<p class="text-sm">
				Prueba ajustando los filtros como fechas, cantidad de pasajeros, categoría de hotel o rango
				de precio.
			</p>
		</div>
	{/if}
</div>

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
		background-color: #f3f4f6; /* gris clarito */
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e5e7eb; /* Tailwind gray-200 */
	}

	tr:hover {
		background-color: #f9fafb; /* efecto hover clarito */
	}

	input[type='checkbox'] {
		transform: scale(1.2);
		accent-color: #3b82f6; /* azul Tailwind */
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
