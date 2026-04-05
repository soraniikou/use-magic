import { useEffect } from "react";

declare global {
  interface Window {
    __useMagicBooted?: boolean;
    __runMagicVisualFX?: () => void;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.crossOrigin = "anonymous";
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(el);
  });
}

export default function App() {
  useEffect(() => {
    if (window.__useMagicBooted) return;
    window.__useMagicBooted = true;

    const urls = [
      "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js",
      "/js/magic-effects.js",
      "/js/app.js",
    ];

    let cancelled = false;
    (async () => {
      try {
        for (const u of urls) {
          if (cancelled) return;
          await loadScript(u);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div id="p5-root" />
      <div id="magicOverlay" className="magic-overlay" aria-hidden="true" />

      <header className="chrome" aria-label="アプリ情報">
        <h1 className="title-en">use magic</h1>
        <p className="subtitle jp">折り合いをつけながら生きていく</p>
      </header>

      <aside className="panel chrome panel--center" aria-label="入力">
        <textarea
          id="fragment-text"
          className="jp input-text"
          rows={3}
          maxLength={200}
          placeholder="不甲斐ない現実.."
          aria-label="入力"
        />
        <div className="row">
          <button type="button" id="btn-drop" className="btn primary btn-script">
            take shape
          </button>
        </div>

        <button type="button" id="btn-magic" className="btn magic">
          use magic
        </button>
      </aside>
    </>
  );
}
