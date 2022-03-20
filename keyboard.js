
function create_key(c, doublewide) {
    let k = document.createElement("span");
    k.classList.add("key");
    if (doublewide) {
        k.classList.add("widekey");
    }
    k.id = "key_" + c;
    if (c === "Backspace") { k.innerHTML = "BkSp";}
    else if (c === "Enter") { k.innerHTML = "Ent"; }
    else { k.innerHTML = c; }

    k.onclick = () => { 
        var e = new KeyboardEvent("keyup", {bubbles : true, cancelable : true, key : c, char : c});
        document.body.dispatchEvent(e);
    };

    return k;
}

function keyb_row(charset, start, end, includecontrol) {
    let row = document.createElement("div");
    row.classList.add("keybrow");
    if (includecontrol) {
        let bksp = create_key("Backspace", true);
        row.appendChild(bksp);
    }
    for (let i=start; i < end; ++i) {
        let c = charset.charAt(i);
        let k = create_key(c, false);
        row.appendChild(k);
    }

    if (includecontrol) {
        let bksp = create_key("Enter", true);
        row.appendChild(bksp);
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
    keyb.appendChild(keyb_row(charset, 0, 10, false));
    keyb.appendChild(keyb_row(charset, 10, 19, false));
    keyb.appendChild(keyb_row(charset, 19, 26, true));
}

function update_keyboard(word) {
    for (const c of word) {
        if (keybmap[c] === 0) { continue; }
        let key = document.getElementById("key_"+c);
        key.classList.add("keybused");
        keybmap[c] = 0;
    }
}

