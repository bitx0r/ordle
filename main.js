
let ALPHACHARS = "qwertyuiopasdfghjklzxcvbnm";
let MATHCHARS = "1234567890-+*/=";

let numboards = 0;
let dones = {};
let controllers = new Array();
let rows = 0;
let cols = 0;
let game_counter = 0;


function word_validator(word) {
    return usable_words.includes(word) || allowed_words.includes(word);
}

async function word_picker() {
    const d = new Date();
    const datenum = ((d.getUTCFullYear()*100000) + (d.getUTCMonth()*1000) + (d.getUTCDate()*10) + (game_counter)).toString();
    const data = new TextEncoder().encode(datenum);
    const digest = await window.crypto.subtle.digest('SHA-256', data.buffer);
    const dv = new DataView(digest);
    const i = dv.getUint32() % usable_words.length;

    const word = usable_words[i];
    console.log ("game " + game_counter + " word is " + word);
    game_counter++;
    return word;
}

function copy_results() {
    var copyText = document.body.getElementsByClassName("resultwindow")[0].innerHTML;
  
    let t = document.createElement("textarea");
    t.innerHTML = copyText;
    t.select();
    navigator.clipboard.writeText(t.value);
  
    /* Alert the copied text */
    alert("Copied the text: " + copyText.value);
}

function on_done(gameid, winner) {
    console.log(winner ? "You win game " + gameid + "!" : "Lose game "+ gameid + ".");
    dones[gameid] = winner;

    if (Object.keys(dones).length === numboards)
    {
        //show_results();
    }
}

function on_draw(gameid, minrows, mincols, board) {
    let root = document.getElementById("game"+gameid);
    let resultroot = document.getElementById("resultgame"+gameid);
    root.innerHTML = "";
    resultroot.innerHTML = "";

    for (const guess of board.board) {
        // row
        let r = document.createElement("div");
        let rr = document.createElement("div");
        for (let i = 0; i < mincols; ++i) {
            // word
            let c = guess.g[i];
            let l = document.createElement("span");
            let rl = document.createElement("span");
            rl.innerHTML = "&nbsp;";

            if (c) {
                l.classList.add("guesschar");
                rl.classList.add("resultchar");
                if (!c.v) {
                    l.classList.add("invalidword");                    
                }
                else if (c.s === 'O') {
                    l.classList.add("correctchar");
                    rl.classList.add("correctchar");
                }
                else if (c.s === 'X') {
                    l.classList.add("wrongchar");
                    rl.classList.add("wrongchar");
                }
                else if (c.s === '?') {
                    l.classList.add("maybechar");
                    rl.classList.add("maybechar");
                }

                l.innerHTML = c.c.length ? c.c : "&nbsp;"
            }
            else {
                l.classList.add("guesschar");
                l.classList.add("wrongchar");
                rl.classList.add("resultchar");
                rl.classList.add("wrongchar");
                l.innerHTML = "&nbsp;";
            }

            r.appendChild(l);
            rr.appendChild(rl);
        }
        root.appendChild(r);
        resultroot.appendChild(rr);
    }

    for (let i = 0; i < minrows - board.board.length; ++i)
    {
        let r = document.createElement("div");
        let rr = document.createElement("div");
        for (let j = 0; j < mincols; ++j) {
            // word
            let l = document.createElement("span");
            let rl = document.createElement("span");
            rl.innerHTML = "&nbsp;";

            l.classList.add("guesschar");
            l.classList.add("wrongchar");
            rl.classList.add("resultchar");
            rl.classList.add("wrongchar");
            l.innerHTML = "&nbsp;";
            r.appendChild(l);
            rr.appendChild(rl);
        }
        root.appendChild(r);
        resultroot.appendChild(rr);
    }
}

function setup_areas(rows, cols) {
    let boardarea = document.body.getElementsByClassName("boardarea")[0];
    let resultwindow = document.body.getElementsByClassName("resultwindow")[0];
    for (let i=0; i < rows; ++i) {
        let boards = document.createElement("div");
        boards.classList.add("boards");
        let results = document.createElement("div");        
        results.classList.add("resultboards");

        for( let j=0; j < cols; ++j) {
            let game = document.createElement("span");
            game.classList.add("game");
            game.id = "game" + (i*cols + j);
            let resultgame = document.createElement("span");
            resultgame.classList.add("resultgame");
            resultgame.id = "resultgame" + (i*cols + j);

            boards.appendChild(game);
            results.appendChild(resultgame);
        }

        boardarea.appendChild(boards);
        resultwindow.appendChild(results);
    }
}

const MAXERRORS = 5;
async function new_game(n, i) {
    const word = await word_picker();
    const wordlen = word.length;
    const maxguesses = n + MAXERRORS;

    let controller = new Controller(i, (o) => on_draw(i, maxguesses, wordlen, o), (k) => { return ALPHACHARS.includes(k); }, word, maxguesses, word_validator, on_done, (x) => update_keyboard(x));
    controller.setup();
    controller.redraw();
    controllers.push(controller);
}

async function on_load(r, c) {
    rows = r;
    cols = c;
    load_keyb(ALPHACHARS);
    setup_areas(r,c);

    numboards = r*c;
    for (let i=0; i < numboards; ++i ) {
        await new_game(numboards, i);
    }
}