<script lang="ts">
  import { db } from '$lib/firebase';
  import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  export let cotizacionId: string;
  export let estado: string;
  export let mostrarConfirmar: boolean = true;
  export let mostrarDuplicar: boolean = true;

  function generarId(tipo: 'CT' | 'FF') {
    const numero = Math.floor(1000 + Math.random() * 9000);
    return `${tipo}-DCH${numero}`;
  }

  async function confirmar() {
    try {
      const ref = doc(db, 'cotizaciones', cotizacionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert('Cotización no encontrada');
        return;
      }

      const data = snap.data();
      const nuevaId = generarId('FF');

      await setDoc(doc(db, 'reservas', nuevaId), {
        ...data,
        id: nuevaId,
        estado: 'Confirmada',
        creadaDesdeCotizacion: cotizacionId,
        creadoEn: serverTimestamp()
      });

      await updateDoc(ref, { estado: 'Confirmada' });

      alert(`Reserva confirmada. ID: ${nuevaId}`);
      goto(`/reservas/${nuevaId}`);
    } catch (error) {
      console.error('Error al confirmar:', error);
      alert('Error al confirmar la cotización.');
    }
  }

  async function duplicar() {
    try {
      const ref = doc(db, 'cotizaciones', cotizacionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert('Cotización no encontrada');
        return;
      }

      const data = snap.data();
      const nuevaId = generarId('CT');

      await setDoc(doc(db, 'cotizaciones', nuevaId), {
        ...data,
        id: nuevaId,
        estado: 'Pendiente',
        creadoEn: serverTimestamp()
      });

      alert(`Cotización duplicada. ID: ${nuevaId}`);
goto(`/cotizaciones/${nuevaId}`);
    } catch (error) {
      console.error('Error al duplicar:', error);
      alert('Error al duplicar la cotización.');
    }
  }
</script>

<div class="flex gap-4 flex-wrap">
  {#if mostrarConfirmar && estado !== 'Confirmada'}
 <button
  on:click={confirmar}
  class="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
>
  Confirmar como reserva
</button>
  {/if}

  {#if mostrarDuplicar}
 <button
  on:click={duplicar}
  class="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition duration-200"
>
  Duplicar cotización
</button>
  {/if}
</div>
