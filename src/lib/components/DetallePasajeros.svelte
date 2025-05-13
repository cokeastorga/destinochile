<script lang="ts">
	export let pasajeros: any[] = [];
	function calcularEdad(fechaNacimiento: string): string {
		if (!fechaNacimiento) return '—';
		const hoy = new Date();
		const nacimiento = new Date(fechaNacimiento);
		let edad = hoy.getFullYear() - nacimiento.getFullYear();
		const m = hoy.getMonth() - nacimiento.getMonth();
		if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
			edad--;
		}
		return `${edad} años`;
	}
    
</script>


{#if pasajeros.length > 0}
	<div class="space-y-6">
		<h2 class="text-xl font-semibold mb-4">Lista de Pasajeros</h2>
		{#each pasajeros as p, i}
			<div class="p-4 border rounded-lg bg-white shadow-sm space-y-1">
				<p><strong>Pasajero #{i + 1}</strong></p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
					<p><strong>Nombre:</strong> {p.nombre} {p.apellido}</p>
					<p><strong>Nacionalidad:</strong> {p.nacionalidad}</p>
					<p><strong>Fecha de Nacimiento:</strong> {p.fechaNacimiento || '—'}</p>
					<p><strong>Edad estimada:</strong> {calcularEdad(p.fechaNacimiento)}</p>
					<p><strong>Correo:</strong> {p.correo || '—'}</p>
					<p><strong>RUT o Pasaporte:</strong> {p.rut_pasaporte || '—'}</p>
					<p><strong>Teléfono:</strong> {p.telefono || '—'}</p>
					<p><strong>Restricciones Alimenticias:</strong> {p.restriccionesAlimenticias || '—'}</p>
					<p><strong>Preexistencias Médicas:</strong> {p.preexistenciasMedicas || '—'}</p>
					<p><strong>Observaciones:</strong> {p.observaciones || '—'}</p>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<p class="text-gray-500">No hay pasajeros registrados para esta reserva.</p>
{/if}


