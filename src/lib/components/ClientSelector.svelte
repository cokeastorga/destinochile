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

<h1 class="mb-6 text-2xl font-bold">Datos Cliente</h1>
<div class="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
  <select bind:value={clienteSeleccionado} on:change={(e) => seleccionarCliente(e.target.value)} class="w-full rounded border px-2 py-1">
    <option value="">Seleccione cliente</option>
    {#each clientes as c}
      <option value={c.id}>{c.nombre}</option>
    {/each}
  </select>
  <input type="text" placeholder="Ejecutivo" bind:value={ejecutivo} class="w-full rounded border px-2 py-1" disabled />
  <input type="email" placeholder="Correo electrónico" bind:value={email} class="w-full rounded border px-2 py-1" disabled />
  <input type="text" placeholder="Referencia pasajero" bind:value={referenciaPasajero} class="w-full rounded border px-2 py-1" />
  <select bind:value={tipoCliente} class="w-full rounded border px-2 py-1">
    <option>Extranjero</option>
    <option>Nacional</option>
  </select>
</div>
