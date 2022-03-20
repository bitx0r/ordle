function keyb_row(charset, start, end) {
    let row = document.createElement("div");
    row.classList.add("keybrow");
    for (let i=start; i < end; ++i) {
        let k = document.createElement("span");
        let c = charset.charAt(i);
        k.classList.add("key");
        k.id = "key_" + c;
        k.innerHTML = c;
        row.appendChild(k);
    }
    return row;
}

let keybmap = {}
function load_keyb(charset) {
    for (let i=0; i < charset.length; ++i) {
        const c = charset.charAt(i);
        keybmap[c] = 1;
    }

    let keyb = document.body.getElementsByClassName("keyb")[0];
    keyb.appendChild(keyb_row(charset, 0, 10));
    keyb.appendChild(keyb_row(charset, 10, 19));
    keyb.appendChild(keyb_row(charset, 19, 26));
}

function update_keyboard(word) {
    for (const c of word) {
        if (keybmap[c] === 0) { continue; }
        let key = document.getElementById("key_"+c);
        key.classList.add("keybused");
        keybmap[c] = 0;
    }
}

