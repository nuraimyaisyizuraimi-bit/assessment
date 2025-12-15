function num(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function setText(id, value){
  document.getElementById(id).innerText = value;
}

function updateAll(){
  const A5  = num(document.getElementById("inA5").value);
  const A7  = num(document.getElementById("inA7").value);
  const A12 = num(document.getElementById("inA12").value);
  const A13 = num(document.getElementById("inA13").value);
  const A15 = num(document.getElementById("inA15").value);
  const A20 = num(document.getElementById("inA20").value);

  // Update Table 1 cells
  setText("A5", A5);
  setText("A7", A7);
  setText("A12", A12);
  setText("A13", A13);
  setText("A15", A15);
  setText("A20", A20);

  // Calculations for Table 2
  const alpha = A5 + A20;
  const charlie = A13 * A12;

  setText("alpha", alpha);
  setText("charlie", charlie);

  const warn = document.getElementById("warn");
  if (A7 === 0){
    setText("beta", "-");
    warn.classList.remove("hidden");
  } else {
    const beta = A15 / A7;
    setText("beta", beta.toFixed(2));
    warn.classList.add("hidden");
  }
}

// Live update on typing
["inA5","inA7","inA12","inA13","inA15","inA20"].forEach(id => {
  document.getElementById(id).addEventListener("input", updateAll);
});

// Buttons
document.getElementById("btnReset").addEventListener("click", () => {
  document.getElementById("inA5").value = 5;
  document.getElementById("inA7").value = 7;
  document.getElementById("inA12").value = 12;
  document.getElementById("inA13").value = 13;
  document.getElementById("inA15").value = 15;
  document.getElementById("inA20").value = 20;
  updateAll();
});

document.getElementById("btnRandom").addEventListener("click", () => {
  const rnd = () => Math.floor(Math.random() * 90) + 1;
  document.getElementById("inA5").value = rnd();
  document.getElementById("inA7").value = rnd();
  document.getElementById("inA12").value = rnd();
  document.getElementById("inA13").value = rnd();
  document.getElementById("inA15").value = rnd();
  document.getElementById("inA20").value = rnd();
  updateAll();
});

// Initial render
updateAll();
