const PROXY = 'https://api.allorigins.win/raw?url=';
const API_BASE = 'https://api.mangadex.org';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const url = `${API_BASE}/manga?title=${encodeURIComponent(query)}&limit=20&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&includes[]=cover_art&availableTranslatedLanguage[]=ru`;
        const response = await fetch(PROXY + encodeURIComponent(url));
        if (!response.ok) throw new Error('Ошибка API');
        const data = await response.json();

        const list = document.getElementById('manga-list');
        list.innerHTML = '';

        if (data.data.length === 0) {
            list.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Ничего не найдено 😢 Попробуй "Наруто", "Ван Пис", "Атака титанов" или английское название</p>';
            return;
        }

        data.data.forEach(manga => {
            const attrs = manga.attributes;
            const title = attrs.title.ru || attrs.title.en || attrs.title.ja || attrs.title['ja-ro'] || 'Без названия';
            const coverRel = manga.relationships.find(r => r.type === 'cover_art');
            const coverFile = coverRel ? coverRel.attributes?.fileName : '';
            const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${manga.id}/${coverFile}.256.jpg` : 'https://via.placeholder.com/200x300?text=No+Cover';

            const card = document.createElement('div');
            card.className = 'manga-card';
            card.innerHTML = `
                <img src="${coverUrl}" alt="${title}" loading="lazy">
                <h3>${title}</h3>
            `;
            card.onclick = () => showDetails(manga.id, title);
            list.appendChild(card);
        });

        list.style.display = 'grid';
    } catch (err) {
        console.error(err);
        document.getElementById('manga-list').innerHTML = '<p style="color:red;">Ошибка загрузки. Попробуй позже.</p>';
    }
}

async function showDetails(mangaId, mangaTitle) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    try {
        const infoUrl = `${API_BASE}/manga/${mangaId}?includes[]=cover_art`;
        const infoResp = await fetch(PROXY + encodeURIComponent(infoUrl));
        const info = await infoResp.json();

        const attrs = info.data.attributes;
        const description = attrs.description.ru || attrs.description.en || 'Нет описания';
        const coverRel = info.data.relationships.find(r => r.type === 'cover_art');
        const coverFile = coverRel ? coverRel.attributes.fileName : '';
        const coverUrl = coverFile ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFile}.512.jpg` : '';

        document.getElementById('manga-title').textContent = mangaTitle;
        document.getElementById('manga-cover').src = coverUrl;
        document.getElementById('manga-description').textContent = description;

        // Главы на русском в приоритете, новые сверху
        const chaptersUrl = `${API_BASE}/manga/${mangaId}/feed?limit=500&translatedLanguage[]=ru&translatedLanguage[]=en&order[volume]=desc&order[chapter]=desc`;
        const chaptersResp = await fetch(PROXY + encodeURIComponent(chaptersUrl));
        const chaptersData = await chaptersResp.json();

        const chaptersList = document.getElementById('chapters-list');
        chaptersList.innerHTML = '';

        chaptersData.data.forEach(ch => {
            const chAttrs = ch.attributes;
            const chapNum = chAttrs.chapter ? `Глава ${chAttrs.chapter}` : 'One-shot';
            const title = chAttrs.title ? ` - ${chAttrs.title}` : '';
            const lang = chAttrs.translatedLanguage === 'ru' ? ' (RU)' : ' (EN)';

            const li = document.createElement('li');
            li.textContent = `${chapNum}${title}${lang}`;
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
        const atHomeUrl = `${API_BASE}/at-home/server/${chapterId}`;
        const atHomeResp = await fetch(PROXY + encodeURIComponent(atHomeUrl));
        
        if (!atHomeResp.ok) {
            document.getElementById('pages-container').innerHTML = '<p style="text-align:center;color:red;">Глава недоступна (удалена или ограничена)</p>';
            return;
        }

        const atHome = await atHomeResp.json();

        const baseUrl = atHome.baseUrl;
        const hash = atHome.chapter.hash;
        const quality = 'data'; // 'dataSaver' для сжатых
        const pages = atHome.chapter[quality];

        currentPages = pages.map(file => PROXY + encodeURIComponent(`${baseUrl}/${quality}/${hash}/${file}`));
        currentPage = 0;

        document.getElementById('chapter-title').textContent = 'Глава загружена';
        renderPage();
    } catch (err) {
        document.getElementById('pages-container').innerHTML = '<p style="text-align:center;color:red;">Ошибка загрузки страниц</p>';
    }
}

// Остальные функции (renderPage, prev/next, back) — те же

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
