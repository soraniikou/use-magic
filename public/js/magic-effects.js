/**
 * use magic クリック時: 複数パターンからランダムで視覚エフェクトを再生
 */
(function () {
  const DURATION = 9000;

  function triggerMagicOverlay() {
    const overlay = document.getElementById("magicOverlay");
    if (!overlay) return;
    overlay.classList.add("active");
    setTimeout(() => overlay.classList.remove("active"), DURATION);
  }

  function spawnParticles(patternKey) {
    const patterns = {
      light: () => {
        for (let i = 0; i < 55; i++) {
          const p = document.createElement("div");
          p.className = "particle particle--star";
          const size = 2 + Math.random() * 5;
          const angle = Math.random() * Math.PI * 2;
          const dist = 120 + Math.random() * 320;
          const sparkDur = `${0.65 + Math.random() * 1.5}s`;
          const sparkDelay = `${Math.random() * 2.8}s`;
          p.style.cssText = `
            left:${15 + Math.random() * 70}%;top:${15 + Math.random() * 70}%;
            width:${size}px;height:${size}px;
            --tx:${Math.cos(angle) * dist}px;--ty:${Math.sin(angle) * dist}px;
            --dur:${3 + Math.random() * 4}s;
            --spark-dur:${sparkDur};
            --spark-delay:${sparkDelay};
            --float-delay:${Math.random() * 2}s;
          `;
          document.body.appendChild(p);
          setTimeout(() => p.remove(), DURATION);
        }
      },
      bubble: () => {
        for (let i = 0; i < 25; i++) {
          const b = document.createElement("div");
          const size = 20 + Math.random() * 60;
          b.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;bottom:-100px;
            width:${size}px;height:${size}px;border-radius:50%;
            border:1px solid rgba(200,240,255,0.6);
            background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.3),rgba(180,220,255,0.05));
            box-shadow:inset 0 0 ${size / 3}px rgba(200,240,255,0.3);
            pointer-events:none;z-index:99;
            animation:bubbleFloat ${4 + Math.random() * 4}s ease-out forwards;
            animation-delay:${Math.random() * 3}s;
          `;
          document.body.appendChild(b);
          setTimeout(() => b.remove(), DURATION);
        }
      },
      angel: () => {
        for (let i = 0; i < 26; i++) {
          const f = document.createElement("div");
          f.className = "magic-angel-mote";
          const s = 2 + Math.random() * 5;
          f.style.cssText = `
            left:${Math.random() * 100}%;top:${-10 + Math.random() * 32}%;
            width:${s}px;height:${s}px;
            --af-dur:${4.5 + Math.random() * 5}s;
            animation-delay:${Math.random() * 3.2}s;
          `;
          document.body.appendChild(f);
          setTimeout(() => f.remove(), DURATION);
        }
      },
      flower: () => {
        const speciesList = [
          {
            name: "sakura",
            colors: ["#ffc4d6", "#ffb3c9", "#ffa8c0", "#ffe0ea"],
            br: "55% 45% 60% 40%",
          },
          {
            name: "rose",
            colors: ["#c45c6a", "#b84d5c", "#d47280", "#a63d4e"],
            br: "40% 60% 45% 55%",
          },
          {
            name: "lily",
            colors: ["#fff8f2", "#ffefe8", "#fff5ee", "#faf0e8"],
            br: "50% 50% 50% 50%",
          },
        ];
        const sp = speciesList[Math.floor(Math.random() * speciesList.length)];
        const n = 42;
        for (let i = 0; i < n; i++) {
          const el = document.createElement("div");
          const c = sp.colors[Math.floor(Math.random() * sp.colors.length)];
          const w = 8 + Math.random() * 10;
          const h = 12 + Math.random() * 16;
          const dx = (Math.random() - 0.5) * 180;
          const rot = (Math.random() - 0.5) * 520;
          el.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;top:${-4 + Math.random() * 8}%;
            width:${w}px;height:${h}px;
            border-radius:${sp.br};
            background:linear-gradient(125deg,rgba(255,255,255,0.35),${c} 45%,${c});
            box-shadow:0 0 6px rgba(255,255,255,0.15);
            pointer-events:none;z-index:99;
            --dx:${dx}px;--rot:${rot}deg;
            animation:petalScatter ${4.5 + Math.random() * 5}s ease-in forwards;
            animation-delay:${Math.random() * 3}s;
          `;
          document.body.appendChild(el);
          setTimeout(() => el.remove(), DURATION);
        }
      },
      purpleRose: () => {
        const colors = [
          "#2a1834",
          "#3d2248",
          "#4b2c5a",
          "#5a3670",
          "#6b4585",
          "#5c3a72",
          "#4a2f62",
          "#7d5298",
        ];
        const br = "44% 56% 50% 50%";
        const n = 48;
        for (let i = 0; i < n; i++) {
          const el = document.createElement("div");
          const c = colors[Math.floor(Math.random() * colors.length)];
          const w = 9 + Math.random() * 11;
          const h = 13 + Math.random() * 18;
          const dx = (Math.random() - 0.5) * 200;
          const rot = (Math.random() - 0.5) * 560;
          el.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;top:${-4 + Math.random() * 10}%;
            width:${w}px;height:${h}px;
            border-radius:${br};
            background:linear-gradient(128deg,rgba(180,140,220,0.22),${c} 48%,${c});
            box-shadow:0 0 8px rgba(100,60,140,0.25);
            pointer-events:none;z-index:99;
            --dx:${dx}px;--rot:${rot}deg;
            animation:petalScatter ${5.2 + Math.random() * 6}s ease-in forwards;
            animation-delay:${Math.random() * 3.5}s;
          `;
          document.body.appendChild(el);
          setTimeout(() => el.remove(), DURATION);
        }
      },
      rainbow: () => {
        const r = document.createElement("div");
        r.style.cssText = `
          position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
          width:600px;height:300px;border-radius:300px 300px 0 0;
          background:linear-gradient(to bottom,
            rgba(255,40,40,0.38),rgba(255,140,0,0.36),rgba(255,220,40,0.34),
            rgba(40,200,80,0.34),rgba(40,120,255,0.36),rgba(160,60,220,0.38));
          pointer-events:none;z-index:99;
          animation:rainbowAppear 8s ease forwards;
          filter:blur(10px);
        `;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), DURATION);
      },
      heart: () => {
        const hearts = ["💗", "💖", "🩷", "💝", "💕"];
        for (let i = 0; i < 15; i++) {
          const h = document.createElement("div");
          h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
          h.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;bottom:-10%;
            font-size:${12 + Math.random() * 28}px;
            pointer-events:none;z-index:99;
            animation:heartFloat ${3 + Math.random() * 5}s ease-out forwards;
            animation-delay:${Math.random() * 3}s;opacity:0;
          `;
          document.body.appendChild(h);
          setTimeout(() => h.remove(), DURATION);
        }
      },
      kaleidoscope: () => {
        for (let i = 0; i < 12; i++) {
          const k = document.createElement("div");
          const hue = i * 30;
          const size = 40 + Math.random() * 80;
          k.style.cssText = `
            position:fixed;left:50%;top:50%;
            width:${size}px;height:${size}px;
            --r:${i * 30}deg;
            transform:translate(-50%,-50%) rotate(${i * 30}deg);
            border-radius:${Math.random() * 50}% ${Math.random() * 50}%;
            background:hsla(${hue},80%,60%,0.2);
            pointer-events:none;z-index:99;
            animation:kaleidoSpin ${6 + Math.random() * 3}s linear forwards;
            filter:blur(2px);
          `;
          document.body.appendChild(k);
          setTimeout(() => k.remove(), DURATION);
        }
      },
      diamond: () => {
        for (let i = 0; i < 6; i++) {
          const d = document.createElement("div");
          d.className = "magic-fx-diamond";
          const size = 5 + Math.random() * 11;
          const dur = 3 + Math.random() * 5;
          d.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;top:${Math.random() * 100}%;
            width:${size}px;height:${size}px;
            background:
              conic-gradient(from 210deg at 40% 35%,
                rgba(255,255,255,0.95),
                rgba(220,240,255,0.85),
                rgba(180,210,255,0.75),
                rgba(255,255,255,0.92),
                rgba(200,230,255,0.8),
                rgba(255,255,255,0.95));
            transform:rotate(45deg);
            box-shadow:
              0 0 ${size * 0.4}px #fff,
              0 0 ${size}px rgba(255,255,255,0.95),
              0 0 ${size * 1.8}px rgba(190,230,255,0.85),
              0 0 ${size * 3}px rgba(160,200,255,0.55),
              inset 0 0 ${size * 0.35}px rgba(255,255,255,0.65);
            pointer-events:none;z-index:99;
            --dg-dur:${dur}s;
            --dg-delay:${Math.random() * 2}s;
            --shine-dur:${0.55 + Math.random() * 1.35}s;
            --shine-delay:${Math.random() * 3.2}s;
            opacity:0;
          `;
          document.body.appendChild(d);
          setTimeout(() => d.remove(), DURATION);
        }
      },
      ocean: () => {
        const overlay2 = document.createElement("div");
        overlay2.style.cssText = `
          position:fixed;inset:0;pointer-events:none;z-index:98;
          background:radial-gradient(ellipse at 50% 80%,rgba(0,80,160,0.3) 0%,rgba(0,120,200,0.15) 40%,transparent 70%);
          animation:oceanWave 8s ease forwards;
        `;
        document.body.appendChild(overlay2);
        for (let i = 0; i < 15; i++) {
          const b = document.createElement("div");
          const size = 4 + Math.random() * 10;
          b.style.cssText = `
            position:fixed;left:${Math.random() * 100}%;top:${40 + Math.random() * 60}%;
            width:${size}px;height:${size / 2}px;border-radius:50%;
            background:rgba(100,200,255,0.4);
            pointer-events:none;z-index:99;
            animation:waveDrift ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay:${Math.random() * 2}s;
          `;
          document.body.appendChild(b);
          setTimeout(() => b.remove(), DURATION);
        }
        setTimeout(() => overlay2.remove(), DURATION);
      },
      aurora: () => {
        const bands = [
          "linear-gradient(to bottom,rgba(40,255,140,0.52),rgba(0,200,120,0.38) 35%,transparent 72%)",
          "linear-gradient(to bottom,rgba(60,210,255,0.5),rgba(0,140,220,0.42) 40%,transparent 75%)",
          "linear-gradient(to bottom,rgba(180,90,255,0.48),rgba(100,40,200,0.4) 38%,transparent 74%)",
          "linear-gradient(to bottom,rgba(0,255,200,0.45),rgba(0,180,160,0.38) 42%,transparent 76%)",
        ];
        bands.forEach((bg, i) => {
          const a = document.createElement("div");
          a.style.cssText = `
            position:fixed;left:${-25 + i * 28}%;top:-5%;
            width:42%;height:110%;
            background:${bg};
            pointer-events:none;z-index:98;
            filter:blur(42px) saturate(1.25);
            mix-blend-mode:screen;
            animation:auroraDance ${5 + i * 1.5}s ease-in-out forwards;
            animation-delay:${i * 0.45}s;opacity:0;
          `;
          document.body.appendChild(a);
          setTimeout(() => a.remove(), DURATION);
        });
      },
    };

    const keys = Object.keys(patterns);
    const chosen = patternKey && patterns[patternKey] ? patternKey : keys[Math.floor(Math.random() * keys.length)];
    patterns[chosen]();
  }

  function runMagicVisualFX() {
    triggerMagicOverlay();
    spawnParticles();
    const magicBgs = ["#0a0515", "#050a1a", "#050f0a"];
    const pick = magicBgs[Math.floor(Math.random() * magicBgs.length)];
    document.body.style.transition = "background 2s ease";
    document.body.style.background = pick;
    setTimeout(() => {
      document.body.style.background = "";
      document.body.style.transition = "";
    }, 3000);
  }

  window.__runMagicVisualFX = runMagicVisualFX;
})();
