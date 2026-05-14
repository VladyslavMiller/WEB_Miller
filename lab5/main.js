const POOL = ["Mathematics", "Physics", "English", "Computer Science", "Dancing", "Chess", "Biology", "Chemistry", "Law", "Art", "Medicine", "Statistics"];
let roster = [];
let currentSortField = null;
let isAscending = true;
let favScrollIndex = 0;

const CARDS_PER_PAGE = 10;
const TABLE_PER_PAGE = 10;
let cardsPage = 1;
let tablePage = 1;

let apiPage = 1;
const API_SEED = "teachinder";
const DB_URL = 'http://localhost:3001/teachers';

const toEntry = src => {
    const loc = src.location ?? {};
    return {
        id: src.login?.uuid ?? src.id ?? Math.random().toString(36).substring(7),
        gender: src.gender,
        full_name: src.full_name ?? `${src.name?.first ?? ""} ${src.name?.last ?? ""}`.trim(),
        city: loc.city ?? src.city ?? "Unknown",
        country: loc.country ?? src.country ?? "Unknown",
        email: src.email,
        age: src.dob?.age ?? src.age,
        phone: src.phone ?? "No phone",
        picture: src.picture?.large ?? src.picture_large,
        favorite: src.favorite ?? false,
        course: src.course ?? POOL[Math.floor(Math.random() * POOL.length)],
        note: src.note ?? src.notes ?? ""
    };
};

