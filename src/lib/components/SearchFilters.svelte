<script lang="ts">
	export let destino = '';
	export let fechaInicio = '';
	export let fechaFin = '';
	export let cantidadPasajeros = 1;
	export let tiposDeServicio: string[] = [];
	export let tipoServicio = '';
	export let serviciosPorTipo: { [tipo: string]: string[] } = {};
	export let servicio = '';
	export let categoriaHotel = '';
	export let tourPrivado = '';
	export let duracionTour = '';
	export let filtroPrecioMin = 0;
	export let filtroPrecioMax = 1000000;

	export let onSearch: (filters: {
		destino: string;
		fechaInicio: string;
		fechaFin: string;
		tipoServicio: string;
		servicio: string;
		categoriaHotel: string;
		tourPrivado: string;
		duracionTour: string;
		filtroPrecioMin: number;
		filtroPrecioMax: number;
		cantidadPasajeros: number;
	}) => void;

	function handleSearchClick() {
		onSearch({
			destino,
			fechaInicio,
			fechaFin,
			tipoServicio,
			servicio,
			categoriaHotel,
			tourPrivado,
			duracionTour,
			filtroPrecioMin,
			filtroPrecioMax,
			cantidadPasajeros
		});
	}
</script>


<h1 class="mb-6 text-2xl font-bold">Filtros de Búsqueda por Destino</h1>

<div class="mb-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-6">
	<input type="text" placeholder="Destino" bind:value={destino} class="w-full rounded border px-2 py-1" />
	<input type="date" bind:value={fechaInicio} class="w-full rounded border px-2 py-1" />
	<input type="date" bind:value={fechaFin} class="w-full rounded border px-2 py-1" />
	<input type="number" min="1" placeholder="Pasajeros" bind:value={cantidadPasajeros} class="w-full rounded border px-2 py-1" />

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
			<input type="range" min="0" max="1000000" step="10000" bind:value={filtroPrecioMin} class="w-full" />
			<span>${filtroPrecioMin.toLocaleString()}</span>
			<span>–</span>
			<input type="range" min="0" max="1000000" step="10000" bind:value={filtroPrecioMax} class="w-full" />
			<span>${filtroPrecioMax.toLocaleString()}</span>
		</div>
	</div>
</div>

<div class="mb-8 text-center">
	<button on:click={handleSearchClick} class="rounded bg-blue-500 px-8 py-2 text-lg text-white hover:bg-blue-600">
		Buscar
	</button>
</div>
