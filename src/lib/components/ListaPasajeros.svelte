<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { Icon } from 'svelte-hero-icons'; // Optional: Add svelte-hero-icons
  import { debounce } from 'lodash'; // Optional: For debouncing input updates

  export let pasajeros: any[] = [];
  export let onChange: (pasajeros: any[]) => void;

  // State for collapsible sections and validation errors
  let expanded: Record<number, boolean> = {};
  let errors: Record<number, Record<string, string>> = {};

  // Toggle collapse state for a passenger
  function toggleExpand(index: number) {
    expanded[index] = !expanded[index];
  }

  // Validate required fields
  function validateField(index: number, campo: string, valor: string) {
    if (['nombre', 'apellido', 'nacionalidad'].includes(campo) && !valor.trim()) {
      errors[index] = { ...errors[index], [campo]: 'Este campo es obligatorio' };
    } else {
      errors[index] = { ...errors[index], [campo]: '' };
    }
  }

  // Debounced field update to optimize performance
  const debouncedActualizarCampo = debounce((index: number, campo: string, valor: string) => {
    pasajeros[index][campo] = valor;
    validateField(index, campo, valor);
    pasajeros = [...pasajeros];
    onChange(pasajeros);
  }, 300);

  function agregarPasajero() {
    pasajeros = [
      ...pasajeros,
      {
        nombre: '',
        apellido: '',
        nacionalidad: '',
        fechaNacimiento: '',
        correo: '',
        rut_pasaporte: '',
        telefono: '',
        restriccionesAlimenticias: '',
        preexistenciasMedicas: '',
        observaciones: '',
      },
    ];
    expanded[pasajeros.length - 1] = true; // Expand new passenger
    onChange(pasajeros);
  }

  function eliminarPasajero(index: number) {
    if (!confirm(`¿Estás seguro de eliminar a ${pasajeros[index].nombre || 'este pasajero'}?`)) return;
    pasajeros.splice(index, 1);
    pasajeros = [...pasajeros];
    delete errors[index];
    errors = { ...errors };
    onChange(pasajeros);
  }

  function calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return '';
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento.getTime())) return 'Fecha inválida';
    const hoy = new Date();
    if (nacimiento > hoy) return 'Fecha futura';
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  }

  // Type definition for better type safety
  interface Pasajero {
    nombre: string;
    apellido: string;
    nacionalidad: string;
    fechaNacimiento: string;
    correo: string;
    rut_pasaporte: string;
    telefono: string;
    restriccionesAlimenticias: string;
    preexistenciasMedicas: string;
    observaciones: string;
  }
</script>

