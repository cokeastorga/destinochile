<script lang="ts">
    import { db } from '$lib/firebase';
    import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { format } from 'date-fns';
    import { onMount } from 'svelte';
    import { generarPDFDesdeHtml, descargarPDFDesdeHtml } from '$lib/utils/generarPDF';
    import { differenceInDays } from 'date-fns';
    import { getAuth } from 'firebase/auth';
    import DetallePasajeros from '$lib/components/DetallePasajeros.svelte';
    import { toast } from '@zerodevx/svelte-toast';

    let mostrarAlertaSeguimiento = false;
    let reserva: any = null;
    let cargando = true;
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
        try {
            await updateDoc(doc(db, 'reservas', reserva.id), {
                enviadaEl: Timestamp.now(),
                seguimientoRealizado: false,
                eventos: arrayUnion({
                    tipo: 'enviada',
                    fecha: Timestamp.now(),
                    usuario: usuarioActual,
                    comentario: 'Reserva enviada por correo'
                })
            });

            const pdf = await generarPDFDesdeHtml('vista-pdf');
            await enviarReservaPorCorreo({
                para: reserva.email,
                asunto: 'Reservación personalizada – Destino Chile',
                mensaje: 'Estimado cliente, adjuntamos su reservación solicitada.',
                pdfBlob: pdf
            });
            mensaje = 'Correo enviado con éxito';
            toast.push(mensaje, {
	theme: {
		'--toastBackground': '#4ade80', // verde
		'--toastBarBackground': '#15803d'
	}
});
        } catch (error) {
            mensaje = `Error al enviar el correo: ${(error as Error).message}`;
            toast.push(mensaje, {
	theme: {
		'--toastBackground': '#fca5a5', // rojo claro
		'--toastBarBackground': '#b91c1c'
	}
});

        } finally {
            enviandoCorreo = false;
        }
    }

    async function cargarReserva(id: string) {
        try {
            const ref = doc(db, 'reservas', id);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                reserva = { id, ...snap.data() };
            } else {
                toast.error('Reservación no encontrada');
                goto('/dashboard');
            }
        } catch (error) {
            toast.error('Error al cargar la reservación');
        } finally {
            cargando = false;
        }
    }

    async function marcarSeguimientoRealizado() {
        try {
            await updateDoc(doc(db, 'reservas', reserva.id), {
                seguimientoRealizado: true
            });
            mensaje = 'Seguimiento marcado como realizado.';
           toast.push(mensaje, {
	theme: {
		'--toastBackground': '#4ade80', // verde
		'--toastBarBackground': '#15803d'
	}
});
            mostrarAlertaSeguimiento = false;
        } catch (error) {
            mensaje = 'Error al actualizar el seguimiento.';
            toast.push(mensaje, {
	theme: {
		'--toastBackground': '#fca5a5', // rojo claro
		'--toastBarBackground': '#b91c1c'
	}
});
        }
    }

    onMount(() => {
        const unsubscribe = page.subscribe(($page) => {
            const id = $page.params.id;
            if (id) {
                cargarReserva(id);
            }
        });
        return () => unsubscribe();
    });

    $: pasajeros = reserva?.pasajeros ?? [];
    $: if (
        reserva?.enviadaEl &&
        reserva.estado === 'Pendiente' &&
        !reserva.seguimientoRealizado
    ) {
        const enviada = reserva.enviadaEl?.toDate?.() ?? null;
        if (enviada) {
            const dias = differenceInDays(new Date(), enviada);
            mostrarAlertaSeguimiento = dias >= 3;
        }
    }
</script>

