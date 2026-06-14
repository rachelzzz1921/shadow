/**
 * Shadow Demo — 视觉占位（V-007）
 * 读取 demo-layouts.json，在 .scene-placeholder 内渲染简版 layout。
 */
'use strict';

window.ShadowVisual = {
  layouts: null,
  _loading: null,

  async load() {
    if (this.layouts) return this.layouts;
    if (this._loading) return this._loading;
    this._loading = fetch('demo-layouts.json')
      .then(r => r.json())
      .then(j => {
        this.layouts = j.years || j;
        return this.layouts;
      })
      .catch(() => {
        this.layouts = {};
        return this.layouts;
      });
    return this._loading;
  },

  /** @param {HTMLElement} mount @param {object} layout @param {object} [yearMeta] */
  paint(mount, layout, yearMeta) {
    if (!mount) return;
    if (!layout && !yearMeta?.visual_anchor) return;

    let overlay = mount.querySelector('.visual-layout-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'visual-layout-overlay';
      mount.appendChild(overlay);
    }

    const anchor = yearMeta?.visual_anchor || layout.visual_anchor || '';
    const layers = (layout.layers || []).slice(0, 3).map(l => l.role).join(' · ');
    overlay.innerHTML = `
      ${anchor ? `<span class="vlo-anchor">${anchor}</span>` : ''}
      <span class="vlo-mood">${layout.mood || yearMeta?.mood_visual || ''}</span>
      <span class="vlo-meta">${layout.background?.asset_id || 'BG'} · ${layers}</span>
      ${layout.daily_loops?.[0] ? `<span class="vlo-loop">A:${layout.daily_loops[0].animation}</span>` : ''}
    `;
  },

  async paintYear(mountOrYear, yearNum, yearMeta) {
    await this.load();
    let mount = mountOrYear;
    if (typeof mountOrYear === 'number') {
      yearNum = mountOrYear;
      mount = document.querySelector(`#p-year-${yearNum} .pixel-scene`);
    }
    const layout = this.layouts?.[yearNum] || this.layouts?.[String(yearNum)];
    this.paint(mount, layout, yearMeta);
  }
};
