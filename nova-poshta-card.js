/**
 * Nova Poshta Lovelace Card
 * Home Assistant custom card for tracking Nova Poshta parcels
 *
 * Repository: https://github.com/igorolesko/homeassistant-nova-poshta
 * License: MIT
 *
 * Usage in Lovelace:
 *   type: custom:nova-poshta-card
 *   title: 'Нова Пошта'   # optional
 */

const CARD_VERSION = '1.0.0';

const STATUS_CONFIG = {
  in_transit: {
    key:    'v_dorozi',
    label:  'В дорозі',
    emoji:  '🚚',
    color:  '#3b82f6',
    bg:     'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.35)',
    badge:  '#1d4ed8',
  },
  arrived: {
    key:    'chekaie_u_viddilenni',
    label:  'У відділенні',
    emoji:  '📦',
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
    badge:  '#b45309',
  },
  delivered: {
    key:    'otrimano',
    label:  'Отримано',
    emoji:  '✅',
    color:  '#22c55e',
    bg:     'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.30)',
    badge:  '#15803d',
  },
  problem: {
    key:    'potrebuie_uvagi',
    label:  'Проблема',
    emoji:  '⚠️',
    color:  '#ef4444',
    bg:     'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.35)',
    badge:  '#b91c1c',
  },
};

// ── helpers ────────────────────────────────────────────────────────────────────

function formatTTN(raw) {
  if (!raw) return '—';
  const s = String(raw).replace(/\s/g, '');
  // group: 2 4 4 4 — standard NP format
  return s.replace(/^(\d{2})(\d{4})(\d{4})(\d{4})$/, '$1 $2 $3 $4') || s;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, value) {
  if (!value && value !== 0) return '';
  return `<div class="np-detail-row">
    <span class="np-detail-label">${escapeHtml(label)}</span>
    <span class="np-detail-value">${escapeHtml(String(value))}</span>
  </div>`;
}

// ── styles ─────────────────────────────────────────────────────────────────────

