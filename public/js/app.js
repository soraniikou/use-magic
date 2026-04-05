/**
 * use magic — walking log + fragments (p5.js + Matter.js)
 */
(function () {
  const STORAGE_KEY = "use_magic_v1";
  const Matter = window.Matter;
  const { Engine, World, Bodies, Body, Composite, Events } = Matter;

  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /** 重い金属が噛み合うような短い「カチリ」 */
  function playClack() {
    const ctx = ensureAudio();
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "square";
    const og = ctx.createGain();
    osc.connect(og);
    og.connect(master);
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.07);
    og.gain.setValueAtTime(0.22, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.12);

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    }
    noise.buffer = buf;
    const ng = ctx.createGain();
    noise.connect(ng);
    ng.connect(master);
    ng.gain.setValueAtTime(0.12, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.start(t);
    noise.stop(t + 0.06);
  }

  function playMagicChime() {
    const ctx = ensureAudio();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.value = 0.2;
    g.connect(ctx.destination);
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      const og = ctx.createGain();
      o.connect(og);
      og.connect(g);
      const st = t + i * 0.04;
      o.frequency.setValueAtTime(freq, st);
      og.gain.setValueAtTime(0, st);
      og.gain.linearRampToValueAtTime(0.15, st + 0.02);
      og.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      o.start(st);
      o.stop(st + 0.4);
    });
  }

  const sketch = (p) => {
    let engine;
    let world;
    let floorBody;
    let wallLeft;
    let wallRight;
    let canvas;

    let roadScroll = 0;
    let roadSpeed = 0.55;
    let distanceMeters = 0;
    /** @type {{ worldX: number, sides: number, seed: number, isGem: boolean, text: string }[]} */
    let roadside = [];
    let walkerPhase = 0;

    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;

    /** grain buffer */
    let grainImg = null;

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.version !== 1) return;
        roadside = Array.isArray(data.roadside) ? data.roadside : [];
        roadScroll = typeof data.roadScroll === "number" ? data.roadScroll : 0;
        distanceMeters = typeof data.distanceMeters === "number" ? data.distanceMeters : 0;
        return data.bodies;
      } catch {
        return null;
      }
    }

    function saveState() {
      const bodies = Composite.allBodies(world).filter((b) => !b.plugin?.isWall);
      const records = bodies.map(serializeBody);
      const payload = {
        version: 1,
        roadside,
        roadScroll,
        distanceMeters,
        bodies: records,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* quota */
      }
    }

    let saveTimer = null;
    function scheduleSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = null;
        saveState();
      }, 400);
    }

    function serializeBody(b) {
      const verts = b.vertices.map((v) => ({ x: v.x, y: v.y }));
      return {
        x: b.position.x,
        y: b.position.y,
        angle: b.angle,
        vtx: verts,
        text: b.plugin?.text ?? "",
        isGem: !!b.plugin?.isGem,
        isStatic: b.isStatic,
        settle: b.plugin?.settle ?? 0,
        roadEcho: !!b.plugin?.roadEcho,
      };
    }

    function deserializeBody(rec) {
      if (!rec.vtx || rec.vtx.length < 3) return null;
      const body = Body.create({
        position: { x: rec.x, y: rec.y },
        angle: rec.angle,
        vertices: rec.vtx,
        friction: 0.62,
        restitution: 0.12,
        density: 0.0025,
        isStatic: !!rec.isStatic,
        plugin: {
          text: rec.text,
          isGem: !!rec.isGem,
          settle: rec.settle || 0,
          roadEcho: !!rec.roadEcho,
        },
      });
      return body;
    }

    function makeWallBodies(w, h, roadTop) {
      const t = 40;
      const floor = Bodies.rectangle(w / 2, roadTop + t / 2, w * 2, t, {
        isStatic: true,
        friction: 0.85,
        plugin: { isWall: true },
      });
      const left = Bodies.rectangle(-t / 2, h / 2, t, h * 2, {
        isStatic: true,
        plugin: { isWall: true },
      });
      const right = Bodies.rectangle(w + t / 2, h / 2, t, h * 2, {
        isStatic: true,
        plugin: { isWall: true },
      });
      return { floor, left, right };
    }

    function spawnJunk(text, cx, cy) {
      const sides = p.random() < 0.5 ? 3 : 4;
      const body = Bodies.polygon(cx, cy, sides, p.random(14, 26), {
        angle: p.random(p.TWO_PI),
        friction: 0.58,
        restitution: 0.18,
        density: 0.0022,
        plugin: { text, isGem: false, settle: 0, roadEcho: false },
      });
      Body.setAngularVelocity(body, p.random(-0.08, 0.08));
      Body.setVelocity(body, { x: p.random(-1.2, 1.2), y: p.random(-0.5, 0.5) });
      Composite.add(world, body);
      scheduleSave();
      return body;
    }

    function addRoadsideFromBody(b) {
      if (b.plugin?.roadEcho) return;
      b.plugin.roadEcho = true;
      const sides = b.vertices.length;
      roadside.push({
        worldX: roadScroll + p.width + p.random(30, 120),
        sides: Math.min(4, Math.max(3, sides)),
        seed: p.random(1000000),
        isGem: !!b.plugin?.isGem,
        text: (b.plugin?.text || "").slice(0, 24),
      });
      scheduleSave();
    }

    function applyMagic(px, py) {
      const bodies = Composite.allBodies(world).filter(
        (b) => !b.plugin?.isWall && !b.plugin?.isGem
      );
      const R = 130;
      const converted = [];
      for (const b of bodies) {
        const dx = b.position.x - px;
        const dy = b.position.y - py;
        if (dx * dx + dy * dy < R * R) {
          b.plugin.isGem = true;
          b.plugin.settle = 999;
          Body.setVelocity(b, {
            x: b.velocity.x * 0.3,
            y: -2.2 - p.random(0.5, 1.5),
          });
          Body.setAngularVelocity(b, p.random(-0.15, 0.15));
          converted.push(b);
        }
      }
      if (converted.length > 0) {
        playMagicChime();
        for (const b of converted) {
          roadside.push({
            worldX: roadScroll + p.width + p.random(30, 120),
            sides: Math.min(4, Math.max(3, b.vertices.length)),
            seed: p.random(1000000),
            isGem: true,
            text: (b.plugin?.text || "").slice(0, 24),
          });
        }
        scheduleSave();
      }
    }

    p.setup = () => {
      canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent("p5-root");

      engine = Engine.create({ enableSleeping: true });
      world = engine.world;
      engine.gravity.y = 1.05;

      const roadTop = p.height * 0.62;
      const walls = makeWallBodies(p.width, p.height, roadTop);
      floorBody = walls.floor;
      wallLeft = walls.left;
      wallRight = walls.right;
      Composite.add(world, [floorBody, wallLeft, wallRight]);

      const savedBodies = loadState();
      if (savedBodies && savedBodies.length) {
        for (const rec of savedBodies) {
          const b = deserializeBody(rec);
          if (b) Composite.add(world, b);
        }
      }

      grainImg = p.createGraphics(p.width, p.height);
      buildGrain(grainImg);

      pointerX = p.width / 2;
      pointerY = p.height / 2;
      hasPointer = false;

      Events.on(engine, "collisionStart", () => {
        /* 衝突の気配だけ残す — 音は入れすぎない */
      });

      window.addEventListener("beforeunload", saveState);

      window.__useMagic = {
        dropText(text) {
          const t = (text || "").trim();
          if (!t) return;
          playClack();
          spawnJunk(t.slice(0, 200), p.width / 2 + p.random(-80, 80), 48);
        },
        magic() {
          const cx = hasPointer ? pointerX : p.width / 2;
          const cy = hasPointer ? pointerY : p.height * 0.38;
          applyMagic(cx, cy);
        },
        save: saveState,
      };
    };

    function buildGrain(g) {
      g.clear();
      const n = Math.floor((g.width * g.height) / 2200);
      for (let i = 0; i < n; i++) {
        g.stroke(220, 218, 255, p.random(6, 32));
        g.strokeWeight(p.random(0.6, 1.2));
        g.point(p.random(g.width), p.random(g.height));
      }
    }

    function updatePointer() {
      pointerX = p.mouseX;
      pointerY = p.mouseY;
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        hasPointer = true;
      }
    }

    p.mouseMoved = () => {
      updatePointer();
    };
    p.mousePressed = () => {
      updatePointer();
      hasPointer = true;
    };
    p.touchStarted = (e) => {
      if(e && e.target && (
        e.target.tagName === 'TEXTAEA'  ||
        e.target.tagName === 'BUTTON'
      )) return true;

      if (e && e.preventDefault) e.preventDefault();
      if (p.touches && p.touches.length) {
        pointerX = p.touches[0].x;
        pointerY = p.touches[0].y;
        hasPointer = true;
      }
      return false;
    };
    p.touchMoved = (e) => {
      if(e && e.target && (
        e.target.tagName === 'TEXTAREA'  ||
        e.target.tagNa,e ==='BUTTON'
      ))return true;
      
      if (e && e.preventDefault) e.preventDefault();
      if (p.touches && p.touches.length) {
        pointerX = p.touches[0].x;
        pointerY = p.touches[0].y;
        hasPointer = true;
      }
      return false;
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      const roadTop = p.height * 0.62;
      Body.setPosition(floorBody, { x: p.width / 2, y: roadTop + 20 });
      Body.setPosition(wallLeft, { x: -20, y: p.height / 2 });
      Body.setPosition(wallRight, { x: p.width + 20, y: p.height / 2 });
      grainImg = p.createGraphics(p.width, p.height);
      buildGrain(grainImg);
    };

    function settleStep() {
      const roadTop = p.height * 0.62;
      const bodies = Composite.allBodies(world).filter((b) => !b.plugin?.isWall);
      for (const b of bodies) {
        if (b.plugin?.isGem) continue;
        const onFloor = b.position.y > roadTop - 50;
        const slow =
          Math.abs(b.velocity.x) < 0.35 &&
          Math.abs(b.velocity.y) < 0.35 &&
          Math.abs(b.angularVelocity) < 0.06;
        if (onFloor && slow) {
          b.plugin.settle = (b.plugin.settle || 0) + 1;
          if (b.plugin.settle > 90) {
            addRoadsideFromBody(b);
            b.plugin.settle = -9999;
          }
        } else {
          if (b.plugin.settle > 0 && b.plugin.settle < 80) b.plugin.settle = 0;
        }
      }
    }

    function drawWobblyPath(roadY, offset) {
      p.push();
      p.noFill();
      p.stroke(232, 197, 71, p.map(p.sin(p.frameCount * 0.04), -1, 1, 70, 130));
      p.strokeWeight(1.1);
      p.beginShape();
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = t * p.width * 1.05 - (offset % 140) - 10;
        const n = p.noise(i * 0.15, p.frameCount * 0.012) * 5 - 2.5;
        const wobble = (p.noise(i * 0.4 + 99, p.frameCount * 0.008) - 0.5) * 4;
        p.vertex(x + n + wobble, roadY + 4 + p.noise(i * 0.25) * 3);
      }
      p.endShape();
      p.pop();
    }

    function drawRoadsideStone(x, y, item) {
      p.push();
      p.translate(x, y);
      const seed = item.seed || 0;
      p.randomSeed(seed);
      const sides = item.sides || 4;
      if (item.isGem) {
        p.stroke(180, 160, 255, 120);
        p.strokeWeight(0.6);
        p.fill(232, 197, 71, p.map(p.sin(p.frameCount * 0.08 + seed), -1, 1, 40, 90));
      } else {
        p.stroke(60, 58, 90, 100);
        p.strokeWeight(0.5);
        p.fill(42, 42, 68, 160);
      }
      p.beginShape();
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * p.TWO_PI + p.random(-0.2, 0.2);
        const r = p.random(5, 11) * (item.isGem ? 0.85 : 1);
        const wx = p.cos(a) * r + (p.noise(i, seed) - 0.5) * 3;
        const wy = p.sin(a) * r * 0.65 + (p.noise(i + 9, seed) - 0.5) * 2;
        p.vertex(wx, wy);
      }
      p.endShape(p.CLOSE);
      p.pop();
      p.randomSeed(p.frameCount + p.millis());
    }

    function truncateLabel(s, max) {
      const t = (s || "").trim();
      if (t.length <= max) return t;
      return t.slice(0, max) + "…";
    }

    function drawFragmentBody(b) {
      const verts = b.vertices;
      const gem = b.plugin?.isGem;
      p.push();
      p.strokeWeight(1);
      if (gem) {
        p.fill(232, 197, 71, 200);
        p.stroke(240, 220, 140, 90);
      } else {
        p.fill(55, 54, 82, 230);
        p.stroke(90, 88, 120, 140);
      }
      p.beginShape();
      for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        const j = p.noise(v.x * 0.02, v.y * 0.02, p.frameCount * 0.02) * 2.2;
        p.vertex(v.x + j, v.y + j);
      }
      p.endShape(p.CLOSE);

      const label = truncateLabel(b.plugin?.text, 32);
      if (label) {
        const bid = b.id || 0;
        const jx = (p.noise(bid * 0.08, p.frameCount * 0.018) - 0.5) * 2.8;
        const jy = (p.noise(bid * 0.08 + 31, p.frameCount * 0.018) - 0.5) * 2.8;
        const top = b.bounds.min.y;
        const tx = b.position.x + jx;
        const ty = top - 5 + jy;
        const ctx = p.drawingContext;
        p.textFont("'Zen Old Mincho', serif");
        p.textSize(gem ? 9 : 8);
        p.textAlign(p.CENTER, p.BOTTOM);
        ctx.save();
        ctx.shadowBlur = gem ? 6 : 5;
        ctx.shadowColor = "rgba(8, 8, 20, 0.85)";
        p.noStroke();
        if (gem) {
          p.fill(255, 248, 220, 210);
        } else {
          p.fill(198, 194, 225, 195);
        }
        p.text(label, tx, ty);
        ctx.restore();
      }
      p.pop();
    }

    function drawHeadlightMask() {
      const cx = hasPointer ? pointerX : p.width * 0.5;
      const cy = hasPointer ? pointerY : p.height * 0.35;
      const breath = 280 + p.sin(p.frameCount * 0.05) * 14;
      const ctx = p.drawingContext;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, breath);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.45, "rgba(0,0,0,0.45)");
      g.addColorStop(0.78, "rgba(0,0,0,0.08)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, p.width, p.height);
      ctx.restore();
    }

    p.draw = () => {
      updatePointer();
      Engine.update(engine, 1000 / 60);
      settleStep();

      roadScroll += roadSpeed;
      distanceMeters += roadSpeed * 0.08;
      walkerPhase += roadSpeed * 1.4;

      const roadTop = p.height * 0.62;

      /* --- ベース：夜明け前の紺 --- */
      p.background(26, 26, 46);

      /* 道路帯：やや明るい紺のグラデーション */
      p.push();
      for (let y = roadTop; y < p.height; y++) {
        const t = (y - roadTop) / (p.height - roadTop);
        const c = p.lerpColor(p.color(26, 26, 46), p.color(22, 24, 52), t * 0.6);
        p.stroke(c);
        p.line(0, y, p.width, y);
      }
      p.pop();

      drawWobblyPath(roadTop + 2, roadScroll);

      /* 道端の石・宝石 */
      for (const item of roadside) {
        const sx = item.worldX - roadScroll;
        if (sx > -30 && sx < p.width + 30) {
          drawRoadsideStone(sx, roadTop + 18, item);
        }
      }

      /* 歩く光の点 */
      const wx = (walkerPhase % (p.width + 60)) - 20;
      p.push();
      p.noStroke();
      p.fill(255, 245, 210, 220);
      p.circle(wx, roadTop + 10, 5 + p.sin(p.frameCount * 0.12) * 0.6);
      p.fill(255, 250, 220, 40);
      p.circle(wx, roadTop + 10, 14);
      p.pop();

      /* 物理レイヤー：床より上の領域をクリップしなくてもよい — 全体に描く */
      const bodies = Composite.allBodies(world).filter((b) => !b.plugin?.isWall);
      for (const b of bodies) {
        drawFragmentBody(b);
      }

      /* 薄膜ノイズ */
      p.push();
      p.blendMode(p.SCREEN);
      p.tint(255, 25);
      p.image(grainImg, 0, 0);
      p.pop();

      /* 闇オーバーレイ → ヘッドライトでくり抜く */
      p.push();
      p.noStroke();
      p.fill(18, 18, 32, 235);
      p.rect(0, 0, p.width, p.height);
      drawHeadlightMask();
      p.pop();

      /* 二次的な縁の光（円周） */
      const cx = hasPointer ? pointerX : p.width * 0.5;
      const cy = hasPointer ? pointerY : p.height * 0.35;
      const breath = 280 + p.sin(p.frameCount * 0.05) * 14;
      p.push();
      p.noFill();
      p.stroke(232, 197, 71, 35);
      p.strokeWeight(1);
      p.circle(cx, cy, breath * 2);
      p.stroke(200, 190, 255, 18);
      p.circle(cx, cy, breath * 2 + 24 + p.sin(p.frameCount * 0.07) * 6);
      p.pop();

    };

  };

  new p5(sketch);

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(() => {
    const ta = document.getElementById("fragment-text");
    const btnDrop = document.getElementById("btn-drop");
    const btnMagic = document.getElementById("btn-magic");

    btnDrop?.addEventListener("click", () => {
      ensureAudio();
      window.__useMagic?.dropText(ta?.value || "");
      if (ta) ta.value = "";
    });

    btnMagic?.addEventListener("click", () => {
      ensureAudio();
      if (typeof window.__runMagicVisualFX === "function") {
        window.__runMagicVisualFX();
      }
      window.__useMagic?.magic();
    });
  });
})();
