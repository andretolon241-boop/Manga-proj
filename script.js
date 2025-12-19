const PROXY = 'https://corsproxy.io/?';  // Надёжный прокси
const API_PROVIDER = 'mangakakalot';  // Можно менять на mangadex если хочешь русский
const API_BASE = `https://api.consumet.org/manga/${API_PROVIDER}`;

let currentPages = [];
let currentPage = 0;

async function fetchJSON(url) {
    const response = await fetch(PROXY + encodeURIComponent(url));
    if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
    }
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Не JSON:', text.substring(0, 200));
        throw new Error('Сервер вернул не JSON (возможно, ошибка API)');
    }
}

// Поиск
async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const data = await fetchJSON(`${API_BASE}/${query}`);
        const list = document.getElementById('manga-list');
        list.innerHTML = '';

        if (data.length === 0) {
            list.innerHTML = '<p>Ничего не найдено 😢</p>';
            return;
        }

        data.forEach(manga => {
            const card = createMangaCard(manga);
            list.appendChild(card);
        });
    } catch (err) {
        document.getElementById('manga-list').innerHTML = '<p style="color:red;">Ошибка: ' + err.message + '</p>';
    }
}

// Детали манги
async function showDetails(id) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    try {
        const info = await fetchJSON(`${API_BASE}/info/${id}`);

        document.getElementById('manga-title').textContent = info.title;
        document.getElementById('manga-cover').src = info.image;
        document.getElementById('manga-description').textContent = info.description || 'Нет описания';

        const chaptersList = document.getElementById('chapters-list');
        chaptersList.innerHTML = '';

        info.chapters.reverse().forEach(ch => {
            const li = document.createElement('li');
            li.textContent = ch.title || `Глава ${ch.id}`;
            li.onclick = () => readChapter(ch.id);
            chaptersList.appendChild(li);
        });
    } catch (err) {
        alert('Ошибка деталей: ' + err.message);
    }
}

// Чтение главы
async function readChapter(chapterId) {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'block';

    try {
        const pagesData = await fetchJSON(`${API_BASE}/read/${chapterId}`);
        currentPages = pagesData.images.map(img => img.url);  // Consumet возвращает объекты
        currentPage = 0;

        document.getElementById('chapter-title').textContent = pagesData.title || 'Глава';
        renderPage();
    } catch (err) {
        alert('Ошибка главы: ' + err.message);
    }
}

// Популярные и новые (для главной)
async function loadPopular() {
    try {
        const data = await fetchJSON(`${API_BASE}/popular`);
        displayFeatured('popular-list', data.results.slice(0, 12));
    } catch (err) { console.error(err); }
}

async function loadLatest() {
    try {
        const data = await fetchJSON(`${API_BASE}/updated`);
        displayFeatured('latest-list', data.results.slice(0, 12));
    } catch (err) { console.error(err); }
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
        <img src="${manga.image || manga.cover}" alt="${manga.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
        <h3>${manga.title}</h3>
    `;
    card.onclick = () => showDetails(manga.id);
    return card;
}

// Остальные функции без изменений
function renderPage() { /* ... тот же код ... */ }
function prevPage() { /* ... */ }
function nextPage() { /* ... */ }
function backToList() { /* ... */ }
function backToDetails() { /* ... */ }

// Загрузка главной при старте
window.onload = () => {
    loadPopular();
    loadLatest();
};

// Enter в поиске
document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchManga();
});

