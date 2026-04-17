import { additionalUsers, randomUserMock } from "./FE4U-Lab3-mock.js";

const POOL = ["Mathematics","Physics","English","Computer Science","Dancing","Chess","Biology","Chemistry","Law","Art","Medicine","Statistics"];
const pickRandom = a => a[Math.random() * a.length | 0];
const capTest = s => typeof s === "string" && s.length > 0 && s[0] === s[0].toUpperCase() && s[0] !== s[0].toLowerCase();

const toEntry = src => {
    const loc = src.location ?? {};
    const pic = src.picture ?? {};
    return {
        gender: src.gender,
        title: src.name?.title ?? src.title,
        full_name: src.full_name ?? `${src.name?.first ?? ""} ${src.name?.last ?? ""}`.trim(),
        city: loc.city ?? src.city, state: loc.state ?? src.state,
        country: loc.country ?? src.country, postcode: loc.postcode ?? src.postcode,
        coordinates: loc.coordinates ?? src.coordinates, timezone: loc.timezone ?? src.timezone,
        email: src.email, b_date: src.dob?.date ?? src.b_date,
        age: src.dob?.age ?? src.age, phone: src.phone,
        picture_large: pic.large ?? src.picture_large,
        picture_thumbnail: pic.thumbnail ?? src.picture_thumbnail,
        id: src.login?.uuid ?? src.id?.value ?? (Math.random() + 1).toString(36).substring(2),
        favorite: src.favorite ?? false,
        course: src.course ?? pickRandom(POOL),
        bg_color: src.bg_color ?? "#ffffff",
        note: src.note ?? ""
    };
};

const dedupe = entries => Object.values(
    entries.reduce((acc, e) => (acc[e.email] ??= e, acc), {})
);

const getUsers = (a, b = []) => dedupe([...a, ...b].map(toEntry));

const audit = e => {
    const textFields = ["full_name", "state", "city", "country"];
    if (!textFields.every(f => capTest(e[f]))) return false;
    if (typeof e.gender !== "string") return false;
    if (e.note !== "" && !capTest(e.note)) return false;
    if (isNaN(+e.age)) return false;
    if (!/^[\d\s()+-]{7,}$/.test(e.phone ?? "")) return false;
    if (!e.email?.includes("@")) return false;
    return true;
};

const sift = (arr, q) => arr.filter(e =>
    Object.entries(q).every(([k, v]) => {
        if (k === "age" && v?.op) {
            const ops = { ">": ">", "<": "<", ">=": ">=", "<=": "<=" };
            return new Function("a", "b", `return a ${ops[v.op]} b`)(e.age, v.val);
        }
        return e[k] === v;
    })
);

const arrange = (arr, prop, dir = "asc") => {
    const get = e => prop === "b_date" ? +new Date(e.b_date) : e[prop];
    return [...arr].sort((a, b) => {
        const diff = get(a) < get(b) ? -1 : get(a) > get(b) ? 1 : 0;
        return dir === "asc" ? diff : -diff;
    });
};

const seek = (arr, val) =>
    arr.find(e => e.full_name?.includes(val) || e.note?.includes(val) || e.age === val) ?? null;

const share = (arr, q) => arr.length ? +(sift(arr, q).length / arr.length * 100).toFixed(2) : 0;

const roster = getUsers(randomUserMock, additionalUsers);

console.log(`Завантажено ${roster.length} користувачів`);
console.log(roster);
console.log(`Перший запис валідний: ${audit(roster[0])}`);
console.log(`Чоловіки: ${sift(roster, { gender: "male" }).length}`);
console.log(`Молодші 25: ${sift(roster, { age: { op: "<", val: 25 } }).length}`);
console.log(`Найстарший: ${arrange(roster, "age", "desc")[0]?.full_name}`);
console.log(`Пошук 'Claude': ${seek(roster, "Claude")?.full_name ?? "не знайдено"}`);
console.log(`% старших 40: ${share(roster, { age: { op: ">", val: 40 } })}%`);