const API_BASE = 'https://api.comick.io';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const response = await fetch(`${API_BASE}/v1.0/search?q=${encodeURIComponent(query)}&limit=20`);
    const data = await response.json();

    const list = document.getElementById('manga-list');
    list.innerHTML = '';
    
    if (data.length === 0) {
        list.innerHTML = '<p>Ничего не найдено 😢 Попробуй "One Piece" или "Solo Leveling".</p>';
        return;
    }

    data.forEach(manga => {
        const card = document.createElement('div');
        card.className = 'manga-card';
        card.innerHTML = `
            <img src="${manga.md_covers[0]?.b2key ? 'https://meo.comick.io/' + manga.md_covers[0].b2key : 'https://via.placeholder.com/200x300?text=No+Cover'}" alt="${manga.title}">
            <h3>${manga.title}</h3>
        `;
        card.onclick = () => showDetails(manga.slug);
        list.appendChild(card);
    });
}

async function showDetails(slug) {
    document.getElementById('manga-list').style.display = 'none';
    const detailsSection = document.getElementById('manga-details');
    detailsSection.style.display = 'block';

    const infoResponse = await fetch(`${API_BASE}/v1.0/comic/${slug}`);
    const info = await infoResponse.json();

    document.getElementById('manga-title').textContent = info.comic.title;
    document.getElementById('manga-cover').src = info.comic.md_covers[0]?.b2key ? 'https://meo.comick.io/' + info.comic.md_covers[0].b2key : '';
    document.getElementById('manga-description').textContent = info.comic.description || 'Нет описания';

    const chaptersList = document.getElementById('chapters-list');
    chaptersList.innerHTML = '';
    
    // Главы новые сверху
    info.chapters.slice().reverse().forEach(ch => {
        const li = document.createElement('li');
        li.textContent = `Глава ${ch.chap} ${ch.title ? ' - ' + ch.title : ''}`;
        li.onclick = () => readChapter(ch.hid);
        chaptersList.appendChild(li);
    });
}

async function readChapter(chapterHid) {
    document.getElementById('manga-details').style.display = 'none';
    const readerSection = document.getElementById('reader-section');
    readerSection.style.display = 'block';

    const pagesResponse = await fetch(`${API_BASE}/v1.0/chapter/${chapterHid}`);
    const pagesData = await pagesResponse.json();

    currentPages = pagesData.chapter.images.map(img => 'https://meo.comick.io/' + img.b2key);
    currentPage = 0;

    document.getElementById('chapter-title').textContent = `Глава ${pagesData.chapter.chap}`;
    renderPage();
}

function renderPage() {
    const container = document.getElementById('pages-container');
    container.innerHTML = '';
    if (currentPages.length > 0) {
        const img = document.createElement('img');
        img.src = currentPages[currentPage];
        img.loading = 'lazy';
        container.appendChild(img);
    }
    document.getElementById('page-info').textContent = `${currentPage + 1} / ${currentPages.length}`;
}

function prevPage() {
    if (currentPage > 0) currentPage--, renderPage(), window.scrollTo(0, 0);
}

function nextPage() {
    if (currentPage < currentPages.length - 1) currentPage++, renderPage(), window.scrollTo(0, 0);
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
