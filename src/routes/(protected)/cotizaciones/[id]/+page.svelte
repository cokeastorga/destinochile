<!-- src/routes/cotizacion/[id]/+page.svelte -->
<script lang="ts">
    import { db } from '$lib/firebase';
    import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { format } from 'date-fns';
    import { onMount } from 'svelte';
    import { generarPDFDesdeHtml, descargarPDFDesdeHtml } from '$lib/utils/generarPDF';
    import { enviarCotizacionPorCorreo } from '$lib/api/enviarCorreoCliente';
    import { differenceInDays } from 'date-fns';
    import { getAuth } from 'firebase/auth';
    import CotizacionAcciones from '$lib/components/CotizacionAcciones.svelte';

    let mostrarAlertaSeguimiento = false;
    let cotizacion: any = null;
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
      width: 100% !important;
      max-width: 190mm !important;
      background: #ffffff !important;
    }

    table, .no-break {
      page-break-inside: avoid !important;
    }

    body {
      font-size: 10pt !important;
      color: #1f2937 !important;
      background: #ffffff !important;
    }

    .no-print {
      display: none !important;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 8pt !important;
    }

    th, td {
      border: 0.5pt solid #d1d5db !important;
      padding: 4pt !important;
      text-align: left;
    }

    th {
      background-color: #f3f4f6 !important;
      font-weight: 600;
    }

    img {
      max-height: 40pt !important;
      width: auto !important;
    }

    h1 {
      font-size: 16pt !important;
    }

    h3 {
      font-size: 12pt !important;
    }

    .text-2xl {
      font-size: 14pt !important;
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
  }

  .pdf-rendering table {
    border: 0.5pt solid #d1d5db !important;
    font-size: 8pt !important;
  }

  .pdf-rendering th,
  .pdf-rendering td {
    border: 0.5pt solid #d1d5db !important;
    padding: 4pt !important;
  }

  .pdf-rendering th {
    background-color: #f3f4f6 !important;
  }
