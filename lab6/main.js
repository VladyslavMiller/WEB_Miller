const POOL = ["Mathematics", "Physics", "English", "Computer Science", "Dancing", "Chess", "Biology", "Chemistry", "Law", "Art", "Medicine", "Statistics"];
let roster = [];
let favScrollIndex = 0;
let chartInstance = null;
let activeMap = null;

const CARDS_PER_PAGE = 10;
let cardsPage = 1;
const API_SEED = "teachinder";
const DB_URL = 'http://localhost:3001/teachers';

const toEntry = src => {
    const loc = _.get(src, 'location', {});
    return {
        id: _.get(src, 'login.uuid') || _.get(src, 'id') || _.uniqueId('t_'),
        gender: _.get(src, 'gender'),
        full_name: _.get(src, 'full_name') || `${_.get(src, 'name.first', '')} ${_.get(src, 'name.last', '')}`.trim(),
        city: _.get(loc, 'city') || _.get(src, 'city') || "Unknown",
        country: _.get(loc, 'country') || _.get(src, 'country') || "Unknown",
        email: _.get(src, 'email'),
        age: parseInt(_.get(src, 'dob.age') || _.get(src, 'age') || 0),
        phone: _.get(src, 'phone') || "No phone",
        picture: _.get(src, 'picture.large') || _.get(src, 'picture_large'),
        favorite: _.get(src, 'favorite', false),
        course: _.get(src, 'course') || _.sample(POOL),
        note: _.get(src, 'note') || _.get(src, 'notes') || "",
        coordinates: {
            lat: parseFloat(_.get(loc, 'coordinates.latitude') || _.get(src, 'coordinates.lat') || 0),
            lng: parseFloat(_.get(loc, 'coordinates.longitude') || _.get(src, 'coordinates.lng') || 0)
        },
        dob: _.get(src, 'dob.date') || _.get(src, 'dob') || null
    };
};

async function fetchUsers(count = 50, page = 1) {
    const url = `https://randomuser.me/api/?results=${count}&seed=${API_SEED}&page=${page}`;
    const res = await fetch(url);
    const data = await res.json();
    return _.map(data.results, toEntry);
}

async function fetchFromDb() {
    try {
        const res = await fetch(DB_URL);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        return [];
    }
}

