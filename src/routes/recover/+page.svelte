<script lang="ts">
  import { sendPasswordResetEmail } from 'firebase/auth';
  import { auth } from '$lib/firebase';
  import { goto } from '$app/navigation';

  let email = '';
  let success = false;
  let error: string | null = null;
  let loading = false;

  const handleReset = async () => {
    error = null;
    success = false;
    loading = true;

    try {
      await sendPasswordResetEmail(auth, email);
      success = true;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        error = 'No se encontró un usuario con este correo.';
      } else {
        error = err.message;
      }
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>Recuperar contraseña</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-sky-600 to-indigo-800 flex items-center justify-center px-4 py-10 text-white">
  <div class="bg-white text-gray-800 shadow-xl rounded-xl px-8 py-10 w-full max-w-md animate-fade-in-slow">
    <!-- Logo centrado -->
    <div class="flex justify-center mb-6">
      <img src="/logo.jpg" alt="Logo Destino Chile" class="w-40 h-40 rounded-full shadow-lg" />
    </div>

    <h1 class="text-2xl font-bold mb-4 text-center text-gray-800">Recuperar contraseña</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>
    {/if}

    {#if success}
      <div class="bg-green-100 text-green-700 p-2 mb-4 rounded text-sm">
        Se ha enviado un enlace de recuperación a tu correo.
      </div>
    {/if}

    <form on:submit|preventDefault={handleReset} class="space-y-4">
      <input
        type="email"
        bind:value={email}
        placeholder="Correo electrónico"
        class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        required
      />

      <button
        type="submit"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center"
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Enviando...
        {:else}
          Enviar enlace de recuperación
        {/if}
      </button>
    </form>

    <div class="mt-4 text-sm text-center">
      <a href="/login" class="text-blue-600 hover:underline">Volver al login</a>
    </div>
  </div>
</div>

<style>
  @keyframes fade-in-slow {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-slow {
    animation: fade-in-slow 0.8s ease-out forwards;
  }
</style>
