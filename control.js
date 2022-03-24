class Controller {
    constructor(gameid, valid_char, word, maxguesses, valid_word, on_done, update_keyboard) {
        this.gameid = gameid;
        this.word = "";
        this.minlength = word.length;
        this.guess = new Guess("");

        if (valid_char instanceof Function) {
            this.valid_char = valid_char;
        }
        else {
            this.valid_char = () => { return true; };
        }

        if (valid_word instanceof Function) {
            this.valid_word = valid_word;
        }
        else {
            this.valid_word = () => { return true; };
        }

        if (on_done instanceof Function) {
            this.on_done = on_done;
        }
        else {
            this.on_done = (x) => { return true; };
        }

        // reload game if present
        const saved = window.localStorage.getItem(gameid);
        if (saved) {
            this.ordle = new Ordle('', 0, update_keyboard, JSON.parse(saved));
            this.signal_if_done();
        }
        else {
            this.ordle = new Ordle(word, maxguesses, update_keyboard);
        }
    }

    save_game() {
        window.localStorage.setItem(this.gameid, JSON.stringify(this.ordle.toJsonObj()))
    }

    get_id() { return this.gameid; }

    get_board()
    {
        let x = {...this.ordle.toJsonObj()};
        if (!x.done && x.board) {
            x.board.push(this.guess.toJsonObj());
        }
        return x;
    }

    signal_if_done() {
        if (this.ordle.is_done()) {
            this.on_done(this.gameid, this.ordle.is_winner());
        }
    }
  
    on_input(e)
    {
        if (this.ordle.is_done()) { return; }

        if (e.isComposing || e.code === 229) { return; }

        // enter
        if (e.key === "Enter") {
            if (this.valid_word(this.word)) {
                this.ordle.submit_guess(this.word);
                this.save_game();
                this.word = "";
                this.signal_if_done();
            }
        }

        // backspace
        if (e.key === "Backspace") {
            if (this.word.length === 0) { return; }
            this.word = this.word.substring(0, this.word.length-1);
        }
        else if (this.valid_char(e.key) && this.word.length < this.minlength) {
            this.word = this.word.concat(e.key);
        }

        this.guess = new Guess(this.word);
        if (this.guess.length() === this.minlength && !this.valid_word(this.word)) {
            this.guess.set_invalid();
        }
    }
}
