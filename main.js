
const ALPHACHARS = "qwertyuiopasdfghjklzxcvbnm";
const MATHCHARS = "1234567890-+*/=";
const MAXERRORS = 5;
const WORDLEN = 5;

function word_validator(word) {
    return usable_words.includes(word) || allowed_words.includes(word);
}

let game_counter = 0;
async function word_picker() {
    const d = new Date();
    const zeroPad = (num) => num.toString().padStart(2, '0');
    const datenum = d.getUTCFullYear().toString() + zeroPad(d.getUTCMonth()) + zeroPad(d.getUTCDate()) + zeroPad(game_counter);
    const data = new TextEncoder().encode(datenum);
    const digest = await window.crypto.subtle.digest('SHA-256', data.buffer);
    const dv = new DataView(digest);
    const i = dv.getUint32() % usable_words.length;

    const word = usable_words[i];
    console.log ("game " + game_counter + " word is " + word);
    game_counter++;
    return {gameid: datenum, word: word};
}

let renderer;
async function on_load(r, c) {
    maxguesses = r*c + MAXERRORS;
    load_keyb(ALPHACHARS);

    renderer = new Renderer(r, c, true, maxguesses, ALPHACHARS, word_picker, word_validator, update_keyboard);
    renderer.start();
}