import { additionalUsers, randomUserMock } from "./FE4U-Lab3-mock.js";

const POOL = ["Mathematics", "Physics", "English", "Computer Science", "Dancing", "Chess", "Biology", "Chemistry", "Law", "Art", "Medicine", "Statistics"];
let roster = [];
let currentSortField = null;
let isAscending = true;

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

function render() {
    const container = document.querySelector('.cards');
    const favTrack = document.querySelector('.slider-track');

    const searchVal = document.getElementById('main-search')?.value.toLowerCase() || "";
    const ageF = document.getElementById('f-age')?.value || "all";
    const genderF = document.getElementById('f-sex')?.value || "all";
    const regionF = document.getElementById('f-region')?.value || "all";
    const photoF = document.getElementById('f-photo')?.checked;
    const favF = document.getElementById('f-fav')?.checked;

    const filtered = roster.filter(t => {
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

    container.innerHTML = filtered.map(t => `
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

    favTrack.innerHTML = roster.filter(t => t.favorite).map(t => `
        <div class="mini-card" onclick="showTeacherInfo('${t.id}')">
            <div class="avatar">
                ${t.picture ? `<img src="${t.picture}">` : `<div class="avatar text">${t.full_name[0]}</div>`}
            </div>
            <h4>${t.full_name.split(' ').join('<br>')}</h4>
            <p class="country">${t.country}</p>
        </div>
    `).join('');
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

            renderStats();
        };
    });
}

function renderStats() {
    const tbody = document.querySelector('.table tbody');
    tbody.innerHTML = roster.map(t => `
        <tr>
            <td>${t.full_name}</td>
            <td>${t.course}</td>
            <td>${t.age}</td>
            <td>${t.gender}</td>
            <td>${t.country}</td>
        </tr>
    `).join('');
}

const addForm = document.querySelector('#formModal form');
addForm.onsubmit = function(e) {
    e.preventDefault();
    const fd = new FormData(this);

    const dob = new Date(fd.get('dob'));
    const age = dob.getFullYear() ? (new Date().getFullYear() - dob.getFullYear()) : 30;

    const newTeacher = toEntry({
        full_name: fd.get('name'),
        course: fd.get('speciality'),
        country: fd.get('country'),
        city: fd.get('city'),
        email: fd.get('email'),
        phone: fd.get('phone'),
        gender: fd.get('gender'),
        note: fd.get('notes'),
        age: age
    });

    roster.unshift(newTeacher);
    render();
    renderStats();
    toggleModal('formModal');
    this.reset();
};

const init = () => {
    const allRaw = [...randomUserMock, ...additionalUsers];
    roster = Array.from(new Set(allRaw.map(u => u.email)))
        .map(email => toEntry(allRaw.find(u => u.email === email)));

    const countries = [...new Set(roster.map(t => t.country))].sort();
    const regSel = document.getElementById('f-region');
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        regSel.appendChild(opt);
    });

    document.getElementById('search-go').onclick = render;
    document.getElementById('main-search').oninput = render; // пошук під час друку
    document.querySelectorAll('.filters select, .filters input').forEach(el => {
        el.onchange = render;
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