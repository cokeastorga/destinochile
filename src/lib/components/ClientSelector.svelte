<script lang="ts">
  export let clientes: any[] = [];
  export let clienteSeleccionado: string = '';
  export let ejecutivo: string = '';
  export let email: string = '';
  export let referenciaPasajero: string = '';
  export let tipoCliente: string = 'Extranjero';
  export let onClientSelect: (id: string) => void;

  function seleccionarCliente(id: string) {
    onClientSelect?.(id);
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  <h1 class="mb-6 text-xl font-semibold text-gray-800">Datos del Cliente</h1>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
    <div>
      <label for="clienteSeleccionado" class="block text-gray-700 text-sm font-bold mb-2">Cliente</label>
      <select
        id="clienteSeleccionado"
        bind:value={clienteSeleccionado}
        on:change={(e) => seleccionarCliente(e.target.value)}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      >
        <option value="">Seleccione un cliente</option>
        {#each clientes as c}
          <option value={c.id}>{c.nombre}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="ejecutivo" class="block text-gray-700 text-sm font-bold mb-2">Ejecutivo</label>
      <input
        type="text"
        id="ejecutivo"
        placeholder="No asignado"
        bind:value={ejecutivo}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
        disabled
      />
    </div>
    <div>
      <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
      <input
        type="email"
        id="email"
        placeholder="Sin correo"
        bind:value={email}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
        disabled
      />
    </div>
    <div>
      <label for="referenciaPasajero" class="block text-gray-700 text-sm font-bold mb-2">Referencia Pasajero</label>
      <input
        type="text"
        id="referenciaPasajero"
        placeholder="Ingrese referencia (opcional)"
        bind:value={referenciaPasajero}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
    </div>
    <div>
      <label for="tipoCliente" class="block text-gray-700 text-sm font-bold mb-2">Tipo de Cliente</label>
      <select
        id="tipoCliente"
        bind:value={tipoCliente}
        class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      >
        <option>Extranjero</option>
        <option>Nacional</option>
      </select>
    </div>
  </div>
</div>