<script lang="ts">
  import { auth } from '$lib/firebase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

  let verificationSent = false;
  let resendCooldown = false;
  let error: string | null = null;

  onMount(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          goto('/dashboard');
        }
      } else {
        goto('/login');
      }
    });
  });

  async function resendVerificationEmail() {
    const user = auth.currentUser;
    if (user && !user.emailVerified && !resendCooldown) {
      try {
        await sendEmailVerification(user);
        verificationSent = true;
        resendCooldown = true;

        // Esperar 1 minuto antes de poder reenviar
        setTimeout(() => {
          resendCooldown = false;
        }, 60000);
      } catch (err: any) {
        error = err.message;
      }
    }
  }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
  <div class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
    <h1 class="text-2xl font-bold mb-4 text-center">Verifica tu correo</h1>

    {#if error}
      <div class="bg-red-100 text-red-700 p-2 mb-4 rounded text-sm">{error}</div>
    {/if}

    {#if verificationSent}
      <div class="text-green-600 text-sm mb-4 text-center">
        Correo enviado. Revisa tu bandeja de entrada.
      </div>
    {/if}

    <button
      on:click={resendVerificationEmail}
      class="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      disabled={resendCooldown}
    >
      {resendCooldown ? 'Espera antes de reenviar' : 'Reenviar correo de verificación'}
    </button>
  </div>
</div>

<style>
  :global(body) {
    @apply bg-gray-100;
  }
</style>
