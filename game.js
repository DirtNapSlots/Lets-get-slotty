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
      div.textContent = symEmoji(b[r][c]);
      gridEl.appendChild(div);
    }
  }
}

function symEmoji(id){
  return SYMS.find(s=>s.id===id)?.e || "❔";
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
