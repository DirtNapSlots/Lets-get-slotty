// Neon Cluster 6×6 — static, GitHub Pages ready.
// Cluster wins: 6+ connected orthogonally. Cascades until no wins.
// Wild 🃏 can join any cluster.

const GRID = 6;
const gridEl = document.getElementById("grid");
const balEl = document.getElementById("bal");
const betEl = document.getElementById("bet");
const winEl = document.getElementById("win");
const msgEl = document.getElementById("msg");

const spinBtn = document.getElementById("spin");
const betDownBtn = document.getElementById("betDown");
const betUpBtn = document.getElementById("betUp");
const resetBtn = document.getElementById("reset");

const STORAGE_KEY = "neon_cluster_6x6_save_v1";

const SYMS = [
  { id:"DIAMOND", e:"💎", w: 7, tier:"high" },
  { id:"FIRE",    e:"🔥", w: 9, tier:"mid"  },
  { id:"STAR",    e:"⭐", w: 11, tier:"mid"  },
  { id:"CHERRY",  e:"🍒", w: 14, tier:"low"  },
  { id:"LEMON",   e:"🍋", w: 15, tier:"low"  },
  { id:"GREEN",   e:"🟩", w: 17, tier:"low"  },
  { id:"WILD",    e:"🃏", w: 6,  tier:"wild" },
];

const BASE_MULT = {
  DIAMOND: 20,
  FIRE:    10,
  STAR:     8,
  CHERRY:   5,
  LEMON:    4,
  GREEN:    3,
  // WILD doesn't have its own base; it counts as the cluster's symbol.
};

function fmt(n){ return "$" + n.toLocaleString(undefined, {maximumFractionDigits:0}); }

let state = load() || { balance: 1000, bet: 10 };
let board = makeEmpty();
let spinning = false;

renderBoard(fillRandom(makeEmpty()));
syncHUD(0);
setMsg("Ready.");

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const obj = JSON.parse(raw);
    if(typeof obj.balance !== "number" || typeof obj.bet !== "number") return null;
    return obj;
  } catch { return null; }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setMsg(t){ msgEl.textContent = t; }
function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

function shakeGlass(){
  const glass = document.querySelector(".glass");
  if(!glass) return;
  glass.classList.remove("shake");
  void glass.offsetWidth;      // retrigger animation
  glass.classList.add("shake");
}
function syncHUD(win){
  balEl.textContent = fmt(state.balance);
  betEl.textContent = fmt(state.bet);
  winEl.textContent = fmt(win);
}

function makeEmpty(){
  return Array.from({length: GRID}, ()=> Array.from({length: GRID}, ()=> null));
}

function weightedPick(){
  const total = SYMS.reduce((a,s)=>a+s.w,0);
  let r = Math.random() * total;
  for(const s of SYMS){
    r -= s.w;
    if(r <= 0) return s;
  }
  return SYMS[SYMS.length-1];
}

function fillRandom(b){
  for(let r=0; r<GRID; r++){
    for(let c=0; c<GRID; c++){
      b[r][c] = weightedPick().id;
    }
  }
  return b;
}

function renderBoard(b){
  board = b;
  gridEl.innerHTML = "";
  for(let r=0; r<GRID; r++){
    for(let c=0; c<GRID; c++){
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.r = r;
      div.dataset.c = c;
      div.innerHTML = symSVG(b[r][c]);
      gridEl.appendChild(div);
    }
  }
}

let __svgUid = 0;
function uid(prefix="fx"){ __svgUid++; return `${prefix}_${__svgUid}`; }

