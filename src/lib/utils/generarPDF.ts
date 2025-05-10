import html2pdf from 'html2pdf.js';

export async function generarPDFDesdeHtml(elementId: string): Promise<Blob> {
	const element = document.getElementById(elementId);
	if (!element) throw new Error('No se encontró el elemento HTML');
	return html2pdf().from(element).outputPdf('blob');
}

export async function descargarPDFDesdeHtml(elementId: string, nombreArchivo = 'cotizacion.pdf') {
	const element = document.getElementById(elementId);
	if (!element) throw new Error('No se encontró el elemento HTML');
	await html2pdf()
		.set({
			filename: nombreArchivo,
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: { scale: 2 },
			jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
		})
		.from(element)
		.save();
}
