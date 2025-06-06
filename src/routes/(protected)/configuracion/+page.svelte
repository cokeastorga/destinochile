<script lang="ts">
  import { onMount } from 'svelte';
  import { auth, db } from '$lib/firebase';
  import { doc, getDoc, getDocs , setDoc, collection, addDoc, serverTimestamp  } from 'firebase/firestore';
  import { onAuthStateChanged } from 'firebase/auth';
  import { goto } from '$app/navigation';
  import { calcularTarifaFinal } from '$lib/stores/precios';


  type Configuracion = {
    tiposServicio: {
      categoria: string;
      servicio: string;
      markup: number;
    }[];
  };

  function agregarFilaVacia() {
 configuracion.tiposServicio = [
  { categoria: '', servicio: '', markup: 0 },
  ...configuracion.tiposServicio
];
  }


  let configuracion: Configuracion = {
    tiposServicio: [
      { categoria: 'Alojamiento', servicio: 'Hotel', markup: 15 },
      { categoria: 'Producto', servicio: 'Hotel', markup: 20 },
      { categoria: 'All Inclusive', servicio: 'Hotel', markup: 20 },
      { categoria: 'Termas', servicio: 'Hotel', markup: 20 },
      { categoria: 'Restaurante', servicio: 'Hotel', markup: 15 },
      { categoria: 'Restaurante', servicio: 'Restaurante', markup: 15 },
      { categoria: 'Entradas', servicio: 'Entradas Sitios Turisticos', markup: 5 },
      { categoria: 'Entradas', servicio: 'Museos', markup: 5 },
      { categoria: 'Entradas', servicio: 'Otros', markup: 5 },
      { categoria: 'Guía', servicio: 'Traslado', markup: 20 },
      { categoria: 'Guía', servicio: 'Tour', markup: 20 },
      { categoria: 'Transporte', servicio: 'Hotel', markup: 22 },
      { categoria: 'Transporte', servicio: 'Traslado', markup: 22 },
      { categoria: 'Transporte', servicio: 'Tour', markup: 22 },
      { categoria: 'Transporte', servicio: 'Aereo', markup: 15 },
      { categoria: 'Excursiones', servicio: 'Tour', markup: 22 },
      { categoria: 'Trekking', servicio: 'Tour', markup: 22 },
      { categoria: 'Navegación', servicio: 'Tour', markup: 22 },
      { categoria: 'Rafting', servicio: 'Tour', markup: 22 },
      { categoria: 'Panorámicos', servicio: 'Tour', markup: 22 },
      { categoria: 'Cabalgatas', servicio: 'Tour', markup: 22 },
      { categoria: 'Pesca', servicio: 'Tour', markup: 22 },
      { categoria: 'Box Lunch', servicio: 'Tour', markup: 10 },
      { categoria: 'Show', servicio: 'Tour', markup: 10 },
      { categoria: 'Cena Show', servicio: 'Tour', markup: 22 },
      { categoria: 'Viñedo', servicio: 'Tour', markup: 22 },
      { categoria: 'Intereses especiales', servicio: 'Tour', markup: 22 }
    ]
  };

  let nuevaCategoria = '';
  let nuevoServicio = '';
  let nuevoMarkup = '';
  let cargando = true;
  let error: string | null = null;
  let guardado = false;
  let esSuperAdmin = false;
  let cambioReceptivo: number = 950;
let cambioContable: number = 960;

  function obtenerMarkupDesdeConfiguracion(tipoServicio: string, servicioProducto: string): number {
    const configuracion = obtenerConfiguracionGlobal(); // tu store o fetch
    const clave = `${tipoServicio.toUpperCase()}|${servicioProducto.toUpperCase()}`;
    return configuracion.markups[clave] ?? 1;
  }



  onMount(async () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) return goto('/login');

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) return goto('/login');
  
      esSuperAdmin = userDoc.data().rol === 'SuperAdministrador';
  const historialRef = collection(db, 'configuracion', 'global', 'historial');
  const historialSnap = await getDocs(historialRef);
  historial = historialSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.fecha?.seconds - a.fecha?.seconds); // orden descendente por fecha
      const configDoc = await getDoc(doc(db, 'configuracion', 'global'));
    if (configDoc.exists()) {
  const data = configDoc.data() as Configuracion;
  configuracion = data;
  cambioReceptivo = data.cambioReceptivo ?? 950;
  cambioContable = data.cambioContable ?? 960;
}

      cargando = false;
    });
  });

  let historial = [];

 async function guardarConfiguracion() {
  try {
    const nuevaConfiguracion: Configuracion = {
      ...configuracion,
      cambioReceptivo,
      cambioContable
    };

    // Guardar configuración actual
    await setDoc(doc(db, 'configuracion', 'global'), nuevaConfiguracion);

    // Obtener usuario autenticado actual (ya está autenticado porque es SuperAdmin)
    const usuarioActual = auth.currentUser;
    const cambiadoPor = usuarioActual?.email ?? 'usuario-desconocido';

    // Guardar entrada en subcolección historial
    const historialRef = collection(db, 'configuracion', 'global', 'historial');
    await addDoc(historialRef, {
      fecha: serverTimestamp(),
      cambiadoPor,
      cambioReceptivo,
      cambioContable,
      tiposServicio: [...configuracion.tiposServicio]
    });

    guardado = true;
    setTimeout(() => (guardado = false), 2000);
  } catch (err) {
    error = 'Error al guardar la configuración.';
    console.error('Error en guardarConfiguracion:', err);
  }
}

  function eliminarTipo(index: number) {
    configuracion.tiposServicio.splice(index, 1);
    configuracion.tiposServicio = [...configuracion.tiposServicio];
  }

  function actualizarCampo(index: number, campo: keyof Configuracion['tiposServicio'][0], valor: string | number) {
    configuracion.tiposServicio[index][campo] = campo === 'markup' ? parseFloat(valor as string) : valor as string;
    configuracion.tiposServicio = [...configuracion.tiposServicio];
  }