</style>
<hr class="my-1" />
{#if cargando}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    <p class="ml-3 text-gray-600 font-medium">Cargando cotización...</p>
  </div>
{:else if !cotizacion}
  <div class="text-center py-8">
    <p class="text-red-600 font-semibold text-lg">Cotización no encontrada</p>
  </div>
{:else}
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


    <!-- Botones de Acción -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        on:click={() => goto('/dashboard')}
        class="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>
      <button
        on:click={marcarSeguimientoRealizado}
        class="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Seguimiento realizado
      </button>
      <button
        on:click={() => goto(`/cotizaciones?edit=${cotizacion.id}`)}
        class="flex items-center bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Editar
      </button>
      <button
        on:click={handleEnviarCorreo}
        class="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200 disabled:opacity-50"
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
        on:click={() => descargarPDFDesdeHtml('vista-pdf', `cotizacion-${cotizacion.id}.pdf`)}
        class="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar PDF
      </button>
   {#if cotizacion}
    <CotizacionAcciones
      cotizacionId={cotizacion.id}
      estado={cotizacion.estado}
    />
    {/if}



    </div>

    <!-- Mensaje -->
    {#if mensaje}
      <div
        class="mb-6 p-4 rounded-lg text-sm font-medium {mensaje.includes('Error')
          ? 'bg-red-100 text-red-800'
          : 'bg-emerald-100 text-emerald-800'} animate-fade-in no-print"
      >
        {mensaje}
      </div>
    {/if}

    <!-- Alerta de seguimiento -->
    {#if mostrarAlertaSeguimiento}
      <div class="mb-6 p-4 bg-amber-100 border-l-4 border-amber-500 text-amber-800 rounded-lg animate-fade-in no-print">
        <div class="flex items-center">
          <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            Han pasado más de 3 días desde que esta cotización fue enviada y aún está pendiente. Realiza seguimiento con el cliente.
          </p>
        </div>
      </div>
    {/if}

    <!-- Vista para PDF -->
    <div id="vista-pdf" class="bg-white p-8 max-w-6xl mx-auto rounded-xl shadow-lg print:shadow-none print:p-4">
      <!-- Encabezado -->
      <div class="flex justify-between items-center border-b border-gray-200 pb-6 mb-8">
        <div class="flex items-center gap-6">
          <img src="/logo.jpg" alt="Destino Chile" class="h-16 w-auto object-contain" />
          <div>
            <p class="text-sm text-gray-500">Cotización</p>
            <h1 class="text-3xl font-bold text-gray-900">CT-DCH{cotizacion.id.slice(-4)}</h1>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm text-gray-500">Fecha de emisión:</p>
          <p class="text-md font-medium text-gray-900">{new Date().toLocaleDateString('es-CL')}</p>
        </div>
      </div>
      <hr class="my-4" />
      <!-- Datos del cliente -->
      <section class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 ml-4 text-sm">
        <div>
          <span class="font-semibold text-center text-gray-600">Correo Cliente:</span>
          <p class="text-gray-900">{cotizacion.email}</p>
        </div>
        <div>
          <span class="font-semibold text-center text-gray-600">Ejecutivo Responsable:</span>
          <p class="text-gray-900">{cotizacion.ejecutivo}</p>
        </div>
         <div>
          <span class="font-semibold text-center text-gray-600">Referencia:</span>
          <p class="text-gray-900">{cotizacion.referenciaPasajero}</p>
        </div>
        <div>
          <span class="font-semibold text-center text-gray-600">Tipo Cliente:</span>
          <p class="text-gray-900">{cotizacion.tipoCliente}</p>
        </div>
        <div>
          <span class="font-semibold text-center text-gray-600">Cantidad de Pasajeros:</span>
          <p class="text-gray-900">{cotizacion.cantidadPasajeros}</p>
        </div>
         <div>
          <span class="font-semibold text-center text-gray-600">Estado:</span>
          <span class="inline-block px-3 py-1 text-sm font-medium text-amber-800 bg-amber-100 rounded-full">{cotizacion.estado}</span>
        </div>
        
         <div>
          <span class="font-semibold text-center text-gray-600">Ciudad de Destino:</span>
          <p class="text-gray-900">{cotizacion.destino}</p>
        </div>
        <div>
          <span class="font-semibold text-center text-gray-600">Check-in:</span>
          <p class="text-gray-900">{formatear(cotizacion.fechaInicio)}</p>
        </div>
        <div>
          <span class="font-semibold text-center text-gray-600">Check-out:</span>
          <p class="text-gray-900">{formatear(cotizacion.fechaFin)}</p>
        </div>
       
        
       
      </section>
      
      <hr class="my-4" />
      <hr class="my-4" />
      <!-- Servicios -->
      <h3 class="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-3 no-break">Servicios seleccionados</h3>
      <div class="overflow-x-auto mb-8">
        <table class="w-full text-sm text-gray-700 border border-gray-200 rounded-lg no-break">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="px-2 py-1 text-center font-semibold">Proveedor</th>
              <th class="px-2 py-1 text-center font-semibold">Servicio</th>

              <th class="px-2 py-1 text-center font-semibold">Producto</th>
              <th class="px-2 py-1 text-center font-semibold">Habitación</th>
              <th class="px-2 py-1 text-center font-semibold">Nombre</th>
              <th class="px-2 py-1 text-center font-semibold">Descripción</th>
         <!--     <th class="px-2 py-1 text-center font-semibold">HalfDay/ FullDay</th>
              <th class="px-2 py-1 text-center font-semibold">Tipo Tour</th> -->
              <th class="px-2 py-1 text-center font-semibold">Cant/ Noches</th>
              <th class="px-2 py-1 text-center font-semibold">Cant/ Habs</th>
              <th class="px-2 py-1 text-center font-semibold">Temp</th>
              <th class="px-6 py-1 text-center font-semibold">Check-in</th>
              <th class="px-6 py-1 text-center font-semibold">Check-out</th>
              <th class="px-2 py-1 text-center font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {#each cotizacion.servicios ?? [] as s, i}
              <tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150">
                <td class="border text-center px-2 py-1">{s.proveedor}</td>
                <td class="border text-center px-2 py-1">{s.servicioProducto}</td>
                <td class="border text-center px-2 py-1">{s.tipoServicio}</td>
                <td class="border text-center px-2 py-1">{s.tipoHabitacion}</td>
                <td class="border text-center px-2 py-1">{s.nombreProducto}</td>
                <td class="border text-center px-2 py-1">{s.descripcion}</td>
            <!--     <td class="border text-center px-2 py-1">{s.halfDay}</td>
                <td class="border text-center px-2 py-1">{s.tourPrivado}</td>-->
                <td class="border text-center px-2 py-1">{s.noches}</td>
                <td class="border text-center px-2 py-1">{s.habitaciones}</td>
                <td class="border text-center px-2 py-1">{s.temporada}</td>
                <td class="border text-center px-2 py-1">{s.checkin}</td>
                <td class="border text-center px-2 py-1">{s.checkout}</td>
                <td class="border text-center px-2 py-1 text-right">${(s.subtotal || 0).toLocaleString('es-CL')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div class="text-right text-2xl font-bold text-gray-900 mb-10 no-break">
        Total: ${cotizacion.totalGeneral.toLocaleString('es-CL')}
      </div>
      <hr class="my-4" />
      <!-- Observaciones -->
      <div class="bg-gray-50 border-l-4 border-indigo-400 p-6 text-sm rounded-lg mb-8 no-break">
        <p class="font-semibold text-gray-700">Nota:</p>
        <p class="text-gray-600">Esta cotización es referencial y puede cambiar sin previo aviso.</p>
        <p class="text-gray-600">Tarifas sujetas a disponibilidad al momento de confirmar la reserva.</p>
      </div>

      <!-- Historial -->
      {#if cotizacion.eventos?.length}
        <div class="bg-white border border-gray-200 rounded-lg p-6 text-sm no-break">
          <h4 class="font-semibold text-gray-900 mb-3">Historial de acciones</h4>
          <ul class="space-y-2 text-gray-700">
            {#each cotizacion.eventos.sort((a, b) => a.fecha?.seconds - b.fecha?.seconds).filter((e, i, arr) => 
              arr.findIndex(x => x.fecha?.seconds === e.fecha?.seconds && x.comentario === e.comentario) === i
            ) as e}
              <li class="flex items-start">
                <span class="text-gray-500 min-w-[100px]">{formatear(e.fecha)}</span>
                <span class="ml-2">— <strong>{e.tipo}</strong> por {e.usuario}: <em>{e.comentario}</em></span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </div>
{/if}