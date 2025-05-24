<script lang="ts">
  import { db } from '$lib/firebase';
  import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';

  export let cotizacionId: string;
  const dispatch = createEventDispatcher();

  function generarIdReserva(): string {
    const numero = Math.floor(1000 + Math.random() * 9000);
    return `FF-DCH${numero}`;
  }

  async function confirmar() {
    if (!cotizacionId) {
      alert('Falta ID de cotización');
      return;
    }

    const ref = doc(db, 'cotizaciones', cotizacionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert('Cotización no encontrada');
      return;
    }

    const reservaId = generarIdReserva();
    const cotizacion = snap.data();

    const reserva = {
      ...cotizacion,
      id: reservaId,
      estado: 'Confirmada',
      creadaDesdeCotizacion: cotizacionId,
      creadoEn: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'reservas', reservaId), reserva);
      await updateDoc(ref, { estado: 'Confirmada' });

      dispatch('reservaConfirmada', { reservaId });

      alert(`Cotización confirmada. ID: ${reservaId}`);

      // 🔁 Redirige al detalle de la nueva reserva
      goto(`/reservas/${reservaId}`);
    } catch (error) {
      console.error('Error al confirmar:', error);
      alert('Error al confirmar la reserva.');
    }
  }
</script>

<button
  class="text-green-600 hover:underline"
  on:click={confirmar}
  aria-label="Confirmar cotización como reserva"
>
  Confirmar
</button>
