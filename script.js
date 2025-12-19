const API_BASE = 'https://mangahook-api.vercel.app/api';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    // Поиск: /search?keyword=...
    const response = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(query)}`);
    const data = await response.json();

    const list = document.getElementById('manga-list');
    list.innerHTML = '';
    
    if (data.result.length === 0) {
        list.innerHTML = '<p>Ничего не найдено 😢 Попробуй на английском.</p>';
        return;
    }

    data.result.forEach(manga => {
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <img src="${manga.image}" alt="${manga.title}">
            <h3>${manga.title}</h3>
        `;
        card.onclick = () => showDetails(manga.slug); // slug вместо id
        list.appendChild(card);
    });
}

async function showDetails(slug) {
    document.getElementById('manga-list').style.display = 'none';
    const detailsSection = document.getElementById('manga-details');
    detailsSection.style.display = 'block';

    // Детали: /manga/slug
    const infoResponse = await fetch(`${API_BASE}/manga/${slug}`);
    const info = await infoResponse.json();

    document.getElementById('manga-title').textContent = info.title;
    document.getElementById('manga-cover').src = info.image;
    document.getElementById('manga-description').textContent = info.description || 'Нет описания';

    const chaptersList = document.getElementById('chapters-list');
    chaptersList.innerHTML = '';
    
    // Главы в обратном порядке (новые сверху)
    info.chapters.reverse().forEach(ch => {
        const li = document.createElement('li');
        li.textContent = ch.title;
        li.onclick = () => readChapter(ch.slug); // slug главы
        chaptersList.appendChild(li);
    });
}

async function readChapter(chapterSlug) {
    document.getElementById('manga-details').style.display = 'none';
    const readerSection = document.getElementById('reader-section');
    readerSection.style.display = 'block';

    // Страницы главы: /chapter/slug
    const pagesResponse = await fetch(`${API_BASE}/chapter/${chapterSlug}`);
    const pagesData = await pagesResponse.json();

    currentPages = pagesData.images; // массив URL изображений
    currentPage = 0;

    document.getElementById('chapter-title').textContent = pagesData.title || 'Глава';
    renderPage();
}

function renderPage() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    if (currentPages.length > 0) {
        const img = document.createElement('img');
        img.src = currentPages[currentPage];
        img.loading = 'lazy'; // для быстрой загрузки
        container.appendChild(img);
    }
    document.getElementById('page-info').textContent = `${currentPage + 1} / ${currentPages.length}`;
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        renderPage();
        window.scrollTo(0, 0); // скролл вверх
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