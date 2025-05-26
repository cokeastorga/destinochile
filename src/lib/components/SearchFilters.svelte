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

<div class="bg-white p-6 rounded-lg shadow-md">
  <h1 class="mb-6 text-xl font-semibold text-gray-800">Busqueda de Servicios</h1>

  <div class="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
    <div>
      <label for="destino" class="block text-gray-700 text-sm font-bold mb-2">Destino</label>
      <input type="text" id="destino" placeholder="Ej: Santiago, Valdivia" bind:value={destino} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    </div>
    <div>
      <label for="fechaInicio" class="block text-gray-700 text-sm font-bold mb-2">Fecha de Inicio</label>
      <input type="date" id="fechaInicio" bind:value={fechaInicio} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    </div>
    <div>
      <label for="fechaFin" class="block text-gray-700 text-sm font-bold mb-2">Fecha de Fin</label>
      <input type="date" id="fechaFin" bind:value={fechaFin} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    </div>
    <div>
      <label for="cantidadPasajeros" class="block text-gray-700 text-sm font-bold mb-2">Pasajeros</label>
      <input type="number" id="cantidadPasajeros" min="1" placeholder="Número de pasajeros" bind:value={cantidadPasajeros} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
    </div>
    <div>
      <label for="tipoServicio" class="block text-gray-700 text-sm font-bold mb-2">Tipo de Servicio</label>
      <select id="tipoServicio" bind:value={tipoServicio} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <option value="">Seleccionar servicio</option>
        {#each tiposDeServicio as tipo}
          <option value={tipo}>{tipo}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="servicio" class="block text-gray-700 text-sm font-bold mb-2">Servicio Específico</label>
      <select id="servicio" bind:value={servicio} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <option value="">Seleccionar servicio</option>
        {#if serviciosPorTipo[tipoServicio]}
          {#each serviciosPorTipo[tipoServicio] as s}
            <option value={s}>{s}</option>
          {/each}
        {/if}
      </select>
    </div>
    <!--
    <div>
      <label for="categoriaHotel" class="block text-gray-700 text-sm font-bold mb-2">Categoría Hotel</label>
      <select id="categoriaHotel" bind:value={categoriaHotel} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <option value="">Todas las categorías</option>
        <option value="1 ESTRELLA">1 Estrella</option>
        <option value="2 ESTRELLAS">2 Estrellas</option>
        <option value="3 ESTRELLAS">3 Estrellas</option>
        <option value="4 ESTRELLAS">4 Estrellas</option>
        <option value="5 ESTRELLAS">5 Estrellas</option>
      </select>
    </div>
    
    
    
    <div>
      <label for="tourPrivado" class="block text-gray-700 text-sm font-bold mb-2">Tipo de Tour</label>
      <select id="tourPrivado" bind:value={tourPrivado} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <option value="">Privado o Regular</option>
        <option value="PRIVADO">Privado</option>
        <option value="REGULAR">Regular</option>
      </select>
    </div>
     
    <div>
      <label for="duracionTour" class="block text-gray-700 text-sm font-bold mb-2">Duración del Tour</label>
      <select id="duracionTour" bind:value={duracionTour} class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
        <option value="">Duración (Half/Full)</option>
        <option value="HALF DAY">Medio día</option>
        <option value="FULL DAY">Día completo</option>
      </select>
    </div>
     
    
    <div class="sm:col-span-2 md:col-span-3 lg:col-span-4">
      <label class="block text-gray-700 text-sm font-bold mb-2">Rango de Precio</label>
      <div class="flex items-center gap-4">
        <input type="range" min="0" max="1000000" step="10000" bind:value={filtroPrecioMin} class="w-full" />
        <span class="text-gray-700">${filtroPrecioMin.toLocaleString()}</span>
        <span class="text-gray-700">–</span>
        <input type="range" min="0" max="1000000" step="10000" bind:value={filtroPrecioMax} class="w-full" />
        <span class="text-gray-700">${filtroPrecioMax.toLocaleString()}</span>
      </div>
    </div>
    -->
  </div>

  <div class="text-center">
    <button on:click={handleSearchClick} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded focus:outline-none focus:shadow-outline">
      Buscar
    </button>
  </div>
</div>