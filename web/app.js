import { applyChange, budgetOf, validateDecisions, referenceDecisions, isCurrentResponse } from './state.mjs';
import { mockAnalysis } from './mock-analysis.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const delta = value => `${value > 0 ? '+' : ''}${number(value)}`;
const storageKey = 'astana-akim-scenario-v1';
const icons = {
  city: '<path d="m3 9 9-6 9 6M3 21h18M5 10v8m5-8v8m4-8v8m5-8v8M3 9h18"/>',
  transport: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 18v3m8-3v3M8 14h1m6 0h1"/>',
  ecology: '<path d="M20 3C9 2 2 7 5 15s15 5 15-12ZM4 21l11-11"/>',
  social: '<path d="M3 21V7l9-4 9 4v14M9 21v-5h6v5M7 9h1m8 0h1M7 12h1m8 0h1M12 8v4m-2-2h4"/>',
  safety: '<path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  services: '<path d="M4 6h16v14H4zM8 3v6m8-6v6M4 11h16m-11 4 2 2 4-3"/>',
  chart: '<path d="M4 3v17h17M7 14l4-5 4 3 6-8"/>',
  wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4M4 5v14a2 2 0 0 0 2 2h14V7M15 12h6v5h-6z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
  spark: '<path d="m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Zm7-1 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.city}</svg>`;
const geometry = {
  saryarka: { points: '160,115 365,90 425,183 390,260 270,310 160,240 130,165', label: [270, 190] },
  baikonur: { points: '365,90 605,65 650,146 560,200 475,215 425,183', label: [502, 137] },
  almaty: { points: '605,65 842,89 880,220 738,265 630,230 560,200 650,146', label: [727, 167] },
  esil: { points: '390,280 540,240 680,260 810,380 720,510 520,470 440,380', label: [607, 355] },
  nura: { points: '270,310 440,380 520,470 480,578 280,565 200,470 230,370', label: [357, 461] },
};
let data;
let config = { apiBaseUrl: '/api', analysisMode: 'disabled' };
let decisions = [];
let selectedDistrict = 'nura';
let filter = 'all';
let revision = 0;
let session = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
let result = null;
let running = false;
let analysis = { status: 'idle' };
let simulationAbort;
let analysisAbort;
let modalDraft;
let toastTimer;
const version = () => `${session}:${revision}`;
const initiativeById = id => data.initiatives.find(item => item.id === id);
const districtById = id => data.districts.find(item => item.id === id);
const categoryById = id => data.categories.find(item => item.id === id);
const currentSnapshot = () => result?.result ?? data.baseline;
const scoreClass = score => score > 60 ? 'good' : score >= 50 ? 'average' : score >= 45 ? 'weak' : 'critical';

async function request(url, options = {}) {
  const timeout = AbortSignal.timeout(25000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const response = await fetch(url, { ...options, signal, headers: { 'Content-Type': 'application/json', ...options.headers } });
  let body;
  try { body = await response.json(); } catch { throw new Error('Сервер вернул некорректный ответ. Повторите запрос.'); }
  if (!response.ok) {
    const details = body.error?.details?.errors;
    const error = new Error(details?.map(item => item.message).join(' ') || body.error?.message || (typeof body.detail === 'string' ? body.detail : 'Не удалось выполнить запрос.'));
    error.status = response.status;
    throw error;
  }
  return body;
}

function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 5500);
}

function change(action) {
  const next = applyChange(data, decisions, action);
  if (!next.ok) { toast(next.errors.map(error => error.message).join(' ')); return false; }
  decisions = next.decisions;
  revision += 1;
  result = null;
  running = false;
  analysis = { status: 'idle' };
  simulationAbort?.abort();
  analysisAbort?.abort();
  if ($('#results-dialog').open) $('#results-dialog').close();
  try { localStorage.setItem(storageKey, JSON.stringify({ datasetVersion: data.datasetVersion, decisions })); } catch { /* Private browsing may disallow storage. */ }
  render();
  return true;
}

