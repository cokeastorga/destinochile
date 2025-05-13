<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
  import { goto } from '$app/navigation';
  import { Icon } from 'svelte-hero-icons'; // Optional: Add an icon library like Heroicons

  let reservasOriginal: any[] = [];
  let reservas: any[] = [];
  let cotizacionesOriginal: any[] = [];
  let cotizaciones: any[] = [];
  let cargando = true;
  let filtroEstado = '';
  let filtroCliente = '';
  let ordenDesc = true;

  onMount(async () => {
    const snapshot = await getDocs(collection(db, 'cotizaciones'));
    cotizacionesOriginal = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().creadoEn?.toDate?.() ?? new Date(0),
    }));

    const snapshotReservas = await getDocs(collection(db, 'reservas'));
    reservasOriginal = snapshotReservas.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      fecha: doc.data().creadoEn?.toDate?.() ?? new Date(0),
    }));

    reservas = reservasOriginal;
    aplicarFiltros();
    cargando = false;
  });

  async function actualizarEstado(id: string, nuevoEstado: string, type: 'cotizaciones' | 'reservas') {
    try {
      const ref = doc(db, type, id);
      await updateDoc(ref, { estado: nuevoEstado });
      console.log(`Estado actualizado a ${nuevoEstado} para ${id}`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('No se pudo actualizar el estado. Intenta nuevamente.');
    }
  }

  function aplicarFiltros() {
    cotizaciones = cotizacionesOriginal
      .filter((c) => {
        const coincideEstado = filtroEstado ? (c.estado ?? 'Pendiente') === filtroEstado : true;
        const coincideCliente = filtroCliente
          ? c.email?.toLowerCase().includes(filtroCliente.toLowerCase())
          : true;
        return coincideEstado && coincideCliente;
      })
      .sort((a, b) =>
        ordenDesc
          ? b.fecha.getTime() - a.fecha.getTime()
          : a.fecha.getTime() - b.fecha.getTime()
      );

    reservas = reservasOriginal
      .filter((r) => {
        const coincideEstado = filtroEstado ? (r.estado ?? 'Pendiente') === filtroEstado : true;
        const coincideCliente = filtroCliente
          ? r.email?.toLowerCase().includes(filtroCliente.toLowerCase())
          : true;
        return coincideEstado && coincideCliente;
      })
      .sort((a, b) =>
        ordenDesc
          ? b.fecha.getTime() - a.fecha.getTime()
          : a.fecha.getTime() - b.fecha.getTime()
      );
  }

  async function eliminarItem(id: string, type: 'cotizaciones' | 'reservas') {
    const confirmar = confirm(`¿Estás seguro que deseas eliminar la ${type.slice(0, -1)} ${id}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, type, id));
      alert(`${type.slice(0, -1)} ${id} eliminada correctamente.`);

      if (type === 'cotizaciones') {
        cotizacionesOriginal = cotizacionesOriginal.filter((c) => c.id !== id);
      } else {
        reservasOriginal = reservasOriginal.filter((r) => r.id !== id);
      }
      aplicarFiltros();
    } catch (error) {
      console.error(`Error al eliminar ${type.slice(0, -1)}:`, error);
      alert(`No se pudo eliminar la ${type.slice(0, -1)}. Intenta nuevamente.`);
    }
  }

  function resetFiltros() {
    filtroEstado = '';
    filtroCliente = '';
    ordenDesc = true;
    aplicarFiltros();
  }

  // Reusable component props
  interface TableItem {
    id: string;
    email: string;
    fecha: Date;
    estado: string;
    totalGeneral: number;
  }
</script>

<div class="container mx-auto p-6 space-y-12">
  <!-- Cotizaciones Dashboard -->
  <section>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard de Cotizaciones</h1>
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <div class="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar cliente por email..."
          bind:value={filtroCliente}
          on:input={aplicarFiltros}
          class="w-full sm:w-auto flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Buscar cliente por email"
        />
        <select
          bind:value={filtroEstado}
          on:change={aplicarFiltros}
          class="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Anulada">Anulada</option>
        </select>
        <button
          on:click={() => {
            ordenDesc = !ordenDesc;
            aplicarFiltros();
          }}
          class="w-full sm:w-auto flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
          aria-label="Cambiar orden de fecha"
        >
          <Icon name={ordenDesc ? 'arrow-down' : 'arrow-up'} class="w-5 h-5 mr-2" />
          {ordenDesc ? 'Recientes primero' : 'Antiguas primero'}
        </button>
       
      </div>
    </div>

    {#if cargando}
      <div class="space-y-4">
        {#each Array(5) as _}
          <div class="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
        {/each}
      </div>
    {:else if cotizaciones.length === 0}
      <div class="text-center py-12 bg-white rounded-lg shadow-md">
        <p class="text-gray-500 text-lg">No hay cotizaciones que coincidan con los filtros.</p>
        <button
          on:click={resetFiltros}
          class="mt-4 text-blue-600 hover:underline"
          aria-label="Restablecer filtros"
        >
          Restablecer filtros
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full table-auto border-collapse text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Total</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each cotizaciones as c}
              <tr class="hover:bg-gray-50 transition">
                <td class="border px-4 py-3 font-mono text-gray-600">{c.id}</td>
                <td class="border px-4 py-3 text-gray-600">{c.email}</td>
                <td class="border px-4 py-3 text-gray-600">{c.fecha.toLocaleDateString()}</td>
                <td class="border px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                      class:bg-yellow-100={c.estado === 'Pendiente'}
                      class:bg-green-100={c.estado === 'Confirmada'}
                      class:bg-red-100={c.estado === 'Anulada'}
                      class:text-yellow-800={c.estado === 'Pendiente'}
                      class:text-green-800={c.estado === 'Confirmada'}
                      class:text-red-800={c.estado === 'Anulada'}
                    >
                      {c.estado}
                    </span>
                    <select
                      bind:value={c.estado}
                      on:change={() => actualizarEstado(c.id, c.estado, 'cotizaciones')}
                      class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Cambiar estado de cotización ${c.id}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Anulada">Anulada</option>
                    </select>
                  </div>
                </td>
                <td class="border px-4 py-3 text-gray-600">${c.totalGeneral?.toLocaleString('es-CL')}</td>
                <td class="border px-4 py-3 space-x-2">
                  <button
                    on:click={() => goto(`/cotizaciones/${c.id}`)}
                    class="text-blue-600 hover:underline"
                    aria-label={`Ver detalles de cotización ${c.id}`}
                  >
                    Ver detalle
                  </button>
                  <button
                    on:click={() => eliminarItem(c.id, 'cotizaciones')}
                    class="text-red-600 hover:underline"
                    aria-label={`Eliminar cotización ${c.id}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Reservas Dashboard -->
  <section>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard de Reservas</h1>
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <div class="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Buscar cliente por email..."
          bind:value={filtroCliente}
          on:input={aplicarFiltros}
          class="w-full sm:w-auto flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Buscar cliente por email"
        />
        <select
          bind:value={filtroEstado}
          on:change={aplicarFiltros}
          class="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
          <option value="Anulada">Anulada</option>
        </select>
        <button
          on:click={() => {
            ordenDesc = !ordenDesc;
            aplicarFiltros();
          }}
          class="w-full sm:w-auto flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition"
          aria-label="Cambiar orden de fecha"
        >
          <Icon name={ordenDesc ? 'arrow-down' : 'arrow-up'} class=" w-5 h-5 mr-2" />
          {ordenDesc ? 'Recientes primero' : 'Antiguas primero'}
        </button>
       
      </div>
    </div>

    {#if cargando}
      <div class="space-y-4">
        {#each Array(5) as _}
          <div class="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
        {/each}
      </div>
    {:else if reservas.length === 0}
      <div class="text-center py-12 bg-white rounded-lg shadow-md">
        <p class="text-gray-500 text-lg">No hay reservas que coincidan con los filtros.</p>
        <button
          on:click={resetFiltros}
          class="mt-4 text-blue-600 hover:underline"
          aria-label="Restablecer filtros"
        >
          Restablecer filtros
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full table-auto border-collapse text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">ID</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Estado</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Total</th>
              <th class="border px-4 py-3 text-left font-semibold text-gray-700">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each reservas as c}
              <tr class="hover:bg-gray-50 transition">
                <td class="border px-4 py-3 font-mono text-gray-600">{c.id}</td>
                <td class="border px-4 py-3 text-gray-600">{c.email}</td>
                <td class="border px-4 py-3 text-gray-600">{c.fecha.toLocaleDateString()}</td>
                <td class="border px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-block rounded-full px-3 py-1 text-sm font-semibold"
                      class:bg-yellow-100={c.estado === 'Pendiente'}
                      class:bg-green-100={c.estado === 'Confirmada'}
                      class:bg-red-100={c.estado === 'Anulada'}
                      class:text-yellow-800={c.estado === 'Pendiente'}
                      class:text-green-800={c.estado === 'Confirmada'}
                      class:text-red-800={c.estado === 'Anulada'}
                    >
                      {c.estado}
                    </span>
                    <select
                      bind:value={c.estado}
                      on:change={() => actualizarEstado(c.id, c.estado, 'reservas')}
                      class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={`Cambiar estado de reserva ${c.id}`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmada">Confirmada</option>
                      <option value="Anulada">Anulada</option>
                    </select>
                  </div>
                </td>
                <td class="border px-4 py-3 text-gray-600">${c.totalGeneral?.toLocaleString('es-CL')}</td>
                <td class="border px-4 py-3 space-x-2">
                  <button
                    on:click={() => goto(`/reservas/${c.id}`)}
                    class="text-blue-600 hover:underline"
                    aria-label={`Ver detalles de reserva ${c.id}`}
                  >
                    Ver detalle
                  </button>
                  <button
                    on:click={() => eliminarItem(c.id, 'reservas')}
                    class="text-red-600 hover:underline"
                    aria-label={`Eliminar reserva ${c.id}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>

<style>
  /* Optional: Add custom styles if needed */
  .container {
    max-width: 1200px;
  }
</style>