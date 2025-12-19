const API_BASE = 'https://api.mangalib.me/api';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${API_BASE}/manga/search?query=${encodeURIComponent(query)}&limit=20`);
        const data = await response.json();

        const list = document.getElementById('manga-list');
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Ничего не найдено 😢 Попробуй "Наруто", "Атака титанов", "Ван Пис"</p>';
            return;
        }

        data.forEach(manga => {
            const card = document.createElement('div');
            card.className = 'manga-card';
            card.innerHTML = `
                <img src="https://cover.imglib.info/uploads/cover/${manga.slug}/cover/250x350.jpg" alt="${manga.rus_name || manga.name}" loading="lazy">
                <h3>${manga.rus_name || manga.name}</h3>
            `;
            card.onclick = () => showDetails(manga.id, manga.rus_name || manga.name);
            list.appendChild(card);
        });

        list.style.display = 'grid';
    } catch (err) {
        document.getElementById('manga-list').innerHTML = '<p style="color:red;">Ошибка API</p>';
    }
}

async function showDetails(mangaId, title) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/manga/${mangaId}`);
        const info = await response.json();

        document.getElementById('manga-title').textContent = title;
        document.getElementById('manga-cover').src = `https://cover.imglib.info/uploads/cover/${info.slug}/cover/250x350.jpg`;
        document.getElementById('manga-description').textContent = info.description || 'Нет описания';

        const chaptersList = document.getElementById('chapters-list');
        chaptersList.innerHTML = '';

        const chaptersResponse = await fetch(`${API_BASE}/manga/${mangaId}/chapters`);
        const chaptersData = await chaptersResponse.json();

        chaptersData.forEach(ch => {
            const li = document.createElement('li');
            li.textContent = `Том ${ch.volume} Глава ${ch.number} ${ch.name || ''}`;
            li.style.cursor = 'pointer';
            li.onclick = () => readChapter(ch.id);
            chaptersList.appendChild(li);
        });
    } catch (err) {
        alert('Ошибка загрузки деталей');
    }
}

async function readChapter(chapterId) {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/chapter/${chapterId}`);
        const pagesData = await response.json();

        currentPages = pagesData.images.map(img => `https://img.imglib.info/${img}`);
        currentPage = 0;
        document.getElementById('chapter-title').textContent = 'Глава загружена';
        renderPage();
    } catch (err) {
        alert('Ошибка загрузки главы');
    }
}

// Остальные функции без изменений
function renderPage() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    if (currentPages.length > 0) {
        const img = document.createElement('img');
        img.src = currentPages[currentPage];
        img.loading = 'lazy';
        img.style.width = '100%';
        container.appendChild(img);
    }
    document.getElementById('page-info').textContent = `${currentPage + 1} / ${currentPages.length}`;
}

function prevPage() {
    if (currentPage > 0) { currentPage--; renderPage(); window.scrollTo(0, 0); }
}

function nextPage() {
    if (currentPage < currentPages.length - 1) { currentPage++; renderPage(); window.scrollTo(0, 0); }
}

function backToList() {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'none';
    document.getElementById('manga-list').style.display = 'grid';
}

function backToDetails() {
    document.getElementById('reader-section').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.querySelector('header button');
    if (searchButton) searchButton.addEventListener('click', searchManga);

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') searchManga(); });
});