function header() {
  const budget = budgetOf(data, decisions);
  return `<header class="topbar"><a href="/" class="brand" aria-label="Аким на 5 часов, главная"><span class="brand-mark">${icon('city')}</span><span><strong>Аким на 5 часов <span class="brand-tag">ASTANA</span></strong><small>Город начинается с ваших решений</small></span></a>
    <div class="header-metrics"><div class="header-metric"><span class="metric-icon green">${icon('chart')}</span><span><small>${result ? 'Итоговый QoL' : 'Исходный QoL'}</small><strong>${number(currentSnapshot().score)} ${result ? `<em>${delta(result.scoreChange)}</em>` : ''}</strong></span></div><div class="header-metric"><span class="metric-icon amber">${icon('wallet')}</span><span><small>Остаток бюджета</small><strong>${budget.remaining}<span class="unit"> / ${budget.limit} ед.</span></strong></span></div><div class="header-metric"><span class="metric-icon blue">${icon('check')}</span><span><small>Ваши решения</small><strong>${decisions.length}<span class="unit"> / ${data.rules.decisionCount}</span></strong></span></div></div>
    <div class="header-actions"><button class="button secondary compact" data-action="reference" title="Заменить текущий план эталонным сценарием">Эталонный план</button><button class="icon-button" data-action="reset" aria-label="Сбросить сценарий" title="Сбросить сценарий">${icon('reset')}</button></div></header>`;
}

function map() {
  const snapshot = currentSnapshot();
  return `<section class="map-panel" aria-label="Схематичная карта районов Астаны"><div class="map-heading"><span class="eyebrow">ВАША АСТАНА</span><h1>Пять решений.<br>Один город.</h1><p>Выберите район и направьте бюджет<br>туда, где изменения нужнее всего.</p></div><div class="map-state">${result ? '<span class="live-dot green-dot"></span>После реализации' : '<span class="live-dot"></span>Исходное состояние'}</div>
    <svg class="city-map" viewBox="95 20 815 600" role="group" aria-label="Выберите район на карте"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#dfe6e9" stroke-width=".6"/></pattern><filter id="label-shadow" x="-20%" y="-30%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#21324b" flood-opacity=".11"/></filter></defs>
    <rect x="95" width="815" height="630" fill="#edf2ee"/><rect x="95" width="815" height="630" fill="url(#grid)"/>
    <g fill="#dbe8d4"><rect x="525" y="380" width="83" height="74" rx="14"/><path d="m366 244 62-25 32 49-45 28-49-19z"/><path d="m563 267 71-36 49 44-67 24z"/><ellipse cx="718" cy="460" rx="31" ry="21"/></g>
    <g fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"><path d="M150 420 865 130M210 550 510 45M380 600 720 45M150 220 810 480M250 65 750 545"/><path d="M105 505Q480 520 865 323"/></g>
    <g fill="none" stroke="#ced9d9" stroke-width="1.4"><path d="M150 420 865 130M210 550 510 45M380 600 720 45M150 220 810 480M250 65 750 545"/></g>
    <path d="M85 515C220 450 280 360 360 300S490 265 540 240 650 230 730 190 880 180 945 132" fill="none" stroke="#a0d1e9" stroke-width="24" stroke-linecap="round"/><path d="M540 240Q532 162 600 90T780 16" fill="none" stroke="#a0d1e9" stroke-width="8"/>
    <text x="781" y="202" fill="#659bb6" font-size="11" transform="rotate(-15 781 202)">река Есиль</text>
    ${snapshot.districts.map(district => { const shape = geometry[district.id]; if (!shape) return ''; const count = decisions.filter(decision => decision.districtId === district.id).length; return `<g class="map-district ${scoreClass(district.score)} ${selectedDistrict === district.id ? 'selected' : ''}" tabindex="0" role="button" data-district="${district.id}" aria-label="${escape(district.name)}, балл ${number(district.score)}" aria-pressed="${selectedDistrict === district.id}"><polygon points="${shape.points}"/><g class="map-label" transform="translate(${shape.label.join(' ')})"><rect x="-59" y="-26" width="118" height="52" rx="10" filter="url(#label-shadow)"/><text y="-5" text-anchor="middle" class="district-name">${escape(district.name)}</text><text y="14" text-anchor="middle" class="district-value">${number(district.score)} <tspan class="qol-unit">QoL</tspan></text>${count ? `<circle cx="53" cy="-23" r="12"/><text class="map-count" x="53" y="-19" text-anchor="middle">${count}</text>` : ''}</g></g>`; }).join('')}
    <g transform="translate(850 518)" fill="#657586"><path d="m0-23-7 22 7-4 7 4Z"/><text y="18" text-anchor="middle" font-size="12">С</text></g></svg>
    <div class="map-legend"><span><i class="legend-dot good"></i> &gt;60</span><span><i class="legend-dot average"></i> 50–60</span><span><i class="legend-dot weak"></i> 45–50</span><span><i class="legend-dot critical"></i> &lt;45</span><small>Балл района</small></div><p class="map-footnote">Схематичные границы · Синтетические данные</p></section>`;
}

