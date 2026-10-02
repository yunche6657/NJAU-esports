(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const current = new URLSearchParams(location.search).get('view') === 'current';
  $('archiveBackgroundPreload').href = current ? 'assets/activities/main-building-day-v1.webp' : 'assets/activities/main-building-night.webp';
  $('archiveBackgroundPreload').rel = 'preload';
  const narrow = matchMedia('(max-width: 800px), (max-height: 699px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scroll = $('archiveScroll');
  const scene = $('archiveScene');
  const viewport = $('archiveViewport');
  const track = $('archiveTrack');
  const years = $('archiveYears');
  const detail = $('activityDetail');
  let items = [];
  let eras = [];
  let active = -1;
  let distance = 0;
  let frame = 0;
  let vertical = false;
  let drag = null;
  let suppressClick = false;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  if (current) {
    document.body.classList.add('archive-current');
    document.title = '当期活动时间轴 · NJAU 电竞社';
    document.querySelector('meta[name="theme-color"]').content = '#e8f7ef';
    document.querySelector('meta[name="description"]').content = '南农电竞社 2026 年 9 月起的活动安排。';
    const switcher = $('archiveSwitch');
    if (switcher) {
      switcher.href = 'activities.html?view=history';
      const icon = switcher.querySelector('.archive-switch__icon');
      if (icon) icon.textContent = '🌙';
      const txt = $('archiveSwitchText');
      if (txt) txt.textContent = '回望历史档案';
      switcher.setAttribute('aria-label', '回望历史档案活动时间轴');
    }
    const bridge = $('archiveFooterBridge');
    if (bridge) {
      bridge.href = 'activities.html?view=history';
      bridge.textContent = '🌙 历史档案 ↗';
    }
    $('archiveEyebrow').textContent = '新的故事，等你入场';
    $('archiveTitle').replaceChildren(document.createTextNode('下一场，'), document.createElement('br'));
    const em = document.createElement('em');
    em.textContent = '一起上场。';
    $('archiveTitle').append(em);
    $('archiveRange').textContent = '2026.09 起';
    $('archiveDescription').textContent = '从这个学期开始，和队友一起创造新的回忆。';
    $('archiveCaption').textContent = '当期活动';
  }

  function readDate(value) {
    const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(value || ''));
    if (!match) return null;
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3] || 1);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
    return { year, month, day, hasDay: Boolean(match[3]), key: year * 100 + month, date: `${match[1]}-${match[2]}-${String(day).padStart(2, '0')}`, label: match[3] ? `${match[1]}.${match[2]}.${match[3]}` : `${match[1]}.${match[2]}` };
  }

  function safeImage(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function normalize(records) {
    const seen = new Set();
    return (Array.isArray(records) ? records : []).flatMap((record) => {
      if (!record || typeof record !== 'object') return [];
      const date = readDate(record.date);
      if (!date || typeof record.title !== 'string' || !record.title.trim()) return [];
      if (current ? date.key < 202609 : date.key < 202409 || date.key > 202606) return [];
      const key = `${date.date}:${record.id ?? record.title}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const cover = safeImage(record.cover);
      const gallery = (Array.isArray(record.gallery) ? record.gallery : []).flatMap((photo) => {
        const src = safeImage(typeof photo === 'string' ? photo : photo?.src);
        return src ? [{ src, original: safeImage(photo?.original), caption: String(photo?.caption || record.title) }] : [];
      });
      if (cover && !gallery.some((photo) => photo.src === cover)) gallery.unshift({ src: cover, caption: record.title });
      const gameIds = Array.isArray(record.game_ids) ? record.game_ids.filter((g) => typeof g === 'string') : [];
      return [{ year: date.year, date, datePending: record.date_pending === true, dateLabel: String(record.date_label || date.label), title: record.title.trim(), summary: String(record.summary || record.desc || ''), detail: String(record.detail || record.summary || record.desc || ''), cover, gallery, game_ids: gameIds, group_number: record.group_number ? String(record.group_number).trim() : '', matchup: Array.isArray(record.matchup) && record.matchup.length === 2 ? record.matchup.map(String) : null }];
    }).sort((a, b) => a.date.date.localeCompare(b.date.date));
  }

  function el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  const GAME_META = {
    wangzhe: { name: '王者荣耀', tag: '王者荣耀' },
    valorant: { name: '无畏契约', tag: 'VALORANT' },
    cs2: { name: 'CS2', tag: 'CS2' },
    lol: { name: '英雄联盟', tag: 'LOL' },
    overwatch: { name: '守望先锋', tag: '守望先锋' },
    identityv: { name: '第五人格', tag: '第五人格' },
    naraka: { name: '永劫无间', tag: '永劫无间' },
    delta: { name: '三角洲行动', tag: '三角洲' }
  };

  function showDetail(item) {
    const primaryGame = (item.game_ids && item.game_ids[0]) ? GAME_META[item.game_ids[0]] : null;
    $('activityDetailTitle').textContent = item.title;
    $('activityDetailDate').textContent = (primaryGame ? `[${primaryGame.name}] · ` : '') + item.dateLabel;
    $('activityDetailCopy').textContent = item.detail || '更多活动回顾即将补充。';
    const matchup = $('activityDetailMatchup');
    matchup.replaceChildren();
    matchup.hidden = !item.matchup;
    if (item.matchup) matchup.append(el('strong', '', item.matchup[0]), el('span', '', 'VS'), el('strong', '', item.matchup[1]));
    const media = $('activityDetailMedia');
    const image = $('activityDetailImage');
    const gallery = $('activityDetailGallery');
    const photos = item.gallery;
    gallery.replaceChildren();
    gallery.hidden = photos.length < 2;
    media.hidden = !photos.length;
    function selectPhoto(index) {
      const photo = photos[index];
      media.hidden = false;
      image.alt = photo.caption;
      image.onerror = () => { media.hidden = true; };
      image.src = photo.src;
      $('activityDetailCaption').textContent = photo.caption;
      $('activityDetailOriginal').href = photo.original || photo.src;
      $('activityDetailImageLink').href = photo.original || photo.src;
      Array.from(gallery.children).forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
    }
    photos.forEach((photo, index) => {
      const button = el('button', 'activity-gallery__thumb');
      button.type = 'button';
      button.setAttribute('aria-label', `查看图片 ${index + 1}：${photo.caption}`);
      const thumb = el('img');
      thumb.src = photo.src;
      thumb.alt = '';
      button.append(thumb);
      button.addEventListener('click', () => selectPhoto(index));
      gallery.append(button);
    });
    if (photos.length) selectPhoto(0);

    // Action bar for group copying
    const actions = $('activityDetailActions');
    if (actions) {
      actions.replaceChildren();
      if (item.group_number) {
        actions.hidden = false;
        const bar = el('div', 'activity-action-bar');
        const info = el('div', 'activity-action-info');
        info.append(el('span', 'activity-action-tag', '赛事联络'));
        info.append(el('strong', 'activity-action-number', `QQ 群号：${item.group_number}`));

        const copyBtn = el('button', 'activity-action-btn');
        copyBtn.type = 'button';
        const icon = el('span', 'activity-action-icon', '📋');
        const text = el('span', 'activity-action-label', '复制群号');
        copyBtn.append(icon, text);
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(item.group_number);
            copyBtn.classList.add('is-copied');
            text.textContent = '已复制！前往 QQ 搜索加群';
            icon.textContent = '✓';
            setTimeout(() => {
              copyBtn.classList.remove('is-copied');
              text.textContent = '复制群号';
              icon.textContent = '📋';
            }, 2500);
          } catch (_) {
            prompt('长按复制 QQ 群号：', item.group_number);
          }
        });
        bar.append(info, copyBtn);
        actions.append(bar);
      } else {
        actions.hidden = true;
      }
    }

    detail.showModal();
    document.body.classList.add('detail-open');
  }

  function render(records) {
    const normalized = normalize(records);
    const yearList = current ? [...new Set([2026, ...normalized.map((item) => item.year)])].sort((a, b) => a - b) : [2024, 2025, 2026];
    items = yearList.flatMap((year) => {
      const events = normalized.filter((item) => item.year === year);
      return [{ year, yearMarker: true, eventCount: events.length }, ...events];
    });
    track.replaceChildren();
    years.replaceChildren();
    let eventIndex = 0;
    items.forEach((item, index) => {
      const era = el('li', 'archive-era' + (item.yearMarker ? ' archive-year' : (++eventIndex % 2 === 0 ? ' archive-era--below' : ' archive-era--above')));
      era.id = `archive-era-${index}`;
      era.dataset.year = String(item.year);
      if (item.yearMarker) {
        const heading = el('h2', 'archive-year__label', String(item.year));
        const range = current ? (item.year === 2026 ? '09 月起 · 新的篇章' : '新的篇章') : ({ 2024: '09—12 月 · 初次相遇', 2025: '01—12 月 · 并肩上场', 2026: '01—06 月 · 继续前行' })[item.year];
        heading.append(el('small', '', range));
        era.append(heading, el('p', 'archive-year__note', item.eventCount ? `${item.eventCount} 场${current ? '当期活动' : '活动回忆'}` : current ? '下一场，敬请期待' : '活动资料整理中'));
        track.append(era);
        return;
      }
      const shortDate = item.datePending ? '待定' : item.date.hasDay ? `${String(item.date.month).padStart(2, '0')}.${String(item.date.day).padStart(2, '0')}` : `${String(item.date.month).padStart(2, '0')} 月`;
      const date = el('h3', 'archive-era__date', shortDate);
      date.append(el('small', '', item.dateLabel));
      const gameClass = (item.game_ids && item.game_ids[0]) ? ' archive-card--game-' + item.game_ids[0] : '';
      const card = el('button', 'archive-card archive-event' + gameClass);
      card.type = 'button';
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-label', `查看 ${item.dateLabel} ${item.title}`);

      // 1. Cover Box with aspect crop, gradient shade and chips
      const coverBox = el('div', 'archive-card__cover-box');
      if (item.cover) {
        const image = el('img', 'archive-card__cover');
        image.src = item.cover;
        image.alt = '';
        image.loading = 'lazy';
        image.onerror = () => coverBox.remove();
        coverBox.append(image);
      }
      coverBox.append(el('div', 'archive-card__cover-shade'));

      // Chips on cover
      const chips = el('div', 'archive-card__chips');
      const primaryGame = (item.game_ids && item.game_ids[0]) ? GAME_META[item.game_ids[0]] : null;
      if (primaryGame) {
        chips.append(el('span', `archive-chip archive-chip--${item.game_ids[0]}`, primaryGame.name));
      } else {
        chips.append(el('span', 'archive-chip archive-chip--club', '社团活动'));
      }
      chips.append(el('span', 'archive-chip archive-chip--date', item.datePending ? '赛程待公布' : shortDate));
      coverBox.append(chips);
      card.append(coverBox);

      // 2. Card Body
      const body = el('div', 'archive-card__body');
      body.append(el('span', 'archive-card__index', `${current ? 'NEXT' : 'ARCHIVE'} / ${String(eventIndex).padStart(2, '0')}`));
      body.append(el('h3', 'archive-card__title', item.title));
      body.append(el('p', 'archive-card__desc', item.summary));
      body.append(el('span', 'archive-card__status', current ? '查看活动详情  ↗' : '打开这段回忆  ↗'));
      card.append(body);

      card.addEventListener('click', () => showDetail(item));
      era.append(date, card);
      track.append(era);
    });
    yearList.forEach((year) => {
      const button = el('button', '', String(year));
      button.type = 'button';
      button.dataset.year = String(year);
      button.setAttribute('aria-label', `跳到 ${year} 年`);
      button.addEventListener('click', () => jump(items.findIndex((item) => item.year === year)));
      years.append(button);
    });
    eras = Array.from(track.children);
    active = -1;
    layout();
  }

  function layout() {
    const before = vertical;
    const oldIndex = Math.max(0, active);
    vertical = narrow.matches || reduced.matches;
    document.body.classList.toggle('archive-static', reduced.matches);
    if (vertical) {
      scroll.style.height = '';
      track.style.paddingRight = '';
      track.style.transform = '';
      distance = 0;
    } else {
      const firstWidth = eras[0]?.offsetWidth || 320;
      const lastWidth = eras[eras.length - 1]?.offsetWidth || firstWidth;
      track.style.paddingRight = `${Math.max(64, viewport.clientWidth - lastWidth - 64)}px`;
      distance = Math.max(0, track.scrollWidth - viewport.clientWidth);
      scroll.style.height = `${scene.offsetHeight + distance}px`;
    }
    if (before !== vertical && active >= 0) jump(oldIndex, true);
    update();
  }

  function positionFor(index) {
    if (vertical) return Math.max(0, eras[index].getBoundingClientRect().top + window.scrollY - 110);
    return clamp(eras[index].offsetLeft - eras[0].offsetLeft, 0, distance);
  }

  function jump(index, instantly = false) {
    if (!eras.length) return;
    index = clamp(index, 0, eras.length - 1);
    window.scrollTo({ top: positionFor(index), behavior: instantly || reduced.matches ? 'instant' : 'smooth' });
  }

  function update() {
    frame = 0;
    if (!eras.length) return;
    let next = 0;
    let progress = 0;
    if (vertical) {
      const marker = window.innerHeight * .38;
      eras.forEach((era, index) => { if (era.getBoundingClientRect().top <= marker) next = index; });
      const end = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress = clamp(scrollY / end, 0, 1);
      if (scrollY >= end - 2) next = eras.length - 1;
    } else {
      const moved = clamp(window.scrollY, 0, distance);
      track.style.transform = `translate3d(${-moved}px, 0, 0)`;
      progress = distance ? moved / distance : 0;
      let nearest = Infinity;
      eras.forEach((era, index) => {
        const delta = Math.abs(positionFor(index) - moved);
        if (delta < nearest) { nearest = delta; next = index; }
      });
    }
    $('archiveProgress').style.transform = `scaleX(${progress})`;
    if (next !== active) {
      active = next;
      years.querySelectorAll('button').forEach((button) => button.setAttribute('aria-current', String(Number(button.dataset.year) === items[active].year)));
      $('archivePrev').disabled = active === 0;
      $('archiveNext').disabled = active === eras.length - 1;
      $('archiveStatus').textContent = `${items[active].year} 年，${active + 1} / ${eras.length}`;
    }
    $('archiveScrollHint').textContent = eras.length === 1 ? '新的活动，即将到来' : active === eras.length - 1 ? '已到达这段时光的终点' : '滚轮 / 左右滑动 / 拖动，沿时间前行';
  }

  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', layout);
  reduced.addEventListener('change', layout);
  $('archivePrev').addEventListener('click', () => jump(active - 1));
  $('archiveNext').addEventListener('click', () => jump(active + 1));
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport || vertical) return;
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      jump(event.key === 'Home' ? 0 : event.key === 'End' ? eras.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  track.addEventListener('focusin', (event) => {
    const era = event.target.closest('.archive-era');
    if (era && !vertical && !drag) jump(eras.indexOf(era), true);
  });
  scene.addEventListener('wheel', (event) => {
    if (vertical || detail.open || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerWidth : 1;
    const next = clamp(scrollY + event.deltaX * unit, 0, distance);
    if (next === scrollY) return;
    event.preventDefault();
    window.scrollTo({ top: next, behavior: 'instant' });
  }, { passive: false });
  viewport.addEventListener('pointerdown', (event) => {
    if (vertical || detail.open || event.button !== 0 || event.pointerType === 'touch') return;
    suppressClick = false;
    drag = { id: event.pointerId, x: event.clientX, start: scrollY, moved: false };
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = drag.x - event.clientX;
    if (!drag.moved && Math.abs(delta) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
    }
    event.preventDefault();
    window.scrollTo({ top: clamp(drag.start + delta, 0, distance), behavior: 'instant' });
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging');
    drag = null;
    setTimeout(() => { suppressClick = false; }, 0);
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener('click', (event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
  $('activityDetailClose').addEventListener('click', () => detail.close());
  detail.addEventListener('click', (event) => {
    const box = detail.getBoundingClientRect();
    if (event.target === detail && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) detail.close();
  });
  detail.addEventListener('close', () => {
    $('activityDetailImage').removeAttribute('src');
    document.body.classList.remove('detail-open');
  });

  render(window.NJAUEC_ACTIVITIES || []);
  async function loadActivities() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const local = ['localhost', '127.0.0.1'].includes(location.hostname);
      const endpoint = local ? `${location.protocol}//${location.hostname}:8787/api/activities` : '/api/activities';
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) return;
      const records = await response.json();
      // A backend without records must not erase curated local entries.
      if (Array.isArray(records) && normalize(records).length) render([...records, ...(window.NJAUEC_ACTIVITIES || [])]);
    } catch (_) { /* The local, readable archive remains available offline. */ }
    finally { clearTimeout(timer); }
  }
  loadActivities();
})();
