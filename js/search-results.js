document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    const searchInput = document.getElementById('searchInput');
    const searchTitle = document.getElementById('searchTitle');
    const searchSubtitle = document.getElementById('searchSubtitle');
    const resultsContainer = document.getElementById('resultsContainer');

    if (searchInput) {
        searchInput.value = query;
    }

    if (!query) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="color: var(--text-light); font-size: 1.125rem;">Digite algo na busca para ver os resultados.</p>
            </div>
        `;
        return;
    }

    // Update title
    searchTitle.textContent = `Resultados para "${query}"`;

    function normalize(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    // Load search index
    fetch('/search-index.json')
        .then(response => response.json())
        .then(data => {
            const normalizedQuery = normalize(query);
            const seriesResults = [];
            const cardsResults = [];

            function calculateScore(text, query, field) {
                const normalizedText = normalize(text);
                const normalizedQuery = normalize(query);

                if (!normalizedText.includes(normalizedQuery)) return 0;

                // Exact match
                if (normalizedText === normalizedQuery) return field === 'title' ? 100 : 50;

                // Starts with query
                if (normalizedText.startsWith(normalizedQuery)) return field === 'title' ? 75 : 35;

                // Contains query in title
                if (field === 'title') return 40;

                // Contains query in description
                return 15;
            }

            // Search in series
            data.series.forEach(serie => {
                const score = calculateScore(serie.nome_serie, query, 'title');
                if (score > 0) {
                    seriesResults.push({ ...serie, score });
                }
            });

            // Search in cards
            data.cards.forEach(card => {
                const titleScore = calculateScore(card.titulo, query, 'title');
                const textScore = card.texto_completo ? calculateScore(card.texto_completo, query, 'description') : 0;
                const score = Math.max(titleScore, textScore);

                if (score > 0) {
                    cardsResults.push({ ...card, score });
                }
            });

            // Sort by score (descending)
            seriesResults.sort((a, b) => b.score - a.score);
            cardsResults.sort((a, b) => b.score - a.score);

            displayResults(seriesResults, cardsResults);
        })
        .catch(err => {
            console.error('Failed to load search index:', err);
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="color: var(--text-light);">Erro ao carregar resultados. Tente novamente.</p>
                </div>
            `;
        });

    function displayResults(series, cards) {
        const totalResults = series.length + cards.length;

        if (totalResults === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <p style="color: var(--text-light); font-size: 1.125rem;">Nenhum resultado encontrado para "${query}".</p>
                    <p style="color: var(--text-light); margin-top: 1rem;">Tente usar palavras-chave diferentes.</p>
                </div>
            `;
            searchSubtitle.textContent = '0 resultados encontrados';
            return;
        }

        searchSubtitle.textContent = `${totalResults} resultado${totalResults > 1 ? 's' : ''} encontrado${totalResults > 1 ? 's' : ''}`;

        let html = '';

        // Series section
        if (series.length > 0) {
            html += `
                <section style="margin-bottom: 3rem;">
                    <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem;">Séries (${series.length})</h2>
                    <div class="grid grid-home">
                        ${series.map(serie => `
                            <a href="/series/${serie.slug}/" class="card-item">
                                <div class="card-img-wrapper horizontal">
                                    <img src="${serie.imagem}" alt="${serie.nome_serie}" class="card-img" loading="lazy">
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${serie.nome_serie}</h3>
                                    <div class="card-meta">
                                        <span>${serie.ano} • ${serie.total_cartoes} cartões</span>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Cards section
        if (cards.length > 0) {
            html += `
                <section>
                    <h2 style="margin-bottom: 1.5rem; font-size: 1.5rem;">Cartões (${cards.length})</h2>
                    <div class="grid grid-serie">
                        ${cards.map(card => {
                const orientation = card.orientacao || 'horizontal';
                return `
                            <a href="/series/${card.serie_slug}/${card.slug}/" class="card-item">
                                <div class="card-img-wrapper ${orientation}">
                                    <img src="${card.imagem}" alt="${card.titulo}" class="card-img" loading="lazy">
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${card.titulo}</h3>
                                    <div class="card-meta">
                                        <span>#${card.numero}</span>
                                        <span>${card.serie_nome}</span>
                                    </div>
                                </div>
                            </a>
                        `}).join('')}
                    </div>
                </section>
            `;
        }

        resultsContainer.innerHTML = html;
    }
});
