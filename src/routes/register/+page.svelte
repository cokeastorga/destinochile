<script lang="ts">
  import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
  import { auth, db } from '$lib/firebase';
  import { doc, setDoc } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let nombre = '';
  let apellido = '';
  let sucursal = '';
  let showPassword = false;
  let showConfirmPassword = false;
  let error: string | null = null;
  let loading = false;
  let verificationSent = false;

  const handleRegister = async () => {
    error = null;
    verificationSent = false;

    if (password !== confirmPassword) {
      error = 'Las contraseñas no coinciden.';
      return;
    }

    if (password.length < 6) {
      error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    loading = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
        email: userCredential.user.email,
        rol: 'Ejecutivo',
        nombre,
        apellido,
        sucursal,
        verificado: false
      });

      if (!verificationSent) {
        await sendEmailVerification(userCredential.user);
        verificationSent = true;
      }

      goto('/verify-email');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        error = 'Este correo ya está en uso.';
      } else if (err.code === 'auth/weak-password') {
        error = 'La contraseña es demasiado débil.';
      } else {
        error = err.message;
      }
    } finally {
      loading = false;
    }
  };
</script>

<div class="min-h-screen bg-gradient-to-br from-sky-600 to-indigo-800 flex items-center justify-center px-4 py-10 text-white">
  <div class="bg-white text-gray-800 shadow-xl rounded-xl px-8 py-10 w-full max-w-md animate-fade-in-slow">
    <!-- Logo centrado -->
    <div class="flex justify-center mb-6">
      <img src="/logo.jpg" alt="Logo Destino Chile" class="w-40 h-40 rounded-full shadow-lg" />
    </div>

    <h1 class="text-3xl font-bold mb-4 text-center text-gray-800">Crear cuenta</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleRegister} class="space-y-4">
      <input type="text" bind:value={nombre} placeholder="Nombre" class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" required />
      <input type="text" bind:value={apellido} placeholder="Apellido" class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" required />
      <input type="text" bind:value={sucursal} placeholder="Sucursal" class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" required />
      <input type="email" bind:value={email} placeholder="Correo electrónico" class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500" required />

      <div class="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          placeholder="Contraseña"
          class="w-full px-4 py-2 border rounded pr-10 focus:ring-2 focus:ring-blue-500"
          required
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer transition"
          on:click={() => (showPassword = !showPassword)}
        >
          {#if showPassword}
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10a9.956 9.956 0 013.132-7.184m16.668 16.668L3 3" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.854-.68 1.651-1.192 2.368" />
          {/if}
        </svg>
      </div>

      <div class="relative">
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          bind:value={confirmPassword}
          placeholder="Confirmar contraseña"
          class="w-full px-4 py-2 border rounded pr-10 focus:ring-2 focus:ring-blue-500"
          required
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer transition"
          on:click={() => (showConfirmPassword = !showConfirmPassword)}
        >
          {#if showConfirmPassword}
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10a9.956 9.956 0 013.132-7.184m16.668 16.668L3 3" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.854-.68 1.651-1.192 2.368" />
          {/if}
        </svg>
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center justify-center"
        disabled={loading || verificationSent}
      >
        {#if loading}
          <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Registrando...
        {:else}
          Registrarse
        {/if}
      </button>
    </form>

    <div class="mt-4 text-sm text-center">
      ¿Ya tienes cuenta?
      <a href="/login" class="text-blue-600 hover:underline ml-1">Inicia sesión</a>
    </div>
    <div class="mt-2 text-sm text-center">
      ¿Olvidaste tu contraseña?
      <a href="/recover" class="text-blue-600 hover:underline ml-1">Recupérala</a>
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
