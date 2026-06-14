'use strict';

(function initVisualPreview() {
  const mount = document.getElementById('game-mount');
  const btnWrap = document.getElementById('year-btns');
  let layouts = {};
  let game = null;

  function layoutForYear(n) {
    return layouts[n] || layouts[String(n)];
  }

  function destroyGame() {
    if (game) {
      game.destroy(true);
      game = null;
    }
  }

  function bootPhaser(layout) {
    destroyGame();
    if (!layout) return;

    class ShadowLayoutScene extends Phaser.Scene {
      create() {
        this.cameras.main.setBackgroundColor('#0a0a12');
        const g = this.add.graphics();
        g.fillStyle(0x1a1a24, 1);
        g.fillRect(0, 280, 640, 80);
        g.fillStyle(0x333344, 0.6);
        g.fillRect(40, 60, 560, 200);

        this.add.text(20, 16, `${layout.story_id || 'fuxduxian'} · Y${layout.year}`, {
          fontFamily: 'monospace', fontSize: '11px', color: '#888899'
        });
        this.add.text(20, 32, layout.mood || layout.scene_type || '', {
          fontFamily: 'monospace', fontSize: '10px', color: '#666677'
        });

        (layout.layers || []).forEach((layer, i) => {
          const x = layer.x ?? 120 + i * 80;
          const y = layer.y ?? 200;
          this.add.rectangle(x, y, 48, 64, 0x445566, 0.55);
          this.add.text(x - 24, y + 36, layer.role || 'layer', {
            fontSize: '9px', color: '#9999aa'
          });
        });

        const loop = layout.daily_loops?.[0];
        if (loop) {
          this.add.text(20, 340, `A: ${loop.animation || loop.id}`, {
            fontSize: '9px', color: '#555566'
          });
        }
      }
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount,
      width: 640,
      height: 360,
      pixelArt: true,
      scene: ShadowLayoutScene,
      backgroundColor: '#0a0a12'
    });
  }

  function selectYear(n) {
    btnWrap.querySelectorAll('button').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.year) === n);
    });
    bootPhaser(layoutForYear(n));
  }

  for (let y = 1; y <= 7; y += 1) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `Y${y}`;
    b.dataset.year = String(y);
    b.addEventListener('click', () => selectYear(y));
    btnWrap.appendChild(b);
  }

  fetch('visual-layouts.json')
    .then(r => r.json())
    .then(j => {
      layouts = j.years || j;
      selectYear(1);
    })
    .catch(err => {
      mount.innerHTML = `<p style="padding:12px;color:#f88">layout 加载失败: ${err.message}</p>`;
    });
})();
