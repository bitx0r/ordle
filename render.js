class Renderer {
    constructor(rows, cols, asciimode, maxguesses, charset, word_picker, word_validator, update_keyboard) {
        this.rows = rows;
        this.cols = cols;
        this.dones = {};
        this.controllers = new Array();
        this.maxguesses = maxguesses;
        this.numboards = this.rows*this.cols;
        this.charset = charset;
        this.word_picker = word_picker;
        this.word_validator = word_validator;
        this.update_keyboard = update_keyboard;
        this.is_done = false;
        this.datekey = this.get_date_key();
        this.wordlen = 0;

        const savedMode = window.localStorage.getItem("view");

        if (savedMode === "ascii") {
            this.set_ascii_mode()
        }
        else if (savedMode === "regular") {
            this.set_regular_mode();    
        }
        else {
            this.set_regular_mode();

            if (asciimode) {
                this.set_ascii_mode()
            }
        }

        this.clean_up_old(this.datekey);

        document.addEventListener("keydown", (e)=> { return this.on_input(e);} );
    }

    toggle_mode() {
        if (this.guesscharclass === "asciiguesschar") {
            this.regular_mode();
            return;
        }
        this.ascii_mode();
    }

    set_ascii_mode() {
        this.guessrowclass = "asciiguessrow";
        this.guesscharclass = "asciiguesschar";
        this.resultcharclass = "asciiresultchar";
        this.resultrowclass = "asciiresultrow";
        this.showcursor = true;
        let display_toggle = document.getElementById("display_toggle");
        display_toggle.innerHTML = "Grid View";
        window.localStorage.setItem("view", "ascii");
    }
    ascii_mode() {
        this.set_ascii_mode();
        this.redraw();
    }

    set_regular_mode() {
        this.guessrowclass = "guessrow";
        this.guesscharclass = "guesschar";
        this.resultcharclass = "resultchar";
        this.resultrowclass = "resultrow";
        this.showcursor = false;
        let display_toggle = document.getElementById("display_toggle");
        display_toggle.innerHTML = "Console View";
        window.localStorage.setItem("view", "regular");
    }

    regular_mode() {
        this.set_regular_mode();
        this.redraw();
    }

    clean_up_old(datekey) {
        const mindate = Number.parseInt(datekey + "00");
        const isNum = (s) => { return Number.isInteger(s) || /^[0-9]+$/.test(s); };

        let to_delete = new Array();
        for (let i = 0; i < window.localStorage.length; ++i) {
            const k = window.localStorage.key(i);
            if (k) {
                if (isNum(k) && Number.parseInt(k) < mindate) {
                    to_delete.push(k);
                }
            }
        }

        for (const k of to_delete) {
            window.localStorage.removeItem(k);
        }
    }

    grid_for(colfunc) {
        for (let i=0; i < this.rows; ++i) {
            for (let j=0; j < this.cols; ++j) {
                colfunc(i,j);
            }
        }
    }

    async grid_for_async(colfunc) {
        for (let i=0; i < this.rows; ++i) {
            for (let j=0; j < this.cols; ++j) {
                await colfunc(i,j);
            }
        }        
    }

    empty_grid_matrix() {
        return Array.from({length: this.rows}, (v,i) => Array.from( {length: this.cols}, (v2,j) => {}));
    }
    
    async create_games()
    {
        this.controllers = this.empty_grid_matrix();
        await this.grid_for_async( async (i,j) => {
            this.controllers[i][j] = await this.new_game(i*this.cols + j);
        });
    }

    create_small_share_board() {
        let board = this.empty_grid_matrix();
        const wrong = "&#128997;";
        const numbers = ["&#48;&#65039;&#8419;","&#49;&#65039;&#8419;","&#50;&#65039;&#8419;","&#51;&#65039;&#8419;","&#52;&#65039;&#8419;","&#53;&#65039;&#8419;","&#54;&#65039;&#8419;","&#55;&#65039;&#8419;","&#56;&#65039;&#8419;","&#57;&#65039;&#8419;"];
        const spacer = "&#11035;";

        this.grid_for((i,j) => {
            const b = this.controllers[i][j].get_board();
            let spc = "";
            if (j < this.cols-1) {
                spc = spacer;
            }

            if (!b.winner) {
                board[i][j] = wrong+wrong+spc;
                return;
            }

            let guesses = numbers[Math.trunc(b.gi/10)] + numbers[b.gi % 10];
            board[i][j] = guesses+spc;
        });

        let textboard = "";
        board.forEach((row) => { 
            row.forEach((col) => textboard += col); 
            textboard += '\n';
        });

        return textboard;        
    }

    create_share_board(minrows, mincols) {
        //const maybe = "🟨";
        //const yes = "🟩";
        //const no = "⬛";
        const maybe = "&#x1f7e8;";
        const yes = "&#x1f7e9;";
        const no = "&#11035;";
        const charmap = {"M": maybe, "O": yes, "X": no};

        let board = Array.from({length: this.rows*minrows}, () => Array.from({length: this.cols}, () => no.repeat(mincols)));

        this.grid_for( (i,j) => {
            const b = this.controllers[i][j].get_board();
            const rowindex = i*minrows;

            let rowcounter = 0;
            for (const guess of b.board) {
                // row
                let word = ""
                guess.g.forEach((e) => word += charmap[e.s]);
                word.padEnd(mincols, no);

                board[rowindex+rowcounter][j] = word;
                rowcounter++;
            }
        });

        let textboard = "";
        let rowcounter = 1;
        board.forEach((row) => { 
            row.forEach((col) => textboard += col + " "); 
            textboard += '\n';
            if (rowcounter == minrows) {
                textboard += '\n';
                rowcounter = 0;
            }
            rowcounter++;
        });

        return textboard;
    }

    create_board(parent, nochar, charclass, rowclass, minrows, mincols, board) {
        if (board.winner) {
            parent.classList.add("win");
        }

        const blankmap = {M: "&#x1f7e8;", O: "&#x1f7e9;", X: "&#11035;"};
        const nbsp = "&nbsp;";
        const nullchar = { v: true, s: "X", c: nbsp }
        const nullguess = { g: [] };
    
        let do_it = (guess, docursor) => {
            let r = document.createElement("div");
            r.classList.add(rowclass);
            for (let i = 0; i < mincols; ++i) {
                // word
                let c = guess.g[i];
                let l = document.createElement("span");
                l.innerHTML = "&nbsp;";
                l.classList.add(charclass);
                if (!c) {
                    c = nullchar;
                }
    
                l.classList.add( c.v ? c.s : "invalidword");                    
                l.innerHTML = nochar ? blankmap[c.s] : (c.c.length ? c.c : nbsp);
                if (docursor && this.showcursor && (i == guess.g.length)) {
                    l.classList.add(charclass+"cursor");
                }

                r.appendChild(l);
            }
            parent.appendChild(r);
        };

        board.board.forEach(g => do_it(g, true));
        Array.from(Array(minrows-board.board.length), () => do_it(nullguess, false));
    }
    
    on_draw(gameid, minrows, mincols, board) {
        let root = document.getElementById("game"+gameid);
        let resultroot = document.getElementById("resultgame"+gameid);
        root.innerHTML = "";
        resultroot.innerHTML = "";
    
        this.create_board(root, false, this.guesscharclass, this.guessrowclass, minrows, mincols, board);
        this.create_board(resultroot, true, this.resultcharclass, this.resultrowclass, minrows, mincols, board);
    }
    
    create_area(parent, style) {
        this.grid_for( (i,j) => {
                let game = document.createElement("div");
                game.classList.add(style);
                game.id = style + (i*this.cols + j);
                parent.appendChild(game);
            });
    }
    
    setup_areas() {
        let boardarea = document.body.getElementsByClassName("boardarea")[0];
        let resultwindow = document.body.getElementsByClassName("resultwindow")[0];
    
        this.create_area(boardarea, "game");
        this.create_area(resultwindow, "resultgame");

        let display_toggle = document.getElementById("display_toggle");
        display_toggle.onclick = () => this.toggle_mode();
    }
    
    get_date_key()
    {
        const d = new Date();
        const zeroPad = (num) => num.toString().padStart(2, '0');
        const datestr = d.getUTCFullYear().toString() + zeroPad(d.getUTCMonth()) + zeroPad(d.getUTCDate());
        return datestr;
    }
   
    async new_game(i) {
        const wordobj = await this.word_picker();
        const { gameid, word } = wordobj;
        this.wordlen = word.length;
    
        let controller = new Controller(gameid, (k) => { return this.charset.includes(k); }, word, this.maxguesses, (w) => {return this.word_validator(w)}, (i,w) => { this.on_done(i,w); }, this.update_keyboard);
        return controller;
    }


    copy_results(copyText) {
        let t = document.createElement("textarea");
        t.innerHTML = copyText;
        navigator.clipboard.writeText(t.value)
        .then(success => {alert("Copied!"); console.log("text copied");}, err => console.log("error copying text : " + err) )
        .catch(err => { console.log(err) });
    }
    
    on_done(gameid, winner) {
        console.log(winner ? "You win game " + gameid + "!" : "Lose game "+ gameid + ".");
        this.dones[gameid.toString()] = winner;
    }
    
    win_count() {
        return Object.keys(this.dones).reduce( (p,c) => this.dones[c] ? p+1 : p, 0 );
    }

    next_game_time() {
        const zeroPad = (num) => num.toString().padStart(2, '0');

        // time to next game
        let tomorrow = new Date();
        const now = new Date();
        tomorrow.setUTCDate(now.getUTCDate() + 1);
        tomorrow.setUTCHours(0,0,0,0);
        const difftime = new Date(tomorrow - now);
        const time_to_tomorrow = difftime.getUTCHours().toString() +"h "+ zeroPad(difftime.getUTCMinutes()) +"m "+ zeroPad(difftime.getUTCSeconds()) + "s";

        return time_to_tomorrow;
    }

    correct_word_grid() {
        let board = this.empty_grid_matrix();

        this.grid_for( (i,j) => {
                const b = this.controllers[i][j].get_board();
                board[i][j] = b.word;
            });

        let textboard = "";
        board.forEach((row) => {
            row.forEach((col) => textboard += col + "&nbsp;")
            textboard += '<br/>';
        });

        return textboard;
    }

    show_final_results()
    {
        let w = document.getElementById("finalresults");
        w.innerHTML = "";
        w.classList.add("finalresults");

        // top results message
        let top_content = document.createElement("p");
        let wins = this.win_count();
        if (wins === this.numboards) {
            top_content.innerHTML = "You won! " + wins + " correct!";
        }
        else if (wins > 0) {
            top_content.innerHTML = "You got " + wins + " of "+ this.numboards +" correct!";
        }
        else {
            top_content.innerHTML = "You didn't get any right. How?";
        }
        w.appendChild(top_content);

        // share button
        let button = document.createElement("a");        
        const time_to_tomorrow = this.next_game_time();
        button.innerHTML = "[&nbsp;SHARE&nbsp;]"

        let shareboard = "";
        if (this.rows > 2 || this.cols > 2) {
            shareboard = this.create_small_share_board();
        }
        else {
            shareboard = this.create_share_board(this.maxguesses, this.wordlen);
        }
        button.onclick = () => this.copy_results("xOrdle " + wins + "/" + this.numboards + "\n" + shareboard + "\nxOrdle " + window.location.toString());
        button.style.cursor = "pointer";
        w.appendChild(button);

        // bottom results content
        let bottom_content = document.createElement("p");
        const transformed_shareboard = shareboard.replaceAll("\n", "<br/>")
        const correct_grid = this.correct_word_grid()
        bottom_content.innerHTML = transformed_shareboard + "<br/>" + correct_grid + "<br/>Next game in " + time_to_tomorrow;
        w.appendChild(bottom_content);

        // update body
        document.body.appendChild(w);
    }

    redraw()
    {
        let guessnumber = 0;
        this.grid_for( (i,j) => {
            let b = this.controllers[i][j].get_board();
            if (guessnumber < b.board.length) {
                guessnumber = b.board.length;
            }
            this.on_draw(i*this.cols + j, this.maxguesses, WORDLEN, b);
        });

        let stats = document.getElementById("stats");
        //stats.innerHTML = (this.maxguesses - guessnumber + 1) + "/" + this.maxguesses + "<br>" + Object.keys(this.dones).length + "/" + this.numboards;
        const num_unsolved = this.numboards - Object.keys(this.dones).length;
        stats.innerHTML = (this.maxguesses - guessnumber + (num_unsolved > 0 ? 1 : 0)) + " more turns. " + num_unsolved + " unsolved."

        if (Object.keys(this.dones).length === this.numboards)
        {
            this.is_done = true;
            this.show_final_results();
        }
    }
    
    on_input(ev)
    {
        if (this.is_done) { return false; }

        if (ev.ctrlKey && ev.shiftKey && ev.key === " ") {
            this.toggle_mode();
            return false;
        }

        this.grid_for( (i,j) => {
                this.controllers[i][j].on_input(ev);
            });
    
        this.redraw();
	
	if (ev.key === "Backspace")
	{
	    ev.stopPropagation();
	    ev.preventDefault();
	    return false;
	}
	
	return false;
    }

    async start() {
        renderer.setup_areas();

        await renderer.create_games();
    
        renderer.redraw();
    }
    
}
