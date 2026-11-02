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
 
function balls() {
  const palette = ["red", "blue", "green", "yellow", "purple", "orange"];
  const STORAGE_KEY = "playviral_ball_sort_progress";
  const CAPACITY = 4;

  const levelLabel = document.getElementById("level-label");
  const starsLabel = document.getElementById("stars-label");
  const coinsLabel = document.getElementById("coins-label");
  const progressText = document.getElementById("level-progress-text");
  const progressFill = document.getElementById("level-progress-fill");
  const progressBar = document.getElementById("level-progress");
  const levelMessage = document.getElementById("level-message");
  const nextButton = document.getElementById("next-level");

  let saved = { level: 1, stars: 0, coins: 0 };

  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    saved.level = Math.max(1, Number(data.level) || 1);
    saved.stars = Math.max(0, Number(data.stars) || 0);
    saved.coins = Math.max(0, Number(data.coins) || 0);
  } catch (error) {
    console.warn("Ball Sort progress could not be loaded.", error);
  }

  let level = saved.level;
  let totalStars = saved.stars;
  let totalCoins = saved.coins;
  let tubes = [];
  let selected = -1;
  let moves = 0;
  let completed = false;

  const colorCount = () => Math.min(
    palette.length,
    2 + Math.floor((level - 1) / 3)
  );

  const saveProgress = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        level,
        stars: totalStars,
        coins: totalCoins
      }));
    } catch (error) {
      console.warn("Ball Sort progress could not be saved.", error);
    }
  };

  const updateDashboard = () => {
    if (levelLabel) levelLabel.textContent = "Level " + level;
    if (starsLabel) starsLabel.textContent = "⭐ " + totalStars;
    if (coinsLabel) coinsLabel.textContent = "🪙 " + totalCoins;

    const count = colorCount();
    const sorted = tubes.filter(tube =>
      tube.length === CAPACITY &&
      tube.every(color => color === tube[0])
    ).length;

    const percent = Math.round((sorted / count) * 100);

    if (progressText) {
      progressText.textContent = sorted + " / " + count + " tubes sorted";
    }

    if (progressFill) {
      progressFill.style.width = percent + "%";
    }

    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(percent));
    }

    if (nextButton) {
      nextButton.hidden = !completed;
      nextButton.disabled = !completed;
    }
  };

  const createPuzzle = () => {
    const count = colorCount();

    // Begin with a solved puzzle.
    const puzzle = [];

    for (let i = 0; i < count; i++) {
      puzzle.push(Array(CAPACITY).fill(palette[i]));
    }

    puzzle.push([]);

    // Reverse legal moves to generate a solvable scramble.
    let previousSource = -1;
    let previousDestination = -1;
    const scrambleMoves = Math.min(70, 10 + level * 3);
    let successfulMoves = 0;
    let attempts = 0;

    while (successfulMoves < scrambleMoves && attempts < scrambleMoves * 30) {
      attempts++;

      const sources = puzzle
        .map((tube, index) => tube.length ? index : -1)
        .filter(index => index !== -1);

      const source = sources[Math.floor(Math.random() * sources.length)];

      const destinations = puzzle
        .map((tube, index) => {
          if (index === source) return -1;
          if (tube.length >= CAPACITY) return -1;
          if (index === previousSource) return -1;

          const top = tube[tube.length - 1];
          const ball = puzzle[source][puzzle[source].length - 1];

          if (top && top !== ball) return -1;

          return index;
        })
        .filter(index => index !== -1);

      if (!destinations.length) continue;

      const destination =
        destinations[Math.floor(Math.random() * destinations.length)];

      // Move one ball in reverse direction.
      const ball = puzzle[source].pop();
      puzzle[destination].push(ball);

      previousSource = source;
      previousDestination = destination;
      successfulMoves++;
    }

    return puzzle;
  };

  const render = () => {
    area.innerHTML = "";

    const board = document.createElement("div");
    board.className = "ball-board";

    tubes.forEach((tube, index) => {
      const tubeElement = document.createElement("button");
      tubeElement.type = "button";
      tubeElement.className = "tube";
      tubeElement.setAttribute("aria-label", "Tube " + (index + 1));

      if (selected === index) {
        tubeElement.classList.add("selected");
      }

      const ballSlots = [];

      for (let i = 0; i < CAPACITY; i++) {
        const ball = document.createElement("span");
        ball.className = "ball";

        const color = tube[i];

        if (color) {
          ball.classList.add("ball-" + color);
        }

        ballSlots.push(ball);
      }

      // Display balls from bottom to top.
      ballSlots.forEach(slot => tubeElement.append(slot));

      tubeElement.addEventListener("click", () => handleTubeClick(index));

      board.append(tubeElement);
    });

    area.append(board);
    updateDashboard();
  };

  const isTubeComplete = tube =>
    tube.length === CAPACITY &&
    tube.every(color => color === tube[0]);

  const isGameComplete = () =>
    tubes.every(tube => tube.length === 0 || isTubeComplete(tube));

  const handleTubeClick = index => {
    if (completed) return;

    const tube = tubes[index];

    if (selected === -1) {
      if (!tube.length) {
        setNote("Select a tube containing a ball first.");
        return;
      }

      selected = index;
      render();
      setNote("Now select a tube to move the top ball.");
      return;
    }

    if (selected === index) {
      selected = -1;
      render();
      setNote("Selection cancelled.");
      return;
    }

    const source = tubes[selected];
    const destination = tubes[index];

    if (!source.length) {
      selected = -1;
      render();
      return;
    }

    const movingBall = source[source.length - 1];
    const destinationTop = destination[destination.length - 1];

    if (destination.length >= CAPACITY) {
      setNote("This tube is full. Choose another tube.");
      return;
    }

    if (destination.length && destinationTop !== movingBall) {
      setNote("You can only place a ball on the same color.");
      return;
    }

    destination.push(source.pop());
    moves++;
    selected = -1;

    render();
    setScore(moves);

    if (isGameComplete()) {
      completeLevel();
    } else {
      setNote("Good move! Keep sorting the colors.");
    }
  };

  const completeLevel = () => {
    if (completed) return;

    completed = true;

    let earnedStars = 1;

    if (moves <= colorCount() * 5) {
      earnedStars = 3;
    } else if (moves <= colorCount() * 9) {
      earnedStars = 2;
    }

    const earnedCoins = 10 + level * 2;

    totalStars += earnedStars;
    totalCoins += earnedCoins;

    saveProgress();
    updateDashboard();

    if (levelMessage) {
      levelMessage.textContent =
        "Level completed! You earned " +
        earnedStars + " stars and " +
        earnedCoins + " coins.";
    }

    setNote(
      "Level " + level + " completed! ⭐ " +
      earnedStars + " stars earned. 🪙 " +
      earnedCoins + " coins earned."
    );

    setScore(moves);
  };

  const startLevel = () => {
    selected = -1;
    moves = 0;
    completed = false;

    tubes = createPuzzle();

    if (levelMessage) {
      levelMessage.textContent = "Sort all colors to complete this level.";
    }

    if (nextButton) {
      nextButton.hidden = true;
      nextButton.disabled = true;
    }

    setScore(0);
    render();
    setNote("Sort the balls by color. Only matching colors can be stacked.");
  };

  const nextLevelHandler = () => {
    if (!completed) return;

    level++;
    saveProgress();
    startLevel();
  };

  if (nextButton) {
    nextButton.addEventListener("click", nextLevelHandler);
  }

  startLevel();

  cleanup = () => {
    if (nextButton) {
      nextButton.removeEventListener("click", nextLevelHandler);
    }
  };
}
 function runner(){const canvas=document.createElement("canvas");canvas.width=680;canvas.height=300;canvas.className="runner-canvas";area.append(canvas);const ctx=canvas.getContext("2d");let x=80,y=220,vy=0,obs=[],score=0,alive=true,frame=0,raf;const jump=()=>{if(y>=220&&alive)vy=-13;};const key=e=>{if(e.code==="Space"){e.preventDefault();jump();}};window.addEventListener("keydown",key);canvas.addEventListener("pointerdown",jump);function loop(){ctx.clearRect(0,0,680,300);ctx.fillStyle="#d8e8f8";ctx.fillRect(0,250,680,50);ctx.fillStyle="#283b59";ctx.fillRect(0,250,680,3);vy+=.65;y+=vy;if(y>220){y=220;vy=0;}if(frame%85===0)obs.push({x:690,w:24,h:35+Math.random()*25});obs.forEach(o=>o.x-=5);obs=obs.filter(o=>o.x>-30);ctx.fillStyle="#7057f5";ctx.fillRect(x,y,30,30);ctx.fillStyle="#f46b9b";obs.forEach(o=>ctx.fillRect(o.x,250-o.h,o.w,o.h));if(obs.some(o=>x+27>o.x&&x<o.x+o.w&&y+27>250-o.h)){alive=false;}ctx.fillStyle="#17172a";ctx.font="bold 18px sans-serif";ctx.fillText("Distance: "+score,20,30);if(alive){score++;frame++;setScore(Math.floor(score/5));raf=requestAnimationFrame(loop);}else{ctx.fillStyle="#17172a";ctx.font="bold 30px sans-serif";ctx.fillText("Game over!",260,135);setNote("You ran "+Math.floor(score/5)+" metres. Press Restart to run again.");}}loop();cleanup=()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",key);};setNote("Tap, click or press Space to jump.");}
 start();
});
