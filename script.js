// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function safeNumber(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function setText(id, value){
  const el = $(id);
  if (el) el.textContent = value;
}

function getInput(id){
  const el = $(id);
  if (!el) return null;
  return safeNumber(el.value);
}

function getCell(id){
  const el = $(id);
  if (!el) return null;
  return safeNumber(el.textContent);
}

function setInput(id, val){
  const el = $(id);
  if (el) el.value = val;
}

// ---------- Persistence ----------
const KEY = "simple_assessment_values_v1";

function loadValues(){
  try{
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function saveValues(vals){
  try{
    localStorage.setItem(KEY, JSON.stringify(vals));
  }catch{}
}

function currentValues(){
  // 1) Try inputs/table cells
  let A5 = getInput("inA5");   if (A5 === null) A5 = getCell("A5");
  let A7 = getInput("inA7");   if (A7 === null) A7 = getCell("A7");
  let A12= getInput("inA12");  if (A12=== null) A12= getCell("A12");
  let A13= getInput("inA13");  if (A13=== null) A13= getCell("A13");
  let A15= getInput("inA15");  if (A15=== null) A15= getCell("A15");
  let A20= getInput("inA20");  if (A20=== null) A20= getCell("A20");

  // 2) If not found, try saved values
  if ([A5,A7,A12,A13,A15,A20].some(v => v === null)){
    const saved = loadValues();
    if (saved && typeof saved === "object"){
      return saved;
    }
  }

  // 3) If still nothing (like opening more.html first), use default sample
  if ([A5,A7,A12,A13,A15,A20].some(v => v === null)){
    return { A5:5, A7:7, A12:12, A13:13, A15:15, A20:20 };
  }

  return { A5, A7, A12, A13, A15, A20 };
}

function applyValuesToPage(vals){
  // sync inputs if exist
  setInput("inA5", vals.A5);
  setInput("inA7", vals.A7);
  setInput("inA12", vals.A12);
  setInput("inA13", vals.A13);
  setInput("inA15", vals.A15);
  setInput("inA20", vals.A20);

  // sync table cells if exist
  setText("A5", vals.A5);
  setText("A7", vals.A7);
  setText("A12", vals.A12);
  setText("A13", vals.A13);
  setText("A15", vals.A15);
  setText("A20", vals.A20);
}

// ---------- Core calculation ----------
function updateAll(){
  const vals = currentValues();
  if (!vals) return;

  // store for other pages
  saveValues(vals);

  const alpha = vals.A5 + vals.A20;
  const charlie = vals.A13 * vals.A12;

  setText("alpha", alpha);
  setText("charlie", charlie);

  // beta with divide-by-zero protection
  const warn = $("warn");
  if (vals.A7 === 0){
    setText("beta", "-");
    if (warn) warn.classList.remove("hidden");
  }else{
    setText("beta", (vals.A15 / vals.A7).toFixed(2));
    if (warn) warn.classList.add("hidden");
  }

  // custom formula page
  const out = $("formulaOut");
  const err = $("formulaErr");
  const inp = $("formula");
  if (inp && out){
    const res = evaluateFormula(inp.value, vals);
    if (res.ok){
      out.textContent = String(res.value);
      if (err) err.classList.add("hidden");
    }else{
      out.textContent = "-";
      if (err){
        err.textContent = "⚠️ " + res.error;
        err.classList.remove("hidden");
      }
    }
  }
}

function evaluateFormula(expr, vars){
  const raw = (expr || "").trim();
  if (!raw) return { ok:false, error:"Enter a formula using A-values (e.g. A5 + A20)" };

  const upper = raw.toUpperCase();
  const allowedVars = ["A5","A7","A12","A13","A15","A20"];
  const allowedSet = new Set(allowedVars);

  // MUST contain at least one allowed variable
  const hasAllowedVar = allowedVars.some(v => new RegExp(`\\b${v}\\b`).test(upper));
  if (!hasAllowedVar){
    return { ok:false, error:"Formula must use at least one variable: A5, A7, A12, A13, A15, A20." };
  }

  // Allow only numbers, spaces, + - * / . ( ) and letters A
  if (!/^[0-9+\-*/().\sA]+$/i.test(raw)){
    return { ok:false, error:"Only A5, A7, A12, A13, A15, A20 and + - * / ( ) are allowed." };
  }

  // Block any variable token NOT in allowed list
  const tokens = upper.match(/[A-Z]+[0-9]*/g) || [];
  for (const t of tokens){
    if (/[A-Z]/.test(t) && !allowedSet.has(t)){
      return { ok:false, error:`Invalid variable "${t}". Allowed: ${allowedVars.join(", ")}.` };
    }
  }

  // Parentheses balance check
  let bal = 0;
  for (const ch of upper){
    if (ch === "(") bal++;
    if (ch === ")") bal--;
    if (bal < 0) return { ok:false, error:"Parentheses are not balanced." };
  }
  if (bal !== 0) return { ok:false, error:"Parentheses are not balanced." };

  // Replace variables
  let replaced = upper
    .replace(/\bA5\b/g,  String(vars.A5))
    .replace(/\bA7\b/g,  String(vars.A7))
    .replace(/\bA12\b/g, String(vars.A12))
    .replace(/\bA13\b/g, String(vars.A13))
    .replace(/\bA15\b/g, String(vars.A15))
    .replace(/\bA20\b/g, String(vars.A20));

  // After replacement, only numbers/operators remain
  if (!/^[0-9+\-*/().\s]+$/.test(replaced)){
    return { ok:false, error:"Formula contains invalid content." };
  }

  try{
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${replaced});`);
    const value = fn();

    if (!Number.isFinite(value)){
      return { ok:false, error:"Result is not a valid number (maybe divide by zero?)." };
    }

    return { ok:true, value: Math.round(value * 100) / 100 };
  }catch{
    return { ok:false, error:"Invalid formula format." };
  }
}


// ---------- Page transitions on navigation ----------
function wireNavFade(){
  document.querySelectorAll(".nav a").forEach(a=>{
    a.addEventListener("click", (e)=>{
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      const board = document.querySelector(".board");
      if (board) board.classList.add("fadeOut");
      setTimeout(()=>{ window.location.href = href; }, 160);
    });
  });
}

// ---------- Initialize ----------
document.addEventListener("DOMContentLoaded", ()=>{
  // apply saved values across pages
  const saved = loadValues();
  if (saved) applyValuesToPage(saved);

  // live update on input
  ["inA5","inA7","inA12","inA13","inA15","inA20"].forEach(id=>{
    const el = $(id);
    if (el) el.addEventListener("input", updateAll);
  });

  // buttons if exist
  const btnCalc = $("btnCalc");
  if (btnCalc) btnCalc.addEventListener("click", updateAll);

  const btnReset = $("btnReset");
  if (btnReset) btnReset.addEventListener("click", ()=>{
    applyValuesToPage({A5:5,A7:7,A12:12,A13:13,A15:15,A20:20});
    updateAll();
  });

  const btnRandom = $("btnRandom");
  if (btnRandom) btnRandom.addEventListener("click", ()=>{
    const rnd = ()=> Math.floor(Math.random()*90)+1;
    applyValuesToPage({A5:rnd(),A7:rnd(),A12:rnd(),A13:rnd(),A15:rnd(),A20:rnd()});
    updateAll();
  });

  const btnRun = $("btnRunFormula");
  if (btnRun) btnRun.addEventListener("click", updateAll);

  wireNavFade();
  updateAll();
});