function districtPanel() {
  const district = currentSnapshot().districts.find(item => item.id === selectedDistrict) ?? currentSnapshot().districts[0];
  const source = districtById(district.id);
  const weakest = currentSnapshot().weakestDistrictId === district.id;
  const categories = data.categories.map(category => {
    const values = data.indicators.filter(indicator => indicator.category === category.id);
    const score = district.categories?.[category.id] ?? values.reduce((sum, indicator) => sum + district.indicators[indicator.id], 0) / values.length;
    return `<div class="category-row"><span class="category-label">${icon(category.id)}${escape(category.name)}</span><strong>${number(score)}</strong><div class="meter"><span class="${scoreClass(score)}" style="width:${Math.min(100, Math.max(0, score))}%"></span></div></div>`;
  }).join('');
  const critical = data.indicators.filter(indicator => district.indicators[indicator.id] < data.rules.criticalThreshold);
  return `<aside class="district-panel"><div class="panel-kicker"><span class="eyebrow">ПРОФИЛЬ РАЙОНА</span><span class="small-tag">${Math.round(source.populationShare * 100)}% населения</span></div><div class="district-title"><div><h2>${escape(district.name)}</h2><p>${escape(typeof source.profile === 'string' ? source.profile : 'Выбранный район Астаны')}</p></div><div class="district-score ${scoreClass(district.score)}"><strong>${number(district.score)}</strong><small>из 100</small></div></div>
    ${weakest ? `<div class="district-notice">${icon('chart')}<span>Район с наименьшим баллом.<br><strong>Его развитие влияет на 30% взвешенной части индекса.</strong></span></div>` : ''}
    <div class="category-meters">${categories}</div>
    <details class="indicators-details"><summary>Все 10 показателей <span>↓</span></summary><div>${data.indicators.map(indicator => `<div class="indicator-line ${district.indicators[indicator.id] < data.rules.criticalThreshold ? 'is-critical' : ''}"><span><code>${escape(indicator.id)}</code> ${escape(indicator.label)}</span><strong>${number(district.indicators[indicator.id])}</strong></div>`).join('')}</div></details>
    <div class="district-bottom"><span class="status-dot ${critical.length ? 'orange' : 'green'}"></span>${critical.length ? `Показателей ниже порога 40: ${critical.length}` : 'Все показатели не ниже критического порога'}</div><button class="button secondary wide" data-action="catalog">Выбрать инициативу для района ${icon('arrow')}</button></aside>`;
}

