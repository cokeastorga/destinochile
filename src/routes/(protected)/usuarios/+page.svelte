<script lang="ts">
  import { onMount } from 'svelte';
  import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
  import { db } from '$lib/firebase';
  import Sidebar from '$lib/components/Sidebar.svelte';


  interface Usuario {
    uid: string;
    email: string;
    rol: string;
    sucursal: string;
    nombre: string;
    apellido: string;
  }

  let usuarios: Usuario[] = [];
  let error: string | null = null;
  let roles = ['Ejecutivo', 'Administrador', 'SuperAdministrador'];

  onMount(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      usuarios = querySnapshot.docs.map((docSnapshot) => ({
        uid: docSnapshot.id,
        ...docSnapshot.data()
      })) as Usuario[];
    } catch (err) {
      error = 'Error al cargar los usuarios';
      console.error(err);
    }
  });

  async function cambiarRol(uid: string, nuevoRol: string) {
    try {
      const ref = doc(db, 'usuarios', uid);
      await updateDoc(ref, { rol: nuevoRol });
      usuarios = usuarios.map((u) => (u.uid === uid ? { ...u, rol: nuevoRol } : u));
    } catch (err) {
      console.error('Error al cambiar el rol:', err);
    }
  }
</script>

<svelte:head>
  <title>Gestión de Usuarios</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-6">
  <div class="max-w-4xl mx-auto bg-white p-6 rounded shadow">
    <h1 class="text-2xl font-bold mb-4">Gestión de Usuarios</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
    {/if}

    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Nombre</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Apellido</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Sucursal</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Correo</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Rol</th>
          <th class="px-4 py-2 text-left font-medium text-gray-700">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        {#each usuarios as usuario}
          <tr>
          <td class="px-4 py-2">{usuario.nombre}</td>
          <td class="px-4 py-2">{usuario.apellido}</td>
          <td class="px-4 py-2">{usuario.sucursal}</td>
            <td class="px-4 py-2">{usuario.email}</td>
            <td class="px-4 py-2">{usuario.rol}</td>
            <td class="px-4 py-2">
              <select
                class="border rounded px-2 py-1 text-sm"
                on:change={(e) => cambiarRol(usuario.uid, (e.target as HTMLSelectElement).value)}
                bind:value={usuario.rol}
              >
                {#each roles as rol}
                  <option value={rol}>{rol}</option>
                {/each}
              </select>
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
