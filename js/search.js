document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchIndex = null;

    if (!searchInput) return;

    // Load search index
    fetch('/search-index.json')
        .then(response => response.json())
        .then(data => {
            searchIndex = data;
        })
        .catch(err => console.error('Failed to load search index:', err));

    function normalize(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    searchInput.addEventListener('input', (e) => {
        const query = normalize(e.target.value).trim();
        if (query.length < 2 || !searchIndex) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        const results = [];

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
        searchIndex.series.forEach(serie => {
            const score = calculateScore(serie.nome_serie, query, 'title');
            if (score > 0) {
                results.push({
                    type: 'série',
                    title: serie.nome_serie,
                    url: `/series/${serie.slug}/`,
                    subtitle: `Ano: ${serie.ano} - ${serie.total_cartoes} cartões`,
                    image: serie.imagem,
                    score: score
                });
            }
        });

        // Search in cards
        searchIndex.cards.forEach(card => {
            const titleScore = calculateScore(card.titulo, query, 'title');
            const textScore = card.texto_completo ? calculateScore(card.texto_completo, query, 'description') : 0;
            const score = Math.max(titleScore, textScore);

            if (score > 0) {
                results.push({
                    type: 'cartão',
                    title: card.titulo,
                    url: `/series/${card.serie_slug}/${card.slug}/`,
                    subtitle: `${card.serie_nome} (${card.ano}) - #${card.numero} de ${card.total_cartoes}`,
                    image: card.imagem,
                    score: score
                });
            }
        });

        // Sort by score (descending) and limit to 10
        results.sort((a, b) => b.score - a.score);
        displayResults(results.slice(0, 10));
    });

    function displayResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado.</div>';
        } else {
            searchResults.innerHTML = results.map(res => `
                <a href="${res.url}" class="search-result-item">
                    <img src="${res.image}" alt="${res.title}" class="search-result-image">
                    <div class="search-result-info">
                        <div class="search-result-header">
                            <span class="search-result-type">${res.type}</span>
                            ${res.subtitle ? `<span class="search-result-subtitle">${res.subtitle}</span>` : ''}
                        </div>
                        <div class="search-result-title">${res.title}</div>
                    </div>
                </a>
            `).join('');
        }
        searchResults.classList.add('active');
    }

    // Close search on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
});
