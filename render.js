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
        this.set_regular_mode();

        if (asciimode) {
            this.set_ascii_mode()
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

    copy_results() {
        var copyText = document.body.getElementsByClassName("resultwindow")[0].innerHTML;
      
        let t = document.createElement("textarea");
        t.innerHTML = copyText;
        t.select();
        navigator.clipboard.writeText(t.value);
      
        /* Alert the copied text */
        alert("Copied the text: " + copyText.value);
    }
    
    on_done(gameid, winner) {
        console.log(winner ? "You win game " + gameid + "!" : "Lose game "+ gameid + ".");
        this.dones[gameid] = winner;
    
        if (Object.keys(this.dones).length === this.numboards)
        {
            //show_results();
        }
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
                        l.innerHTML = c.c.length ? c.c : "&nbsp;"
                    }
                }
                else {
                    l.classList.add(charclass);
                    l.classList.add("X");
                    if (this.showcursor && (i === 0 || guess.g[i-1])) {
                        l.classList.add(charclass+"cursor");
                    }

                    l.innerHTML = "&nbsp;";
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
                l.innerHTML = "&nbsp;";
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
    
    
    async new_game(i) {
        const word = await this.word_picker();
    
        let controller = new Controller(i, (k) => { return this.charset.includes(k); }, word, this.maxguesses, this.word_validator, this.on_done, this.update_keyboard);
        return controller;
    }
    
    async redraw()
    {
        for (let i=0; i < this.rows; ++i)
        {
            for (let j=0; j < this.cols; ++j ) {
                let b = this.controllers[i][j].get_board();
                this.on_draw(i*this.cols + j, this.maxguesses, WORDLEN, b);
            }
        }
    }
    
    async on_input(ev)
    {
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