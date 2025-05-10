<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let redirigido = false;

    const frases = [
    'Donde comienza tu viaje.',
    'Explora. Descubre. Disfruta.',
    'Tu próxima aventura empieza aquí.',
    'Servicio turístico personalizado.',
    'Una empresa dedicada al servicio del turismo'

  ];
  let fraseActual = frases[0];

  let index = 0;
  setInterval(() => {
    index = (index + 1) % frases.length;
    fraseActual = frases[index];
  }, 1500);

  onMount(() => {
    const timer = setTimeout(() => {
      if (!redirigido) goto('/login');
    }, 7000); // redirige automáticamente en 5 segundos
    return () => clearTimeout(timer);
  });

  function ingresarAhora() {
    redirigido = true;
    goto('/login');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-sky-600 to-indigo-800 flex flex-col items-center justify-center text-white px-6 text-center">
  <!-- LOGO -->
  <img src="/logo.jpg" alt="Logo Destino Chile" class="w-36 h-36 mb-6 rounded-full drop-shadow-xl animate-fade-in-slow" />

  <!-- TÍTULO -->
  <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 animate-slide-up">¡Bienvenido a Destino Chile!</h1>

  <p class="text-lg sm:text-xl mb-4 font-light italic opacity-90 animate-fade-in-slow delay-200 transition-opacity duration-500">
    {fraseActual}
  </p>
  <!-- MENSAJE DE CARGA -->
  <p class="text-sm mb-6 opacity-80 animate-fade-in-slow delay-500">Redirigiendo al sistema...</p>

  <!-- BOTÓN MANUAL -->
  <button
    on:click={ingresarAhora}
    class="px-6 py-2 rounded-full bg-white text-blue-700 font-semibold shadow hover:bg-gray-100 transition animate-slide-up delay-700"
  >
    Ingresar ahora
  </button>

  <!-- SPINNER -->
  <div class="mt-10 animate-fade-in-slow delay-700">
    <svg class="animate-spin-slow h-20 w-20 text-white opacity-80" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  </div>

  
</div>



<style>
  @keyframes fade-in-slow {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-up {
    0% { transform: translateY(30px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  .animate-fade-in-slow {
    animation: fade-in-slow 1.2s ease-out forwards;
  }
  .animate-slide-up {
    animation: slide-up 1s ease-out forwards;
  }
  .animate-spin-slow {
    animation: spin 2s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
