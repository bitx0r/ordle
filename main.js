
const ALPHACHARS = "qwertyuiopasdfghjklzxcvbnm";
const MATHCHARS = "1234567890-+*/=";
const MAXERRORS = 5;
const WORDLEN = 5;

function word_validator(word) {
    return usable_words.includes(word) || allowed_words.includes(word);
}

let game_counter = -1;
async function word_picker() {
    const d = new Date();
    const zeroPad = (num) => num.toString().padStart(2, '0');
    game_counter++;
    const current_game = game_counter;
    const datenum = d.getUTCFullYear().toString() + zeroPad(d.getUTCMonth()) + zeroPad(d.getUTCDate()) + zeroPad(current_game);
    const data = new TextEncoder().encode(datenum);
    let word = "";
    const digest = await window.crypto.subtle.digest('SHA-256', data.buffer);
    const dv = new DataView(digest);
    const i = dv.getUint32() % usable_words.length;

    word = usable_words[i];
    console.log ("game " + current_game + " word is " + word);

    return {gameid: datenum, word: word};
}

let renderer;
async function on_load(r, c) {
    let rows = r;
    let cols = c;
    const isNum = (s) => { return Number.isInteger(s) || /^[0-9]+$/.test(s); };
    const params = new URLSearchParams(window.location.search);
    const getNumParam = (k, or_value) => {
        if (params.has(k)) {
            const qr = params.get(k);
            if (isNum(qr)) {
                return Number.parseInt(qr);
            }
        }
        return or_value;
    };

    rows = getNumParam("r", rows);
    cols = getNumParam("c", cols);

    maxguesses = rows*cols + MAXERRORS;
    load_keyb(ALPHACHARS);

    renderer = new Renderer(rows, cols, true, maxguesses, ALPHACHARS, word_picker, word_validator, update_keyboard);
    renderer.start();
}