function catalog() {
  const initiatives = filter === 'all' ? data.initiatives : data.initiatives.filter(item => item.category === filter);
  return `<section class="catalog-section" id="catalog"><div class="section-heading"><div><span class="eyebrow">ИНВЕСТИЦИИ В БУДУЩЕЕ</span><h2>Что изменим в городе?</h2><p>Выберите 5 мер · До 2 в одном направлении · Горизонт ${data.rules.horizonQuarters} кварталов</p></div><span class="catalog-count">${data.initiatives.length} инициатив</span></div><div class="category-filters" role="group" aria-label="Фильтр направлений"><button class="filter ${filter === 'all' ? 'active' : ''}" data-filter="all">Все инициативы</button>${data.categories.map(category => `<button class="filter ${filter === category.id ? 'active' : ''}" data-filter="${escape(category.id)}">${icon(category.id)}${escape(category.name)}<span>${decisions.filter(decision => initiativeById(decision.initiativeId).category === category.id).length}/2</span></button>`).join('')}</div>
    <div class="initiative-grid">${initiatives.map(item => { const index = decisions.findIndex(decision => decision.initiativeId === item.id); const chosen = index !== -1; const synergyIds = (data.rules.synergies ?? []).filter(synergy => synergy.initiatives.includes(item.id)).flatMap(synergy => synergy.initiatives.filter(id => id !== item.id)); return `<article class="initiative-card ${chosen ? 'chosen' : ''}"><div class="card-top"><span class="category-symbol ${item.category}">${icon(item.category)}</span><span class="small-tag">${escape(item.id)} · ${item.scope === 'city' ? 'Весь город' : 'Один район'}</span><strong class="cost">${item.cost}<small>ед.</small></strong></div><h3>${escape(item.name)}</h3><p class="initiative-description">${escape(item.description)}</p><div class="effect-chips">${Object.entries(item.effects).map(([key, value]) => `<span class="${value < 0 ? 'negative' : ''}" title="${escape(data.indicators.find(indicator => indicator.id === key)?.label)}">${escape(key)} ${value > 0 ? '+' : ''}${value}</span>`).join('')}</div><div class="card-facts"><span>Лаг: ${item.lag} кв.</span>${synergyIds.length ? `<span title="Дополнительный эффект при совместном выборе">Синергия: ${synergyIds.join(', ')}</span>` : '<span>Горизонт: 8 кв.</span>'}</div><button class="button ${chosen ? 'secondary' : 'card-action'} wide" data-initiative="${escape(item.id)}">${icon(chosen ? 'check' : 'plus')}${chosen ? 'В плане · изменить' : 'Выбрать инициативу'}</button></article>`; }).join('')}</div></section>`;
}

function plan() {
  const budget = budgetOf(data, decisions);
  const valid = !validateDecisions(data, decisions, { complete: true }).length;
  return `<section class="plan-panel" aria-label="Ваш план развития"><div class="plan-header"><div><span class="eyebrow">ВАШ ПЛАН</span><strong>${decisions.length} из 5 решений</strong></div><span>Потрачено <strong>${budget.spent}</strong> из ${budget.limit} ед.</span></div><div class="plan-body"><div class="decision-slots">${Array.from({ length: data.rules.decisionCount }, (_, index) => { const decision = decisions[index]; const item = decision && initiativeById(decision.initiativeId); return `<div class="decision-slot ${item ? 'filled' : ''}">${item ? `<button class="slot-main" data-edit="${index}" title="Изменить решение ${index + 1}"><span class="slot-number">${index + 1}</span><span><strong>${escape(item.name)}</strong><small>${decision.districtId ? escape(districtById(decision.districtId).name) : 'Весь город'} · ${item.cost} ед.</small></span></button><button class="slot-remove" data-remove="${index}" aria-label="Удалить ${escape(item.name)}">${icon('close')}</button>` : `<button class="slot-main" data-action="catalog"><span class="slot-number">${index + 1}</span><span><strong>Добавить решение</strong><small>Выберите инициативу</small></span></button>`}</div>`; }).join('')}</div><button id="simulate-button" class="button primary simulate-button" data-action="simulate" ${!valid || running ? 'disabled' : ''}>${running ? '<span class="spinner"></span>Считаем…' : result ? 'Открыть результаты' : `Рассчитать сценарий ${icon('arrow')}`}</button></div><div class="plan-progress"><span style="width:${budget.spent / budget.limit * 100}%"></span></div></section>`;
}

