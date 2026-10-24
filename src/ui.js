import { SPECIES, TYPES, statsOf, maxHpOf, xpToNext } from './data.js';
import { buildMinimap } from './world.js';
import { choice, rand } from './utils.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

export class UI {
  constructor(audio) {
    this.audio = audio;
    this.el = {
      hud: $('#hud'),
      load: $('#loadscreen'),
      loadStatus: $('#load-status'),
      questText: $('#quest-text'),
      questCount: $('#quest-count'),
      questFill: $('#quest-fill'),
      journalBadge: $('#journal-badge'),
      partyCount: $('#party-count'),
      nearby: $('#nearby'),
      nearbyName: $('#nearby-name'),
      nearbyHint: $('#nearby-hint'),
      nameplates: $('#nameplates'),
      minimap: $('#minimap'),
      toast: $('#toast'),
      location: $('#location-banner'),
      panel: $('#panel'),
      teamGrid: $('#team-grid'),
      guideGrid: $('#guide-grid'),
      tabTeam: $('#tab-team-count'),
      tabGuide: $('#tab-guide-count'),
      saveState: $('#save-state'),
      battleBtn: $('#btn-battle'),
      battleUI: $('#battle-ui'),
      nearHint: $('#near-hint')
    };
    this.ctx = this.el.minimap.getContext('2d');
    this.base = buildMinimap(this.el.minimap.width);
    this.nameplateMap = new Map();
    this.thumbs = {};
    this.panelTab = 'team';
    this.resetArmed = false;
    this.lastNearId = null;
    this.onLeadChange = null;
    this.onReset = null;
    this.onBattle = null;
    this.onParty = null;

    $('#btn-music').addEventListener('click', () => {
      this.audio.init();
      const on = this.audio.toggle();
      this.updateAudioButton(on);
      this.audio.sfx('click');
      this.toast(on ? 'Meadow music on' : 'Music muted');
    });
    $('#btn-journal').addEventListener('click', () => { this.audio.init(); this.audio.sfx('open'); this.openPanel('guide'); });
    $('#btn-party').addEventListener('click', () => { this.audio.init(); this.audio.sfx('open'); this.openPanel('team'); });
    $('#panel-close').addEventListener('click', () => this.closePanel());
    $('#panel .panel-scrim').addEventListener('click', () => this.closePanel());
    $$('.tab').forEach(tab => tab.addEventListener('click', () => this.switchTab(tab.dataset.tab)));
    $('#btn-reset').addEventListener('click', () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        this.el.saveState.textContent = 'Tap "New journey" again to erase progress';
        this.el.saveState.style.color = '#ffb59b';
        setTimeout(() => {
          if (!this.resetArmed) return;
          this.resetArmed = false;
          this.el.saveState.textContent = 'Adventure saved';
          this.el.saveState.style.color = '';
        }, 3500);
        return;
      }
      this.resetArmed = false;
      this.closePanel();
      this.onReset?.();
    });
    this.updateAudioButton(this.audio.enabled);
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !this.el.panel.classList.contains('hidden')) this.closePanel(); });
  }

  updateAudioButton(on) {
    $('#btn-music').classList.toggle('muted', !on);
  }

  hideLoading() {
    this.el.load.classList.add('gone');
    setTimeout(() => this.el.load.remove(), 900);
  }

  setLoadStatus(text) { this.el.loadStatus.textContent = text; }

  setThumbs(thumbs) {
    this.thumbs = thumbs;
  }

  showLocation(text = 'PRISM MEADOW') {
    this.el.location.querySelector('span').textContent = text;
    this.el.location.classList.add('show');
    setTimeout(() => this.el.location.classList.remove('show'), 3800);
    this.el.nearHint.classList.remove('hidden');
    setTimeout(() => this.el.nearHint.classList.add('hidden'), 5200);
  }

  toast(text, ms = 2600) {
    const t = this.el.toast;
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  updateQuest(caughtCount, total = 6) {
    this.el.questCount.textContent = `${caughtCount} / ${total}`;
    this.el.questFill.style.width = `${(caughtCount / total) * 100}%`;
    this.el.journalBadge.textContent = caughtCount;
    this.el.tabGuide.textContent = `${caughtCount}/${total}`;
    if (caughtCount >= total) {
      this.el.questText.textContent = 'Meadow Guardian — every beast found!';
    } else if (caughtCount === 0) {
      this.el.questText.textContent = 'Track down the meadow\'s wild beasts';
    } else {
      this.el.questText.textContent = 'Keep exploring — new beasts are hiding';
    }
  }

  setPartyCount(n) {
    this.el.partyCount.textContent = n;
    this.el.tabTeam.textContent = n;
  }

  setNearby(mon) {
    if (!mon) {
      this.el.nearby.classList.add('hidden');
      this.el.battleBtn.classList.remove('focus');
      this.lastNearId = null;
      return;
    }
    if (mon.uid !== this.lastNearId) {
      this.lastNearId = mon.uid;
      const sp = SPECIES[mon.species];
      const level = mon.mon?.level ?? mon.level;
      this.el.nearbyName.textContent = `Wild ${sp.name} · Lv. ${level}`;
      this.el.nearbyHint.textContent = 'Close enough — tap Battle!';
      this.el.nearby.classList.remove('hidden');
      this.el.battleBtn.classList.add('focus');
    }
  }

  updateNameplates(items) {
    const seen = new Set();
    for (const item of items) {
      seen.add(item.uid);
      let node = this.nameplateMap.get(item.uid);
      if (!node) {
        node = document.createElement('div');
        node.className = 'nameplate';
        node.innerHTML = `<div class="np-pill"><span class="np-dot"></span><span class="np-name"></span><span class="np-lv"></span><span class="np-alert">!</span></div>`;
        this.el.nameplates.appendChild(node);
        this.nameplateMap.set(item.uid, node);
      }
      const sp = SPECIES[item.species];
      const dot = node.querySelector('.np-dot');
      dot.style.background = TYPES[sp.type].color;
      dot.style.color = TYPES[sp.type].color;
      node.querySelector('.np-name').textContent = sp.name;
      node.querySelector('.np-lv').textContent = `Lv.${item.level}`;
      node.querySelector('.np-alert').style.display = item.near ? 'inline-grid' : 'none';
      node.style.transform = `translate(-50%, -100%) translate(${item.x}px, ${item.y}px)`;
      node.style.opacity = item.opacity ?? 1;
      node.style.display = '';
    }
    for (const [uid, node] of this.nameplateMap) {
      if (!seen.has(uid)) node.style.display = 'none';
    }
  }

  drawMinimap(player, wilds, nearId) {
    const ctx = this.ctx;
    const size = this.el.minimap.width;
    const range = 52;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.base, 0, 0, size, size);
    ctx.fillStyle = 'rgba(8,32,32,.25)';
    ctx.fillRect(0, 0, size, size);
    const toMap = (x, z) => [((x / range) * 0.5 + 0.5) * size, ((z / range) * 0.5 + 0.5) * size];
    for (const w of wilds) {
      const [mx, my] = toMap(w.x, w.z);
      const sp = SPECIES[w.species];
      ctx.beginPath();
      ctx.arc(mx, my, w.uid === nearId ? 5.5 : 3.8, 0, Math.PI * 2);
      ctx.fillStyle = w.uid === nearId ? '#fff6c9' : TYPES[sp.type].color;
      ctx.shadowColor = TYPES[sp.type].color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      if (w.uid === nearId) {
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,246,201,.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    const [px, py] = toMap(player.x, player.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-player.yaw + Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6.5, 7);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-6.5, 7);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  openPanel(tab = 'team') {
    this.el.panel.classList.remove('hidden');
    this.switchTab(tab);
  }

  closePanel() {
    this.el.panel.classList.add('hidden');
    this.resetArmed = false;
    this.el.saveState.textContent = 'Adventure saved';
    this.el.saveState.style.color = '';
  }

  switchTab(tab) {
    this.panelTab = tab;
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $$('.tab-view').forEach(v => v.classList.toggle('active', v.id === `${tab}-view`));
  }

  renderTeam(party, leadUid, onLeadChange) {
    this.onLeadChange = onLeadChange;
    const grid = this.el.teamGrid;
    grid.innerHTML = '';
    party.forEach((mon, i) => {
      const sp = SPECIES[mon.species];
      const stats = statsOf(mon);
      const hp = maxHpOf(mon);
      const card = document.createElement('button');
      card.className = `beast-card t-${sp.type}${mon.uid === leadUid ? ' lead' : ''}`;
      card.innerHTML = `
        <div class="beast-thumb">${this.thumbs[mon.species] ? `<img src="${this.thumbs[mon.species]}" alt="${sp.name}">` : ''}<span class="lvl">Lv.${mon.level}</span></div>
        <div class="beast-info">
          <h4>${sp.name} <span class="type-badge">${TYPES[sp.type].name}</span></h4>
          <p>${sp.title} · ${mon.hp}/${hp} HP</p>
          <div class="beast-stats hpbar"><span>HP</span><div class="mini-track"><i style="width:${Math.max(4, (mon.hp / hp) * 100)}%"></i></div><span>${mon.hp}/${hp}</span></div>
          <div class="beast-stats"><span>ATK</span><div class="mini-track"><i style="width:${Math.min(100, stats.atk * 3.4)}%"></i></div><span>${stats.atk}</span></div>
          <div class="beast-stats"><span>SPD</span><div class="mini-track"><i style="width:${Math.min(100, stats.spd * 3.4)}%"></i></div><span>${stats.spd}</span></div>
        </div>
        ${mon.uid === leadUid ? '<span class="lead-flag">LEAD</span>' : ''}
      `;
      card.addEventListener('click', () => {
        this.audio.init();
        this.audio.sfx('click');
        if (mon.uid === leadUid) return;
        this.onLeadChange?.(mon.uid);
      });
      grid.appendChild(card);
    });
    for (let i = party.length; i < 6; i++) {
      const empty = document.createElement('div');
      empty.className = 'beast-card';
      empty.style.opacity = '0.32';
      empty.innerHTML = `<div class="beast-thumb" style="background:rgba(255,255,255,.04)"><span style="font-family:var(--display);font-size:26px;color:rgba(255,255,255,.3)">?</span></div><div class="beast-info"><h4 style="color:rgba(255,255,255,.45)">Open spot</h4><p>Catch a wild beast to fill this slot.</p></div>`;
      grid.appendChild(empty);
    }
  }

  renderGuide(caughtSet, party) {
    const grid = this.el.guideGrid;
    grid.innerHTML = '';
    for (const key of Object.keys(SPECIES)) {
      const sp = SPECIES[key];
      const known = caughtSet.has(key);
      const owned = party.find(m => m.species === key);
      const card = document.createElement('div');
      card.className = `guide-card t-${sp.type}${known ? ' known' : ' unknown'}`;
      const img = known && this.thumbs[key]
        ? `<img src="${this.thumbs[key]}" alt="${sp.name}">`
        : `<div class="silhouette">?</div>`;
      card.innerHTML = `
        <div class="guide-art">${img}</div>
        <h4>${known ? sp.name : '???'}</h4>
        <p>${known ? `${sp.desc}` : 'A beast still hiding somewhere in Prism Meadows.'}</p>
        <span class="type-badge">${TYPES[sp.type].name}</span>
        ${owned ? `<div style="margin-top:6px;font-size:8.5px;color:var(--mint)">On team · Lv.${owned.level}</div>` : known ? '<div style="margin-top:6px;font-size:8.5px;color:rgba(255,255,255,.4)">In the field</div>' : ''}
      `;
      grid.appendChild(card);
    }
  }

  updateXPBar(mon) {
    const need = xpToNext(mon.level);
    $('#player-xp').style.width = `${Math.min(100, (mon.xp / need) * 100)}%`;
  }

  confetti(count = 70) {
    const wrap = $('#confetti');
    const colors = ['#7ce4b8', '#ffd166', '#ff8b61', '#79d5ff', '#cf8cff', '#fff8e6'];
    for (let i = 0; i < count; i++) {
      const bit = document.createElement('i');
      bit.style.left = `${rand(2, 98)}%`;
      bit.style.background = choice(colors);
      bit.style.setProperty('--dx', `${rand(-120, 120)}px`);
      bit.style.animationDuration = `${rand(1.6, 2.8)}s`;
      bit.style.animationDelay = `${rand(0, 0.3)}s`;
      bit.style.transform = `rotate(${rand(0, 360)}deg)`;
      wrap.appendChild(bit);
      setTimeout(() => bit.remove(), 3200);
    }
  }

  screenShake() {
    document.body.classList.remove('screen-shake');
    void document.body.offsetWidth;
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 360);
  }
}
