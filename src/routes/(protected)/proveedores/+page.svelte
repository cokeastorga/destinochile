<script lang="ts">
  import { onMount } from 'svelte';
  import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
  } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import { goto } from '$app/navigation';

  interface Proveedor {
    id: string;
    nombre: string;
    gerente: string;
    sucursal: string;
    direccion: string;
    pais: string;
    ciudad: string;
    razon: string;
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    rut: string;
    correoContable: string;
    correoReservas: string;
    correoGerencia: string;
    correoContacto: string;
  }

  let proveedores: Proveedor[] = [];
  let error: string | null = null;
  let nuevoProveedor: Omit<Proveedor, 'id'> = {
    nombre: '', gerente: '', sucursal: '', direccion: '', pais: '', ciudad: '', razon: '',
    banco: '', tipoCuenta: '', numeroCuenta: '', rut: '', correoContable: '',
    correoReservas: '', correoGerencia: '', correoContacto: ''
  };
  let editando: Proveedor | null = null;

  onMount(async () => {
    await cargarProveedores();
  });

  async function cargarProveedores() {
    try {
      const querySnapshot = await getDocs(collection(db, 'proveedores'));
      proveedores = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Proveedor, 'id'>)
      }));
    } catch (err) {
      error = 'Error al cargar los proveedores';
      console.error(err);
    }
  }

  async function guardarProveedor() {
    if (editando) {
      const ref = doc(db, 'proveedores', editando.id);
      await updateDoc(ref, nuevoProveedor);
      editando = null;
    } else {
      await addDoc(collection(db, 'proveedores'), nuevoProveedor);
    }
    nuevoProveedor = {
      nombre: '', gerente: '', sucursal: '', direccion: '', pais: '', ciudad: '', razon: '',
      banco: '', tipoCuenta: '', numeroCuenta: '', rut: '', correoContable: '',
      correoReservas: '', correoGerencia: '', correoContacto: ''
    };
    await cargarProveedores();
  }

  function seleccionarParaEditar(proveedor: Proveedor) {
    editando = proveedor;
    nuevoProveedor = { ...proveedor };
    delete (nuevoProveedor as any).id;
  }

  async function eliminarProveedor(id: string) {
    await deleteDoc(doc(db, 'proveedores', id));
    await cargarProveedores();
  }
</script>

<svelte:head>
  <title>Gestión de Proveedores</title>
</svelte:head>



<div class="min-h-screen bg-gray-100 p-6">
  <div class="max-w-6xl mx-auto bg-white p-6 rounded shadow">
    <h1 class="text-2xl font-bold mb-4">Proveedores</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
    {/if}

    <form on:submit|preventDefault={guardarProveedor} class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <input type="text" placeholder="Nombre proveedor" bind:value={nuevoProveedor.nombre} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="Nombre gerente o responsable" bind:value={nuevoProveedor.gerente} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Sucursal" bind:value={nuevoProveedor.sucursal} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="Dirección" bind:value={nuevoProveedor.direccion} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="País" bind:value={nuevoProveedor.pais} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Ciudad" bind:value={nuevoProveedor.ciudad} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="Razón social" bind:value={nuevoProveedor.razon} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Banco" bind:value={nuevoProveedor.banco} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Tipo de cuenta / Dólar y Peso" bind:value={nuevoProveedor.tipoCuenta} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Nro de cuenta" bind:value={nuevoProveedor.numeroCuenta} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="RUT" bind:value={nuevoProveedor.rut} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo contable" bind:value={nuevoProveedor.correoContable} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo de reservas" bind:value={nuevoProveedor.correoReservas} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo de gerencia" bind:value={nuevoProveedor.correoGerencia} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo de contacto" bind:value={nuevoProveedor.correoContacto} class="border px-3 py-2 rounded" />

      <button type="submit" class="col-span-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
        {editando ? 'Actualizar' : 'Agregar'} Proveedor
      </button>
    </form>
<hr class="my-4" />
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Sucursal</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Ciudad</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each proveedores as proveedor}
          <tr>
            <td class="px-4 py-2">{proveedor.nombre}</td>
            <td class="px-4 py-2">{proveedor.sucursal}</td>
            <td class="px-4 py-2">{proveedor.ciudad}</td>
            <td class="px-4 py-2 flex gap-2">
              <button on:click={() => seleccionarParaEditar(proveedor)} class="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
              <button on:click={() => eliminarProveedor(proveedor.id)} class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
              <button on:click={() => goto(`/proveedores/${proveedor.id}`)} class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Detalles</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  :global(body) {
    @apply bg-gray-100;
  }
</style>
