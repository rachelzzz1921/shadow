'use strict';

/**
 * Intake 性别 → 像素角色切片（Cool School B 48px）
 * 供 Demo 预览 / 后续动画管线读取 full_profile.raw.gender
 */
(function exportGenderSprites(global) {
  const SHEET = 'visual-assets/coolschool_B.png';

  const OPTIONS = [
    { value: 'female', label: '女', hint: '长发剪影 · 默认女角' },
    { value: 'male', label: '男', hint: '短发剪影 · 男角占位' },
    { value: 'neutral', label: '不指定', hint: '中性剪影 · 由叙事推断' }
  ];

  const SPRITES = {
    female: { sheet: SHEET, pos: '-192px -672px', size: '48px 48px' },
    male: { sheet: SHEET, pos: '-240px -672px', size: '48px 48px' },
    neutral: { sheet: SHEET, pos: '-336px -672px', size: '48px 48px' }
  };

  const LABELS = Object.fromEntries(OPTIONS.map((o) => [o.value, o.label]));

  function normalize(gender) {
    if (gender === 'female' || gender === 'male' || gender === 'neutral') return gender;
    return 'neutral';
  }

  function getSprite(gender) {
    return SPRITES[normalize(gender)] || SPRITES.neutral;
  }

  function applyToRoot(gender, root) {
    const el = root || document.documentElement;
    const sprite = getSprite(gender);
    el.style.setProperty('--sprite-char', `url('${sprite.sheet}')`);
    el.style.setProperty('--sprite-pos', sprite.pos);
    el.style.setProperty('--sprite-size', sprite.size);
    el.dataset.shadowGender = normalize(gender);
  }

  global.ShadowGenderSprites = {
    OPTIONS,
    LABELS,
    normalize,
    getSprite,
    applyToRoot
  };
})(window);
