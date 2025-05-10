<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/firebase';
  import { onAuthStateChanged, signOut } from 'firebase/auth';
  import Sidebar from '$lib/components/Sidebar.svelte';

  let userEmail: string | null = null;

  onMount(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        userEmail = user.email;
      }
    });
  });

  function logout() {
    signOut(auth);
  }
</script>

<Sidebar>
  <div class="p-4 text-sm text-right text-gray-700">
    {#if userEmail}
      <p class="mb-2">Sesión activa como <strong>{userEmail}</strong></p>
    {/if}
  
  </div>
  <slot />
</Sidebar>

<style>
  :global(body) {
    @apply bg-gray-100;
  }
</style>
