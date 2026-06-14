'use strict';

/**
 * Shadow Visual — fuxduxian-v1 draft pack renderer (V-007 + 寻源接入)
 * Loads demo-layouts-v1.json + fuxduxian-v1-manifest.json
 * CC0 ready assets show texture preview; others show license-colored placeholders.
 */
(function initDemoPhaserV1() {
  const mount = document.getElementById('game-mount');
  const btnWrap = document.getElementById('year-btns');
  const packBadge = document.getElementById('pack-badge');
  const anchorEl = document.getElementById('visual-anchor');

  let bundle = null;
  let manifest = null;
  let game = null;
  let currentYear = 1;

  const TIER_COLOR = {
    cc0_ready: 0x3a5a48,
    cc0_pending: 0x3a4858,
    license_pending: 0x5a4030
  };

  const TIER_LABEL = {
    cc0_ready: 'CC0',
    cc0_pending: 'CC0?',
    license_pending: '待授权'
  };

  function layoutForYear(n) {
    return bundle?.years?.[n] || bundle?.years?.[String(n)];
  }

  function assetMeta(assetId) {
    return manifest?.assets?.[assetId] || { license: 'license_pending' };
  }

  function destroyGame() {
    if (game) {
      game.destroy(true);
      game = null;
    }
  }

  function preloadScene(layout) {
    return class ShadowPreload extends Phaser.Scene {
      constructor() {
        super({ key: 'preload' });
        this.layout = layout;
      }

      preload() {
        const seen = new Set();
        const queue = [
          layout.background?.asset_id,
          ...(layout.layers || []).map(l => l.asset_id)
        ].filter(Boolean);

        queue.forEach(id => {
          const meta = assetMeta(id);
          if (meta.demo_path && !seen.has(meta.demo_path)) {
            seen.add(meta.demo_path);
            this.load.image(`tex-${id}`, meta.demo_path);
          }
        });
      }

      create() {
        this.scene.start('main', { layout: this.layout });
      }
    };
  }

  function mainScene() {
    return class ShadowMain extends Phaser.Scene {
      create(data) {
        const layout = data.layout;
        const mood = layout.mood || '';
        const tint = layout.background?.tint || '#0a0a12';

        this.cameras.main.setBackgroundColor(tint);
        this.drawStage(layout);

        this.add.text(20, 16, `${layout.story_id} · Y${layout.year} · v1 draft`, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#888899'
        });
        this.add.text(20, 32, mood, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#666677'
        });

        if (layout.visual_anchor) {
          this.add.text(20, 50, layout.visual_anchor, {
            fontFamily: 'sans-serif',
            fontSize: '12px',
            color: '#9999aa',
            wordWrap: { width: 420 }
          });
        }

        this.renderBackground(layout);
        (layout.layers || [])
          .slice()
          .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0))
          .forEach((layer, i) => this.renderLayer(layer, i));

        const loop = layout.daily_loops?.[0];
        if (loop) {
          this.add.text(20, 332, `A: ${loop.animation || loop.id} ← ${loop.asset_id}`, {
            fontSize: '12px',
            color: '#6a8a7a'
          });
        }

        if (layout.sequence?.length) {
          const beats = layout.sequence.map(s => s.beat || s.camera).join(' → ');
          this.add.text(20, 348, `C: ${beats}`, {
            fontSize: '11px',
            color: '#7a6a5a'
          });
        }

        if (layout.intervention_ui) {
          this.add.text(480, 332, `UI: ${layout.intervention_ui.asset_id}`, {
            fontSize: '11px',
            color: '#8a7a5a'
          });
        }
      }

      drawStage(layout) {
        const g = this.add.graphics();
        g.fillStyle(0x1a1a24, 1);
        g.fillRect(0, 280, 640, 80);
        const year = layout.year;
        const frameW = year <= 3 ? 420 : year === 7 ? 360 : 480;
        const frameX = year === 7 ? 140 : year <= 3 ? 180 : 80;
        g.fillStyle(0x222230, 0.85);
        g.fillRect(frameX, 72, frameW, 200);
      }

      renderBackground(layout) {
        const bgId = layout.background?.asset_id;
        const meta = assetMeta(bgId);
        const texKey = meta.demo_path ? `tex-${bgId}` : null;

        if (texKey && this.textures.exists(texKey)) {
          const img = this.add.image(320, 180, texKey);
          img.setDisplaySize(640, 240);
          img.setAlpha(0.55);
          img.setTint(0x8899aa);
        }

        this.add.text(24, 76, `B: ${bgId}`, {
          fontSize: '12px',
          color: '#778899'
        });
        this.add.text(24, 92, TIER_LABEL[meta.license] || '待授权', {
          fontSize: '11px',
          color: meta.license === 'cc0_ready' ? '#6a9a7a' : '#9a7a6a'
        });
      }

      renderLayer(layer, i) {
        const meta = assetMeta(layer.asset_id);
        const tier = meta.license || 'license_pending';
        const color = TIER_COLOR[tier] || 0x444455;
        const x = layer.x ?? 120 + i * 80;
        const y = layer.y ?? 200;
        const alpha = layer.alpha ?? (layer.role === 'fx' ? 0.45 : 0.65);
        const w = layer.role === 'fx' ? 640 : 48;
        const h = layer.role === 'fx' ? 200 : 64;

        const texKey = meta.demo_path ? `tex-${layer.asset_id}` : null;
        if (texKey && this.textures.exists(texKey) && layer.role !== 'protagonist') {
          const spr = this.add.image(x, y, texKey);
          spr.setDisplaySize(w, h);
          spr.setAlpha(alpha);
          if (layer.role === 'fx') spr.setBlendMode(Phaser.BlendModes.ADD);
        } else {
          this.add.rectangle(x, y, Math.min(w, 56), Math.min(h, 72), color, alpha);
        }

        const roleColor = {
          protagonist: '#aabbcc',
          npc: '#aa9988',
          prop: '#8899aa',
          fx: '#6688aa'
        }[layer.role] || '#9999aa';

        this.add.text(x - 28, y + (layer.role === 'fx' ? -100 : 38), layer.role, {
          fontSize: '12px',
          color: roleColor
        });
        this.add.text(x - 28, y - (layer.role === 'fx' ? 88 : 52), layer.asset_id.replace('PX-FDX-', ''), {
          fontSize: '11px',
          color: '#777788'
        });
        this.add.text(x - 28, y - (layer.role === 'fx' ? 76 : 40), TIER_LABEL[tier], {
          fontSize: '10px',
          color: tier === 'cc0_ready' ? '#5a9a6a' : '#9a7a5a'
        });
      }
    };
  }

  function bootPhaser(layout) {
    destroyGame();
    if (!layout) return;
    if (typeof Phaser === 'undefined') {
      ensurePhaser();
      return;
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount,
      width: 640,
      height: 360,
      pixelArt: true,
      scene: [preloadScene(layout), mainScene()],
      backgroundColor: '#0a0a12'
    });
  }

  function selectYear(n) {
    currentYear = n;
    btnWrap.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.year) === n);
    });
    const layout = layoutForYear(n);
    if (anchorEl && layout?.visual_anchor) {
      anchorEl.textContent = layout.visual_anchor;
    }
    bootPhaser(layout);
  }

  function buildYearButtons() {
    btnWrap.innerHTML = '';
    for (let y = 1; y <= 7; y += 1) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `Y${y}`;
      b.dataset.year = String(y);
      b.addEventListener('click', () => selectYear(y));
      btnWrap.appendChild(b);
    }
  }

  function useLegacy() {
    return new URLSearchParams(window.location.search).get('legacy') === '1';
  }

  async function fetchLayoutBundle() {
    if (useLegacy()) {
      const r = await fetch('demo-layouts.json');
      if (!r.ok) throw new Error(`layout HTTP ${r.status}`);
      return r.json();
    }
    const v1 = await fetch('demo-layouts-v1.json');
    if (v1.ok) return v1.json();
    const legacy = await fetch('demo-layouts.json');
    if (!legacy.ok) throw new Error('layout HTTP 404 (v1 与 legacy 均不可用)');
    return legacy.json();
  }

  function ensurePhaser() {
    if (typeof Phaser !== 'undefined') return true;
    mount.innerHTML = '<p style="padding:16px;color:#f88;line-height:1.6">Phaser CDN 加载失败。请检查网络，或稍后刷新。<br>若在中国大陆，可尝试 VPN 或使用本地 <code>npm run demo:preview</code>。</p>';
    return false;
  }

  fetchLayoutBundle()
    .then(async (layoutBundle) => {
      const manRes = await fetch('fuxduxian-v1-manifest.json').catch(() => null);
      manifest = manRes && manRes.ok ? await manRes.json() : {};
      bundle = layoutBundle;
      if (!ensurePhaser()) return;
      if (packBadge) {
        const isV1 = Boolean(bundle.pack || layoutBundle.pack);
        packBadge.textContent = useLegacy()
          ? 'legacy PX-PLACEHOLDER'
          : isV1
            ? `${bundle.pack || 'fuxduxian-v1'} · ${bundle.pack_status || 'draft_review'}`
            : 'fallback · demo-layouts.json';
      }
      buildYearButtons();
      selectYear(1);
    })
    .catch(err => {
      mount.innerHTML = `<p style="padding:16px;color:#f88;line-height:1.6">layout 加载失败: ${err.message}<br>仓库需包含 demo-layouts-v1.json；本地运行 <code>npm run build:visual-demo</code> 后 push。</p>`;
    });
})();
