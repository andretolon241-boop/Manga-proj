const PROXY = 'https://api.allorigins.win/raw?url=';  // Или 'https://api.allorigins.win/raw?url=' если первый не сработает
const API_BASE = 'https://mangahook-api.vercel.app/api';

let currentPages = [];
let currentPage = 0;

async function searchManga() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        alert('Введи название манги!');
        return;
    }

    try {
        const response = await fetch(PROXY + encodeURIComponent(`${API_BASE}/search?keyword=${encodeURIComponent(query)}`));
        if (!response.ok) throw new Error('API ошибка');
        const data = await response.json();

        const list = document.getElementById('manga-list');
        list.innerHTML = '';
        
        if (data.result.length === 0) {
            list.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Ничего не найдено 😢 Попробуй на английском: "One Piece", "Solo Leveling"</p>';
            return;
        }

        data.result.forEach(manga => {
            const card = document.createElement('div');
            card.className = 'manga-card';
            card.innerHTML = `
                <img src="${manga.image}" alt="${manga.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
                <h3>${manga.title}</h3>
            `;
            card.onclick = () => showDetails(manga.slug);
            list.appendChild(card);
        });
    } catch (err) {
        document.getElementById('manga-list').innerHTML = '<p style="color:red;">Ошибка загрузки. Попробуй другой прокси или позже.</p>';
        console.error(err);
    }
}

async function showDetails(slug) {
    document.getElementById('manga-list').style.display = 'none';
    const detailsSection = document.getElementById('manga-details');
    detailsSection.style.display = 'block';

    try {
        const response = await fetch(PROXY + encodeURIComponent(`${API_BASE}/manga/${slug}`));
        const info = await response.json();

        document.getElementById('manga-title').textContent = info.title;
        document.getElementById('manga-cover').src = info.image || 'https://via.placeholder.com/400x600';
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
    } catch (err) {
        alert('Ошибка загрузки деталей');
    }
}

async function readChapter(chapterSlug) {
    document.getElementById('manga-details').style.display = 'none';
    const readerSection = document.getElementById('reader-section');
    readerSection.style.display = 'block';

    try {
        const response = await fetch(PROXY + encodeURIComponent(`${API_BASE}/chapter/${chapterSlug}`));
        const pagesData = await response.json();

        currentPages = pagesData.images;
        currentPage = 0;

        document.getElementById('chapter-title').textContent = pagesData.title || 'Глава';
        renderPage();
    } catch (err) {
        alert('Ошибка загрузки главы');
    }
}

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
    document.getElementById('manga-list').style.display = 'grid';
}

function backToDetails() {
    document.getElementById('reader-section').style.display = 'none';
    document.getElementById('manga-details').style.display = 'block';
    currentPages = [];
}

// Enter для поиска
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchManga();
});