const STYLES = `
  :host { display: block; }

  ha-card {
    font-family: 'Roboto', 'Noto Sans', sans-serif;
    background: var(--card-background-color, #1c1c2e);
    border-radius: 16px;
    overflow: hidden;
    padding: 0;
  }

  /* ── Header ── */
  .np-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
    background: linear-gradient(135deg,
      rgba(220,36,36,0.18) 0%,
      rgba(220,36,36,0.06) 100%);
    border-bottom: 1px solid rgba(220,36,36,0.20);
    gap: 12px;
  }

  .np-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .np-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #dc2424;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(220,36,36,0.4);
  }

  .np-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--primary-text-color, #fff);
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .np-subtitle {
    font-size: 11px;
    color: var(--secondary-text-color, rgba(255,255,255,0.5));
    margin-top: 1px;
  }

  .np-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .np-total-badge {
    background: rgba(34,197,94,0.15);
    border: 1px solid rgba(34,197,94,0.35);
    color: #22c55e;
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .np-refresh-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 8px;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 15px;
    line-height: 1;
    transition: background 0.15s, transform 0.1s;
    color: var(--primary-text-color, #fff);
  }
  .np-refresh-btn:hover { background: rgba(255,255,255,0.14); }
  .np-refresh-btn:active { transform: scale(0.92); }
  .np-refresh-btn.spinning { animation: spin 0.7s linear; }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Counters ── */
  .np-counters {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .np-counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 4px 10px;
    background: var(--card-background-color, #1c1c2e);
    gap: 3px;
    cursor: default;
    transition: background 0.15s;
  }
  .np-counter:hover { background: rgba(255,255,255,0.04); }

  .np-counter-emoji { font-size: 18px; line-height: 1; }
  .np-counter-count {
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    color: var(--primary-text-color, #fff);
  }
  .np-counter-label {
    font-size: 10px;
    color: var(--secondary-text-color, rgba(255,255,255,0.45));
    text-align: center;
    line-height: 1.2;
  }

  /* ── Active filter tab ── */
  .np-counter.active {
    background: rgba(255,255,255,0.06);
  }
  .np-counter.active .np-counter-count { color: var(--np-status-color, #fff); }

  /* ── Filter bar ── */
  .np-filter-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .np-filter-btn {
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    background: transparent;
    color: var(--secondary-text-color, rgba(255,255,255,0.6));
  }
  .np-filter-btn:hover { border-color: rgba(255,255,255,0.35); color: var(--primary-text-color, #fff); }
  .np-filter-btn.active {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.35);
    color: var(--primary-text-color, #fff);
    font-weight: 600;
  }

  /* ── Grid ── */
  .np-parcels-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px;
  }

  @media (min-width: 480px) {
    .np-parcels-grid { grid-template-columns: 1fr 1fr; }
  }

  /* ── Parcel card ── */
  .np-parcel {
    border-radius: 12px;
    border: 1px solid var(--np-border, rgba(255,255,255,0.1));
    background: var(--np-bg, rgba(255,255,255,0.04));
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.15s;
  }
  .np-parcel:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }

  .np-parcel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 8px;
    border-bottom: 1px solid var(--np-border, rgba(255,255,255,0.08));
    gap: 8px;
  }

  .np-ttn {
    font-family: 'Roboto Mono', 'Courier New', monospace;
    font-size: 13px;
    font-weight: 700;
    color: var(--primary-text-color, #fff);
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .np-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .np-description {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-text-color, #fff);
    padding: 8px 12px 4px;
    line-height: 1.3;
  }

  /* ── Detail rows ── */
  .np-details { padding: 0 12px 10px; }

  .np-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 3px 0;
    gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .np-detail-row:last-child { border-bottom: none; }

  .np-detail-label {
    font-size: 11px;
    color: var(--secondary-text-color, rgba(255,255,255,0.45));
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 1px;
  }

  .np-detail-value {
    font-size: 12px;
    color: var(--primary-text-color, rgba(255,255,255,0.85));
    text-align: right;
    line-height: 1.3;
    word-break: break-word;
  }

  /* ── Route ── */
  .np-route {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(255,255,255,0.03);
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-wrap: wrap;
    font-size: 11px;
    color: var(--secondary-text-color, rgba(255,255,255,0.55));
  }

  .np-route-city {
    color: var(--primary-text-color, rgba(255,255,255,0.85));
    font-weight: 600;
    font-size: 11px;
  }
  .np-route-arrow { color: rgba(255,255,255,0.3); font-size: 10px; }

  /* ── Empty state ── */
  .np-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--secondary-text-color, rgba(255,255,255,0.35));
    font-size: 14px;
    grid-column: 1 / -1;
  }
  .np-empty-icon { font-size: 40px; margin-bottom: 10px; }

  /* ── Error ── */
  .np-error {
    padding: 16px 20px;
    color: #ef4444;
    font-size: 13px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 8px;
    margin: 12px;
  }

  /* ── Last updated ── */
  .np-footer {
    display: flex;
    justify-content: flex-end;
    padding: 6px 16px 10px;
    font-size: 10px;
    color: var(--secondary-text-color, rgba(255,255,255,0.3));
  }
`;

// ── Card class ─────────────────────────────────────────────────────────────────

class NovaPoshtaCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._filter = 'all';
    this._lastUpdated = null;
  }

  static getStubConfig() {
    return { title: 'Нова Пошта' };
  }

  setConfig(config) {
    this.config = config;
    this._buildShadow();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 6; }

  // ── DOM bootstrap ────────────────────────────────────────────────────────────

  _buildShadow() {
    const style = document.createElement('style');
    style.textContent = STYLES;

    const card = document.createElement('ha-card');
    card.innerHTML = '<div id="np-root"></div>';

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);
  }

  // ── Auto-detect sensors from hass.states ────────────────────────────────────
  // Finds all sensor.nova_poshta_* entities and maps them to status buckets
  // by matching known suffix patterns. Works for any phone number / account.

  _getSensors() {
    const suffixMap = {
      in_transit: '_v_dorozi',
      arrived:    '_chekaie_u_viddilenni',
      delivered:  '_otrimano',
      problem:    '_potrebuie_uvagi',
    };

    const sensors = { in_transit: null, arrived: null, delivered: null, problem: null };

    for (const entityId of Object.keys(this._hass.states)) {
      if (!entityId.startsWith('sensor.nova_poshta_')) continue;
      for (const [bucket, suffix] of Object.entries(suffixMap)) {
        if (entityId.endsWith(suffix)) {
          sensors[bucket] = this._hass.states[entityId];
          break;
        }
      }
    }
    return sensors;
  }

  _getAllParcels(sensors) {
    const all = [];
    for (const [statusName, sensor] of Object.entries(sensors)) {
      if (!sensor) continue;
      const parcels = sensor.attributes?.parcels || [];
      for (const p of parcels) {
        all.push({ ...p, _statusKey: statusName });
      }
    }
    return all;
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  _render() {
    const root = this.shadowRoot.getElementById('np-root');
    if (!root) return;

    if (!this._hass || !this.config) {
      root.innerHTML = '';
      return;
    }

    const sensors   = this._getSensors();
    const allParcels = this._getAllParcels(sensors);

    // counts per status
    const counts = {};
    for (const [name, sensor] of Object.entries(sensors)) {
      counts[name] = sensor
        ? (sensor.attributes?.total ?? sensor.attributes?.parcels?.length ?? 0)
        : 0;
    }
    // header badge shows only delivered count
    const total = counts['delivered'] || 0;

    // filter
    const visible = this._filter === 'all'
      ? allParcels
      : allParcels.filter(p => p._statusKey === this._filter);

    root.innerHTML = `
      ${this._renderHeader(total)}
      ${this._renderCounters(counts)}
      ${this._renderFilterBar(counts)}
      <div class="np-parcels-grid">
        ${visible.length
          ? visible.map(p => this._renderParcel(p)).join('')
          : `<div class="np-empty">
               <div class="np-empty-icon">📭</div>
               Немає посилок
             </div>`
        }
      </div>
      ${this._renderFooter()}
    `;

    this._attachEvents(root);
  }

  // ── Header ───────────────────────────────────────────────────────────────────

  _renderHeader(total) {
    const title = escapeHtml(this.config.title || 'Нова Пошта');
    return `
      <div class="np-header">
        <div class="np-header-left">
          <div class="np-logo">📮</div>
          <div>
            <div class="np-title">${title}</div>
          </div>
        </div>
        <div class="np-header-right">
          ${total > 0 ? `<div class="np-total-badge">✅ ${total} отримано</div>` : ''}
          <button class="np-refresh-btn" id="np-refresh" title="Оновити">🔄</button>
        </div>
      </div>
    `;
  }

  // ── Counters ─────────────────────────────────────────────────────────────────

  _renderCounters(counts) {
    return `
      <div class="np-counters">
        ${Object.entries(STATUS_CONFIG).map(([name, cfg]) => {
          const n = counts[name] || 0;
          const isActive = this._filter === name ? 'active' : '';
          return `
            <div class="np-counter ${isActive}"
                 style="--np-status-color:${cfg.color}"
                 data-filter="${name}">
              <span class="np-counter-emoji">${cfg.emoji}</span>
              <span class="np-counter-count">${n}</span>
              <span class="np-counter-label">${cfg.label}</span>
            </div>`;
        }).join('')}
      </div>`;
  }

  // ── Filter bar ───────────────────────────────────────────────────────────────

  _renderFilterBar(counts) {
    const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
    const filters = [
      { key: 'all', label: `Всі (${totalAll})` },
      ...Object.entries(STATUS_CONFIG).map(([k, c]) => ({
        key: k, label: `${c.emoji} ${c.label} (${counts[k] || 0})`
      })),
    ];
    return `
      <div class="np-filter-bar">
        ${filters.map(f => `
          <button class="np-filter-btn ${this._filter === f.key ? 'active' : ''}"
                  data-filter="${f.key}">${escapeHtml(f.label)}</button>
        `).join('')}
      </div>`;
  }

  // ── Single parcel ─────────────────────────────────────────────────────────────

  _renderParcel(p) {
    const sc   = STATUS_CONFIG[p._statusKey];
    const ttn  = formatTTN(p.ttn);

    const statusBadge = `
      <span class="np-status-badge"
            style="background:${sc.bg};color:${sc.color};border:1px solid ${sc.border}">
        ${sc.emoji} ${escapeHtml(p.status || sc.label)}
      </span>`;

    const routeHtml = (p.from || p.to) ? `
      <div class="np-route">
        ${p.from ? `<span class="np-route-city">${escapeHtml(p.from)}</span>` : ''}
        ${p.from && p.to ? '<span class="np-route-arrow">→</span>' : ''}
        ${p.to   ? `<span class="np-route-city">${escapeHtml(p.to)}</span>` : ''}
      </div>` : '';

    const details = [
      row('Відправник',  p.sender),
      row('Відділення',  p.warehouse),
      row('Вага',        p.weight_kg ? `${p.weight_kg} кг` : null),
      row('Вартість дост.', p.cost_uah ? `${p.cost_uah} грн` : null),
      row('Оголошена цінність', p.announced_uah ? `${p.announced_uah} грн` : null),
      row('Заплановано',  p.scheduled),
      row('Отримано',    p.received),
      p.additional ? row('Додатково', p.additional) : '',
    ].join('');

    return `
      <div class="np-parcel"
           style="--np-bg:${sc.bg};--np-border:${sc.border}">
        <div class="np-parcel-header">
          <span class="np-ttn">${ttn}</span>
          ${statusBadge}
        </div>
        ${p.description ? `<div class="np-description">${escapeHtml(p.description)}</div>` : ''}
        ${routeHtml}
        <div class="np-details">${details}</div>
      </div>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  _renderFooter() {
    const ts = this._lastUpdated
      ? `Оновлено: ${this._lastUpdated}`
      : '';
    return `<div class="np-footer">${ts}</div>`;
  }

  // ── Events ────────────────────────────────────────────────────────────────────

  _attachEvents(root) {
    // counters click → filter
    root.querySelectorAll('.np-counter[data-filter]').forEach(el => {
      el.addEventListener('click', () => {
        const f = el.dataset.filter;
        this._filter = this._filter === f ? 'all' : f;
        this._render();
      });
    });

    // filter bar buttons
    root.querySelectorAll('.np-filter-btn[data-filter]').forEach(el => {
      el.addEventListener('click', () => {
        this._filter = el.dataset.filter;
        this._render();
      });
    });

    // refresh button
    const btn = root.querySelector('#np-refresh');
    if (btn) {
      btn.addEventListener('click', () => {
        btn.classList.add('spinning');
        setTimeout(() => btn.classList.remove('spinning'), 700);

        // trigger HA state refresh
        if (this._hass?.callService) {
          const sensors = this._getSensors();
          const entityIds = Object.values(sensors)
            .filter(Boolean)
            .map(s => s.entity_id);
          if (entityIds.length) {
            this._hass.callService('homeassistant', 'update_entity', {
              entity_id: entityIds,
            });
          }
        }
        this._lastUpdated = new Date().toLocaleTimeString('uk-UA', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        this._render();
      });
    }
  }
}

// ── Register ───────────────────────────────────────────────────────────────────

customElements.define('nova-poshta-card', NovaPoshtaCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'nova-poshta-card',
  name:        'Nova Poshta Card',
  description: 'Трекінг посилок Нової Пошти',
  preview:     true,
  documentationURL: 'https://github.com/igorolesko/homeassistant-nova-poshta',
});

console.info(
  `%c NOVA-POSHTA-CARD %c v${CARD_VERSION} `,
  'background:#dc2424;color:#fff;font-weight:700;padding:2px 4px;border-radius:3px 0 0 3px',
  'background:#1c1c2e;color:#fff;font-weight:400;padding:2px 4px;border-radius:0 3px 3px 0',
);
