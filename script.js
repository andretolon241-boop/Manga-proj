const PROXY = 'https://corsproxy.io/?';
const API_BASE = 'https://mangahook-api.vercel.app/api';

let currentPages = [];
let currentPage = 0;

async function fetchJSON(url) {
    try {
        const response = await fetch(PROXY + encodeURIComponent(url));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error('Ошибка fetch:', err);
        return null;
    }
}

// Поиск
async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const data = await fetchJSON(`${API_BASE}/search?keyword=${encodeURIComponent(query)}`);
    const list = document.getElementById('manga-list');
    list.innerHTML = '';

    if (!data || data.result.length === 0) {
        list.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Ничего не найдено 😢</p>';
        return;
    }

    data.result.forEach(manga => list.appendChild(createMangaCard(manga)));
}

// Детали манги
async function showDetails(slug) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('featured-manga').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    const info = await fetchJSON(`${API_BASE}/manga/${slug}`);
    if (!info) return alert('Ошибка загрузки деталей');

    document.getElementById('manga-title').textContent = info.title;
    document.getElementById('manga-cover').src = info.image;
    document.getElementById('manga-description').textContent = info.description || 'Нет описания';

    const chaptersList = document.getElementById('chapters-list');
    chaptersList.innerHTML = '';
    info.chapters.reverse().forEach(ch => {
        const li = document.createElement('li');
        li.textContent = ch.title;
        li.style.cursor = 'pointer';
        li.onclick = () => readChapter(ch.slug);
        chaptersList.appendChild(li);
    });
}

// Чтение главы
async function readChapter(chapterSlug) {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'block';

    const pagesData = await fetchJSON(`${API_BASE}/chapter/${chapterSlug}`);
    if (!pagesData) return alert('Ошибка загрузки главы');

    currentPages = pagesData.images;
    currentPage = 0;
    document.getElementById('chapter-title').textContent = pagesData.title || 'Глава';
    renderPage();
}

// Рекомендации
async function loadPopular() {
    const data = await fetchJSON(`${API_BASE}/popular`);
    if (data) displayFeatured('popular-list', data.result.slice(0, 12));
}

async function loadLatest() {
    const data = await fetchJSON(`${API_BASE}/latest`);
    if (data) displayFeatured('latest-list', data.result.slice(0, 12));
}

function displayFeatured(containerId, mangas) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    mangas.forEach(manga => container.appendChild(createMangaCard(manga)));
}

function createMangaCard(manga) {
    const card = document.createElement('div');
    card.className = 'manga-card';
    card.innerHTML = `
        <img src="${manga.image}" alt="${manga.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
        <h3>${manga.title}</h3>
    `;
    card.onclick = () => showDetails(manga.slug);
    return card;
}

// Навигация страниц
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
    document.getElementById('featured-manga').style.display = 'block';
    document.getElementById('manga-list').style.display = 'grid';
}

function backToDetails() {
    document.getElementById('reader-section').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';
}

// Загрузка при старте + Enter
window.onload = () => {
    loadPopular();
    loadLatest();
};

document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchManga();
});

