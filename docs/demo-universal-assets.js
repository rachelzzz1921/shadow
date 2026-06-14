'use strict';

/**
 * 六域 Agent 通用素材占位 — universal-life-scenes-v1
 * 按 story_tags/type 挂 asset_id，与故事线 layout 并行、不覆盖 fuxduxian-v1。
 */
window.ShadowUniversalAssets = {
  map: null,
  manifest: null,
  _loading: null,

  TIER_LABEL: {
    cc0_ready: 'CC0',
    cc0_pending: 'CC0?',
    review_required: '待复核',
    license_pending: '待授权'
  },

  async load() {
    if (this.map && this.manifest) return { map: this.map, manifest: this.manifest };
    if (this._loading) return this._loading;

    this._loading = Promise.all([
      fetch('universal-agent-ui-map.json').then(r => {
        if (!r.ok) throw new Error(`map HTTP ${r.status}`);
        return r.json();
      }),
      fetch('universal-life-scenes-v1-manifest.json')
        .then(r => (r.ok ? r.json() : {}))
        .catch(() => ({}))
    ]).then(([map, manifest]) => {
      this.map = map;
      this.manifest = manifest;
      return { map, manifest };
    }).catch(err => {
      console.warn('[ShadowUniversalAssets]', err.message);
      this.map = { agents: {} };
      this.manifest = { assets: {} };
      return { map: this.map, manifest: this.manifest };
    });

    return this._loading;
  },

  tier(assetId) {
    return this.manifest?.assets?.[assetId]?.license || 'license_pending';
  },

  tierLabel(assetId) {
    return this.TIER_LABEL[this.tier(assetId)] || '待授权';
  },

  agentPack(scenarioKey) {
    return this.map?.agents?.[scenarioKey] || null;
  },

  /** @param {HTMLElement} mount @param {string} scenarioKey */
  paintScenario(mount, scenarioKey) {
    if (!mount || !scenarioKey) return;
    const pack = this.agentPack(scenarioKey);
    if (!pack) return;

    let overlay = mount.querySelector('.universal-asset-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'universal-asset-overlay';
      mount.appendChild(overlay);
    }

    const slotLine = (key, slot) => {
      if (!slot?.asset_id) return '';
      const id = slot.asset_id.replace('PX-UNI-', '');
      const tier = this.tierLabel(slot.asset_id);
      const cand = slot.candidate_only ? '·候选' : '';
      return `<span class="uao-slot uao-${key}" data-tier="${this.tier(slot.asset_id)}">${key}:${id}(${tier}${cand})</span>`;
    };

    const slots = pack.slots || {};
    overlay.innerHTML = `
      <span class="uao-pack">uni-v1 · ${pack.label || scenarioKey}</span>
      ${slotLine('B', slots.background)}
      ${slotLine('P', slots.prop)}
      ${slotLine('fx', slots.fx)}
      ${slotLine('UI', slots.ui)}
    `;
  },

  async paintScenarioAsync(mount, scenarioKey) {
    await this.load();
    this.paintScenario(mount, scenarioKey);
  }
};
