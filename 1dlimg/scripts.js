let border = "2px"
let figsize = "40px"
let figsize2 = "40px"
let x = 0;
let y = 0;
let figArray = []
let wholeCanvas = []
const canvas = document.getElementById('myCanvas')
const c = canvas.getContext('2d')
let isDrawing = false


function dlImage() {
    const canvasUrl = canvas.toDataURL();
    let windowContent = '<!DOCTYPE html>';
    windowContent += '<html>'
    windowContent += '<head><title>Print canvas</title></head>';
    windowContent += '<body>'
    windowContent += '<img src="' + canvasUrl + '">';
    windowContent += '</body>';
    windowContent += '</html>';
    const printWin = window.open();
    printWin.document.open();
    printWin.document.write(windowContent);
    printWin.document.addEventListener('load', function () {
        printWin.focus();
        // printWin.document.close();
    }, true);
}

addEventListener('load', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
})

const ctx = canvas.getContext('2d');
// last known position
let pos = { x: 0, y: 0 };

document.addEventListener('mousemove', drawLine);
document.addEventListener('mousedown', setPosition);
document.addEventListener('mouseenter', setPosition);

function setPosition(e) {
    const rect = canvas.getBoundingClientRect();
    // Get actual position of mouse in Canvas
    pos.x = (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width;
    pos.y = (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height;
}

function drawLine(e) {
    if (e.buttons !== 1) return;
    ctx.beginPath(); // begin

    ctx.lineWidth = border.slice(0, -2);
    ctx.lineCap = 'round';
    ctx.strokeStyle = document.getElementById('bdcolor').value;

    ctx.moveTo(pos.x, pos.y); // from
    setPosition(e);
    ctx.lineTo(pos.x, pos.y); // to

    ctx.stroke(); // draw it!
}

let socket = io();

socket.on('drawing', function (msg) {
    readData(msg)
});

let name = null;
document.getElementsByTagName("canvas")[0].style.border = "solid black 6px";

function SetFigSize(size) {
    figsize = size;
    document.getElementById("figuresize").innerText = "Figure size: " + size;
}

function SetMargin(size) {
    document.getElementById("Thickness").innerText = "Border/Drawing thickness: " + size;
    border = size;
}

function SetFigType(type) {
    document.getElementById("figtype").innerText = type;
}

function Draw(copying = false) {
    const canvas = document.getElementById('myCanvas');
    const c = canvas.getContext('2d');
    c.strokeStyle = document.getElementsByTagName("input")[1].value;
    c.fillStyle = document.getElementsByTagName("input")[0].value;
    c.lineWidth = parseInt(border.slice(0, -2));
    c.beginPath();
    let intercept = getNonOverlappingStart(canvas.width, canvas.height);

    if (document.getElementById("figtype").innerText === "Triangle") {
        drawTriangle(c, intercept);
    } else if (document.getElementById("figtype").innerText === "Square") {
        drawSquare(c, intercept);
    } else {
        drawCircle(c, intercept);
    }
    if (!copying) {
        sendObject(document.getElementById("figtype").innerText, c, intercept);
        console.log(figArray);
    }
}

function getNonOverlappingStart(width, heigth) {
    let overlap = false;
    let startPos = getRandomStart(width, heigth);
    do {
        startPos = getRandomStart(width, heigth);
        overlap = false;
        for (const figure of wholeCanvas) {
            const fig = parseInt(figsize.slice(0, -2));
            console.log(figure);
            if (figure[0] < startPos[0] + fig && figure[0] + parseInt(figure[2].slice(0, -2)) > startPos[0] && figure[1] < startPos[1] + fig && figure[1] + parseInt(figure[2].slice(0, -2)) > startPos[1]) {
                overlap = true;
            }
        }

    } while (overlap);
    return (startPos);
}

function drawSquare(c, intercept, getexternalfig = false) {
    let fig = "";
    if (getexternalfig) {
        fig = parseInt(figsize2.slice(0, -2))
    } else {
        fig = parseInt(figsize.slice(0, -2))
    }
    c.rect(intercept[0], intercept[1], fig, fig)
    c.stroke();
    c.fill();
}

function drawCircle(c, intercept, getexternalfig = false) {
    let fig = "";
    if (getexternalfig) {
        fig = parseInt(figsize2.slice(0, -2))
    } else {
        fig = parseInt(figsize.slice(0, -2))
    }
    c.arc(intercept[0] + fig / 2, intercept[1] + fig / 2, fig / 2, 0, Math.PI * 2)
    c.closePath()
    c.stroke();
    c.fill();
}
function drawTriangle(c, intercept, getexternalfig = false) {
    let fig = "";
    if (getexternalfig) {
        fig = parseInt(figsize2.slice(0, -2))
    } else {
        fig = parseInt(figsize.slice(0, -2))
    }
    c.beginPath()
    c.moveTo(intercept[0], intercept[1]);
    c.lineTo(intercept[0] + fig, intercept[1]);
    c.lineTo(intercept[0] + (fig / 2), intercept[1] + (fig));
    c.closePath();
    c.stroke();
    c.fill();
}


function getRandomStart(width, height) {

    const swidth = width - parseInt(figsize.slice(0, -2));
    const sheight = height - parseInt(figsize.slice(0, -2));
    return [Math.floor(swidth * Math.random()), Math.floor(sheight * Math.random())]
}

function DrawTenFigure(copying = false) {
    const canvas = document.getElementById('myCanvas')
    const c = canvas.getContext('2d')
    c.strokeStyle = document.getElementsByTagName("input")[1].value;
    c.fillStyle = document.getElementsByTagName("input")[0].value;
    c.lineWidth = parseInt(border.slice(0, -2))

    for (i = 0; i < 10; i++) {
        c.beginPath()
        const num = Math.random()
        const start = getRandomStart(canvas.width, canvas.height)
        let figure2 = ""
        if (num < 0.33) {
            drawCircle(c, start)
            figure2 = "Circle"
        } else if (num < 0.66) {
            drawTriangle(c, start)
            figure2 = "Triangle"
        } else {
            drawSquare(c, start)
            figure2 = "Square"
        }

        if (!copying) {
            sendObject(figure2, c, start)
        }
    }
}

function readData(packet) {
    const objects = JSON.parse(packet).data;


    console.log(objects);
    for (const elem of [objects]) {

        console.log(elem);
        const x = elem[0];
        const y = elem[1];
        figsize2 = elem[2];
        const border2 = elem[3];
        const bg = elem[5];
        const bd = elem[4];
        const figure = elem[6];
        if (figure == "Line") {
            drawLine(x, y, elem[7], elem[8]);
            return null;
        }

        const canvas = document.getElementById('myCanvas');
        const c = canvas.getContext('2d');
        c.strokeStyle = bd;
        c.fillStyle = bg;
        c.lineWidth = parseInt(border2.slice(0, -2));
        c.beginPath();

        if (figure === "Triangle") {
            drawTriangle(c, [x, y], true);
        } else if (figure === "Square") {
            drawSquare(c, [x, y], true);
        } else {
            drawCircle(c, [x, y], true);
        }
    }
}



function sendObject(figure, c, intercept) {
    const data = [intercept[0], intercept[1], figsize, border, document.getElementsByTagName("input")[1].value, document.getElementsByTagName("input")[0].value, figure];
    const doc = { data: data, user: document.getElementById("name").value };
    socket.emit("drawing", JSON.stringify(doc));
}

function sendLine(figure, c, intercept, x2, y2) {
    const data = [intercept[0], intercept[1], figsize, border, document.getElementsByTagName("input")[1].value, document.getElementsByTagName("input")[0].value, figure, x2, y2];
    const doc = { data: data, user: document.getElementById("name").value };
    console.log(data);
    socket.emit("drawing", JSON.stringify(doc));
}

function Submit() {
    name = document.getElementById("name").value
    console.log(name)
}