function getFiltered() {
    const searchVal = _.toLower(_.get(document.getElementById('main-search'), 'value', ''));
    const ageF = _.get(document.getElementById('f-age'), 'value', 'all');
    const genderF = _.get(document.getElementById('f-sex'), 'value', 'all');
    const regionF = _.get(document.getElementById('f-region'), 'value', 'all');
    const photoF = _.get(document.getElementById('f-photo'), 'checked', false);
    const favF = _.get(document.getElementById('f-fav'), 'checked', false);

    return _.filter(roster, t => {
        const matchesSearch = _.includes(_.toLower(t.full_name), searchVal) ||
            _.includes(_.toLower(t.note), searchVal) ||
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

function getDaysUntilBirthday(dobString) {
    if (!dobString) return "Невідомо";
    const today = dayjs().startOf('day');
    let bday = dayjs(dobString);
    let nextBday = bday.year(today.year()).startOf('day');
    if (nextBday.isBefore(today)) {
        nextBday = nextBday.add(1, 'year');
    }
    return nextBday.diff(today, 'day');
}

function render() {
    const container = document.querySelector('.cards');
    const favTrack = document.querySelector('.slider-track');

    const filtered = getFiltered();
    const totalPages = Math.ceil(filtered.length / CARDS_PER_PAGE);
    if (cardsPage > totalPages) cardsPage = 1;

    const pageSlice = _.slice(filtered, (cardsPage - 1) * CARDS_PER_PAGE, cardsPage * CARDS_PER_PAGE);

    container.innerHTML = _.map(pageSlice, t => `
        <div class="card" onclick="showTeacherInfo('${t.id}')">
            <div class="avatar">
                ${t.picture ? `<img src="${t.picture}">` : `<div class="avatar text">${_.map(t.full_name.split(' '), n => n[0]).join('.')}</div>`}
                ${t.favorite ? '<span class="star">★</span>' : ''}
            </div>
            <h3>${t.full_name}</h3>
            <p class="subject">${t.course}</p>
            <p class="country">${t.country}</p>
        </div>
    `).join('');

    renderCardsPagination(filtered.length, totalPages);

    const favorites = _.filter(roster, { favorite: true });
    favTrack.innerHTML = _.map(favorites, t => `
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
    const favorites = _.filter(roster, { favorite: true });
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
    const t = _.find(roster, { id: id });
    const modalBody = document.querySelector('#infoModal .modal-body');
    const daysLeft = getDaysUntilBirthday(t.dob);

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
                <p><b>Днів до наступного дня народження:</b> ${daysLeft}</p>
            </div>
        </div>
        <p style="margin-top:20px; line-height:1.6">${t.note || 'No notes available.'}</p>
        <div id="map" style="height: 200px; width: 100%; margin-top: 15px; border-radius: 4px; z-index: 1;"></div>
    `;

    toggleModal('infoModal');

    if (activeMap) {
        activeMap.remove();
        activeMap = null;
    }

    if (t.coordinates && (t.coordinates.lat !== 0 || t.coordinates.lng !== 0)) {
        activeMap = L.map('map').setView([t.coordinates.lat, t.coordinates.lng], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(activeMap);
        L.marker([t.coordinates.lat, t.coordinates.lng]).addTo(activeMap).bindPopup(t.full_name).openPopup();
    } else {
        document.getElementById('map').innerHTML = '<p style="text-align:center; padding-top:80px; color:#999;">Coordinates not found</p>';
    }
};

window.toggleFav = (id) => {
    const t = _.find(roster, { id: id });
    t.favorite = !t.favorite;
    render();
    showTeacherInfo(id);
};

function renderStats() {
    const filtered = getFiltered();

    const statsData = _.countBy(filtered, t => {
        if (t.age >= 18 && t.age <= 25) return '18-25 років';
        if (t.age >= 26 && t.age <= 35) return '26-35 років';
        if (t.age >= 36 && t.age <= 50) return '36-50 років';
        return '51+ років';
    });

    const labels = _.keys(statsData);
    const data = _.values(statsData);

    const ctx = document.getElementById('statsChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function validateTeacher(data) {
    const errors = [];
    if (_.isEmpty(_.trim(_.get(data, 'full_name'))) || _.get(data, 'full_name', '').length < 2) {
        errors.push("Name must be at least 2 characters.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_.get(data, 'email', ''))) {
        errors.push("Invalid email.");
    }
    if (!_.isEmpty(_.get(data, 'phone')) && !/^[+\d\s\-()]{6,}$/.test(_.get(data, 'phone'))) {
        errors.push("Invalid phone number.");
    }
    if (_.isEmpty(_.get(data, 'country'))) {
        errors.push("Country is required.");
    }
    return errors;
}

const addForm = document.querySelector('#formModal form');
addForm.onsubmit = async function(e) {
    e.preventDefault();
    const fd = new FormData(this);

    const dobVal = fd.get('dob');
    const dob = dayjs(dobVal);
    const age = dob.isValid() ? dayjs().diff(dob, 'year') : 30;

    const rawData = {
        full_name: fd.get('name'),
        course: fd.get('speciality'),
        country: fd.get('country'),
        city: fd.get('city'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        gender: fd.get('gender'),
        note: fd.get('notes'),
        age: age,
        dob: dobVal || null
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
    } catch (err) {}

    roster.unshift(newTeacher);
    cardsPage = 1;
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

    const existingIds = new Set(_.map(dbTeachers, 'id'));
    const uniqueApiUsers = _.filter(apiUsers, u => !existingIds.has(u.id));
    roster = _.concat(dbTeachers, uniqueApiUsers);

    const countries = _.sortBy(_.uniq(_.map(roster, 'country')));
    const regSel = document.getElementById('f-region');
    _.forEach(countries, c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        regSel.appendChild(opt);
    });

    document.getElementById('search-go').onclick = () => { cardsPage = 1; render(); renderStats(); };
    document.getElementById('main-search').oninput = () => { cardsPage = 1; render(); renderStats(); };
    _.forEach(document.querySelectorAll('.filters select, .filters input'), el => {
        el.onchange = () => { cardsPage = 1; render(); renderStats(); };
    });

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