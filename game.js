document.addEventListener("DOMContentLoaded", () => {
 const shell=document.querySelector("[data-game]"); if(!shell)return;
 const type=shell.dataset.game, area=document.getElementById("game-area"), scoreLabel=document.getElementById("score-label"), note=document.getElementById("game-note"), restart=document.getElementById("restart");
 let cleanup=()=>{}; const setScore=n=>scoreLabel.textContent="Score: "+n; const setNote=t=>note.textContent=t;
 function start(){cleanup();area.innerHTML="";setScore(0);setNote("Ready when you are."); if(type==="reaction-test") reaction(); if(type==="number-merge") merge(); if(type==="ball-sort") balls(); if(type==="block-puzzle") blocks(); if(type==="endless-runner") runner();}
 restart.addEventListener("click",start);
 function reaction(){let state="idle",timer=0,startAt=0,results=[];const b=document.createElement("button");b.className="reaction-pad";b.textContent="Tap to start";area.append(b);
 const handler=()=>{if(state==="idle"){state="wait";b.classList.add("waiting");b.textContent="Wait for green…";timer=setTimeout(()=>{state="go";startAt=performance.now();b.className="reaction-pad go";b.textContent="TAP NOW!";},900+Math.random()*2800);}else if(state==="wait"){clearTimeout(timer);state="idle";b.className="reaction-pad";b.textContent="Too soon! Tap to try again";setNote("False start — wait until the screen turns green.");}else if(state==="go"){const ms=Math.round(performance.now()-startAt);results.push(ms);state="idle";b.className="reaction-pad";b.textContent=ms+" ms — play again";setScore(ms+" ms");setNote("Best: "+Math.min(...results)+" ms · Average: "+Math.round(results.reduce((a,c)=>a+c,0)/results.length)+" ms");}};b.addEventListener("click",handler);cleanup=()=>{clearTimeout(timer);b.removeEventListener("click",handler);};}

function merge() {
  let board = Array(16).fill(0);
  let score = 0;
  let gameOver = false;
  let won = false;

  const wrap = document.createElement("div");
  wrap.className = "tile-board";
  area.append(wrap);

  // Create the 16 tiles once. Reuse them on every move.
  const cells = [];

  for (let i = 0; i < 16; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.index = i;
    wrap.append(tile);
    cells.push(tile);
  }

  const updateTile = (i, value, animation = "") => {
    const tile = cells[i];
    const oldValue = Number(tile.dataset.value || 0);

    tile.textContent = value || "";
    tile.dataset.value = value;

    tile.className =
      "tile" +
      (value ? (value >= 128 ? " big" : " v" + value) : "");

    if (animation) {
      tile.classList.add(animation);
      tile.addEventListener("animationend", () => {
        tile.classList.remove(animation);
      }, { once: true });
    } else if (value && !oldValue) {
      tile.classList.add("tile-pop");
      tile.addEventListener("animationend", () => {
        tile.classList.remove("tile-pop");
      }, { once: true });
    }
  };

  const render = (merged = []) => {
    cells.forEach((tile, i) => {
      updateTile(i, board[i], merged.includes(i) ? "tile-merge" : "");
    });
    setScore(score);
  };

  const addTile = () => {
    const empty = board
      .map((value, index) => value === 0 ? index : -1)
      .filter(index => index !== -1);

    if (!empty.length) return -1;

    const index = empty[Math.floor(Math.random() * empty.length)];
    board[index] = Math.random() < 0.9 ? 2 : 4;

    return index;
  };

  const getLine = (direction, line) => {
    const ids = [];

    for (let j = 0; j < 4; j++) {
      if (direction === "left") ids.push(line * 4 + j);
      if (direction === "right") ids.push(line * 4 + 3 - j);
      if (direction === "up") ids.push(j * 4 + line);
      if (direction === "down") ids.push((3 - j) * 4 + line);
    }

    return ids;
  };

  const calculateMove = (direction, source) => {
    const result = source.slice();
    let gained = 0;
    let changed = false;
    const merged = [];

    for (let line = 0; line < 4; line++) {
      const ids = getLine(direction, line);
      const values = ids.map(i => source[i]).filter(Boolean);
      const output = [];

      for (let k = 0; k < values.length; k++) {
        if (values[k] === values[k + 1]) {
          const value = values[k] * 2;
          output.push(value);
          gained += value;
          k++;
        } else {
          output.push(values[k]);
        }
      }

      while (output.length < 4) output.push(0);

      ids.forEach((id, k) => {
        if (result[id] !== output[k]) changed = true;
        result[id] = output[k];

        // Identify tiles that have just merged.
        if (output[k] && output[k] > source[id]) {
          merged.push(id);
        }
      });
    }

    return { result, gained, changed, merged };
  };

  const canMove = () => {
    if (board.includes(0)) return true;

    return ["left", "right", "up", "down"].some(direction => {
      return calculateMove(direction, board).changed;
    });
  };

  const move = direction => {
    if (gameOver) return;

    const result = calculateMove(direction, board);

    if (!result.changed) return;

    board = result.result;
    score += result.gained;

    const spawnedIndex = addTile();

    render(result.merged);

    if (!won && board.includes(2048)) {
      won = true;
      setNote("2048 reached! Amazing! Keep playing or restart.");
    } else if (spawnedIndex === -1 || !canMove()) {
      gameOver = true;
      setNote("Game over! Final score: " + score + ". Press Restart to play again.");
    }
  };

  addTile();
  addTile();
  render();

  const keyHandler = e => {
    const directions = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      d: "right",
      w: "up",
      s: "down"
    };

    const direction = directions[e.key];

    if (direction) {
      e.preventDefault();
      move(direction);
    }
  };

  let startX = 0;
  let startY = 0;

  const touchStart = e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const touchEnd = e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;

    move(
      Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up")
    );
  };

  window.addEventListener("keydown", keyHandler);
  wrap.addEventListener("touchstart", touchStart, { passive: true });
  wrap.addEventListener("touchend", touchEnd, { passive: true });

  cleanup = () => {
    window.removeEventListener("keydown", keyHandler);
    wrap.removeEventListener("touchstart", touchStart);
    wrap.removeEventListener("touchend", touchEnd);
  };

  setNote("Use arrow keys, WASD or swipe to move. Merge matching numbers to reach 2048.");
}
 const move=dir=>{let changed=false;for(let line=0;line<4;line++){let ids=[];for(let j=0;j<4;j++)ids.push(dir==="left"?line*4+j:dir==="right"?line*4+3-j:dir==="up"?j*4+line:(3-j)*4+line);let vals=ids.map(i=>board[i]).filter(Boolean),out=[];for(let k=0;k<vals.length;k++){if(vals[k]===vals[k+1]){out.push(vals[k]*2);score+=vals[k]*2;k++;}else out.push(vals[k]);}while(out.length<4)out.push(0);ids.forEach((id,k)=>{if(board[id]!==out[k])changed=true;board[id]=out[k];});}if(changed){add();render();if(board.includes(2048))setNote("2048 reached! Keep playing or restart.");else if(!canMove())setNote("No more moves. Restart to play again.");}};
 const canMove=()=>board.includes(0)||["left","right","up","down"].some(d=>{let copy=board.slice();let before=score;moveNoSpawn(d);let ok=copy.some((v,i)=>v!==board[i]);board=copy;score=before;return ok;});
 const moveNoSpawn=dir=>{for(let line=0;line<4;line++){let ids=[];for(let j=0;j<4;j++)ids.push(dir==="left"?line*4+j:dir==="right"?line*4+3-j:dir==="up"?j*4+line:(3-j)*4+line);let vals=ids.map(i=>board[i]).filter(Boolean),out=[];for(let k=0;k<vals.length;k++){if(vals[k]===vals[k+1]){out.push(vals[k]*2);k++;}else out.push(vals[k]);}while(out.length<4)out.push(0);ids.forEach((id,k)=>board[id]=out[k]);}};
 const key=e=>{const map={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};if(map[e.key]){e.preventDefault();move(map[e.key]);}};window.addEventListener("keydown",key);let sx=0,sy=0;wrap.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});wrap.addEventListener("touchend",e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))>25)move(Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up"));});cleanup=()=>window.removeEventListener("keydown",key);setNote("Use arrow keys or swipe to move tiles.");}
 function balls(){const colors=["red","blue","green","yellow","purple","orange"];let tubes=[];for(let i=0;i<5;i++)tubes.push([]);let all=[];colors.slice(0,4).forEach(c=>{for(let j=0;j<4;j++)all.push(c)});all.sort(()=>Math.random()-.5);for(let i=0;i<4;i++)tubes[i]=all.slice(i*4,i*4+4);let selected=-1,moves=0;const draw=()=>{area.innerHTML="";const row=document.createElement("div");row.className="tubes";tubes.forEach((t,i)=>{const el=document.createElement("button");el.className="tube";el.setAttribute("aria-label","Tube "+(i+1));t.forEach(c=>{const ball=document.createElement("span");ball.className="ball "+c;el.append(ball);});el.addEventListener("click",()=>tap(i));row.append(el);});area.append(row);setScore(moves);};const tap=i=>{if(selected<0){if(tubes[i].length)selected=i;}else if(selected===i)selected=-1;else{let from=tubes[selected],to=tubes[i],c=from[from.length-1];if(c&&to.length<4&&(!to.length||to[to.length-1]===c)){to.push(from.pop());moves++;}selected=-1;}draw();if(tubes.every(t=>!t.length||t.every(c=>c===t[0])&&t.length===4))setNote("Puzzle complete! Great sorting.");};draw();setNote("Tap a tube, then tap another tube. One empty tube helps.");}
 function blocks(){let grid=Array(64).fill(0),score=0,shapes=[[[1,1],[1,1]],[[1,1,1]],[[1],[1],[1]],[[1,1,1],[0,1,0]],[[1,1],[0,1]],[[1],[1],[1],[1]]],current=[];const next=()=>{current=Array.from({length:3},()=>shapes[Math.floor(Math.random()*shapes.length)]);};const draw=()=>{area.innerHTML="";let board=document.createElement("div");board.className="block-board";grid.forEach((v,i)=>{let c=document.createElement("button");c.className="block-cell"+(v?" filled":"");c.setAttribute("aria-label","Cell "+(i+1));c.addEventListener("click",()=>place(i));board.append(c);});area.append(board);let tray=document.createElement("div");tray.style.cssText="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px";current.forEach((s,i)=>{let b=document.createElement("button");b.className="control-btn secondary";b.textContent=s.map(r=>r.map(v=>v?"■":" ").join("")).join(" / ");b.style.fontSize="11px";b.style.maxWidth="100px";b.addEventListener("click",()=>{selected=i;setNote("Selected shape "+(i+1)+". Tap an empty cell.");});tray.append(b);});area.append(tray);setScore(score);};let selected=0;const fits=(shape,r,c)=>shape.every((line,y)=>line.every((v,x)=>!v||(r+y<8&&c+x<8&&!grid[(r+y)*8+c+x])));const place=i=>{let s=current[selected],r=Math.floor(i/8),c=i%8;if(!fits(s,r,c)){setNote("That shape does not fit there.");return;}s.forEach((line,y)=>line.forEach((v,x)=>{if(v)grid[(r+y)*8+c+x]=1;}));let clear=new Set();for(let y=0;y<8;y++)if(grid.slice(y*8,y*8+8).every(Boolean))for(let x=0;x<8;x++)clear.add(y*8+x);for(let x=0;x<8;x++)if(Array.from({length:8},(_,y)=>grid[y*8+x]).every(Boolean))for(let y=0;y<8;y++)clear.add(y*8+x);clear.forEach(i=>grid[i]=0);score+=s.flat().filter(Boolean).length+clear.size*2;current[selected]=shapes[Math.floor(Math.random()*shapes.length)];draw();if(current.every(sh=>!Array.from({length:64},(_,i)=>fits(sh,Math.floor(i/8),i%8)).some(Boolean)))setNote("No available placement. Restart to try again.");};next();draw();setNote("Choose a shape, then tap a board position to place it.");}
 function runner(){const canvas=document.createElement("canvas");canvas.width=680;canvas.height=300;canvas.className="runner-canvas";area.append(canvas);const ctx=canvas.getContext("2d");let x=80,y=220,vy=0,obs=[],score=0,alive=true,frame=0,raf;const jump=()=>{if(y>=220&&alive)vy=-13;};const key=e=>{if(e.code==="Space"){e.preventDefault();jump();}};window.addEventListener("keydown",key);canvas.addEventListener("pointerdown",jump);function loop(){ctx.clearRect(0,0,680,300);ctx.fillStyle="#d8e8f8";ctx.fillRect(0,250,680,50);ctx.fillStyle="#283b59";ctx.fillRect(0,250,680,3);vy+=.65;y+=vy;if(y>220){y=220;vy=0;}if(frame%85===0)obs.push({x:690,w:24,h:35+Math.random()*25});obs.forEach(o=>o.x-=5);obs=obs.filter(o=>o.x>-30);ctx.fillStyle="#7057f5";ctx.fillRect(x,y,30,30);ctx.fillStyle="#f46b9b";obs.forEach(o=>ctx.fillRect(o.x,250-o.h,o.w,o.h));if(obs.some(o=>x+27>o.x&&x<o.x+o.w&&y+27>250-o.h)){alive=false;}ctx.fillStyle="#17172a";ctx.font="bold 18px sans-serif";ctx.fillText("Distance: "+score,20,30);if(alive){score++;frame++;setScore(Math.floor(score/5));raf=requestAnimationFrame(loop);}else{ctx.fillStyle="#17172a";ctx.font="bold 30px sans-serif";ctx.fillText("Game over!",260,135);setNote("You ran "+Math.floor(score/5)+" metres. Press Restart to run again.");}}loop();cleanup=()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",key);};setNote("Tap, click or press Space to jump.");}
 start();
});
