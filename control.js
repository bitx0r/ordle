class Controller {
    constructor(gameid, on_update, valid_char, word, maxguesses, valid_word, on_done, update_keyboard) {
        this.gameid = gameid;
        this.ordle = new Ordle(word, maxguesses);
        this.word = "";
        this.minlength = word.length;
        this.guess = new Guess("", this.minlength);

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

        if (on_update instanceof Function) {
            this.on_update = on_update;
        }
        else {
            this.on_update = () => { console.log(this.ordle.toJsonObj()); };
        }

        if (update_keyboard instanceof Function) {
            this.update_keyboard = update_keyboard;
        }
        else {
            this.update_keyboard = (x) => { };
        }

    }

    get_id() { return this.gameid; }

    setup() {
        document.body.addEventListener('keyup', (ev) => { this.on_input(ev); });
    }

    redraw()
    {
        let x = {...this.ordle.toJsonObj()};
        if (!x.done && x.board) {
            x.board.push(this.guess.toJsonObj());
        }
        this.on_update(x);
    }

    on_input(e)
    {
        if (this.ordle.is_done()) { return; }

        if (e.isComposing || e.code === 229) { return; }

        // enter
        if (e.keyCode === 13) {
            if (this.valid_word(this.word)) {
                this.ordle.submit_guess(this.word);
                this.update_keyboard(this.word);
                this.word = "";
            }
        }

        // backspace
        if (e.keyCode === 8) {
            if (this.word.length === 0) { return; }
            this.word = this.word.substring(0, this.word.length-1);
        }
        else if (this.valid_char(e.key) && this.word.length < this.minlength) {
            this.word = this.word.concat(e.key);
        }

        this.guess = new Guess(this.word, this.minlength);
        if (this.guess.length() === this.minlength && !this.valid_word(this.word)) {
            this.guess.set_invalid();
        }

        this.redraw();

        if (this.ordle.is_done()) {
            this.on_done(this.gameid, this.ordle.is_winner());
        }
    }
}
