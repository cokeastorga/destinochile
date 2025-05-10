<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, getDocs, Timestamp, deleteDoc  } from 'firebase/firestore';
	import { goto } from '$app/navigation';
	
	import { updateDoc, doc } from 'firebase/firestore';


	let cotizacionesOriginal: any[] = [];
	let cotizaciones: any[] = [];
	let cargando = true;

	let filtroEstado = '';
	let filtroCliente = '';
	let ordenDesc = true;

	onMount(async () => {
		const snapshot = await getDocs(collection(db, 'cotizaciones'));
		cotizacionesOriginal = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				fecha: data.creadoEn?.toDate?.() ?? new Date(0)
			};
		});

		aplicarFiltros();
		cargando = false;
	});


	async function actualizarEstado(id: string, nuevoEstado: string) {
		try {
			const ref = doc(db, 'cotizaciones', id);
			await updateDoc(ref, { estado: nuevoEstado });
			console.log(`Estado actualizado a ${nuevoEstado} para ${id}`);
		} catch (error) {
			console.error('Error al actualizar estado:', error);
			alert('No se pudo actualizar el estado. Intenta nuevamente.');
		}
	}


	function aplicarFiltros() {
		cotizaciones = cotizacionesOriginal
			.filter((c) => {
				const coincideEstado = filtroEstado ? (c.estado ?? 'Pendiente') === filtroEstado : true;
				const coincideCliente = filtroCliente
					? c.email?.toLowerCase().includes(filtroCliente.toLowerCase())
					: true;
				return coincideEstado && coincideCliente;
			})
			.sort((a, b) =>
				ordenDesc
					? b.fecha.getTime() - a.fecha.getTime()
					: a.fecha.getTime() - b.fecha.getTime()
			);
	}

	async function eliminarCotizacion(id: string) {
	const confirmar = confirm(`¿Estás seguro que deseas eliminar la cotización ${id}? Esta acción no se puede deshacer.`);
	if (!confirmar) return;

	try {
		await deleteDoc(doc(db, 'cotizaciones', id));
		alert(`Cotización ${id} eliminada correctamente.`);

		// Quitar del array local sin volver a consultar Firestore
		cotizacionesOriginal = cotizacionesOriginal.filter(c => c.id !== id);
		aplicarFiltros();
	} catch (error) {
		console.error('Error al eliminar cotización:', error);
		alert('No se pudo eliminar la cotización. Intenta nuevamente.');
	}
}

</script>

<h1 class="mb-6 text-3xl font-bold">Dashboard de Cotizaciones</h1>

<!-- Filtros -->
<div class="mb-6 flex flex-wrap gap-4 text-sm">
	<input type="text" placeholder="Buscar cliente por email..." bind:value={filtroCliente} on:input={aplicarFiltros}
		class="rounded border px-3 py-1" />

	<select bind:value={filtroEstado} on:change={aplicarFiltros} class="rounded border px-3 py-1">
		<option value="">Todos los estados</option>
		<option value="Pendiente">Pendiente</option>
		<option value="Confirmada">Confirmada</option>
		<option value="Anulada">Anulada</option>
	</select>

	<button on:click={()=> {
		ordenDesc = !ordenDesc;
		aplicarFiltros();
		}}
		class="rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700"
		>
		Orden: {ordenDesc ? '↓ Recientes primero' : '↑ Antiguas primero'}
	</button>
</div>

<!-- Tabla -->
{#if cargando}
<p class="text-gray-500">Cargando cotizaciones...</p>
{:else if cotizaciones.length === 0}
<p class="text-gray-500">No hay cotizaciones que coincidan con los filtros.</p>
{:else}
<table class="w-full table-auto border-collapse border border-gray-300 text-sm">
	<thead class="bg-gray-100">
		<tr>
			<th class="border px-4 py-2">ID</th>
			<th class="border px-4 py-2">Cliente</th>
			<th class="border px-4 py-2">Fecha</th>
			<th class="border px-4 py-2">Estado</th>
			<th class="border px-4 py-2">Total</th>
			<th class="border px-4 py-2">Acción</th>
		</tr>
	</thead>
	<tbody>
		{#each cotizaciones as c}
		<tr>
			<td class="border px-4 py-2 font-mono">{c.id}</td>
			<td class="border px-4 py-2">{c.email}</td>
			<td class="border px-4 py-2">{c.fecha.toLocaleDateString()}</td>
			<td class="border px-4 py-2">
				<div class="flex items-center gap-2">
					<span
						class="rounded px-2 py-1 text-xs font-semibold"
						class:bg-yellow-100={c.estado === 'Pendiente'}
						class:bg-green-100={c.estado === 'Confirmada'}
						class:bg-red-100={c.estado === 'Anulada'}
						class:text-yellow-800={c.estado === 'Pendiente'}
						class:text-green-800={c.estado === 'Confirmada'}
						class:text-red-800={c.estado === 'Anulada'}
					>
						{c.estado}
					</span>
			
					<select
						bind:value={c.estado}
						class="rounded border px-2 py-1 text-sm"
						on:change={() => actualizarEstado(c.id, c.estado)}
					>
						<option value="Pendiente">Pendiente</option>
						<option value="Confirmada">Confirmada</option>
						<option value="Anulada">Anulada</option>
					</select>
				</div>
			</td>
			

		<td class="border px-4 py-2">${c.totalGeneral?.toLocaleString('es-CL')}</td>
<td class="border px-4 py-2 space-x-2">
	<button
		class="text-blue-600 hover:underline"
		on:click={() => goto(`/cotizaciones/${c.id}`)}
	>
		Ver detalle
	</button>
	<button
		class="text-red-600 hover:underline"
		on:click={() => eliminarCotizacion(c.id)}
	>
		Eliminar
	</button>
</td>



		</tr>
		{/each}
	</tbody>
</table>
{/if}