function render() {
  $('#app').innerHTML = `${header()}<main><div class="workspace">${map()}${districtPanel()}</div>${catalog()}<footer class="page-note">Учебный симулятор · Показатели и Astana Quality of Life Score синтетические и не являются официальной оценкой города.<br>Результат описывает условный эффект за 8 кварталов, без поквартального прогноза.</footer></main>${plan()}`;
}

function openDecision(id, index = null) {
  const existing = decisions.findIndex(decision => decision.initiativeId === id);
  if (index == null && existing !== -1) index = existing;
  modalDraft = { index, initiativeId: id, districtId: index != null ? decisions[index]?.districtId ?? selectedDistrict : selectedDistrict };
  renderDecisionDialog();
  if (!$('#decision-dialog').open) $('#decision-dialog').showModal();
}

function renderDecisionDialog() {
  const item = initiativeById(modalDraft.initiativeId);
  const candidate = applyChange(data, decisions, { type: 'save', index: modalDraft.index, decision: { initiativeId: item.id, districtId: modalDraft.districtId } });
  const after = budgetOf(data, candidate.ok ? candidate.decisions : decisions);
  const factor = (data.rules.horizonQuarters - item.lag) / data.rules.horizonQuarters;
  $('#decision-dialog').innerHTML = `<div class="dialog-heading"><div><span class="eyebrow">${modalDraft.index == null ? 'НОВОЕ РЕШЕНИЕ' : `РЕШЕНИЕ ${modalDraft.index + 1}`}</span><h2 id="decision-title">${modalDraft.index == null ? 'Добавить в план' : 'Изменить решение'}</h2></div><button class="icon-button" data-close="decision-dialog" aria-label="Закрыть">${icon('close')}</button></div><div class="dialog-content"><label class="field">Мероприятие<select id="initiative-select">${data.initiatives.map(initiative => `<option value="${initiative.id}" ${initiative.id === item.id ? 'selected' : ''}>${initiative.id} · ${escape(initiative.name)} · ${initiative.cost} ед.</option>`).join('')}</select></label>${item.scope === 'district' ? `<label class="field">Район реализации<select id="district-select">${data.districts.map(district => `<option value="${district.id}" ${district.id === modalDraft.districtId ? 'selected' : ''}>${escape(district.name)}</option>`).join('')}</select></label>` : '<div class="city-scope">Мера применяется ко всем пяти районам · Весь город</div>'}<p class="muted">${escape(item.description)}</p><div class="modal-metrics"><div><small>Стоимость</small><strong>${item.cost} ед.</strong></div><div><small>Лаг</small><strong>${item.lag} кв.</strong></div><div><small>Реализация эффекта</small><strong>${factor * 100}%</strong></div></div><h3 class="small-heading">Эффект за ${data.rules.horizonQuarters} кварталов</h3><div class="modal-effects">${Object.entries(item.effects).map(([key, value]) => `<div><span><code>${escape(key)}</code> ${escape(data.indicators.find(indicator => indicator.id === key)?.label)}</span><strong class="${value < 0 ? 'negative-text' : 'positive-text'}">${delta(value * factor)}</strong></div>`).join('')}</div><p class="hint">Синергии добавляются отдельно при расчёте. Итог учитывает ограничения 0–100 и весь набор решений.</p>${candidate.errors.length ? `<div class="validation-errors" role="alert">${candidate.errors.map(error => `<p>${escape(error.message)}</p>`).join('')}</div>` : `<div class="valid-message">${icon('check')}После сохранения останется ${after.remaining} из ${after.limit} ед.</div>`}</div><div class="dialog-footer"><button class="button secondary" data-close="decision-dialog">Отмена</button><button class="button primary" data-action="save-decision" ${candidate.ok ? '' : 'disabled'}>${modalDraft.index == null ? 'Добавить в план' : 'Сохранить решение'}</button></div>`;
}

