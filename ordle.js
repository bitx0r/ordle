class Ord {
    static WRONG = 0;
    static CORRECT = 1;
    static MAYBE = 2;
    
    constructor(char, state, saved = {}) {
        this.c = char;
        this.s = state;
        this.v = true;

        if (Object.keys(saved).length !== 0) {
            this.c = saved.c;
            this.s = (saved.s === "X" ? Ord.WRONG : (saved.s === "M" ? Ord.MAYBE : Ord.CORRECT));
            this.v = saved.v;
        }
    }

    toJsonObj() {
        return {c: this.c, s: (this.s === Ord.WRONG ? "X" : (this.s === Ord.MAYBE ? "M" : "O")), v: this.v };
    }

    set_state(new_state) { this.s = new_state; }
    set_invalid() { this.v = false; }
    get_char() { return this.c; }
}

class Guess {
    constructor(word, saved = {}) {
        this.guess = new Array();
        this.word = word;

        if (Object.keys(saved).length === 0) {
            for (let i = 0; i < word.length; ++i) {
                this.guess.push(new Ord(word.charAt(i), Ord.WRONG));
            }
            return;
        }

        this.word = "";
        for (const c of saved.g) {
            const o = new Ord('', Ord.WRONG, c);
            this.guess.push(o);
            this.word += o.get_char();
        }        
    }

    toJsonObj() {
        let r = [];
        for (const c of this.guess) {
            let e = c.toJsonObj();
            r.push(e);
        }
        return {g: r};
    }

    update_state(index, new_state) {
        this.guess[index].set_state(new_state);
    }

    set_invalid() {
        this.valid = false;
        for (const c of this.guess) {
            c.set_invalid();
        }
    }

    length() {
        return this.guess.length;
    }

    get_word() {
        return this.word;
    }
}

class Ordle {
    static INPROGRESS = 0;
    static DONE = 1;

    constructor(theword, numguess, update_keyboard, saved = {}) {
        this.word = theword;
        this.maxguesses = numguess;
        this.guesses = new Array();
        this.guess_index = 0;
        this.game_state = Ordle.INPROGRESS;
        this.winner = false;

        if (update_keyboard instanceof Function) {
            this.update_keyboard = update_keyboard;
        }
        else {
            this.update_keyboard = (x) => { };
        }

        if (Object.keys(saved).length === 0) {
            this.build_dict(theword);
            return;
        }

        // reload state
        this.word = saved.word;
        this.winner = saved.winner;
        this.maxguesses = saved.maxguesses;
        this.guess_index = saved.gi;
        this.game_state = saved.state;
        for (const g of saved.board) {
            const guess = new Guess('', g);
            this.guesses.push(guess);
            this.update_keyboard(guess.get_word());
        }
        
        this.build_dict(this.word);
    }

    build_dict(theword) {
        this.dict = {}
        for (let i=0; i < theword.length; ++i) {
            const c = theword.charAt(i);
            if (this.dict[c]) {
                this.dict[c] += 1;
            }
            else {
                this.dict[c] = 1;
            }
        }
    }

    toJsonObj() {
        let g = [];
        for (const c of this.guesses) {
            let e = c.toJsonObj();
            g.push(e);
        }
        return {board: g, done: this.is_done(), winner: this.is_winner(), word: this.word, maxguesses: this.maxguesses, gi: this.guess_index, state: this.game_state };
    }

    char_state(char, index) {
        if (this.word.charAt(index) === char) { return Ord.CORRECT; }
        if (this.word.includes(char)) { return Ord.MAYBE; }
        return Ord.WRONG;
    }

    submit_guess(word)
    {
        if (this.game_state === Ordle.DONE) {
            return;
        }

        let guess = new Guess(word, this.word.length);
        let maybes = { ...this.dict};

        for (let i = 0; i < word.length; ++i) {
            const c = word.charAt(i);
            const s = this.char_state(c, i);
            if (s === Ord.CORRECT) {
                guess.update_state(i, s);
                maybes[c] -= 1;
            }
        }

        for (let i = 0; i < word.length; ++i) {
            const c = word.charAt(i);
            const s = this.char_state(c, i);
            if (s === Ord.MAYBE) {
                if (maybes[c] > 0) {
                    guess.update_state(i, s);
                    maybes[c] -= 1;
                }
            }
        }

        this.guesses.push(guess);
        if (word === this.word) {
            this.game_state = Ordle.DONE;
            this.winner = true;
        }

        this.update_keyboard(word);

        ++this.guess_index;

        if (this.maxguesses === this.guess_index ) {
            this.game_state = Ordle.DONE;
        }
    }

    is_winner() {
        return this.winner;
    }

    is_done() {
        return this.game_state === Ordle.DONE;
    }
}


