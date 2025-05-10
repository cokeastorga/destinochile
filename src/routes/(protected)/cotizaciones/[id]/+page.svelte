<!-- src/routes/cotizacion/[id]/+page.svelte -->
<script lang="ts">
    import { db } from '$lib/firebase';
    import { doc, getDoc } from 'firebase/firestore';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { format } from 'date-fns';
    import { onMount } from 'svelte';
    import { generarPDFDesdeHtml } from '$lib/utils/generarPDF';
    import { enviarCotizacionPorCorreo } from '$lib/api/enviarCorreoCliente';
    import { descargarPDFDesdeHtml } from '$lib/utils/generarPDF';
    import { updateDoc } from 'firebase/firestore';
    import { Timestamp } from 'firebase/firestore';
    import { differenceInDays } from 'date-fns';
    import { arrayUnion } from 'firebase/firestore';
    import { getAuth } from 'firebase/auth';


    let mostrarAlertaSeguimiento = false;
    let cotizacion: any = null;
    let cargando = true;
    let exportTarget: HTMLElement;
    let enviandoCorreo = false;
    let mensaje = '';

    function formatear(fecha: any) {
        if (!fecha) return '-';
        if (typeof fecha === 'string') return fecha;
        if (fecha.toDate) return format(fecha.toDate(), 'dd/MM/yyyy');
        return '-';
    }

    async function handleEnviarCorreo() {
        enviandoCorreo = true;
        mensaje = '';
        const auth = getAuth();
        const usuarioActual = auth.currentUser?.email || 'usuario_desconocido';
        await updateDoc(doc(db, 'cotizaciones', cotizacion.id), {
            enviadaEl: Timestamp.now(),
            seguimientoRealizado: false,
            eventos: arrayUnion({
                tipo: 'enviada',
                fecha: Timestamp.now(),
                usuario: usuarioActual,
                comentario: 'Cotización enviada por correo'
            })
        });

        try {
            const pdf = await generarPDFDesdeHtml('vista-pdf');
            await enviarCotizacionPorCorreo({
                para: cotizacion.email,
                asunto: 'Cotización personalizada – Destino Chile',
                mensaje: 'Estimado cliente, adjuntamos su cotización solicitada.',
                pdfBlob: pdf
            });
            mensaje = 'Correo enviado con éxito';

        } catch (error) {
            mensaje = `Error al enviar el correo: ${error.message}`;
        } finally {
            enviandoCorreo = false;
        }
    }

    async function cargarCotizacion(id: string) {
        const ref = doc(db, 'cotizaciones', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            cotizacion = { id, ...snap.data() };
        } else {
            goto('/dashboard');
            return;
        }
        cargando = false;
    }

    onMount(() => {
        const unsubscribe = page.subscribe(($page) => {
            const id = $page.params.id;
            if (id) {
                cargarCotizacion(id);
            }
        });
        return () => unsubscribe();
    });


    $: if (
        cotizacion?.enviadaEl &&
        cotizacion.estado === 'Pendiente' &&
        !cotizacion.seguimientoRealizado
    ) {
        const enviada = cotizacion.enviadaEl?.toDate?.() ?? null;
        if (enviada) {
            const dias = differenceInDays(new Date(), enviada);
            mostrarAlertaSeguimiento = dias >= 3;
        }
    }



    async function marcarSeguimientoRealizado() {
        try {
            await updateDoc(doc(db, 'cotizaciones', cotizacion.id), {
                seguimientoRealizado: true
            });
            mensaje = 'Seguimiento marcado como realizado.';
            mostrarAlertaSeguimiento = false;
        } catch (err) {
            mensaje = 'Error al actualizar el seguimiento.';
        }
    }

</script>