async function fetchUsers(count = 50, page = 1) {
    const url = `https://randomuser.me/api/?results=${count}&seed=${API_SEED}&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.results.map(toEntry);
}

async function fetchFromDb() {
    try {
        const res = await fetch(DB_URL);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.warn('json-server not available, skipping DB load.', err);
        return [];
    }
}

function getFiltered() {
    const searchVal = document.getElementById('main-search')?.value.toLowerCase() || "";
    const ageF = document.getElementById('f-age')?.value || "all";
    const genderF = document.getElementById('f-sex')?.value || "all";
    const regionF = document.getElementById('f-region')?.value || "all";
    const photoF = document.getElementById('f-photo')?.checked;
    const favF = document.getElementById('f-fav')?.checked;

    return roster.filter(t => {
        const matchesSearch = t.full_name.toLowerCase().includes(searchVal) ||
            t.note.toLowerCase().includes(searchVal) ||
            String(t.age) === searchVal;

        const matchesGender = genderF === 'all' || t.gender === genderF;
        const matchesRegion = regionF === 'all' || t.country === regionF;
        const matchesPhoto = !photoF || t.picture;
        const matchesFav = !favF || t.favorite;

        let matchesAge = true;
        if (ageF === '18-25') matchesAge = t.age >= 18 && t.age <= 25;
        else if (ageF === '26-35') matchesAge = t.age >= 26 && t.age <= 35;
        else if (ageF === '36-50') matchesAge = t.age >= 36 && t.age <= 50;

        return matchesSearch && matchesGender && matchesRegion && matchesPhoto && matchesFav && matchesAge;
    });
}

function render() {
    const container = document.querySelector('.cards');
    const favTrack = document.querySelector('.slider-track');

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
    if (cardsPage > totalPages) cardsPage = 1;

    const pageSlice = filtered.slice((cardsPage - 1) * CARDS_PER_PAGE, cardsPage * CARDS_PER_PAGE);

    container.innerHTML = pageSlice.map(t => `
        <div class="card" onclick="showTeacherInfo('${t.id}')">
            <div class="avatar">
                ${t.picture ? `<img src="${t.picture}">` : `<div class="avatar text">${t.full_name.split(' ').map(n=>n[0]).join('.')}</div>`}
                ${t.favorite ? '<span class="star">★</span>' : ''}
            </div>
            <h3>${t.full_name}</h3>
            <p class="subject">${t.course}</p>
            <p class="country">${t.country}</p>
        </div>
    `).join('');

    renderCardsPagination(filtered.length, totalPages);

    const favorites = roster.filter(t => t.favorite);
    favTrack.innerHTML = favorites.map(t => `
        <div class="mini-card" onclick="showTeacherInfo('${t.id}')">
            <div class="avatar">
                ${t.picture ? `<img src="${t.picture}">` : `<div class="avatar text">${t.full_name[0]}</div>`}
            </div>
            <h4>${t.full_name.split(' ').join('<br>')}</h4>
            <p class="country">${t.country}</p>
        </div>
    `).join('');

    updateFavSlider();
}

function updateFavSlider() {
    const favTrack = document.querySelector('.slider-track');
    if (!favTrack) return;

    const step = 160;
    favTrack.style.transform = `translateX(-${favScrollIndex * step}px)`;
}

window.slideFav = (direction) => {
    const favorites = roster.filter(t => t.favorite);

    const visibleCards = 5;
    const maxIndex = Math.max(0, favorites.length - visibleCards);

    if (direction === 'left') {
        favScrollIndex = Math.max(0, favScrollIndex - 1);
    } else {
        favScrollIndex = Math.min(maxIndex, favScrollIndex + 1);
    }

    updateFavSlider();
};

function renderCardsPagination(total, totalPages) {
    const container = document.getElementById('pagination-cards');
    if (!container) return;

    container.innerHTML = `
        <div class="pagination-controls">
            <button ${cardsPage <= 1 ? 'disabled' : ''} id="cards-prev">&#10094; Prev</button>
            <span>Page ${cardsPage} / ${totalPages || 1}</span>
            <button ${cardsPage >= totalPages ? 'disabled' : ''} id="cards-next">Next &#10095;</button>
        </div>
    `;

    document.getElementById('cards-prev')?.addEventListener('click', () => { cardsPage--; render(); });
    document.getElementById('cards-next')?.addEventListener('click', () => { cardsPage++; render(); });
}

window.showTeacherInfo = (id) => {
    const t = roster.find(x => x.id === id);
    const modalBody = document.querySelector('#infoModal .modal-body');

    modalBody.innerHTML = `
        <div style="display:flex; gap:20px; align-items:flex-start">
            <div class="avatar" style="width:140px; height:140px; flex-shrink:0">
                ${t.picture ? `<img src="${t.picture}" style="width:100%; border-radius:4px">` : `<div class="avatar text" style="width:100%; height:100%; background:#eee; display:flex; align-items:center; justify-content:center">${t.full_name[0]}</div>`}
            </div>
            <div>
                <h2 style="margin-top:0">${t.full_name} <span style="cursor:pointer; color:orange" onclick="toggleFav('${t.id}')">${t.favorite ? '★' : '☆'}</span></h2>
                <p><b>${t.course}</b></p>
                <p>${t.city}, ${t.country}</p>
                <p>${t.age}, ${t.gender}</p>
                <p><a href="mailto:${t.email}">${t.email}</a></p>
                <p>${t.phone}</p>
            </div>
        </div>
        <p style="margin-top:20px; line-height:1.6">${t.note || 'No notes available.'}</p>
    `;
    toggleModal('infoModal');
};

window.toggleFav = (id) => {
    const t = roster.find(x => x.id === id);
    t.favorite = !t.favorite;
    render();
    showTeacherInfo(id);
};

function setupTableSorting() {
    const headers = document.querySelectorAll('.table th');

    headers.forEach(th => {
        th.style.cursor = 'pointer';
        th.onclick = () => {
            const headerText = th.textContent.replace(/[▲▼]/g, '').trim().toLowerCase();

            const fieldMap = {
                'name': 'full_name',
                'speciality': 'course',
                'age': 'age',
                'gender': 'gender',
                'nationality': 'country'
            };

            const field = fieldMap[headerText];
            if (!field) return;

            if (currentSortField === field) {
                isAscending = !isAscending;
            } else {
                currentSortField = field;
                isAscending = true;
            }

            roster.sort((a, b) => {
                let aV = a[field];
                let bV = b[field];

                if (typeof aV === 'string') {
                    aV = aV.toLowerCase();
                    bV = bV.toLowerCase();
                }

                if (aV < bV) return isAscending ? -1 : 1;
                if (aV > bV) return isAscending ? 1 : -1;
                return 0;
            });

            headers.forEach(h => {
                h.textContent = h.textContent.replace(/[▲▼]/g, '').trim();
            });
            th.textContent += isAscending ? ' ▲' : ' ▼';

            tablePage = 1;
            renderStats();
        };
    });
}

function renderStats() {
    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / TABLE_PER_PAGE);
    if (tablePage > totalPages) tablePage = 1;

    const pageSlice = filtered.slice((tablePage - 1) * TABLE_PER_PAGE, tablePage * TABLE_PER_PAGE);

    const tbody = document.querySelector('.table tbody');
    tbody.innerHTML = pageSlice.map(t => `
        <tr>
            <td>${t.full_name}</td>
            <td>${t.course}</td>
            <td>${t.age}</td>
            <td>${t.gender}</td>
            <td>${t.country}</td>
        </tr>
    `).join('');

    renderTablePagination(filtered.length, totalPages);
}

function renderTablePagination(total, totalPages) {
    const container = document.getElementById('pagination-table');
    if (!container) return;

    container.innerHTML = `
        <div class="pagination-controls">
            <button ${tablePage <= 1 ? 'disabled' : ''} id="table-prev">&#10094; Prev</button>
            <span>Page ${tablePage} / ${totalPages || 1}</span>
            <button ${tablePage >= totalPages ? 'disabled' : ''} id="table-next">Next &#10095;</button>
        </div>
    `;

    document.getElementById('table-prev')?.addEventListener('click', () => { tablePage--; renderStats(); });
    document.getElementById('table-next')?.addEventListener('click', () => { tablePage++; renderStats(); });
}

function validateTeacher(data) {
    const errors = [];
    if (!data.full_name || data.full_name.trim().length < 2) errors.push("Name must be at least 2 characters.");
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Invalid email.");
    if (data.phone && !/^[+\d\s\-()]{6,}$/.test(data.phone)) errors.push("Invalid phone number.");
    if (!data.country) errors.push("Country is required.");
    return errors;
}

const addForm = document.querySelector('#formModal form');
addForm.onsubmit = async function(e) {
    e.preventDefault();
    const fd = new FormData(this);

    const dob = new Date(fd.get('dob'));
    const age = dob.getFullYear() ? (new Date().getFullYear() - dob.getFullYear()) : 30;

    const rawData = {
        full_name: fd.get('name'),
        course: fd.get('speciality'),
        country: fd.get('country'),
        city: fd.get('city'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        gender: fd.get('gender'),
        note: fd.get('notes'),
        age: age
    };

    const errors = validateTeacher(rawData);
    if (errors.length > 0) {
        alert("Validation errors:\n" + errors.join("\n"));
        return;
    }

    const newTeacher = toEntry(rawData);

    try {
        const res = await fetch(DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTeacher)
        });
        if (res.ok) {
            const saved = await res.json();
            newTeacher.id = saved.id ?? newTeacher.id;
        }
    } catch (err) {
        console.warn('json-server not available, saving locally only.', err);
    }

    roster.unshift(newTeacher);
    cardsPage = 1;
    tablePage = 1;
    render();
    renderStats();
    toggleModal('formModal');
    this.reset();
};

const init = async () => {
    const [apiUsers, dbTeachers] = await Promise.all([
        fetchUsers(50, 1).catch(() => []),
        fetchFromDb()
    ]);

    const existingIds = new Set(dbTeachers.map(t => t.id));
    const uniqueApiUsers = apiUsers.filter(u => !existingIds.has(u.id));
    roster = [...dbTeachers, ...uniqueApiUsers];

    const countries = [...new Set(roster.map(t => t.country))].sort();
    const regSel = document.getElementById('f-region');
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        regSel.appendChild(opt);
    });

    document.getElementById('search-go').onclick = () => { cardsPage = 1; tablePage = 1; render(); renderStats(); };
    document.getElementById('main-search').oninput = () => { cardsPage = 1; tablePage = 1; render(); renderStats(); };
    document.querySelectorAll('.filters select, .filters input').forEach(el => {
        el.onchange = () => { cardsPage = 1; tablePage = 1; render(); renderStats(); };
    });

    setupTableSorting();
    render();
    renderStats();
};

window.toggleModal = (id) => {
    const el = document.getElementById(id);
    const isVisible = (el.style.display === 'flex');
    el.style.display = isVisible ? 'none' : 'flex';
    document.body.style.overflow = isVisible ? 'auto' : 'hidden';
};

init();