async function simulate() {
  if (result) { renderResults(); $('#results-dialog').showModal(); return; }
  const errors = validateDecisions(data, decisions, { complete: true });
  if (errors.length) return toast(errors.map(item => item.message).join(' '));
  const expectedVersion = version();
  simulationAbort = new AbortController();
  running = true;
  render();
  try {
    const response = await request(`${config.apiBaseUrl}/simulate`, { method: 'POST', body: JSON.stringify({ scenarioVersion: expectedVersion, decisions }), signal: simulationAbort.signal });
    if (version() !== expectedVersion) return;
    if (!isCurrentResponse(response, expectedVersion)) throw new Error('Версия ответа не совпала с текущим планом. Повторите расчёт.');
    result = response;
    running = false;
    render();
    renderResults();
    $('#results-dialog').showModal();
    void analyze();
  } catch (error) {
    if (version() !== expectedVersion) return;
    running = false;
    render();
    toast(error.name === 'TimeoutError' ? 'Расчёт занял слишком много времени. Попробуйте ещё раз.' : error.message);
  }
}

function breakdownCard(title, before, after, suffix = '') {
  return `<div class="breakdown-card"><small>${title}</small><div><span>${number(before)}${suffix}</span>${icon('arrow')}<strong>${number(after)}${suffix}</strong></div></div>`;
}

function renderResults() {
  if (!result) return;
  const before = result.baseline;
  const after = result.result;
  const weakest = after.districts.find(district => district.id === after.weakestDistrictId);
  $('#results-dialog').innerHTML = `<div class="dialog-heading"><div><span class="eyebrow">РЕЗУЛЬТАТ ВАШЕГО СЦЕНАРИЯ</span><h2 id="results-title">Город после ваших решений</h2></div><button class="icon-button" data-close="results-dialog" aria-label="Закрыть результаты">${icon('close')}</button></div><div class="result-content"><section class="result-hero"><div><span class="result-label">Astana Quality of Life Score</span><div class="result-score"><span>${number(before.score)}</span>${icon('arrow')}<strong>${number(after.score)}</strong><em class="${result.scoreChange < 0 ? 'loss' : ''}">${delta(result.scoreChange)}</em></div><p>Условный результат через ${data.rules.horizonQuarters} кварталов</p></div><div class="result-budget">${icon('wallet')}<strong>${result.budget.spent} <span>/ ${result.budget.limit}</span></strong><small>ед. бюджета · Остаток ${result.budget.remaining}</small></div></section>
    <div class="result-section"><h3>Из чего сложился индекс</h3><div class="formula">0,7 × средний балл + 0,3 × минимум − критические показатели</div><div class="breakdown-grid">${breakdownCard('Средний балл по населению', before.averageScore, after.averageScore)}${breakdownCard('Минимальный балл района', before.minimumScore, after.minimumScore)}${breakdownCard('Количество показателей < 40', before.criticalCount, after.criticalCount)}</div><p class="hint">Слабейший район: ${escape(weakest?.name)}. Каждый показатель ниже 40 снижает Score на 1. Расчёт выполняется до округления.</p></div>
    <div class="result-section"><h3>Как изменились районы</h3><div class="district-comparison">${after.districts.map(district => { const base = before.districts.find(item => item.id === district.id); return `<div><strong>${escape(district.name)}</strong><span>${number(base.score)}</span>${icon('arrow')}<strong>${number(district.score)}</strong><em class="${district.score >= base.score ? 'positive-text' : 'negative-text'}">${delta(district.score - base.score)}</em></div>`; }).join('')}</div></div>
    <div class="result-two-columns"><section class="result-section"><h3>Сработавшие синергии</h3>${result.synergies.length ? result.synergies.map(synergy => `<div class="synergy-result">${icon('spark')}<div><strong>${synergy.initiatives.map(escape).join(' + ')}</strong><p>${escape(districtById(synergy.districtId)?.name ?? 'Весь город')} · ${Object.entries(synergy.effects).map(([key, value]) => `${escape(key)} ${delta(value)}`).join(', ')}</p></div></div>`).join('') : '<p class="muted">В этом наборе нет активных синергий.</p>'}</section><section class="result-section"><h3>Что требует внимания</h3>${after.criticalIndicators.length ? after.criticalIndicators.map(item => `<p class="critical-result"><strong>${escape(districtById(item.districtId)?.name)}</strong> · ${escape(item.indicator)}: ${number(item.value)}</p>`).join('') : '<p class="positive-text">Все показатели достигли порога 40.</p>'}</section></div>
    <details class="effects-details result-section"><summary>Эффекты всех пяти решений</summary>${result.effects.map(effect => `<div class="effect-result"><strong>${escape(effect.initiativeId)} · ${escape(effect.name)}</strong><small>${effect.scope === 'city' ? 'Весь город' : escape(districtById(effect.districtId)?.name)} · Лаг ${effect.lag} кв.</small><p>${Object.entries(effect.realizedEffects).map(([key, value]) => `${escape(key)} ${delta(value)}`).join(' · ')}</p></div>`).join('')}<p class="hint">Показаны изменения показателей до ограничения 0–100. Эффекты мер не складываются напрямую в Score: на него также влияют минимум, штрафы и синергии.</p></details>
    <section class="analysis-section" id="analysis-section">${analysisMarkup()}</section><p class="hint result-disclaimer">Синтетическая модель для сравнения решений. Это не прогноз реального развития Астаны.</p></div><div class="dialog-footer"><button class="button secondary" data-close="results-dialog">Вернуться к плану</button><button class="button primary" data-action="show-map">Посмотреть на карте ${icon('arrow')}</button></div>`;
}

