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

        const laststate = window.localStorage.getItem("laststate");
        if (laststate && laststate.length) {
            this.laststate = JSON.parse(laststate);
        }

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

    create_share_board(minrows, mincols) {
        let board = "";
        //const maybe = "🟨";
        //const yes = "🟩";
        //const no = "⬛";
        const maybe = "&#x1f7e8;";
        const yes = "&#x1f7e9;";
        const no = "&#11035;";
        for (let i=0; i<this.rows; ++i) {
            for (let j=0; j<this.cols; ++j) {
                const b = this.controllers[i][j].get_board();

                for (const guess of b.board) {
                    // row
                    for (let k = 0; k < mincols; ++k) {
                        // word
                        let c = guess.g[k];
            
                        if (c) {
                            if (c.s === "M") {
                                board += maybe; // 🟨
                            }
                            else if (c.s === "O") {
                                board += yes; // 🟩
                            }
                            else {
                                board += no; // ⬛
                            }
                        }
                        else {
                            board += no; // ⬛
                        }
                    }
                    board += "\r"
                }
            
                for (let k = 0; k < minrows - b.board.length; ++k)
                {
                    for (let l = 0; l < mincols; ++l) {
                        // word
                        board += no; // ⬛
                    }
                    board += "\r"
                }
            }
        }

        return board;
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
        const datestr = "" + d.getUTCFullYear() + "" + d.getUTCMonth() + "" + d.getUTCDate();
        return datestr;
    }

    save_done() {
        const state = { date: this.datekey, is_done: this.is_done, boards: [] };

        for (let i=0; i < this.rows; ++i)
        {
            for (let j=0; j < this.cols; ++j ) {
                let b = this.controllers[i][j].get_board();
                let id = this.controllers[i][j].get_id();
                state.boards.push({ gameid: id , board: b });
            }
        }

        window.localStorage.setItem("laststate", JSON.stringify(state));
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
        w.innerHTML = "You won " + this.win_count() + "/" + this.numboards;
        document.body.appendChild(w);

        let shareboard = this.create_share_board(this.maxguesses, this.wordlen);
        this.copy_results(shareboard);
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
        stats.innerHTML = (this.maxguesses - guessnumber + 1) + "/" + this.maxguesses;

        if (Object.keys(this.dones).length === this.numboards)
        {
            this.is_done = true;
            this.show_final_results();
            this.save_done();
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
    
}