// Chaos Bunny Unhinged SVG symbol set.
// We keep your existing IDs (DIAMOND/FIRE/etc.) so payouts & logic stay unchanged.
function symSVG(id){
  const fx = uid("g");
  const glow = (color) => `
    <defs>
      <filter id="${fx}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="b"/>
        <feColorMatrix in="b" type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 0.9 0" result="g"/>
        <feMerge>
          <feMergeNode in="g"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#${fx})" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></g>
  `;

  // Helper: wrap with a soft inner plate so symbols feel “cabinet-grade”
  const wrap = (inner, accent="#ff4bd6") => `
    <svg viewBox="0 0 100 100" role="img" aria-label="${id}">
      <defs>
        <radialGradient id="${fx}_bg" cx="35%" cy="28%" r="75%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.16)"/>
          <stop offset="60%" stop-color="rgba(255,255,255,0.05)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.10)"/>
        </radialGradient>
        <filter id="${fx}_soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- subtle plate -->
      <circle cx="50" cy="50" r="40" fill="url(#${fx}_bg)" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="${accent}" stroke-width="2" opacity="0.28"/>

      ${inner}
    </svg>
  `;

  // Symbol drawings (Chaos Bunny Unhinged)
  switch(id){

    // DIAMOND = "Neon Crown Gem"
    case "DIAMOND": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <path d="M25 58 L38 40 L50 58 L62 40 L75 58 L50 78 Z"
                fill="rgba(255,211,122,0.18)" stroke="rgba(255,211,122,0.95)" stroke-width="4" />
          <path d="M38 40 L50 28 L62 40" fill="none"
                stroke="rgba(255,211,122,0.95)" stroke-width="4" />
          <circle cx="50" cy="26" r="5" fill="rgba(255,211,122,0.85)" />
          <path d="M33 56 L50 74 L67 56" fill="none" stroke="rgba(124,246,255,0.55)" stroke-width="3" opacity="0.8"/>
        </g>
      `;
      return wrap(inner, "#ffd37a");
    }

    // FIRE = "Knife Spark"
    case "FIRE": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <path d="M30 72 L72 30" stroke="rgba(124,246,255,0.95)" stroke-width="6" />
          <path d="M68 26 L78 22 L74 32 Z" fill="rgba(124,246,255,0.85)" opacity="0.9"/>
          <path d="M26 68 L22 78 L32 74 Z" fill="rgba(255,75,214,0.85)" opacity="0.85"/>
          <path d="M52 24 L58 18" stroke="rgba(255,255,255,0.65)" stroke-width="3"/>
          <path d="M24 52 L18 58" stroke="rgba(255,255,255,0.55)" stroke-width="3"/>
        </g>
      `;
      return wrap(inner, "#7cf6ff");
    }

    // STAR = "Glitch Star"
    case "STAR": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <path d="M50 22 L58 42 L80 44 L62 57 L68 78 L50 66 L32 78 L38 57 L20 44 L42 42 Z"
                fill="rgba(183,255,90,0.16)" stroke="rgba(183,255,90,0.95)" stroke-width="4"/>
          <path d="M30 34 L70 34" stroke="rgba(255,75,214,0.55)" stroke-width="3" opacity="0.9"/>
          <path d="M28 62 L72 62" stroke="rgba(124,246,255,0.45)" stroke-width="3" opacity="0.8"/>
        </g>
      `;
      return wrap(inner, "#b7ff5a");
    }

    // CHERRY = "Bunny Paw"
    case "CHERRY": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <circle cx="50" cy="56" r="18" fill="rgba(255,75,214,0.16)" stroke="rgba(255,75,214,0.95)" stroke-width="4"/>
          <circle cx="38" cy="40" r="6" fill="rgba(255,75,214,0.28)" stroke="rgba(255,75,214,0.9)" stroke-width="3"/>
          <circle cx="50" cy="36" r="6" fill="rgba(255,75,214,0.28)" stroke="rgba(255,75,214,0.9)" stroke-width="3"/>
          <circle cx="62" cy="40" r="6" fill="rgba(255,75,214,0.28)" stroke="rgba(255,75,214,0.9)" stroke-width="3"/>
          <path d="M43 58 Q50 66 57 58" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3" opacity="0.7"/>
        </g>
      `;
      return wrap(inner, "#ff4bd6");
    }

    // LEMON = "Carrot Shard"
    case "LEMON": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <path d="M50 22 C62 30 70 44 64 62 C60 74 50 82 42 78 C34 74 30 58 36 42 C40 32 46 26 50 22 Z"
                fill="rgba(255,211,122,0.14)" stroke="rgba(255,211,122,0.95)" stroke-width="4"/>
          <path d="M48 20 C40 16 32 18 26 24" stroke="rgba(183,255,90,0.95)" stroke-width="4"/>
          <path d="M42 18 L36 12" stroke="rgba(183,255,90,0.65)" stroke-width="3"/>
          <path d="M55 38 L45 62" stroke="rgba(124,246,255,0.40)" stroke-width="3" opacity="0.7"/>
        </g>
      `;
      return wrap(inner, "#ffd37a");
    }

    // GREEN = "Neon Chip"
    case "GREEN": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <circle cx="50" cy="50" r="24" fill="rgba(124,246,255,0.10)" stroke="rgba(124,246,255,0.95)" stroke-width="4"/>
          <circle cx="50" cy="50" r="14" fill="rgba(183,255,90,0.10)" stroke="rgba(183,255,90,0.9)" stroke-width="3"/>
          <path d="M50 26 L50 18" stroke="rgba(255,75,214,0.75)" stroke-width="4"/>
          <path d="M74 50 L82 50" stroke="rgba(255,75,214,0.75)" stroke-width="4"/>
          <path d="M50 74 L50 82" stroke="rgba(255,75,214,0.75)" stroke-width="4"/>
          <path d="M26 50 L18 50" stroke="rgba(255,75,214,0.75)" stroke-width="4"/>
        </g>
      `;
      return wrap(inner, "#7cf6ff");
    }

    // WILD = "Chaos Bunny Head"
    case "WILD": {
      const inner = `
        <g filter="url(#${fx}_soft)">
          <!-- ears -->
          <path d="M34 24 C28 10 40 8 44 20" fill="rgba(255,75,214,0.12)" stroke="rgba(255,75,214,0.95)" stroke-width="4"/>
          <path d="M66 24 C72 10 60 8 56 20" fill="rgba(255,75,214,0.12)" stroke="rgba(255,75,214,0.95)" stroke-width="4"/>

          <!-- head -->
          <circle cx="50" cy="54" r="22" fill="rgba(124,246,255,0.10)" stroke="rgba(124,246,255,0.95)" stroke-width="4"/>

          <!-- eyes (unhinged) -->
          <circle cx="42" cy="52" r="4" fill="rgba(255,255,255,0.9)"/>
          <circle cx="58" cy="52" r="4" fill="rgba(255,255,255,0.9)"/>
          <circle cx="42" cy="52" r="1.8" fill="rgba(255,75,214,0.95)"/>
          <circle cx="58" cy="52" r="1.8" fill="rgba(255,75,214,0.95)"/>

          <!-- grin -->
          <path d="M42 62 Q50 70 58 62" fill="none" stroke="rgba(183,255,90,0.95)" stroke-width="4"/>
          <path d="M46 66 L46 72" stroke="rgba(183,255,90,0.8)" stroke-width="3"/>
          <path d="M54 66 L54 72" stroke="rgba(183,255,90,0.8)" stroke-width="3"/>
        </g>
      `;
      return wrap(inner, "#ff4bd6");
    }

    default:
      return `<svg viewBox="0 0 100 100"><text x="50" y="58" text-anchor="middle" font-size="36">?</text></svg>`;
  }
}

