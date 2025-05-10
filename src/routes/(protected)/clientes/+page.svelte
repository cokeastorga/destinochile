<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
  import { db } from '$lib/firebase';


  interface Cliente {
    id: string;
    nombre: string;
    referencia: string;
    tipo: string;
    pais: string;
    ciudad: string;
    direccion: string;
    correo1: string;
    correo2: string;
    telefono: string;
    gerente: string;
    ejecutivo1: string;
    ejecutivo2: string;
    otroCargo: string;
    condiciones: string;
  }

  let clientes: Cliente[] = [];
  let error: string | null = null;
  let nuevoCliente: Omit<Cliente, 'id'> = {
    nombre: '', tipo: '', referencia: '', pais: '', ciudad: '', direccion: '',
    correo1: '', correo2: '', telefono: '', gerente: '', ejecutivo1: '',
    ejecutivo2: '', otroCargo: '', condiciones: ''
  };
  let editando: Cliente | null = null;

  onMount(async () => {
    await cargarClientes();
  });

  async function cargarClientes() {
    try {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      clientes = querySnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...(docSnapshot.data() as Omit<Cliente, 'id'>)
      }));
    } catch (err) {
      error = 'Error al cargar los clientes';
      console.error(err);
    }
  }

  async function guardarCliente() {
    if (editando) {
      const ref = doc(db, 'clientes', editando.id);
      await updateDoc(ref, nuevoCliente);
      editando = null;
    } else {
      await addDoc(collection(db, 'clientes'), nuevoCliente);
    }
    nuevoCliente = {
      nombre: '', tipo: '',  referencia: '', pais: '', ciudad: '', direccion: '',
      correo1: '', correo2: '', telefono: '', gerente: '', ejecutivo1: '',
      ejecutivo2: '', otroCargo: '', condiciones: ''
    };
    await cargarClientes();
  }

  function seleccionarParaEditar(cliente: Cliente) {
    editando = cliente;
    nuevoCliente = { ...cliente };
    delete (nuevoCliente as any).id;
  }

  async function eliminarCliente(id: string) {
    await deleteDoc(doc(db, 'clientes', id));
    await cargarClientes();
  }
</script>

<svelte:head>
  <title>Gestión de Clientes</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-6">
  <div class="max-w-5xl mx-auto bg-white p-6 rounded shadow">
    <h1 class="text-2xl font-bold mb-4">Clientes</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
    {/if}

    <form on:submit|preventDefault={guardarCliente} class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <input type="text" placeholder="Nombre" bind:value={nuevoCliente.nombre} class="border px-3 py-2 rounded" required />
      <select bind:value={nuevoCliente.tipo} class="border px-3 py-2 rounded" required>
        <option value="">Tipo de cliente</option>
        <option>Agencia de viajes</option>
        <option>Tour operador</option>
        <option>Corporativo</option>
        <option>Productora</option>
        <option>Hotel</option>
        <option>Otro</option>
      </select>
      <input type="text" placeholder="Referencia Cliente" bind:value={nuevoCliente.referencia} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="País" bind:value={nuevoCliente.pais} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="Ciudad" bind:value={nuevoCliente.ciudad} class="border px-3 py-2 rounded" required />
      <input type="text" placeholder="Dirección" bind:value={nuevoCliente.direccion} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo 1" bind:value={nuevoCliente.correo1} class="border px-3 py-2 rounded" />
      <input type="email" placeholder="Correo 2" bind:value={nuevoCliente.correo2} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Teléfono de contacto" bind:value={nuevoCliente.telefono} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Gerente general" bind:value={nuevoCliente.gerente} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Ejecutivo" bind:value={nuevoCliente.ejecutivo1} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Ejecutivo 2" bind:value={nuevoCliente.ejecutivo2} class="border px-3 py-2 rounded" />
      <input type="text" placeholder="Otro cargo" bind:value={nuevoCliente.otroCargo} class="border px-3 py-2 rounded" />
      <textarea placeholder="Condiciones del acuerdo" bind:value={nuevoCliente.condiciones} class="col-span-full border px-3 py-2 rounded"></textarea>

      <button type="submit" class="col-span-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
        {editando ? 'Actualizar' : 'Agregar'} Cliente
      </button>
    </form>

    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Referencia</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Tipo</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Correo</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Teléfono</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each clientes as cliente}
          <tr>
            <td class="px-4 py-2">{cliente.nombre}</td>
            <td class="px-4 py-2">{cliente.referencia}</td>
            <td class="px-4 py-2">{cliente.tipo}</td>
            <td class="px-4 py-2">{cliente.correo1}</td>
            <td class="px-4 py-2">{cliente.telefono}</td>
            <td class="px-4 py-2 flex gap-2">
              <button on:click={() => seleccionarParaEditar(cliente)} class="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded">Editar</button>
              <button on:click={() => eliminarCliente(cliente.id)} class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Eliminar</button>
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