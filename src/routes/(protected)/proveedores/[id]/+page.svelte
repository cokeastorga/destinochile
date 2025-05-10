<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase';
  import { doc, getDoc, collection, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
  import * as XLSX from 'xlsx';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';

  const columnasOrdenadas = [
    'PAIS','CIUDAD','PROVEEDOR','TIPO DE SERVICIO','SERVICIO/PRODUCTO/ F.I.T', 'NOMBRE PRODUCTO SERVICIO', 'TIPO DE HABITACIÓN', 'OCUPACION DE HAB O PAX',
    'POR PAX O POR CAPAC',  'CATEGORÍA HOTEL', 'SEGMENTO CATEGORÍA HOTEL', 'TOUR PRIVADO REGULAR',  'HALF DAY FULL DAY',
    'DESCRIPCIÓN', 'TEMPORADA', 'MONEDA', 'TARIFA NETA', 'FECHA_INICIO', 'FECHA_FIN','MARK UP GLOBAL', 'MARKUP', 'TARIFA VENTA'
  ];

  let proveedorId = '';
  let proveedorData: any = null;
  let error: string | null = null;
  let servicios: any[] = [];
  let excelError: string | null = null;
  let uploadSuccess = false;
  let cargando = false;
  let currentPage = 1;
  const itemsPerPage = 10;

  $: totalPages = Math.ceil(servicios.length / itemsPerPage);
  $: paginatedServicios = servicios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  onMount(async () => {
    if (!browser) return;
    proveedorId = $page.params.id;
    await cargarProveedor();
    await cargarServiciosExistentes();
  });

  async function cargarProveedor() {
    try {
      const ref = doc(db, 'proveedores', proveedorId);
      const snapshot = await getDoc(ref);
      proveedorData = snapshot.exists() ? snapshot.data() : null;
      if (!proveedorData) error = 'Proveedor no encontrado';
    } catch (err) {
      console.error(err);
      error = 'Error al cargar proveedor';
    }
  }

  async function cargarServiciosExistentes() {
    try {
      const serviciosRef = collection(db, `proveedores/${proveedorId}/servicios`);
      const snapshot = await getDocs(serviciosRef);
      servicios = snapshot.docs.map((doc) => doc.data());
    } catch (err) {
      console.error('Error al cargar servicios existentes:', err);
    }
  }

  function formatearFecha(fechaISO: string) {
    const fecha = new Date(fechaISO);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}-${mes}-${anio}`;
  }

  async function handleExcelUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    servicios = [];
    excelError = null;
    uploadSuccess = false;
    cargando = true;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!parsed.length) {
        excelError = 'El archivo no contiene datos.';
        return;
      }

      servicios = parsed.map((row: any) => {
        const normalizado: any = {};
        for (const key in row) {
          const upper = key.trim().toUpperCase();
          let value = row[key];

          if (typeof value === 'string') {
            value = value.trim().toUpperCase();
          }

          if (["FECHA_INICIO", "FECHA_FIN"].includes(upper)) {
            if (typeof value === 'number') {
              const dateParts = XLSX.SSF.parse_date_code(value);
              const fecha = new Date(Date.UTC(dateParts.y, dateParts.m - 1, dateParts.d));
              value = fecha.toISOString();
            } else if (!isNaN(Date.parse(value))) {
              const fecha = new Date(value);
              value = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())).toISOString();
            }
          }

          normalizado[upper] = value;
        }
        return normalizado;
      });

      uploadSuccess = true;
    } catch (err) {
      console.error(err);
      excelError = 'Error al procesar el archivo.';
    } finally {
      cargando = false;
    }
  }

  async function guardarServicios() {
    cargando = true;
    try {
      const serviciosRef = collection(db, `proveedores/${proveedorId}/servicios`);
      const snapshot = await getDocs(serviciosRef);
      for (const docu of snapshot.docs) {
        await deleteDoc(docu.ref);
      }
      for (const servicio of servicios) {
      const newDoc = doc(serviciosRef);
  await setDoc(newDoc, {
    id: newDoc.id, 
    ...servicio
  });
}
      alert('Servicios cargados correctamente.');
      goto('/proveedores');
    } catch (err) {
      console.error(err);
      excelError = 'Error al guardar los servicios.';
    } finally {
      cargando = false;
    }
  }

  function volverAProveedores() {
    goto('/proveedores');
  }
</script>


<svelte:head>
  <title>Detalles del Proveedor</title>
</svelte:head>

{#if cargando}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
    <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
{/if}


<div class="min-h-screen bg-gray-100 p-6">
  <div class="max-w-5xl mx-auto bg-white p-6 rounded shadow">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Detalles del Proveedor</h1>
      <button on:click={volverAProveedores} class="bg-gray-200 text-sm px-4 py-1 rounded hover:bg-gray-300">Volver</button>
    </div>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
    {:else if proveedorData}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
        <div><strong>Nombre:</strong> {proveedorData.nombre}</div>
        <div><strong>Gerente:</strong> {proveedorData.gerente}</div>
        <div><strong>Sucursal:</strong> {proveedorData.sucursal}</div>
        <div><strong>Ciudad:</strong> {proveedorData.ciudad}</div>
        <div><strong>País:</strong> {proveedorData.pais}</div>
        <div><strong>Dirección:</strong> {proveedorData.direccion}</div>
        <div><strong>Correo Reservas:</strong> {proveedorData.correoReservas}</div>
        <div><strong>Correo Contable:</strong> {proveedorData.correoContable}</div>
        <div><strong>Correo Gerencia:</strong> {proveedorData.correoGerencia}</div>
        <div><strong>Correo Contacto:</strong> {proveedorData.correoContacto}</div>
        <div><strong>Banco:</strong> {proveedorData.banco}</div>
        <div><strong>Tipo Cuenta:</strong> {proveedorData.tipoCuenta}</div>
        <div><strong>N° Cuenta:</strong> {proveedorData.numeroCuenta}</div>
        <div><strong>RUT:</strong> {proveedorData.rut}</div>
      </div>

      <hr class="my-4" />

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Cargar archivo Excel con servicios:</label>
        <input type="file" accept=".xlsx, .xls" on:change={handleExcelUpload} class="block" />
        {#if excelError}<div class="text-red-600 text-sm mt-2">{excelError}</div>{/if}
        {#if uploadSuccess}
          <div class="text-green-600 text-sm mt-2">Archivo procesado correctamente.</div>
          <button on:click={guardarServicios} class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Cargar Servicios
          </button>
        {/if}
      </div>

      {#if servicios.length}
        <div class="mt-6">
          <h2 class="text-lg font-semibold mb-2">Servicios cargados (mostrando {paginatedServicios.length} de {servicios.length})</h2>
          <div class="overflow-auto border rounded">
           <table class="min-w-full text-sm">
  <thead class="bg-gray-100">
    <tr>
      {#each columnasOrdenadas as key}
        <th class="px-4 py-2 text-left">{key}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each paginatedServicios as servicio}
      <tr class="border-t">
        {#each columnasOrdenadas as key}
          <td class="px-4 py-1">
            {#if typeof servicio[key] === 'string' && servicio[key].includes('T') && !isNaN(Date.parse(servicio[key]))}
              {formatearFecha(servicio[key])}
            {:else}
              {servicio[key]}
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

          </div>

          {#if totalPages > 1}
            <div class="mt-4 flex gap-2 justify-center">
              {#each Array(totalPages) as _, i}
                <button
                  class="px-3 py-1 border rounded text-sm hover:bg-blue-100 {currentPage === i + 1 ? 'bg-blue-500 text-white' : ''}"
                  on:click={() => currentPage = i + 1}
                >
                  {i + 1}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  :global(body) {
    @apply bg-gray-100;
  }
</style>