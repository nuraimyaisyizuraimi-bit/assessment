const A5 = parseInt(document.getElementById("A5").innerText);
const A20 = parseInt(document.getElementById("A20").innerText);
const A15 = parseInt(document.getElementById("A15").innerText);
const A7 = parseInt(document.getElementById("A7").innerText);
const A13 = parseInt(document.getElementById("A13").innerText);
const A12 = parseInt(document.getElementById("A12").innerText);

document.getElementById("alpha").innerText = A5 + A20;
document.getElementById("beta").innerText = (A15 / A7).toFixed(2);
document.getElementById("charlie").innerText = A13 * A12;
