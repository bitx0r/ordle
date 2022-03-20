
const ALPHACHARS = "qwertyuiopasdfghjklzxcvbnm";
const MATHCHARS = "1234567890-+*/=";
const MAXERRORS = 5;
const WORDLEN = 5;

let maxguesses;
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

function create_board(nochar, charclass, minrows, mincols, board) {
    let root = document.createElement("div");
    if (board.winner) {
        root.classList.add("win");
    }

    for (const guess of board.board) {
        // row
        let r = document.createElement("div");
        for (let i = 0; i < mincols; ++i) {
            // word
            let c = guess.g[i];
            let l = document.createElement("span");
            l.innerHTML = "&nbsp;";

            if (c) {
                l.classList.add(charclass);

                if (!c.v) {
                    l.classList.add("invalidword");                    
                }
                else {
                    l.classList.add(c.s);
                }

                if (!nochar) { 
                    l.innerHTML = c.c.length ? c.c : "&nbsp;"
                }
            }
            else {
                l.classList.add(charclass);
                l.classList.add("X");
                l.innerHTML = "&nbsp;";
            }

            r.appendChild(l);
        }
        root.appendChild(r);
    }

    for (let i = 0; i < minrows - board.board.length; ++i)
    {
        let r = document.createElement("div");
        for (let j = 0; j < mincols; ++j) {
            // word
            let l = document.createElement("span");
            l.innerHTML = "&nbsp;";

            l.classList.add(charclass);
            l.classList.add("X");
            l.innerHTML = "&nbsp;";
            r.appendChild(l);
        }
        root.appendChild(r);
    }

    return root;
}

function on_draw(gameid, minrows, mincols, board) {
    let root = document.getElementById("game"+gameid);
    let resultroot = document.getElementById("resultgame"+gameid);
    root.innerHTML = "";
    resultroot.innerHTML = "";

    let b = create_board(false, "guesschar", minrows, mincols, board);
    let r = create_board(true, "resultchar", minrows, mincols, board);

    root.appendChild(b);
    resultroot.appendChild(r);
}

function create_area(rows, cols, rowclass, colclass) {
    let a = document.createElement("span");

    for (let i=0; i < rows; ++i) {
        let boards = document.createElement("div");
        boards.classList.add(rowclass);
        boards.id = rowclass + "row" + i;

        for( let j=0; j < cols; ++j) {
            let game = document.createElement("span");
            game.classList.add(colclass);
            game.id = colclass + (i*cols + j);
            boards.appendChild(game);
        }

        a.appendChild(boards);
    }
    return a;
}

function setup_areas(rows, cols) {
    let boardarea = document.body.getElementsByClassName("boardarea")[0];
    let resultwindow = document.body.getElementsByClassName("resultwindow")[0];

    let b = create_area(rows, cols, "boards", "game");
    let r = create_area(rows, cols, "resultboards", "resultgame");

    boardarea.appendChild(b);
    resultwindow.appendChild(r);
}


async function new_game(i) {
    const word = await word_picker();

    let controller = new Controller(i, (k) => { return ALPHACHARS.includes(k); }, word, maxguesses, word_validator, on_done, (x) => update_keyboard(x));
    return controller;
}

async function redraw()
{
    for (let i=0; i < rows; ++i)
    {
        for (let j=0; j < cols; ++j ) {
            let b = controllers[i][j].get_board();
            on_draw(i*cols + j, maxguesses, WORDLEN, b);
        }
    }

}

async function on_input(ev)
{
    for (let i=0; i < rows; ++i)
    {
        for (let j=0; j < cols; ++j ) {
            controllers[i][j].on_input(ev);
        }
    }

    redraw();
}

async function on_load(r, c) {
    rows = r;
    cols = c;
    numboards = r*c;
    maxguesses = numboards + MAXERRORS;
    
    load_keyb(ALPHACHARS);
    setup_areas(r,c);
    document.addEventListener("keyup", (e)=> on_input(e));

    for (let i=0; i < rows; ++i)
    {
        let a = new Array();
        for (let j=0; j < cols; ++j ) {
            const g = await new_game(i*cols + j);
            a.push(g);
        }
        controllers.push(a);
    }

    redraw();
}