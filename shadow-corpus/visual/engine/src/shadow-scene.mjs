import Phaser from 'phaser';
import { loadLayout } from './load-layout.mjs';

/**
 * Factory: Phaser Scene class from layout JSON.
 * @param {object} layoutJson
 */
export function createShadowScene(layoutJson) {
  const spec = loadLayout(layoutJson);

  return class ShadowVisualScene extends Phaser.Scene {
    constructor() {
      super({ key: `shadow-y${spec.layers[0]?.year || layoutJson.year}` });
    }

    create() {
      this.cameras.main.setBackgroundColor('#0a0a12');
      const g = this.add.graphics();
      g.fillStyle(0x1a1a24, 1);
      g.fillRect(0, 280, 640, 80);
      g.fillStyle(0x333344, 0.6);
      g.fillRect(40, 60, 560, 200);

      this.add.text(20, 16, `${layoutJson.story_id} · Y${layoutJson.year}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888899'
      });
      this.add.text(20, 32, layoutJson.mood || layoutJson.scene_type, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666677'
      });

      spec.layers.forEach((layer, i) => {
        const box = this.add.rectangle(
          layer.x ?? 120 + i * 80,
          layer.y ?? 200,
          48,
          64,
          0x445566,
          0.5
        );
        this.add.text(box.x - 20, box.y + 40, layer.role, {
          fontSize: '9px',
          color: '#9999aa'
        });
      });

      if (spec.daily_loops.length) {
        this.add.text(20, 340, `loop: ${spec.daily_loops[0].id}`, {
          fontSize: '9px',
          color: '#555566'
        });
      }
    }
  };
}

export { loadLayout, validateLayout } from './load-layout.mjs';