function clearHighlights(){
  for(const el of gridEl.querySelectorAll(".cell")){
    el.classList.remove("win","pop");
  }
}

function markCells(cells){
  for(const [r,c] of cells){
    const el = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if(el) el.classList.add("win");
  }
}

function popCells(cells){
  for(const [r,c] of cells){
    const el = gridEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if(el) el.classList.add("pop");
  }
}

function neighbors(r,c){
  return [
    [r-1,c],[r+1,c],[r,c-1],[r,c+1]
  ].filter(([rr,cc]) => rr>=0 && rr<GRID && cc>=0 && cc<GRID);
}

// Find clusters of 6+ for each symbol, allowing wild joins.
// Strategy: evaluate clusters per "base symbol" (non-wild), and treat wild as matching that base.
function findWinningClusters(b){
  const wins = []; // { symbolId, cells:SetKey, size:number }
  const keys = (r,c)=> `${r},${c}`;

  const baseSymbols = SYMS.filter(s=>s.id !== "WILD").map(s=>s.id);

  for(const base of baseSymbols){
    const visited = new Set();

    for(let r=0; r<GRID; r++){
      for(let c=0; c<GRID; c++){
        const id = b[r][c];
        if(id !== base && id !== "WILD") continue;

        const k = keys(r,c);
        if(visited.has(k)) continue;

        // BFS build cluster where cells are base or wild
        const q = [[r,c]];
        visited.add(k);
        const cluster = [];

        while(q.length){
          const [cr,cc] = q.pop();
          cluster.push([cr,cc]);
          for(const [nr,nc] of neighbors(cr,cc)){
            const nid = b[nr][nc];
            if(nid !== base && nid !== "WILD") continue;
            const nk = keys(nr,nc);
            if(visited.has(nk)) continue;
            visited.add(nk);
            q.push([nr,nc]);
          }
        }

        if(cluster.length >= 6){
          wins.push({ symbolId: base, cells: cluster, size: cluster.length });
        }
      }
    }
  }

  // Merge overlaps (same cell could be in two wins if wild bridges; resolve by preferring higher-paying base)
  // Simple approach: greedily pick wins by value, marking used cells.
  wins.sort((a,b)=> clusterValue(b) - clusterValue(a));

  const used = new Set();
  const finalWins = [];
  for(const w of wins){
    const cells = w.cells.filter(([r,c])=> !used.has(`${r},${c}`));
    if(cells.length >= 6){
      cells.forEach(([r,c])=> used.add(`${r},${c}`));
      finalWins.push({ ...w, cells, size: cells.length });
    }
  }

  return finalWins;
}