</script>

<svelte:head>
  <title>Configuración Global</title>
</svelte:head>

{#if cargando}
<div class="text-center mt-10 text-gray-500">Cargando configuración...</div>
{:else}
<hr class="my-1" />
<div class="max-w-5xl mx-auto p-6">
  <h1 class="text-4xl font-bold mb-8">Configuración Global</h1>
<div class="mb-8">
  <h2 class="mb-4 font-semibold text-lg">Tipo de Cambio</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label class="block mb-1 font-medium text-sm">Cambio Receptivo (CLP → USD)</label>
      <input
        type="number"
        min="1"
        bind:value={cambioReceptivo}
        on:input={() => (guardado = false)}
        class="w-full border px-3 py-2 rounded shadow-sm"
      />
    </div>
    <div>
      <label class="block mb-1 font-medium text-sm">Cambio Contable (USD → CLP)</label>
      <input
        type="number"
        min="1"
        bind:value={cambioContable}
        on:input={() => (guardado = false)}
        class="w-full border px-3 py-2 rounded shadow-sm"
      />
    </div>
  </div>
</div>


  {#if error}
  <div class="text-red-600 bg-red-100 p-2 mb-4 rounded text-sm">{error}</div>
  {/if}

  {#if guardado}
  <div class="text-green-600 bg-green-100 p-2 mb-4 rounded text-sm">Configuración guardada correctamente.</div>
  {/if}

  <div class="mb-6">
    <h2 class="block mb-8 font-semibold">Tipos de Servicio y Markup Global</h2>
{#if esSuperAdmin}
<div class="flex  justify-between mb-4">
  <button on:click={agregarFilaVacia} class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
    + Agregar nuevo tipo de servicio
  </button>



    <button on:click={guardarConfiguracion} class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
      Guardar configuración
    </button>
    </div>
    {/if}

    <table class="w-full text-sm mb-4">
      <thead>
        <tr class="bg-gray-100">
          <th class="px-4 py-2 text-left">Categoría</th>
          <th class="px-4 py-2 text-left">Servicio</th>
          <th class="px-4 py-2 text-left">Markup (%)</th>
          {#if esSuperAdmin}<th class="px-4 py-2 text-left">Acciones</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each configuracion.tiposServicio as tipo, i}
        <tr class="border-t">
          <td class="px-4 py-2">
            {#if esSuperAdmin}
            <input type="text" class="w-full border rounded px-2 py-1" bind:value={tipo.categoria} on:change={(e)=>
            actualizarCampo(i, 'categoria', e.target.value)} />
            {:else}
            {tipo.categoria}
            {/if}
          </td>
          <td class="px-4 py-2">
            {#if esSuperAdmin}
            <input type="text" class="w-full border rounded px-2 py-1" bind:value={tipo.servicio} on:change={(e)=>
            actualizarCampo(i, 'servicio', e.target.value)} />
            {:else}
            {tipo.servicio}
            {/if}
          </td>
          <td class="px-4 py-2">
            {#if esSuperAdmin}
            <input type="number" class="w-24 border rounded px-2 py-1" bind:value={tipo.markup} on:change={(e)=>
            actualizarCampo(i, 'markup', e.target.value)} />
            {:else}
            {tipo.markup}
            {/if}
          </td>
          {#if esSuperAdmin}
          <td class="px-4 py-2">
            <button on:click={()=> eliminarTipo(i)} class="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1
              rounded">Eliminar</button>
          </td>
          {/if}
        </tr>
        {/each}
      </tbody>
    </table>

   
  </div>
</div>
{/if}
{#if historial.length > 0}
  <div class="mt-10">
    <h2 class="text-xl font-semibold mb-4">Historial de Configuraciones</h2>
    <ul class="text-sm space-y-2">
      {#each historial as h}
        <li class="border-b pb-2">
          <strong>{h.fecha?.toDate().toLocaleString()}</strong> — {h.cambiadoPor}
        </li>
      {/each}
    </ul>
  </div>
{/if}


<style>
  :global(body) {
    @apply bg-gray-100;
  }
</style>