import html2pdf from 'html2pdf.js';

export async function generarPDFDesdeHtml(elementId: string): Promise<Blob> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`No se encontró el elemento HTML con ID "${elementId}"`);
    }

    // Configuración optimizada para html2pdf
    const opt = {
        margin: [10, 10, 10, 10], // Márgenes en mm (arriba, derecha, abajo, izquierda)
        image: { type: 'jpeg', quality: 0.98 }, // Alta calidad para imágenes
        html2canvas: {
            scale: 2, // Mayor resolución
            useCORS: true, // Soporte para imágenes externas (como el logo)
            logging: false, // Desactivar logs para producción
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            putOnlyUsedFonts: true, // Optimizar tamaño del PDF
            compress: true, // Comprimir el PDF
        },
    };

    try {
        return await html2pdf().set(opt).from(element).output('blob');
    } catch (error) {
        throw new Error(`Error al generar el PDF: ${error.message}`);
    }
}

export async function descargarPDFDesdeHtml(
    elementId: string,
    nombreArchivo = `cotizacion-${new Date().toISOString().slice(0, 10)}.pdf`
) {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`No se encontró el elemento HTML con ID "${elementId}"`);
    }

    // Configuración optimizada para descarga
    const opt = {
        margin: [10, 10, 10, 10], // Márgenes en mm
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
            putOnlyUsedFonts: true,
            compress: true,
        },
        // Agregar encabezado y pie de página personalizados
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }, // Evitar cortes en elementos
    };

    try {
        // Aplicar estilos temporales para el PDF
        element.classList.add('pdf-rendering');

        await html2pdf()
            .set(opt)
            .from(element)
            .toPdf()
            .get('pdf')
            .then((pdf: any) => {
                const totalPages = pdf.internal.getNumberOfPages();
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);

                    // Encabezado
                    pdf.setFontSize(8);
                    pdf.setTextColor(100);
                    pdf.text('Destino Chile - Cotización', 10, 8);
                    pdf.text(`CT-DCH${element.querySelector('h1')?.textContent?.slice(-4) || ''}`, pageWidth - 50, 8);

                    // Pie de página
                    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 20, pageHeight - 5);
                    pdf.text('Contacto: info@destinochile.cl', 10, pageHeight - 5);
                }
            })
            .save();

        // Remover estilos temporales
        element.classList.remove('pdf-rendering');
    } catch (error) {
        throw new Error(`Error al descargar el PDF: ${error.message}`);
    }
}