function analysisMarkup() {
  const title = `<h3>${icon('spark')} ${config.analysisMode === 'mock' ? 'Демонстрационный разбор · без AI' : 'AI-анализ сценария'}</h3>`;
  if (analysis.status === 'loading') return `${title}<p class="analysis-status"><span class="spinner"></span>Анализируем сильные стороны и компромиссы…</p>`;
  if (analysis.status === 'ready') {
    const content = analysis.content;
    return `${title}<p class="analysis-summary">${escape(content.summary)}</p><div class="analysis-grid">${[['strengths', 'Сильные стороны'], ['risks', 'Риски'], ['tradeoffs', 'Компромиссы'], ['recommendations', 'Рекомендации']].map(([key, label]) => `<div><h4>${label}</h4><ul>${content[key].map(text => `<li>${escape(text)}</li>`).join('')}</ul></div>`).join('')}</div>`;
  }
  if (config.analysisMode === 'disabled') return `${title}<p>AI-модуль ещё не подключён. Расчёт, показатели и сравнение районов доступны полностью.</p><small>После подключения AI здесь появится объяснение вашего сценария.</small>`;
  return `${title}<p>${analysis.status === 'error' ? escape(analysis.message) : 'Получите объяснение сильных сторон, рисков и компромиссов вашего плана.'}</p><button class="button secondary" data-action="retry-analysis">${analysis.status === 'error' ? 'Повторить AI-анализ' : 'Получить AI-анализ'}</button>`;
}

function renderAnalysis() {
  const element = $('#analysis-section');
  if (element) element.innerHTML = analysisMarkup();
}

async function analyze() {
  if (!result || config.analysisMode === 'disabled' || analysis.status === 'loading') return;
  const expectedVersion = version();
  const simulation = result;
  analysisAbort?.abort();
  analysisAbort = new AbortController();
  analysis = { status: 'loading' };
  renderAnalysis();
  try {
    const response = config.analysisMode === 'mock' ? await mockAnalysis(simulation) : await request(`${config.apiBaseUrl}/analysis`, { method: 'POST', signal: analysisAbort.signal, body: JSON.stringify({ scenarioVersion: expectedVersion, decisions }) });
    if (version() !== expectedVersion || result !== simulation) return;
    if (!isCurrentResponse(response, expectedVersion)) throw new Error('Получен анализ другой версии плана. Повторите запрос.');
    if (typeof response.summary !== 'string' || !['strengths', 'risks', 'tradeoffs', 'recommendations'].every(key => Array.isArray(response[key]) && response[key].every(item => typeof item === 'string'))) throw new Error('AI вернул неподдерживаемый формат. Числовой результат сохранён.');
    analysis = { status: 'ready', content: response };
  } catch (error) {
    if (version() !== expectedVersion || result !== simulation) return;
    analysis = { status: 'error', message: error.status === 404 ? 'AI-анализ пока не подключён. Результат симуляции сохранён.' : error.name === 'TimeoutError' ? 'AI не ответил вовремя. Числовой результат сохранён.' : `AI-анализ недоступен. ${error.message}` };
  }
  renderAnalysis();
}

