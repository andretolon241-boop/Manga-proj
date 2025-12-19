const BASE_URL = 'https://e.readmanga.io';  // Зеркало, работает стабильно

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const list = document.getElementById('manga-list');
        list.innerHTML = '';

        const items = doc.querySelectorAll('.tile');
        if (items.length === 0) {
            list.innerHTML = '<p style="grid-column:1/-1;text-align:center;">Ничего не найдено 😢 Попробуй "Наруто", "Атака титанов", "Тетрадь смерти"</p>';
            return;
        }

        items.forEach(item => {
            const link = item.querySelector('a');
            const title = link?.textContent.trim() || 'Без названия';
            const url = link?.href || '';
            const img = item.querySelector('img')?.src || 'https://via.placeholder.com/200x300?text=No+Cover';

            const card = document.createElement('div');
            card.className = 'manga-card';
            card.innerHTML = `
                <img src="${img}" alt="${title}" loading="lazy">
                <h3>${title}</h3>
            `;
            card.onclick = () => showDetails(url, title);
            list.appendChild(card);
        });

        list.style.display = 'grid';
    } catch (err) {
        alert('Ошибка поиска');
    }
}

async function showDetails(seriesUrl, title) {
    document.getElementById('manga-list').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';

    try {
        const response = await fetch(seriesUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const cover = doc.querySelector('.picture-f img')?.src || '';
        const description = doc.querySelector('.manga-description')?.textContent.trim() || 'Нет описания';

        document.getElementById('manga-title').textContent = title;
        document.getElementById('manga-cover').src = cover;
        document.getElementById('manga-description').textContent = description;

        const chaptersList = document.getElementById('chapters-list');
        chaptersList.innerHTML = '';

        const chapters = doc.querySelectorAll('.chapters-list li a');
        Array.from(chapters).reverse().forEach(ch => {
            const chapTitle = ch.textContent.trim();
            const chapUrl = ch.href;

            const li = document.createElement('li');
            li.textContent = chapTitle;
            li.style.cursor = 'pointer';
            li.onclick = () => readChapter(chapUrl);
            chaptersList.appendChild(li);
        });
    } catch (err) {
        alert('Ошибка деталей');
    }
}

async function readChapter(chapterUrl) {
    document.getElementById('manga-details').style.display = 'none';
    document.getElementById('reader-section').style.display = 'block';

    try {
        const response = await fetch(chapterUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const imgs = doc.querySelectorAll('.reader-area img');
        currentPages = Array.from(imgs).map(img => img.src);

        currentPage = 0;
        document.getElementById('chapter-title').textContent = 'Глава загружена';
        renderPage();
    } catch (err) {
        alert('Ошибка главы');
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
