'use strict';

/**
 * Shadow Demo — 视觉占位（V-007 + fuxduxian-v1 寻源包）
 * 默认读 demo-layouts-v1.json；?legacy=1 回退旧 PX-PLACEHOLDER。
 */
window.ShadowVisual = {
  layouts: null,
  manifest: null,
  pack: null,
  _loading: null,

  async load() {
    if (this.layouts) return this.layouts;
    if (this._loading) return this._loading;

    const legacy = new URLSearchParams(window.location.search).get('legacy') === '1';
    const layoutUrl = legacy ? 'demo-layouts.json' : 'demo-layouts-v1.json';

    this._loading = Promise.all([
      fetch(layoutUrl).then(r => r.json()),
      fetch('fuxduxian-v1-manifest.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}))
    ])
      .then(([j, man]) => {
        this.layouts = j.years || j;
        this.pack = j.pack || (legacy ? 'legacy' : 'fuxduxian-v1');
        this.manifest = man;
        return this.layouts;
      })
      .catch(() => {
        this.layouts = {};
        return this.layouts;
      });

    return this._loading;
  },

  assetTier(assetId) {
    const lic = this.manifest?.assets?.[assetId]?.license;
    if (lic === 'cc0_ready') return 'CC0';
    if (lic === 'cc0_pending') return 'CC0?';
    return '待授权';
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

    const anchor = layout?.visual_anchor || yearMeta?.visual_anchor || '';
    const bgId = layout?.background?.asset_id || 'BG';
    const bgTier = this.assetTier(bgId);
    const layers = (layout?.layers || [])
      .slice(0, 4)
      .map(l => `${l.role}:${(l.asset_id || '').replace('PX-FDX-', '')}`)
      .join(' · ');

    overlay.innerHTML = `
      ${this.pack && this.pack !== 'legacy' ? `<span class="vlo-pack">${this.pack} draft</span>` : ''}
      ${anchor ? `<span class="vlo-anchor">${anchor}</span>` : ''}
      <span class="vlo-mood">${layout?.mood || yearMeta?.mood_visual || ''}</span>
      <span class="vlo-meta">B:${bgId.replace('PX-FDX-', '')}(${bgTier}) · ${layers}</span>
      ${layout?.daily_loops?.[0] ? `<span class="vlo-loop">A:${layout.daily_loops[0].animation}←${(layout.daily_loops[0].asset_id || '').replace('PX-FDX-', '')}</span>` : ''}
      ${layout?.sequence?.length ? `<span class="vlo-seq">C:${layout.sequence.length}步</span>` : ''}
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