{#if cargando}
<p class="text-gray-500">Cargando cotización...</p>
{:else if !cotizacion}
<p class="text-red-600 font-bold">Cotización no encontrada</p>
{:else}
<div class="mt-2 px-4 py-2 text-sm">
    <button on:click={()=> goto('/dashboard')}
        class="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
        >
        ← Volver al Dashboard
    </button>
    <button on:click={marcarSeguimientoRealizado}
        class="mt-2 px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">
        ✅ Marcar como seguimiento realizado
    </button>

    <button on:click={()=> goto(`/cotizaciones?edit=${cotizacion.id}`)}
        class="rounded mt-2 px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
        ✏️ Editar cotización
    </button>
    <button on:click={handleEnviarCorreo}
        class=" mt-2 px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 mb-4 ml-2"
        disabled={enviandoCorreo}>
        {#if enviandoCorreo}
        ⏳ Enviando...
        {:else}
        ✉️ Enviar por correo
        {/if}
    </button>
    <button on:click={()=> descargarPDFDesdeHtml('vista-pdf', `cotizacion-${cotizacion.id}.pdf`)}
        class=" mt-2 px-4 py-2 text-sm rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 mb-4"
        >
        ⬇️ Descargar PDF
    </button>

</div>

{#if mensaje}
<p class={mensaje.includes('Error') ? 'text-red-600' : 'text-green-600' }>{mensaje}</p>
{/if}


{#if mostrarAlertaSeguimiento}
<div class="mb-4 p-4 rounded bg-yellow-100 border border-yellow-400 text-yellow-800">
    ⚠️ Han pasado más de 3 días desde que esta cotización fue enviada y aún está pendiente.
    Por favor realiza seguimiento con el cliente.
</div>
{/if}


<!-- Vista para generar PDF -->
<div id="vista-pdf" class="bg-white text-black p-6 w-full mx-auto rounded shadow">
    <!-- Encabezado -->
    <div class="flex justify-between items-center mb-6 border-b pb-4">
        <img src="/logo.jpg" alt="Destino Chile" class="h-24" />
        
            <h2 class="text-xl font-bold">Destino Chile</h2>
        <div class="text-right">
            <h2 class="text-xl item center font-bold">Cotización CT-DCH{cotizacion.id.slice(-4)}</h2>
            
            <p class="text-sm text-gray-600">Fecha: {new Date().toLocaleDateString()}</p>
        </div>
    </div>
    <hr class="my-8" />

    <!-- Cliente y viaje -->
    <div class=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-m mb-8">
        <p><strong>Cliente:</strong> {cotizacion.email}</p>
        <p><strong>Ejecutivo:</strong> {cotizacion.ejecutivo}</p>
        <p><strong>Tipo Cliente:</strong> {cotizacion.tipoCliente}</p>
        <p><strong>Destino:</strong> {cotizacion.destino}</p>
        <p><strong>Check-in:</strong> {formatear(cotizacion.fechaInicio)}</p>
        <p><strong>Check-out:</strong> {formatear(cotizacion.fechaFin)}</p>
        <p><strong>Pasajeros:</strong> {cotizacion.cantidadPasajeros}</p>
        <p><strong>Estado:</strong> {cotizacion.estado ?? 'Pendiente'}</p>
    </div>
<hr class="my-4" />
<hr class="my-8" />
    <!-- Servicios -->
    <h3 class="text-lg font-bold mb-2">Servicios seleccionados</h3>
    <table class="w-full text-sm border-collapse border border-gray-600 mb-4">
        <thead class="bg-gray-200">
            <tr>
                <th class="border px-2 py-1 text-left">Proveedor</th>
                <th class="border px-2 py-1 text-left">Servicio</th>
                <th class="border px-2 py-1">Producto</th>
                <th class="border px-2 py-1">Temporada</th>
                <th class="border px-2 py-1 ">Tipo Habitacion</th>
                <th class="border px-2 py-1">Nombre producto</th>
                <th class="border px-2 py-1">Descripción</th>
                <th class="border px-2 py-1">Half/Full day</th>
                <th class="border px-2 py-1">Tour Priv/Reg</th>
                <th class="border px-2 py-1">Noches</th>
                <th class="border px-2 py-1">Habitaciones</th>
                <th class="border px-2 py-1">Check-in</th>
                <th class="border px-2 py-1">Check-out</th>
                <th class="border px-2 py-1 text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            {#each cotizacion.servicios ?? [] as s}
            <tr>
                <td class="border px-2 py-1">{s.proveedor}</td>
                <td class="border px-2 py-1">{s.tipoServicio}</td>
                <td class="border px-2 py-1">{s.servicioProducto}</td>
                <td class="border px-2 py-1">{s.temporada}</td>
                <td class="border px-2 py-1">{s.tipoHabitacion}</td>
                <td class="border px-2 py-1">{s.nombreProducto}</td>
                <td class="border px-2 py-1">{s.descripcion}</td>
                <td class="border px-2 py-1">{s.halfDay}</td>
                <td class="border px-2 py-1">{s.tourPrivado}</td>
                <td class="border px-2 py-1">{s.noches}</td>
                <td class="border px-2 py-1">{s.habitaciones}</td>
                <td class="border px-2 py-1">{s.checkin}</td>
                <td class="border px-2 py-1">{s.checkout}</td>
                <td class="border px-2 py-1 text-right">
                    ${(s.subtotal || 0).toLocaleString('es-CL')}
                </td>
            </tr>
            {/each}
        </tbody>
    </table>

    <!-- Total -->
    <div class="text-right text-lg font-bold mb-4">
        Total: ${cotizacion.totalGeneral.toLocaleString('es-CL')}
    </div>
<hr class="my-4" />
    <!-- Observaciones -->
    <div class="text-sm text-gray-600 border-t pt-4">
        <p><strong>Nota:</strong> Esta cotización es referencial y puede estar sujeta a cambios sin previo aviso.</p>
        <p>Tarifas sujetas a disponibilidad al momento de confirmar la reserva.</p>
    </div>

    {#if cotizacion.eventos?.length}
    <div class="mt-8 text-sm border-t pt-4">
        <h4 class="font-semibold mb-2">🕓 Historial de acciones</h4>
        <ul class="space-y-1 list-disc list-inside text-gray-700">
            {#each cotizacion.eventos.sort((a, b) => a.fecha?.seconds - b.fecha?.seconds) as e}
            <li>
                <span class="text-gray-500">{formatear(e.fecha)}</span> —
                <strong class="capitalize">{e.tipo}</strong> por {e.usuario}:
                <em> {e.comentario}</em>
            </li>
            {/each}
        </ul>
    </div>
    {/if}
<hr class="my-4" />
</div>
{/if}