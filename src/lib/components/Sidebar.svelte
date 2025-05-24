<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { signOut, onAuthStateChanged } from 'firebase/auth';
  import { auth, db } from '$lib/firebase';
  import { doc, getDoc } from 'firebase/firestore';
  import {
    LayoutDashboard,
    FileText,
    Users,
    Briefcase,
    CalendarCheck,
    LogOut,
    ShieldCheck,
    Settings
  } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let nombre = '';
  let rol = '';

  function logout() {
    signOut(auth).then(() => goto('/login'));
  }

  onMount(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          nombre = `${data.nombre} ${data.apellido}`;
          rol = data.rol;
        }
      }
    });
  });

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Cotización', href: '/cotizaciones', icon: FileText },
    { label: 'Reservas', href: '/reservas', icon: CalendarCheck },
    { label: 'Clientes', href: '/clientes', icon: Users },
    { label: 'Proveedores', href: '/proveedores', icon: Briefcase },
    //{ label: 'Ventas', href: '/ventas', icon: FileText },
    { label: 'Usuarios y Roles', href: '/usuarios', icon: ShieldCheck },
    { label: 'Configuración', href: '/configuracion', icon: Settings }
  ];
</script>

<div class="flex min-h-screen">
  <!-- Sidebar -->
  <aside class="w-64 bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col p-6 shadow-lg">
    <!-- Logo -->
     <div class="flex justify-center mb-4">
      <img src="/logo.jpg" alt="Logo Destino Chile" class="w-36 h-36 rounded-full shadow-md border-4 border-white" />
    </div>
    
    <!-- Título -->
    <div class="text-2xl font-extrabold tracking-wide mb-8 text-center border-b border-white/30 pb-4">
      Destino Chile
    </div>

    <!-- Navegación -->
 <nav class="flex flex-col space-y-2 text-sm font-medium">
      {#each menuItems as { label, href, icon }}
        {#if $page.url.pathname.startsWith(href)}
          <a href={href} class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/20 text-white font-semibold">
            <svelte:component this={icon} class="w-5 h-5" />
            <span>{label}</span>
          </a>
        {:else}
          <a href={href} class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition">
            <svelte:component this={icon} class="w-5 h-5 text-white/90" />
            <span>{label}</span>
          </a>
        {/if}
      {/each}
    </nav>


    <!-- Datos del usuario -->
    <div class="mt-6 text-sm text-white/80 border-t border-white/30 pt-4">
      <div class="font-semibold">{nombre}</div>
      <div class="text-xs capitalize">{rol}</div>
    </div>

    <!-- Botón Cerrar Sesión -->
    <button
      on:click={logout}
      class="mt-4 flex items-center gap-3 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition duration-200"
    >
      <LogOut class="w-5 h-5" />
      <span class="truncate">Cerrar sesión</span>
    </button>
  </aside>

  <!-- Contenido principal -->
  <main class="flex-1 p-6 bg-gray-50 overflow-y-auto">
    <slot />
  </main>
</div>
