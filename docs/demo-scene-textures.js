'use strict';

/**
 * CC0 场景纹理 — Cool School tileset + rain overlay
 * ext_bg（extended-scenes-v1 id）→ 本地 visual-assets fallback
 */
window.ShadowSceneTextures = {
  ENV: {
    classroom: {
      bg: 'visual-assets/coolschool_A2.png',
      size: '480px auto',
      position: '12% 22%',
      asset_id: 'PX-UNI-037'
    },
    dorm_night: {
      bg: 'visual-assets/coolschool_B.png',
      size: '520px auto',
      position: '8% 35%',
      dim: 0.72,
      asset_id: 'PX-UNI-042'
    },
    cafeteria: {
      bg: 'visual-assets/coolschool_A2.png',
      size: '500px auto',
      position: '55% 18%',
      asset_id: 'PX-UNI-041'
    },
    stage: {
      bg: 'visual-assets/coolschool_B.png',
      size: '540px auto',
      position: '42% 8%',
      asset_id: 'PX-UNI-047'
    },
    trainstation: {
      bg: 'visual-assets/coolschool_A2.png',
      size: '560px auto',
      position: '78% 28%',
      asset_id: 'PX-UNI-053'
    },
    postoffice: {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '28% 45%',
      asset_id: 'PX-UNI-060'
    },
    office: {
      bg: 'visual-assets/coolschool_A4.png',
      size: '420px auto',
      position: '0% 12%',
      asset_id: 'PX-UNI-045'
    },
    home: {
      bg: 'visual-assets/coolschool_B.png',
      size: '520px auto',
      position: '62% 18%',
      asset_id: 'PX-UNI-002'
    },
    studio: {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '35% 5%',
      asset_id: 'PX-UNI-056'
    },
    hospital: {
      bg: 'visual-assets/coolschool_A4.png',
      size: '440px auto',
      position: '40% 20%',
      filter: 'hue-rotate(-8deg) saturate(0.9)',
      asset_id: 'PX-UNI-006'
    },
    'rental-house': {
      bg: 'visual-assets/coolschool_B.png',
      size: '480px auto',
      position: '15% 40%',
      dim: 0.78,
      asset_id: 'PX-UNI-025'
    },
    'home-room': {
      bg: 'visual-assets/coolschool_B.png',
      size: '480px auto',
      position: '70% 32%',
      dim: 0.75,
      asset_id: 'PX-UNI-066'
    },
    'old-street': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '600px auto',
      position: '5% 15%',
      asset_id: 'PX-UNI-013'
    },
    apartment: {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '48% 28%',
      asset_id: 'PX-UNI-017'
    },
    wedding: {
      bg: 'visual-assets/coolschool_B.png',
      size: '520px auto',
      position: '52% 12%',
      filter: 'saturate(1.08)',
      asset_id: 'PX-UNI-036'
    },
    birthday: {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '38% 22%',
      asset_id: 'PX-UNI-016'
    },
    restaurant: {
      bg: 'visual-assets/coolschool_B.png',
      size: '510px auto',
      position: '22% 15%',
      asset_id: 'PX-UNI-016'
    },
    hotel: {
      bg: 'visual-assets/coolschool_A2.png',
      size: '540px auto',
      position: '65% 20%',
      asset_id: 'PX-UNI-028'
    },
    road: {
      bg: 'visual-assets/coolschool_A2.png',
      size: '620px auto',
      position: '88% 35%',
      asset_id: 'PX-UNI-063'
    },
    'ordinary-day': {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '42% 25%',
      asset_id: 'PX-UNI-017'
    },
    'phone-light': {
      bg: 'visual-assets/coolschool_B.png',
      size: '480px auto',
      position: '70% 32%',
      dim: 0.72,
      asset_id: 'PX-UNI-066'
    },
    'rain-dusk': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '560px auto',
      position: '18% 20%',
      dim: 0.82,
      asset_id: 'PX-UNI-013'
    }
  },

  SCENARIO: {
    family: { bg: 'visual-assets/coolschool_B.png', size: '520px auto', position: '62% 18%', asset_id: 'PX-UNI-002' },
    love: { bg: 'visual-assets/coolschool_B.png', size: '500px auto', position: '48% 28%', asset_id: 'PX-UNI-017' },
    friendship: { bg: 'visual-assets/coolschool_A2.png', size: '500px auto', position: '55% 18%', asset_id: 'PX-UNI-026' },
    academic: { bg: 'visual-assets/coolschool_A2.png', size: '480px auto', position: '12% 22%', asset_id: 'PX-UNI-037' },
    career: { bg: 'visual-assets/coolschool_A4.png', size: '420px auto', position: '0% 12%', asset_id: 'PX-UNI-045' },
    self_growth: { bg: 'visual-assets/coolschool_B.png', size: '480px auto', position: '70% 32%', dim: 0.8, asset_id: 'PX-UNI-066' }
  },

  /** extended-scenes-v1 id → 本地 CC0 裁切（待付费包到位后替换 file） */
  EXT_BG: {
    'PX-EXT-002': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '560px auto',
      position: '32% 18%',
      dim: 0.92,
      tint: 'rgba(180, 140, 90, 0.22)',
      asset_id: 'PX-EXT-002'
    },
    'PX-EXT-004': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '640px auto',
      position: '8% 8%',
      dim: 0.95,
      tint: 'rgba(255, 200, 120, 0.18)',
      asset_id: 'PX-EXT-004'
    },
    'PX-EXT-008': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '520px auto',
      position: '45% 25%',
      dim: 0.88,
      tint: 'rgba(120, 100, 80, 0.2)',
      asset_id: 'PX-EXT-008'
    },
    'PX-EXT-009': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '620px auto',
      position: '70% 22%',
      dim: 0.78,
      tint: 'rgba(210, 225, 245, 0.26)',
      asset_id: 'PX-EXT-009'
    },
    'PX-EXT-010': {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '20% 30%',
      dim: 0.9,
      tint: 'rgba(200, 170, 120, 0.15)',
      asset_id: 'PX-EXT-010'
    },
    'PX-EXT-012': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '540px auto',
      position: '60% 35%',
      dim: 0.86,
      tint: 'rgba(100, 120, 80, 0.18)',
      asset_id: 'PX-EXT-012'
    },
    'PX-EXT-014': {
      bg: 'visual-assets/coolschool_B.png',
      size: '520px auto',
      position: '50% 20%',
      dim: 0.58,
      tint: 'rgba(40, 50, 90, 0.35)',
      asset_id: 'PX-EXT-014'
    },
    'PX-EXT-015': {
      bg: 'visual-assets/coolschool_B.png',
      size: '500px auto',
      position: '35% 28%',
      dim: 0.62,
      tint: 'rgba(30, 40, 80, 0.4)',
      asset_id: 'PX-EXT-015'
    },
    'PX-EXT-018': {
      bg: 'visual-assets/coolschool_B.png',
      size: '560px auto',
      position: '48% 10%',
      dim: 0.94,
      tint: 'rgba(255, 180, 80, 0.25)',
      asset_id: 'PX-EXT-018'
    },
    'PX-EXT-019': {
      bg: 'visual-assets/coolschool_B.png',
      size: '540px auto',
      position: '34% 18%',
      dim: 0.9,
      tint: 'rgba(245, 196, 112, 0.24)',
      asset_id: 'PX-EXT-019'
    },
    'PX-EXT-020': {
      bg: 'visual-assets/coolschool_A4.png',
      size: '480px auto',
      position: '15% 15%',
      dim: 0.85,
      tint: 'rgba(80, 90, 110, 0.2)',
      asset_id: 'PX-EXT-020'
    },
    'PX-EXT-025': {
      bg: 'visual-assets/coolschool_B.png',
      size: '460px auto',
      position: '72% 38%',
      dim: 0.68,
      tint: 'rgba(60, 80, 120, 0.28)',
      asset_id: 'PX-EXT-025'
    },
    'PX-EXT-031': {
      bg: 'visual-assets/coolschool_A2.png',
      size: '520px auto',
      position: '20% 20%',
      dim: 0.9,
      tint: 'rgba(255, 216, 142, 0.16)',
      asset_id: 'PX-EXT-031'
    },
    'PX-EXT-037': {
      bg: 'visual-assets/coolschool_B.png',
      size: '560px auto',
      position: '44% 12%',
      dim: 0.86,
      tint: 'rgba(255, 178, 92, 0.24)',
      asset_id: 'PX-EXT-037'
    },
    'PX-EXT-039': {
      bg: 'visual-assets/coolschool_B.png',
      size: '530px auto',
      position: '18% 30%',
      dim: 0.92,
      tint: 'rgba(210, 200, 184, 0.2)',
      asset_id: 'PX-EXT-039'
    }
  },

  RAIN: {
    bg: 'visual-assets/rain_overlay_0.png',
    asset_id: 'PX-UNI-023'
  },

  resolve(environment, scenarioKey) {
    if (environment && this.ENV[environment]) return { ...this.ENV[environment] };
    if (scenarioKey && this.SCENARIO[scenarioKey]) return { ...this.SCENARIO[scenarioKey] };
    return { ...this.SCENARIO.academic };
  },

  resolveForYear(year, scenarioKey) {
    if (year?.ext_bg && this.EXT_BG[year.ext_bg]) {
      return { ...this.EXT_BG[year.ext_bg] };
    }
    return this.resolve(year?.environment, scenarioKey);
  },

  _paintBackdrop(backdrop, tex) {
    if (!backdrop || !tex?.bg) return;
    backdrop.classList.add('has-cc0-texture');
    const computed = window.getComputedStyle(backdrop);
    const grad = computed.backgroundImage;
    const hasGrad = grad && grad !== 'none';
    if (hasGrad) {
      backdrop.style.backgroundImage = `${grad}, url('${tex.bg}')`;
      backdrop.style.backgroundSize = `${computed.backgroundSize}, ${tex.size || 'cover'}`;
      backdrop.style.backgroundPosition = `${computed.backgroundPosition}, ${tex.position || 'center'}`;
      backdrop.style.backgroundRepeat = `${computed.backgroundRepeat}, repeat`;
    } else {
      backdrop.style.backgroundImage = `url('${tex.bg}')`;
      backdrop.style.backgroundSize = tex.size || 'cover';
      backdrop.style.backgroundPosition = tex.position || 'center';
      backdrop.style.backgroundRepeat = 'repeat';
    }
    if (tex.filter) backdrop.style.filter = tex.filter;
    if (tex.dim != null) backdrop.style.opacity = String(tex.dim);
    backdrop.dataset.assetId = tex.asset_id || '';
  },

  _applyMoodTint(mount, year) {
    let tint = mount.querySelector('.scene-mood-tint');
    if (!tint) {
      tint = document.createElement('div');
      tint.className = 'scene-mood-tint';
      tint.setAttribute('aria-hidden', 'true');
      const floor = mount.querySelector('.scene-floor');
      if (floor) mount.insertBefore(tint, floor);
      else mount.appendChild(tint);
    }
    tint.dataset.mood = year?.mood_visual || '';
    const fx = year?.fx || '';
    tint.className = 'scene-mood-tint' + (fx ? ` mood-fx-${fx}` : '');
    if (year?.ext_bg && this.EXT_BG[year.ext_bg]?.tint) {
      tint.style.background = this.EXT_BG[year.ext_bg].tint;
    } else {
      tint.style.background = '';
    }
  },

  _applyFx(mount, year) {
    const mood = year?.scene || mount.className.match(/scene-mood-(\S+)/)?.[1];
    const fx = year?.fx || '';
    const wantRain =
      fx === 'rain' ||
      mood === 'rain' ||
      mood === 'summer-night' ||
      mood === 'rain-dusk' ||
      mood === 'winter-room';

    const rainEl = mount.querySelector('.scene-fx-rain');
    if (rainEl) {
      if (wantRain) {
        rainEl.classList.add('has-cc0-rain', 'is-active');
        rainEl.style.backgroundImage = `url('${this.RAIN.bg}')`;
        rainEl.style.backgroundSize = '512px 64px';
        rainEl.style.opacity = fx === 'rain' ? '0.48' : '0.38';
        rainEl.dataset.assetId = this.RAIN.asset_id;
      } else {
        rainEl.classList.remove('is-active');
      }
    }

    const nightEl = mount.querySelector('.scene-fx-night');
    if (nightEl) {
      const wantNight = fx === 'night' || fx === 'cold' || mood === 'night' || mood === 'phone-light';
      nightEl.classList.toggle('is-active', wantNight);
    }

    let lantern = mount.querySelector('.scene-fx-lantern');
    if (fx === 'lantern') {
      if (!lantern) {
        lantern = document.createElement('div');
        lantern.className = 'scene-fx scene-fx-lantern is-active';
        lantern.setAttribute('aria-hidden', 'true');
        mount.appendChild(lantern);
      } else {
        lantern.classList.add('is-active');
      }
    } else if (lantern) {
      lantern.classList.remove('is-active');
    }
  },

  apply(mount, scenarioKey, year) {
    if (!mount) return null;
    const tex = this.resolveForYear(year, scenarioKey);
    const backdrop = mount.querySelector('.scene-backdrop');
    this._paintBackdrop(backdrop, tex);
    this._applyMoodTint(mount, year);
    this._applyFx(mount, year);
    if (year?.ext_bg) {
      mount.dataset.extBg = year.ext_bg;
      mount.classList.add('has-ext-bg');
    }
    return tex;
  }
};
