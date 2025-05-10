<script lang="ts">
	export let isVisible: boolean = false;
</script>

{#if isVisible}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 bg-white bg-opacity-60"
	>
		<div
			class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
		></div>
		<p class="font-semibold text-blue-700">Buscando servicios, por favor espera...</p>
	</div>
{/if}

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>