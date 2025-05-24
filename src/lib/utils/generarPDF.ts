import html2pdf from 'html2pdf.js';

/**
 * Estilos críticos que deben incluirse en el PDF, para evitar purgado de Tailwind o Vite.
 */
const ESTILOS_PDF = `
  body { font-size: 9pt; color: #1f2937; background: white; }
  .pdf-rendering { padding: 10mm; background: white; width: 190mm; }

  .pdf-rendering table {
    border: 0.5pt solid #d1d5db;
    font-size: 6.5pt;
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
    word-break: break-word;
  }

  .pdf-rendering th, .pdf-rendering td {
    border: 0.5pt solid #d1d5db;
    padding: 2pt 3pt;
    text-align: left;
    vertical-align: top;
  }

  .pdf-rendering th {
    background-color: #f3f4f6;
    font-weight: 600;
  }

  .text-2xl { font-size: 12pt; }
  .bg-amber-100 { background-color: #fef3c7; color: #92400e; }
  img { max-height: 35pt; width: auto; }
`;


/**
 * Crea un clon del elemento original con estilos embebidos y lo añade temporalmente al DOM.
 */
function prepararHTMLParaPDF(elementId: string): HTMLElement {
  const original = document.getElementById(elementId);
  if (!original) throw new Error(`No se encontró el elemento HTML con ID "${elementId}"`);

  const clone = original.cloneNode(true) as HTMLElement;
  const style = document.createElement('style');
  style.textContent = ESTILOS_PDF;
  clone.prepend(style);
  clone.classList.add('pdf-rendering');

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.appendChild(clone);
  document.body.appendChild(container);

  return container;
}

/**
 * Configuración común para html2pdf.
 */
function getOpcionesComunes() {
  return {
    margin: [10, 10, 10, 10],
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      putOnlyUsedFonts: true,
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
}

/**
 * Genera un Blob PDF desde un elemento HTML con ID especificado.
 */
export async function generarPDFDesdeHtml(elementId: string): Promise<Blob> {
  const container = prepararHTMLParaPDF(elementId);
  const clone = container.firstElementChild as HTMLElement;

  try {
    const blob = await html2pdf()
      .set(getOpcionesComunes())
      .from(clone)
      .output('blob');
    return blob;
  } catch (error) {
    throw new Error(`Error al generar el PDF: ${error.message}`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Descarga un PDF directamente desde un elemento HTML.
 */
export async function descargarPDFDesdeHtml(
  elementId: string,
  nombreArchivo = `cotizacion-${new Date().toISOString().slice(0, 10)}.pdf`
) {
  const container = prepararHTMLParaPDF(elementId);
  const clone = container.firstElementChild as HTMLElement;
  const original = document.getElementById(elementId);

  try {
    await html2pdf()
      .set({ ...getOpcionesComunes(), filename: nombreArchivo })
      .from(clone)
      .toPdf()
      .get('pdf')
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100);
          pdf.text('Destino Chile - Cotización', 10, 8);
          pdf.text(`CT-DCH${original?.querySelector('h1')?.textContent?.slice(-4) || ''}`, pageWidth - 50, 8);
          pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 5);
          pdf.text('Contacto: info@destinochile.cl', 10, pageHeight - 5);
        }
      })
      .save();
  } catch (error) {
    throw new Error(`Error al descargar el PDF: ${error.message}`);
  } finally {
    document.body.removeChild(container);
  }
}