<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
    }

    @media print {
        #vista-pdf {
            box-shadow: none !important;
            padding: 10mm !important;
            margin: 0 !important;
            width: 190mm !important;
            max-width: 190mm !important;
            background: #ffffff !important;
            font-size: 9pt !important;
        }
        table, .no-break {
            page-break-inside: avoid !important;
        }
        body {
            color: #1f2937 !important;
            background: #ffffff !important;
        }
        .no-print {
            display: none !important;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            font-size: 7pt !important;
        }
        th, td {
            border: 0.5pt solid #d1d5db !important;
            padding: 3pt !important;
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        th {
            background-color: #f3f4f6 !important;
            font-weight: 600;
        }
        img {
            max-height: 30pt !important;
            width: auto !important;
        }
        h1 {
            font-size: 14pt !important;
        }
        h3 {
            font-size: 10pt !important;
        }
        .text-2xl {
            font-size: 12pt !important;
        }
        .bg-amber-100 {
            background-color: #fef3c7 !important;
            color: #92400e !important;
        }
    }

    .pdf-rendering {
        box-shadow: none !important;
        padding: 10mm !important;
        background: #ffffff !important;
        width: 190mm !important;
        font-size: 9pt !important;
    }
    .pdf-rendering table {
        border: 0.5pt solid #d1d5db !important;
        font-size: 7pt !important;
    }
    .pdf-rendering th,
    .pdf-rendering td {
        border: 0.5pt solid #d1d5db !important;
        padding: 3pt !important;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }
    .pdf-rendering th {
        background-color: #f3f4f6 !important;
    }
</style>

