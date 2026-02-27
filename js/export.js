document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadPdf');
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', () => {
        const element = document.getElementById('pdf-template');
        const seriesName = document.title.split(' - ')[0];

        // Show template temporarily for capturing
        element.style.display = 'block';

        const opt = {
            margin: [10, 5, 10, 5],
            filename: `${seriesName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            enableLinks: true,
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // UI feedback
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<span>Gerando...</span>';
        downloadBtn.disabled = true;

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }).catch(err => {
            console.error('PDF generation error:', err);
            element.style.display = 'none';
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
            alert('Erro ao gerar o PDF. Verifique se todas as imagens carregaram corretamente.');
        });
    });
});