<div class="container mx-auto p-6 space-y-6">
  {#each pasajeros as p, i}
    <div
      class="bg-white p-6 rounded-lg shadow-md border border-gray-200 transition-all"
      aria-labelledby={`pasajero-${i}-header`}
      transition:fade={{ duration: 200 }}
    >
      <!-- Collapsible header -->
      <button
        class="w-full flex justify-between items-center text-left"
        on:click={() => toggleExpand(i)}
        aria-expanded={expanded[i] || false}
        aria-controls={`pasajero-${i}-form`}
      >
        <h3 id={`pasajero-${i}-header`} class="text-lg font-semibold text-gray-800">
          Pasajero #{i + 1}: {p.nombre || 'Sin nombre'} {p.apellido}
        </h3>
        <Icon
          name={expanded[i] ? 'chevron-up' : 'chevron-down'}
          class="w-5 h-5 text-gray-500"
        />
      </button>

      <!-- Form fields -->
      {#if expanded[i] || !expanded[i]}
        <div id={`pasajero-${i}-form`} class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" transition:fade={{ duration: 200 }}>
          <div>
            <label for={`nombre-${i}`} class="block text-sm font-medium text-gray-700">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              id={`nombre-${i}`}
              type="text"
              placeholder="Nombre"
              bind:value={p.nombre}
              on:input={(e) => debouncedActualizarCampo(i, 'nombre', e.target.value)}
              required
              class="w-full px-3 py-2 border {errors[i]?.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={errors[i]?.nombre ? 'true' : 'false'}
              aria-describedby={errors[i]?.nombre ? `nombre-error-${i}` : undefined}
            />
            {#if errors[i]?.nombre}
              <p id={`nombre-error-${i}`} class="text-red-500 text-xs mt-1">{errors[i].nombre}</p>
            {/if}
          </div>

          <div>
            <label for={`apellido-${i}`} class="block text-sm font-medium text-gray-700">
              Apellido <span class="text-red-500">*</span>
            </label>
            <input
              id={`apellido-${i}`}
              type="text"
              placeholder="Apellido"
              bind:value={p.apellido}
              on:input={(e) => debouncedActualizarCampo(i, 'apellido', e.target.value)}
              required
              class="w-full px-3 py-2 border {errors[i]?.apellido ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={errors[i]?.apellido ? 'true' : 'false'}
              aria-describedby={errors[i]?.apellido ? `apellido-error-${i}` : undefined}
            />
            {#if errors[i]?.apellido}
              <p id={`apellido-error-${i}`} class="text-red-500 text-xs mt-1">{errors[i].apellido}</p>
            {/if}
          </div>

          <div>
            <label for={`nacionalidad-${i}`} class="block text-sm font-medium text-gray-700">
              Nacionalidad <span class="text-red-500">*</span>
            </label>
            <input
              id={`nacionalidad-${i}`}
              type="text"
              placeholder="Nacionalidad"
              bind:value={p.nacionalidad}
              on:input={(e) => debouncedActualizarCampo(i, 'nacionalidad', e.target.value)}
              required
              class="w-full px-3 py-2 border {errors[i]?.nacionalidad ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-invalid={errors[i]?.nacionalidad ? 'true' : 'false'}
              aria-describedby={errors[i]?.nacionalidad ? `nacionalidad-error-${i}` : undefined}
            />
            {#if errors[i]?.nacionalidad}
              <p id={`nacionalidad-error-${i}`} class="text-red-500 text-xs mt-1">{errors[i].nacionalidad}</p>
            {/if}
          </div>

          <div>
            <label for={`fechaNacimiento-${i}`} class="block text-sm font-medium text-gray-700">
              Fecha de Nacimiento
            </label>
            <input
              id={`fechaNacimiento-${i}`}
              type="date"
              bind:value={p.fechaNacimiento}
              on:input={(e) => debouncedActualizarCampo(i, 'fechaNacimiento', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for={`edad-${i}`} class="block text-sm font-medium text-gray-700">
              Edad
            </label>
            <input
              id={`edad-${i}`}
              type="text"
              value={calcularEdad(p.fechaNacimiento)}
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>

          <div>
            <label for={`correo-${i}`} class="block text-sm font-medium text-gray-700">
              Correo
            </label>
            <input
              id={`correo-${i}`}
              type="email"
              placeholder="Correo"
              bind:value={p.correo}
              on:input={(e) => debouncedActualizarCampo(i, 'correo', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for={`rut_pasaporte-${i}`} class="block text-sm font-medium text-gray-700">
              RUT o Pasaporte
            </label>
            <input
              id={`rut_pasaporte-${i}`}
              type="text"
              placeholder="RUT o Pasaporte"
              bind:value={p.rut_pasaporte}
              on:input={(e) => debouncedActualizarCampo(i, 'rut_pasaporte', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for={`telefono-${i}`} class="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              id={`telefono-${i}`}
              type="tel"
              placeholder="Teléfono"
              bind:value={p.telefono}
              on:input={(e) => debouncedActualizarCampo(i, 'telefono', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for={`restriccionesAlimenticias-${i}`} class="block text-sm font-medium text-gray-700">
              Restricciones Alimenticias
            </label>
            <input
              id={`restriccionesAlimenticias-${i}`}
              type="text"
              placeholder="Restricciones Alimenticias"
              bind:value={p.restriccionesAlimenticias}
              on:input={(e) => debouncedActualizarCampo(i, 'restriccionesAlimenticias', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label for={`preexistenciasMedicas-${i}`} class="block text-sm font-medium text-gray-700">
              Preexistencias Médicas
            </label>
            <input
              id={`preexistenciasMedicas-${i}`}
              type="text"
              placeholder="Preexistencias Médicas"
              bind:value={p.preexistenciasMedicas}
              on:input={(e) => debouncedActualizarCampo(i, 'preexistenciasMedicas', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="sm:col-span-2 lg:col-span-3">
            <label for={`observaciones-${i}`} class="block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              id={`observaciones-${i}`}
              placeholder="Observaciones"
              bind:value={p.observaciones}
              on:input={(e) => debouncedActualizarCampo(i, 'observaciones', e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex justify-end">
          <button
            on:click={() => eliminarPasajero(i)}
            class="flex items-center text-red-600 hover:text-red-700 text-sm transition"
            aria-label={`Eliminar pasajero ${p.nombre || 'sin nombre'} ${p.apellido}`}
          >
            <Icon name="trash" class="w-4 h-4 mr-1" />
            Eliminar pasajero
          </button>
        </div>
      {/if}
    </div>
  {/each}

  <!-- Add passenger button -->
  <button
    on:click={agregarPasajero}
    class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    aria-label="Agregar nuevo pasajero"
  >
    <Icon name="plus" class="w-5 h-5 mr-2" />
    Agregar pasajero
  </button>
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>