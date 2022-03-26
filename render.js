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

        document.addEventListener("keyup", (e)=> this.on_input(e));
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

    async create_games()
    {
        for (let i=0; i < this.rows; ++i)
        {
            let a = new Array();
            for (let j=0; j < this.cols; ++j ) {
                const g = await this.new_game(i*this.cols + j);
                a.push(g);
            }
            this.controllers.push(a);
        }    
    }

    create_small_share_board() {
        let board = new Array();
        //const maybe = "🟨";
        //const yes = "🟩";
        //const no = "⬛";
        const wrong = "&#128997;";
        const numbers = ["&#48;&#65039;&#8419;","&#49;&#65039;&#8419;","&#50;&#65039;&#8419;","&#51;&#65039;&#8419;","&#52;&#65039;&#8419;","&#53;&#65039;&#8419;","&#54;&#65039;&#8419;","&#55;&#65039;&#8419;","&#56;&#65039;&#8419;","&#57;&#65039;&#8419;"];
        const spacer = "&#11035;";
        for (let i=0; i<this.rows; ++i) {
            for (let j=0; j<this.cols; ++j) {
                const b = this.controllers[i][j].get_board();
                if (board[i] === undefined) {
                    board.push(new Array());
                }

                let spc = "";
                if (j < this.cols-1) {
                    spc = spacer;
                }

                if (!b.winner) {
                    board[i].push(wrong+wrong+spc);
                    continue;
                }

                let guesses = numbers[Math.trunc(b.gi/10)] + numbers[b.gi % 10];
                board[i].push(guesses+spc);
            }
        }

        let textboard = "";
        for (const row of board) {
            for (const col of row) {
                textboard += col;
            }
            textboard += '\r';
        }

        return textboard;        
    }

    create_share_board(minrows, mincols) {
        let board = new Array();
        //const maybe = "🟨";
        //const yes = "🟩";
        //const no = "⬛";
        const maybe = "&#x1f7e8;";
        const yes = "&#x1f7e9;";
        const no = "&#11035;";
        for (let i=0; i<this.rows; ++i) {
            for (let j=0; j<this.cols; ++j) {
                const b = this.controllers[i][j].get_board();
                const rowindex = i*minrows;

                if (board[rowindex] === undefined) {
                    board.push(new Array());
                }

                let rowcounter = 0;
                for (const guess of b.board) {
                    // row
                    let word = ""
                    for (let k = 0; k < mincols; ++k) {
                        // word
                        let c = guess.g[k];
            
                        if (c) {
                            if (c.s === "M") {
                                word += maybe; // 🟨
                            }
                            else if (c.s === "O") {
                                word += yes; // 🟩
                            }
                            else {
                                word += no; // ⬛
                            }
                        }
                        else {
                            word += no; // ⬛
                        }
                    }

                    if (board[rowindex+rowcounter] === undefined) {
                        board.push(new Array());
                    }
    
                    board[rowindex+rowcounter].push(word);
                    rowcounter++;
                }
            
                for (let k = 0; k < minrows - b.board.length; ++k)
                {
                    let word = ""
                    for (let l = 0; l < mincols; ++l) {
                        // word
                        word += no; // ⬛
                    }

                    if (board[rowindex+rowcounter] === undefined) {
                        board.push(new Array());
                    }

                    board[rowindex+rowcounter].push(word);
                    rowcounter++;
                }
            }
        }

        let textboard = "";
        let rowcounter = 1;
        for (const row of board) {
            for (const col of row) {
                textboard += col;
                textboard += " ";
            }
            textboard += '\r';
            if (rowcounter == minrows) {
                textboard += '\r';
                rowcounter = 0;
            }
            rowcounter++;
        }

        return textboard;
    }

    create_board(nochar, charclass, rowclass, minrows, mincols, board) {
        let root = document.createElement("div");
        if (board.winner) {
            root.classList.add("win");
        }
    
        for (const guess of board.board) {
            // row
            let r = document.createElement("div");
            r.classList.add(rowclass);
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
                        l.innerHTML = c.c.length ? c.c : "&nbsp;";
                    }
                    else if (c.s === "M") {
                        l.innerHTML = "&#x1f7e8;";
                    }
                    else if (c.s === "O") {
                        l.innerHTML = "&#x1f7e9;";
                    }
                    else {
                        l.innerHTML = "&#11035;";
                    }
                }
                else {
                    l.classList.add(charclass);
                    l.classList.add("X");
                    if (this.showcursor && (i === 0 || guess.g[i-1])) {
                        l.classList.add(charclass+"cursor");
                    }

                    if (!nochar) { 
                        l.innerHTML = "&nbsp;";
                    } else {
                        l.innerHTML = "&#11035;";
                    }
                }
    
                r.appendChild(l);
            }
            root.appendChild(r);
        }
    
        for (let i = 0; i < minrows - board.board.length; ++i)
        {
            let r = document.createElement("div");
            r.classList.add(rowclass);
            for (let j = 0; j < mincols; ++j) {
                // word
                let l = document.createElement("span");
                l.innerHTML = "&nbsp;";
    
                l.classList.add(charclass);
                l.classList.add("X");
                if (!nochar) { 
                    l.innerHTML = "&nbsp;";
                } else {
                    l.innerHTML = "&#11035;";
                }

                r.appendChild(l);
            }
            root.appendChild(r);
        }

        return root;
    }
    
    on_draw(gameid, minrows, mincols, board) {
        let root = document.getElementById("game"+gameid);
        let resultroot = document.getElementById("resultgame"+gameid);
        root.innerHTML = "";
        resultroot.innerHTML = "";
    
        let b = this.create_board(false, this.guesscharclass, this.guessrowclass, minrows, mincols, board);
        let r = this.create_board(true, this.resultcharclass, this.resultrowclass, minrows, mincols, board);
    
        root.appendChild(b);
        resultroot.appendChild(r);
    }
    
    create_area(rows, cols, rowclass, colclass) {
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
    
    setup_areas() {
        let boardarea = document.body.getElementsByClassName("boardarea")[0];
        let resultwindow = document.body.getElementsByClassName("resultwindow")[0];
    
        let b = this.create_area(this.rows, this.cols, "boards", "game");
        let r = this.create_area(this.rows, this.cols, "resultboards", "resultgame");
    
        boardarea.appendChild(b);
        resultwindow.appendChild(r);
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
        let wins = 0;
        for (const d of Object.keys(this.dones)) {
            if (this.dones[d]) { wins++; }
        }
        return wins;
    }

    show_final_results()
    {
        let w = document.createElement("div");
        w.classList.add("finalresults");
        let wins = this.win_count();
        w.innerHTML = "You won " + wins + "/" + this.numboards + "<BR/><BR/>";
        let button = document.createElement("a");
        button.innerHTML = "[&nbsp;SHARE&nbsp;]";

        let shareboard = "";
        if (this.rows > 2 || this.cols > 2) {
            shareboard = this.create_small_share_board();
        }
        else {
            shareboard = this.create_share_board(this.maxguesses, this.wordlen);
        }

        shareboard += "\n\nxOrdle " + window.location.toString();

        button.onclick = () => this.copy_results("xOrdle " + wins + "/" + this.numboards + "\n\n" + shareboard);
        button.style.cursor = "pointer";
        w.appendChild(button);
        document.body.appendChild(w);
    }

    async redraw()
    {
        let guessnumber = 0;
        for (let i=0; i < this.rows; ++i)
        {
            for (let j=0; j < this.cols; ++j ) {
                let b = this.controllers[i][j].get_board();
                if (guessnumber < b.board.length) {
                    guessnumber = b.board.length;
                }
                this.on_draw(i*this.cols + j, this.maxguesses, WORDLEN, b);
            }
        }

        let stats = document.getElementById("stats");
        stats.innerHTML = (this.maxguesses - guessnumber + 1) + "/" + this.maxguesses + "<br>" + Object.keys(this.dones).length + "/" + this.numboards;

        if (Object.keys(this.dones).length === this.numboards)
        {
            this.is_done = true;
            this.show_final_results();
        }
    }
    
    async on_input(ev)
    {
        if (this.is_done) { return; }

        if (ev.ctrlKey && ev.shiftKey && ev.key === " ") {
            this.toggle_mode();
            return;
        }

        for (let i=0; i < this.rows; ++i)
        {
            for (let j=0; j < this.cols; ++j ) {
                this.controllers[i][j].on_input(ev);
            }
        }
    
        this.redraw();
    }

    async start() {
        renderer.setup_areas();

        await renderer.create_games();
    
        renderer.redraw();    
    }
    
}