{#if cargando}
    <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p class="ml-3 text-gray-600 font-medium">Cargando reservación...</p>
    </div>
{:else if !reserva}
    <div class="text-center py-8">
        <p class="text-red-600 font-semibold text-lg">Reservación no encontrada</p>
    </div>
{:else}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4 mb-8 no-print">
            <button
                on:click={() => goto('/dashboard')}
                class="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver
            </button>
            <button
                on:click={marcarSeguimientoRealizado}
                class="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Seguimiento realizado
            </button>
            <button
                on:click={() => goto(`/reservas?edit=${reserva.id}`)}
                class="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar
            </button>
            <button
                on:click={handleEnviarCorreo}
                class="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                disabled={enviandoCorreo}
            >
                {#if enviandoCorreo}
                    <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                {:else}
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar por correo
                {/if}
            </button>
            <button
                on:click={() => descargarPDFDesdeHtml('vista-pdf', `Reserva-FF-DCH${reserva.id.slice(-4)}.pdf`)}
                class="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
            >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Descargar PDF
            </button>
        </div>

        <!-- Message -->
        {#if mensaje}
            <div
                class="mb-6 p-4 rounded-lg text-sm font-medium {mensaje.includes('Error')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'} animate-fade-in no-print"
            >
                {mensaje}
            </div>
        {/if}

        <!-- Follow-up Alert -->
        {#if mostrarAlertaSeguimiento}
            <div class="mb-6 p-4 bg-amber-100 border-l-4 border-amber-500 text-amber-800 rounded-lg animate-fade-in no-print">
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                        Han pasado más de 3 días desde que esta reservación fue enviada y aún está pendiente. Realiza seguimiento con el cliente.
                    </p>
                </div>
            </div>
        {/if}

        <!-- PDF View -->
        <div id="vista-pdf" class="bg-white p-6 max-w-6xl mx-auto rounded-xl shadow-lg print:shadow-none print:p-4">
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                <div class="flex items-center gap-4">
                    <img src="/logo.jpg" alt="Destino Chile" class="h-12 w-auto object-contain" />
                    <div>
                        <p class="text-sm text-gray-500">Reservación</p>
                        <h1 class="text-2xl font-bold text-gray-900">FF-DCH{reserva.id.slice(-4)}</h1>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-500">Fecha de emisión:</p>
                    <p class="text-md font-medium text-gray-900">{new Date().toLocaleDateString('es-CL')}</p>
                </div>
            </div>

            <!-- Client Details -->
            <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 text-sm">
                <div>
                    <span class="font-semibold text-gray-600">Correo Cliente:</span>
                    <p class="text-gray-900">{reserva.email}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Ejecutivo Responsable:</span>
                    <p class="text-gray-900">{reserva.ejecutivo}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Tipo Cliente:</span>
                    <p class="text-gray-900">{reserva.tipoCliente}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Ciudad de Destino:</span>
                    <p class="text-gray-900">{reserva.destino}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Check-in:</span>
                    <p class="text-gray-900">{formatear(reserva.fechaInicio)}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Check-out:</span>
                    <p class="text-gray-900">{formatear(reserva.fechaFin)}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Cantidad de Pasajeros:</span>
                    <p class="text-gray-900">{reserva.cantidadPasajeros}</p>
                </div>
                <div>
                    <span class="font-semibold text-gray-600">Estado:</span>
                    <span class="inline-block px-2 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full">{reserva.estado}</span>
                </div>
            </section>

            <!-- Services -->
            <h3 class="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2 no-break">Servicios Seleccionados</h3>
            <div class="overflow-x-auto mb-6">
                <table class="w-full text-xs text-gray-700 border border-gray-200 rounded-lg no-break">
                    <thead class="bg-gray-50 text-gray-600">
                        <tr>
                            <th class="px-2 py-1 font-semibold w-[80px]">Proveedor</th>
                            <th class="px-2 py-1 font-semibold w-[70px]">Servicio</th>
                            <th class="px-2 py-1 font-semibold w-[50px]">Temporada</th>
                            <th class="px-2 py-1 font-semibold w-[70px]">Tipo</th>
                            <th class="px-2 py-1 font-semibold w-[60px]">Habitación</th>
                            <th class="px-2 py-1 font-semibold w-[80px]">Nombre</th>
                            <th class="px-2 py-1 font-semibold w-[100px]">Descripción</th>
                            <th class="px-2 py-1 font-semibold w-[50px]">Noches</th>
                            <th class="px-2 py-1 font-semibold w-[50px]">Hab.</th>
                            <th class="px-2 py-1 font-semibold w-[60px]">Check-in</th>
                            <th class="px-2 py-1 font-semibold w-[60px]">Check-out</th>
                            <th class="px-2 py-1 font-semibold w-[60px]">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each reserva.servicios ?? [] as s, i}
                            <tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition">
                                <td class="border px-2 py-1">{s.proveedor || '-'}</td>
                                <td class="border px-2 py-1">{s.servicioProducto || '-'}</td>
                                <td class="border px-2 py-1">{s.temporada || '-'}</td>
                                <td class="border px-2 py-1">{s.tipoServicio || '-'}</td>
                                <td class="border px-2 py-1">{s.tipoHabitacion || '-'}</td>
                                <td class="border px-2 py-1">{s.nombreProducto || '-'}</td>
                                <td class="border px-2 py-1">{s.descripcion || '-'}</td>
                                <td class="border px-2 py-1">{s.noches || '-'}</td>
                                <td class="border px-2 py-1">{s.habitaciones || '-'}</td>
                                <td class="border px-2 py-1">{s.checkin || '-'}</td>
                                <td class="border px-2 py-1">{s.checkout || '-'}</td>
                                <td class="border px-2 py-1 text-right">${(s.subtotal || 0).toLocaleString('es-CL')}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Passengers -->
            {#if pasajeros.length > 0}
                <h3 class="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2 no-break">Lista de Pasajeros</h3>
                <DetallePasajeros {pasajeros} />
            {/if}

            <!-- Total -->
            <div class="text-right text-xl font-bold text-gray-900 mb-6 no-break">
                Total: ${reserva.totalGeneral?.toLocaleString('es-CL') || '0'}
            </div>

            <!-- Notes -->
            <div class="bg-gray-50 border-l-4 border-indigo-400 p-4 text-sm rounded-lg mb-6 no-break">
                <p class="font-semibold text-gray-700">Nota:</p>
                <p class="text-gray-600">Esta Reservación es referencial y puede cambiar sin previo aviso.</p>
                <p class="text-gray-600">Tarifas sujetas a disponibilidad al momento de confirmar la reserva.</p>
            </div>

            <!-- History -->
            {#if reserva.eventos?.length}
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-sm no-break">
                    <h4 class="font-semibold text-gray-900 mb-2">Historial de Acciones</h4>
                    <ul class="space-y-1 text-gray-700">
                        {#each reserva.eventos.sort((a, b) => a.fecha?.seconds - b.fecha?.seconds).filter((e, i, arr) => 
                            arr.findIndex(x => x.fecha?.seconds === e.fecha?.seconds && x.comentario === e.comentario) === i
                        ) as e}
                            <li class="flex items-start">
                                <span class="text-gray-500 min-w-[90px]">{formatear(e.fecha)}</span>
                                <span class="ml-2">— <strong>{e.tipo}</strong> por {e.usuario}: <em>{e.comentario}</em></span>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    </div>
{/if}