<script lang="ts">
  import { fade } from 'svelte/transition';
  import { Icon } from 'svelte-hero-icons'; // Optional: Add an icon library like Heroicons
  export let pasajeros: any[] = [];

  // Memoized age calculation to avoid redundant computations
  function calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return '—';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  }

  // State for collapsible sections
  let expanded: Record<number, boolean> = {};

  // Toggle collapse state for a passenger
  function toggleExpand(index: number) {
    expanded[index] = !expanded[index];
  }

  // Format date for display
  function formatDate(fecha: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
</script>

<div class="container mx-auto p-6">
  {#if pasajeros.length > 0}
    <div class="space-y-6" transition:fade={{ duration: 300 }}>

      {#each pasajeros as p, i}
        <div
          class="bg-white p-6 rounded-lg shadow-md border border-gray-200 transition-all"
          aria-labelledby={`pasajero-${i}-header`}
        >
          <!-- Header with collapsible toggle -->
          <button
            class="w-full flex justify-between items-center text-left"
            on:click={() => toggleExpand(i)}
            aria-expanded={expanded[i] || false}
            aria-controls={`pasajero-${i}-details`}
          >
            <h3 id={`pasajero-${i}-header`} class="text-lg font-semibold text-gray-800">
              Pasajero #{i + 1}: {p.nombre} {p.apellido}
            </h3>
            <Icon
              name={expanded[i] ? 'chevron-up' : 'chevron-down'}
              class="w-5 h-5 text-gray-500"
            />
          </button>

          <!-- Collapsible content -->
          {#if expanded[i] || !expanded[i]}
            <div
              id={`pasajero-${i}-details`}
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4"
              transition:fade={{ duration: 200 }}
            >
              <div>
                <span class="font-semibold text-gray-700">Nombre:</span>
                <span class="text-gray-600"> {p.nombre} {p.apellido}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Nacionalidad:</span>
                <span class="text-gray-600"> {p.nacionalidad || '—'}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Fecha de Nacimiento:</span>
                <span class="text-gray-600"> {formatDate(p.fechaNacimiento)}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Edad estimada:</span>
                <span class="text-gray-600"> {calcularEdad(p.fechaNacimiento)}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Correo:</span>
                <span class="text-gray-600"> {p.correo || '—'}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">RUT o Pasaporte:</span>
                <span class="text-gray-600"> {p.rut_pasaporte || '—'}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Teléfono:</span>
                <span class="text-gray-600"> {p.telefono || '—'}</span>
              </div>
              <div>
                <span class="font-semibold text-gray-700">Restricciones Alimenticias:</span>
                {#if p.restriccionesAlimenticias}
                  <span
                    class="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800"
                  >
                    {p.restriccionesAlimenticias}
                  </span>
                {:else}
                  <span class="text-gray-600">—</span>
                {/if}
              </div>
              <div>
                <span class="font-semibold text-gray-700">Preexistencias Médicas:</span>
                {#if p.preexistenciasMedicas}
                  <span
                    class="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-red-100 text-red-800"
                  >
                    {p.preexistenciasMedicas}
                  </span>
                {:else}
                  <span class="text-gray-600">—</span>
                {/if}
              </div>
              <div>
                <span class="font-semibold text-gray-700">Observaciones:</span>
                <span class="text-gray-600"> {p.observaciones || '—'}</span>
              </div>
            </div>

         
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div
      class="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200"
      transition:fade={{ duration: 300 }}
    >
      <Icon name="user-group" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-500 text-lg">No hay pasajeros registrados para esta reserva.</p>
   
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>