function clusterValue(w){
  const base = BASE_MULT[w.symbolId] || 0;
  // reward size: 6→1x, 9→~2x, 12+→~6x
  const size = w.size;
  const sizeBoost = size >= 12 ? 6 : size >= 10 ? 3.5 : size >= 8 ? 2 : 1;
  return base * sizeBoost;
}

function payoutForCluster(symbolId, size, bet){
  const base = BASE_MULT[symbolId] || 0;
  const sizeBoost = size >= 12 ? 6 : size >= 10 ? 3.5 : size >= 8 ? 2 : 1;
  // scale: base * boost * bet/10
  return Math.round(base * sizeBoost * (bet/10));
}

function removeAndCascade(b, removeCells){
  // Remove
  for(const [r,c] of removeCells){
    b[r][c] = null;
  }

  // Drop each column
  for(let c=0; c<GRID; c++){
    const col = [];
    for(let r=GRID-1; r>=0; r--){
      if(b[r][c] !== null) col.push(b[r][c]);
    }
    // refill with random at top
    while(col.length < GRID){
      col.push(weightedPick().id);
    }
    // write back bottom-up
    for(let r=GRID-1; r>=0; r--){
      b[r][c] = col[GRID-1 - r];
    }
  }

  return b;
}

async function animateSpinStart(){
  clearHighlights();
  // quick “roll” effect: randomize a few frames
  for(let i=0; i<10; i++){
    const temp = fillRandom(makeEmpty());
    renderBoard(temp);
    await sleep(40);
  }
}

function sleep(ms){ return new Promise(res=>setTimeout(res, ms)); }

async function runCascades(){
  let totalWin = 0;
  let cascade = 0;

  while(true){
    const wins = findWinningClusters(board);
    if(wins.length === 0) break;

    cascade++;
    clearHighlights();

    // highlight and calculate
    let removed = [];
    let cascadeWin = 0;

    for(const w of wins){
      markCells(w.cells);
      const pay = payoutForCluster(w.symbolId, w.size, state.bet);
      cascadeWin += pay;
      removed.push(...w.cells);
    }
if (cascadeWin >= state.bet * 3) { shakeGlass(); shakeGlass(); }
else if (cascadeWin > 0) { shakeGlass(); }
    totalWin += cascadeWin;
    setMsg(`Cascade ${cascade} • +${fmt(cascadeWin)} (${wins.length} cluster${wins.length>1?"s":""})`);
    syncHUD(totalWin);

    // pop, pause
    popCells(removed);
    await sleep(220);

    // cascade
    board = removeAndCascade(board, removed);
    renderBoard(board);
    await sleep(120);
  }

  return totalWin;
}

async function spin(){
  if(spinning) return;
  if(state.balance < state.bet){
    setMsg("Not enough balance.");
    return;
  }
  spinning = true;

  state.balance -= state.bet;
  save();
  syncHUD(0);
  setMsg("Spinning…");

  await animateSpinStart();

  // start with a fresh random board each spin
  board = fillRandom(makeEmpty());
  renderBoard(board);

  const win = await runCascades();

  state.balance += win;
  save();

  if(win > 0){
    setMsg(`WIN ${fmt(win)} • Tap SPIN again.`);
  } else {
    setMsg("No win. Tap SPIN again.");
  }
  syncHUD(win);

  spinning = false;
}

// Controls
spinBtn.addEventListener("click", spin);
betUpBtn.addEventListener("click", ()=>{
  if(spinning) return;
  state.bet = Math.min(200, state.bet + 5);
  save();
  syncHUD(0);
  setMsg("Bet increased.");
});
betDownBtn.addEventListener("click", ()=>{
  if(spinning) return;
  state.bet = Math.max(5, state.bet - 5);
  save();
  syncHUD(0);
  setMsg("Bet decreased.");
});
resetBtn.addEventListener("click", ()=>{
  if(spinning) return;
  state = { balance: 1000, bet: 10 };
  save();
  syncHUD(0);
  board = fillRandom(makeEmpty());
  renderBoard(board);
  setMsg("Reset complete.");
});
