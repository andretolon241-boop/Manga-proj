const PROXY = 'https://api.allorigins.win/raw?url=';  // Этот прокси стабильнее и реже даёт 400/504

const BASE_URL = 'https://bato.to';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(PROXY + searchUrl);  // Без лишнего encodeURIComponent!
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const list = document.getElementById('manga-list');
        list.innerHTML = '';

        const items = doc.querySelectorAll('.item');  // Карточки поиска на bato.to
        if (items.length === 0) {
            list.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Ничего не найдено 😢 Попробуй "Наруто", "Ван Пис", "Тетрадь смерти"</p>';
            return;
        }

        items.forEach(item => {
            const link = item.querySelector('.item-title a') || item.querySelector('a');
            const title = link?.title || link?.textContent.trim() || 'Без названия';
            const seriesUrl = link?.href || '';
            const img = item.querySelector('img')?.src || 'https://via.placeholder.com/200x300?text=No+Cover';

            const card = document.createElement('div');
            card.className = 'manga-card';
            card.innerHTML = `
                <img src="${img}" alt="${title}" loading="lazy">
                <h3>${title}</h3>
            `;
            card.onclick = () => showDetails(seriesUrl, title);
            list.appendChild(card);
        });

        list.style.display = 'grid';
    } catch (err) {
        console.error(err);
        document.getElementById('manga-list').innerHTML = '<p style="color:red;">Ошибка поиска (прокси или сайт недоступен). Попробуй позже или другой браузер.</p>';
    }
}

async function showDetails(seriesUrl, mangaTitle) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    try {
        const response = await fetch(PROXY + seriesUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const cover = doc.querySelector('.attr-cover img')?.src || doc.querySelector('.cover img')?.src || '';
        const description = doc.querySelector('.limit')?.textContent.trim() || 'Нет описания';

        document.getElementById('manga-title').textContent = mangaTitle;
        document.getElementById('manga-cover').src = cover;
        document.getElementById('manga-description').textContent = description;

        const chaptersList = document.getElementById('chapters-list');
        chaptersList.innerHTML = '';

        const chapters = doc.querySelectorAll('.chapter-list .link');
        Array.from(chapters).reverse().forEach(ch => {
            const link = ch.querySelector('a');
            const chapTitle = link?.textContent.trim() || 'Глава';
            const chapUrl = link?.href || '';

            const li = document.createElement('li');
            li.textContent = chapTitle;
            li.style.cursor = 'pointer';
            li.onclick = () => readChapter(chapUrl);
            chaptersList.appendChild(li);
        });
    } catch (err) {
        alert('Ошибка загрузки деталей');
    }
}

async function readChapter(chapterUrl) {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'block';

    try {
        const response = await fetch(PROXY + chapterUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const imgs = doc.querySelectorAll('.page-img img, #reader img');
        currentPages = Array.from(imgs).map(img => img.src || img.dataset.src || img.getAttribute('data-src') || '');

        currentPage = 0;
        document.getElementById('chapter-title').textContent = 'Глава загружена';
        renderPage();
    } catch (err) {
        document.getElementById('pages-container').innerHTML = '<p style="color:red;">Ошибка загрузки страниц главы</p>';
    }
}

function renderPage() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    if (currentPages.length > 0 && currentPages[currentPage]) {
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
    if (searchInput) searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') searchManga();
    });
});
