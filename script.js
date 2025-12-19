const API_BASE = 'https://api.mangadex.org';

let currentPages = [];
let currentPage = 0;
let currentQuality = 'data'; // 'data' для оригинала, 'dataSaver' для сжатого

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const response = await fetch(`${API_BASE}/manga?title=${encodeURIComponent(query)}&limit=20&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&order[followedCount]=desc`);
    const data = await response.json();

    const list = document.getElementById('manga-list');
    list.innerHTML = '';
    
    if (data.data.length === 0) {
        list.innerHTML = '<p>Ничего не найдено 😢 Попробуй на английском или оригинальном названии.</p>';
        return;
    }

    data.data.forEach(manga => {
        const attributes = manga.attributes;
        const title = attributes.title.en || attributes.title.ja || attributes.title['ja-ro'] || 'Без названия';
        const coverId = manga.relationships.find(rel => rel.type === 'cover_art')?.id || '';
        const coverUrl = coverId ? `https://uploads.mangadex.org/covers/${manga.id}/${coverId}.256.jpg` : '';

        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <img src="${coverUrl}" alt="${title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
            <h3>${title}</h3>
        `;
        card.onclick = () => showDetails(manga.id, title);
        list.appendChild(card);
    });
}

async function showDetails(mangaId, mangaTitle) {
    document.getElementById('manga-list').style.display = 'none';
    const detailsSection = document.getElementById('manga-details');
    detailsSection.style.display = 'block';

    // Детали манги
    const infoResponse = await fetch(`${API_BASE}/manga/${mangaId}?includes[]=cover_art`);
    const info = await infoResponse.json();
    const attributes = info.data.attributes;
    const description = attributes.description.en || attributes.description.ru || 'Нет описания';
    const coverId = info.data.relationships.find(rel => rel.type === 'cover_art')?.id || '';
    const coverUrl = coverId ? `https://uploads.mangadex.org/covers/${mangaId}/${coverId}.512.jpg` : '';

    document.getElementById('manga-title').textContent = mangaTitle;
    document.getElementById('manga-cover').src = coverUrl;
    document.getElementById('manga-description').textContent = description;

    // Главы (русский + английский, новые сверху)
    const chaptersResponse = await fetch(`${API_BASE}/manga/${mangaId}/feed?limit=500&translatedLanguage[]=ru&translatedLanguage[]=en&order[chapter]=desc&order[volume]=desc`);
    const chaptersData = await chaptersResponse.json();

    const chaptersList = document.getElementById('chapters-list');
    chaptersList.innerHTML = '';
    
    chaptersData.data.forEach(ch => {
        const attrs = ch.attributes;
        const chapNum = attrs.chapter ? `Глава ${attrs.chapter}` : 'One-shot';
        const vol = attrs.volume ? ` Том ${attrs.volume}` : '';
        const title = attrs.title ? ` - ${attrs.title}` : '';
        const lang = attrs.translatedLanguage === 'ru' ? ' (RU)' : ' (EN)';

        const li = document.createElement('li');
        li.textContent = `${chapNum}${vol}${title}${lang}`;
        li.onclick = () => readChapter(ch.id);
        chaptersList.appendChild(li);
    });
}

async function readChapter(chapterId) {
    document.getElementById('manga-details').style.display = 'none';
    const readerSection = document.getElementById('reader-section');
    readerSection.style.display = 'block';

    // Получаем сервер и хэш для страниц
    const atHomeResponse = await fetch(`${API_BASE}/at-home/server/${chapterId}?forcePort443=false`);
    const atHome = await atHomeResponse.json();

    const baseUrl = atHome.baseUrl;
    const hash = atHome.chapter.hash;
    const pages = atHome.chapter[currentQuality]; // массив имён файлов

    currentPages = pages.map(page => `${baseUrl}/${currentQuality}/${hash}/${page}`);

    currentPage = 0;
    document.getElementById('chapter-title').textContent = 'Глава загружена';
    renderPage();
}

function renderPage() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    if (currentPages.length > 0) {
        const img = document.createElement('img');
        img.src = currentPages[currentPage];
        img.loading = 'lazy';
        img.alt = `Страница ${currentPage + 1}`;
        container.appendChild(img);
    }
    document.getElementById('page-info').textContent = `${currentPage + 1} / ${currentPages.length}`;
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        renderPage();
        window.scrollTo(0, 0);
    }
}

function nextPage() {
    if (currentPage < currentPages.length - 1) {
        currentPage++;
        renderPage();
        window.scrollTo(0, 0);
    }
}

function backToList() {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('manga-list').style.display = 'grid';
}

function backToDetails() {
    document.getElementById('reader-section').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';
    currentPages = [];
}
