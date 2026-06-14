'use strict';

/**
 * Extended scenes overlay — extended-scenes-v1 (39 assets)
 * Stacks beside universal-v1 (top) and fuxduxian-v1 (bottom) on .pixel-scene
 */
window.ShadowExtendedAssets = {
  manifest: null,
  map: null,
  _loading: null,

  TIER_LABEL: {
    cc0_ready: 'CC0',
    mana_seed_license: 'MS-L',
    paid_commercial: '付费',
    ready_after_purchase: '付费',
    prototype_ready: 'OK',
    review_required: '待复核',
    attribution_required: '署名',
    candidate_only: '候选'
  },

  async load() {
    if (this.manifest && this.map) return { manifest: this.manifest, map: this.map };
    if (this._loading) return this._loading;

    this._loading = Promise.all([
      fetch('extended-scenes-v1-manifest.json').then(r => (r.ok ? r.json() : {})).catch(() => ({})),
      fetch('extended-agent-ui-map.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}))
    ]).then(([manifest, map]) => {
      this.manifest = manifest;
      this.map = map;
      return { manifest, map };
    });

    return this._loading;
  },

  tier(assetId) {
    return this.manifest?.assets?.[assetId]?.license || 'review_required';
  },

  uiReady(assetId) {
    return this.manifest?.assets?.[assetId]?.ui_ready || 'candidate_only';
  },

  tierLabel(assetId) {
    const ui = this.uiReady(assetId);
    if (ui === 'prototype_ready') return 'OK';
    if (ui === 'ready_after_purchase') return '付费';
    return this.TIER_LABEL[this.tier(assetId)] || '候选';
  },

  /** Pick display slots from manifest ui_rules for a year context */
  slotsForYear(yearMeta) {
    const rules = this.manifest?.ui_rules || {};
    const season = yearMeta?.season_hint || this.inferSeason(yearMeta?.year);
    const slots = [];

    const seasonMap = {
      spring: 'PX-EXT-005', summer: 'PX-EXT-004', autumn: 'PX-EXT-002', winter: 'PX-EXT-003'
    };
    if (seasonMap[season] && this.uiReady(seasonMap[season]) !== 'candidate_only') {
      slots.push({ key: 'season', id: seasonMap[season] });
    }
    if (rules.season_suite) slots.push({ key: 'fx', id: 'PX-EXT-001' });
    if (yearMeta?.year > 1) slots.push({ key: 'trans', id: rules.year_transition_fx || 'PX-EXT-033' });

    const mood = yearMeta?.mood_visual || '';
    const event = yearMeta?.event_summary || yearMeta?.title || '';
    if (/失眠|内省|迷茫|深夜|4点/.test(mood + event)) {
      slots.push({ key: 'sky', id: 'PX-EXT-030' }, { key: 'fog', id: 'PX-EXT-029' });
    }
    if (/春节|中秋|节庆/.test(event)) {
      slots.push({ key: 'lantern', id: 'PX-EXT-018' });
    }
    if (/老家|农村|田野/.test(event)) {
      slots.push({ key: 'rural', id: 'PX-EXT-012' });
    }
    if (/地铁|通勤|车厢/.test(event)) {
      slots.push({ key: 'metro', id: 'PX-EXT-020' });
    }

    slots.push({ key: 'hero', id: rules.protagonist || 'PX-EXT-021' });

    return slots.filter(s => this.uiReady(s.id) !== 'candidate_only');
  },

  inferSeason(year) {
    const cycle = ['spring', 'summer', 'autumn', 'winter'];
    return cycle[((year || 1) - 1) % 4];
  },

  /** @param {HTMLElement} mount @param {object} yearMeta */
  paintYear(mount, yearMeta) {
    if (!mount || !yearMeta) return;

    let overlay = mount.querySelector('.extended-asset-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'extended-asset-overlay';
      mount.appendChild(overlay);
    }

    const slots = this.slotsForYear(yearMeta);
    const lines = slots.map(s => {
      const short = s.id.replace('PX-EXT-', '');
      return `<span class="exo-slot exo-${s.key}" data-tier="${this.tier(s.id)}">${s.key}:${short}(${this.tierLabel(s.id)})</span>`;
    });

    overlay.innerHTML = `
      <span class="exo-pack">ext-v1 · ${this.inferSeason(yearMeta.year)}</span>
      ${lines.join('')}
    `;
  },

  async paintYearAsync(mount, yearMeta) {
    await this.load();
    this.paintYear(mount, yearMeta);
  }
};