document.addEventListener('click', event => {
  const target = event.target.closest('button, [data-district]');
  if (!target || !data) return;
  if (target.dataset.close) { $(`#${target.dataset.close}`).close(); return; }
  if (target.dataset.district) { selectedDistrict = target.dataset.district; render(); return; }
  if (target.dataset.filter) { filter = target.dataset.filter; const scroll = window.scrollY; render(); window.scrollTo({ top: scroll, behavior: 'instant' }); return; }
  if (target.dataset.initiative) return openDecision(target.dataset.initiative);
  if (target.dataset.edit != null) { const index = Number(target.dataset.edit); return openDecision(decisions[index].initiativeId, index); }
  if (target.dataset.remove != null) return change({ type: 'remove', index: Number(target.dataset.remove) });
  switch (target.dataset.action) {
    case 'reset':
      if (decisions.length && !window.confirm('Сбросить выбранные решения и начать с исходных данных?')) break;
      change({ type: 'reset' }); toast('План сброшен. Бюджет и показатели возвращены к исходным.'); break;
    case 'reference':
      if (decisions.length && !window.confirm('Заменить текущие решения эталонным планом стоимостью 95 ед.?')) break;
      if (change({ type: 'load', decisions: referenceDecisions })) toast('Загружен эталонный план: 5 решений, стоимость 95 ед.'); break;
    case 'catalog': $('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
    case 'simulate': void simulate(); break;
    case 'retry-analysis': void analyze(); break;
    case 'show-map': $('#results-dialog').close(); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'save-decision': if (change({ type: 'save', index: modalDraft.index, decision: { initiativeId: modalDraft.initiativeId, districtId: modalDraft.districtId } })) { $('#decision-dialog').close(); toast('Решение сохранено в плане.'); } break;
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'initiative-select') { modalDraft.initiativeId = event.target.value; renderDecisionDialog(); $('#initiative-select').focus(); }
  if (event.target.id === 'district-select') { modalDraft.districtId = event.target.value; renderDecisionDialog(); $('#district-select')?.focus(); }
});
document.addEventListener('keydown', event => {
  if (event.target.matches('[data-district]') && ['Enter', ' '].includes(event.key)) { event.preventDefault(); selectedDistrict = event.target.dataset.district; render(); $(`[data-district="${selectedDistrict}"]`)?.focus(); }
});

async function boot() {
  try {
    const explicitApiUrl = document.querySelector('meta[name="api-base-url"]')?.content.trim().replace(/\/$/, '');
    config = { ...config, ...await request(`${explicitApiUrl || '/api'}/config`) };
    if (explicitApiUrl) config.apiBaseUrl = explicitApiUrl;
    config.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
    data = await request(`${config.apiBaseUrl}/bootstrap`);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.datasetVersion === data.datasetVersion && Array.isArray(saved.decisions) && !validateDecisions(data, saved.decisions).length) decisions = saved.decisions;
    } catch { /* An invalid saved draft is ignored. */ }
    if (!districtById(selectedDistrict)) selectedDistrict = data.districts[0].id;
    render();
  } catch (error) {
    $('#app').innerHTML = `<div class="boot-screen"><div class="brand-mark">${icon('city')}</div><h1>Не удалось загрузить город</h1><p>${escape(error.message)}</p><p>Проверьте доступность backend и настройку адреса API.</p><button class="button primary" id="reload-app">Попробовать ещё раз</button></div>`;
    $('#reload-app').addEventListener('click', () => location.reload());
  }
}
void boot();
