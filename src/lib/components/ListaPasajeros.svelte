<script lang="ts">
	import { onMount } from 'svelte';

	export let pasajeros: any[] = [];
	export let onChange: (pasajeros: any[]) => void;

	function agregarPasajero() {
		pasajeros = [
			...pasajeros,
			{
				nombre: '',
				apellido: '',
				nacionalidad: '',
				fechaNacimiento: '',
				correo: '',
				rut_pasaporte: '',
				telefono: '',
				restriccionesAlimenticias: '',
				preexistenciasMedicas: '',
				observaciones: ''
			}
		];
		onChange(pasajeros);
	}

	function eliminarPasajero(index: number) {
		pasajeros.splice(index, 1);
		pasajeros = [...pasajeros];
		onChange(pasajeros);
	}

	function actualizarCampo(index: number, campo: string, valor: string) {
		pasajeros[index][campo] = valor;
		pasajeros = [...pasajeros];
		onChange(pasajeros);
	}

	function calcularEdad(fechaNacimiento: string): string {
		if (!fechaNacimiento) return '';
		const hoy = new Date();
		const nacimiento = new Date(fechaNacimiento);
		let edad = hoy.getFullYear() - nacimiento.getFullYear();
		const m = hoy.getMonth() - nacimiento.getMonth();
		if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
			edad--;
		}
		return edad.toString();
	}
</script>

<div class="space-y-6">
	{#each pasajeros as p, i}
		<div class="p-4 border rounded-lg space-y-2 bg-gray-50">
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				<input type="text" placeholder="Nombre *" bind:value={p.nombre} on:input={(e) => actualizarCampo(i, 'nombre', e.target.value)} required class="input" />
				<input type="text" placeholder="Apellido *" bind:value={p.apellido} on:input={(e) => actualizarCampo(i, 'apellido', e.target.value)} required class="input" />
				<input type="text" placeholder="Nacionalidad *" bind:value={p.nacionalidad} on:input={(e) => actualizarCampo(i, 'nacionalidad', e.target.value)} required class="input" />

				<input type="date" placeholder="Fecha de Nacimiento" bind:value={p.fechaNacimiento} on:input={(e) => actualizarCampo(i, 'fechaNacimiento', e.target.value)} class="input" />
				<input type="text" placeholder="Edad" value={calcularEdad(p.fechaNacimiento)} disabled class="input bg-gray-100" />
				<input type="text" placeholder="Correo" bind:value={p.correo} on:input={(e) => actualizarCampo(i, 'correo', e.target.value)} class="input" />

				<input type="text" placeholder="RUT o Pasaporte" bind:value={p.rut_pasaporte} on:input={(e) => actualizarCampo(i, 'rut_pasaporte', e.target.value)} class="input" />
				<input type="text" placeholder="Teléfono" bind:value={p.telefono} on:input={(e) => actualizarCampo(i, 'telefono', e.target.value)} class="input" />
				<input type="text" placeholder="Restricciones Alimenticias" bind:value={p.restriccionesAlimenticias} on:input={(e) => actualizarCampo(i, 'restriccionesAlimenticias', e.target.value)} class="input" />

				<input type="text" placeholder="Preexistencias Médicas" bind:value={p.preexistenciasMedicas} on:input={(e) => actualizarCampo(i, 'preexistenciasMedicas', e.target.value)} class="input" />
				<textarea placeholder="Observaciones" bind:value={p.observaciones} on:input={(e) => actualizarCampo(i, 'observaciones', e.target.value)} class="input"></textarea>
			</div>

			<button on:click={() => eliminarPasajero(i)} class="text-sm text-red-600 hover:underline mt-2">Eliminar pasajero</button>
		</div>
	{/each}

	<button on:click={agregarPasajero} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Agregar pasajero</button>
</div>

<style>
	.input {
		@apply w-full px-3 py-2 border border-gray-300 rounded;
	}
</style>
