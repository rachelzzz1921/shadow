'use strict';

/**
 * CC0 场景纹理 — 对齐 universal-life-scenes-v1 Tier 0
 * 已落地：OpenGameArt Cool School (PX-UNI-037/084) + Rain (PX-UNI-023/085)
 */
window.ShadowSceneTextures = {
  /** environment → CC0 纹理（优先于纯 CSS 渐变） */
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
    }
  },

  /** scenario 缺 environment 时的 CC0 默认 */
  SCENARIO: {
    family: { bg: 'visual-assets/coolschool_B.png', size: '520px auto', position: '62% 18%', asset_id: 'PX-UNI-002' },
    love: { bg: 'visual-assets/coolschool_B.png', size: '500px auto', position: '48% 28%', asset_id: 'PX-UNI-017' },
    friendship: { bg: 'visual-assets/coolschool_A2.png', size: '500px auto', position: '55% 18%', asset_id: 'PX-UNI-026' },
    academic: { bg: 'visual-assets/coolschool_A2.png', size: '480px auto', position: '12% 22%', asset_id: 'PX-UNI-037' },
    career: { bg: 'visual-assets/coolschool_A4.png', size: '420px auto', position: '0% 12%', asset_id: 'PX-UNI-045' },
    self_growth: { bg: 'visual-assets/coolschool_B.png', size: '480px auto', position: '70% 32%', dim: 0.8, asset_id: 'PX-UNI-066' }
  },

  RAIN: {
    bg: 'visual-assets/rain_overlay_0.png',
    asset_id: 'PX-UNI-023'
  },

  /**
   * @param {string} [environment]
   * @param {string} [scenarioKey]
   */
  resolve(environment, scenarioKey) {
    if (environment && this.ENV[environment]) return { ...this.ENV[environment] };
    if (scenarioKey && this.SCENARIO[scenarioKey]) return { ...this.SCENARIO[scenarioKey] };
    return this.SCENARIO.academic;
  },

  /**
   * @param {HTMLElement} mount .pixel-scene
   * @param {string} scenarioKey
   * @param {object} [year]
   */
  apply(mount, scenarioKey, year) {
    if (!mount) return null;
    const tex = this.resolve(year?.environment, scenarioKey);
    const backdrop = mount.querySelector('.scene-backdrop');
    if (backdrop && tex?.bg) {
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
    }

    const mood = year?.scene || mount.className.match(/scene-mood-(\S+)/)?.[1];
    const wantRain = mood === 'rain' || mood === 'summer-night' || mood === 'winter-room';
    const rainEl = mount.querySelector('.scene-fx-rain');
    if (rainEl && wantRain) {
      rainEl.classList.add('has-cc0-rain');
      rainEl.style.backgroundImage = `url('${this.RAIN.bg}')`;
      rainEl.style.backgroundSize = '512px 64px';
      rainEl.style.opacity = '0.42';
      rainEl.dataset.assetId = this.RAIN.asset_id;
    }

    return tex;
  }
};
