// The backend remains authoritative. This validator gives immediate draft feedback.
export function budgetOf(data, decisions) {
  const spent = decisions.reduce((sum, decision) => sum + (data.initiatives.find(item => item.id === decision?.initiativeId)?.cost ?? 0), 0);
  return { limit: data.rules.budget, spent, remaining: data.rules.budget - spent };
}

export function validateDecisions(data, decisions, { complete = false } = {}) {
  const errors = [];
  if (!Array.isArray(decisions)) return [{ code: 'INVALID_DECISIONS', message: 'План должен содержать список решений.' }];
  const rules = data.rules;
  if (decisions.length > rules.decisionCount || (complete && decisions.length !== rules.decisionCount)) errors.push({ code: 'DECISION_COUNT', message: `Для запуска выберите ровно ${rules.decisionCount} решений.` });
  const seen = new Set();
  const counts = {};
  for (const decision of decisions) {
    const initiative = data.initiatives.find(item => item.id === decision?.initiativeId);
    if (!initiative) { errors.push({ code: 'UNKNOWN_INITIATIVE', message: 'Мероприятие не найдено в каталоге.' }); continue; }
    if (seen.has(initiative.id)) errors.push({ code: 'DUPLICATE_INITIATIVE', message: `${initiative.id} уже включено в план. Каждая мера выбирается один раз.` });
    seen.add(initiative.id);
    counts[initiative.category] = (counts[initiative.category] ?? 0) + 1;
    if (initiative.scope === 'district' && !data.districts.some(district => district.id === decision.districtId)) errors.push({ code: 'INVALID_DISTRICT', message: 'Выберите район для этой меры.' });
    if (initiative.scope === 'city' && decision.districtId != null) errors.push({ code: 'CITY_TARGET', message: 'Городская мера действует на весь город без отдельного района.' });
  }
  for (const [category, count] of Object.entries(counts)) {
    if (count > rules.maxPerCategory) errors.push({ code: 'CATEGORY_LIMIT', message: `Направление «${data.categories.find(item => item.id === category)?.name ?? category}»: максимум ${rules.maxPerCategory} меры.` });
  }
  const budget = budgetOf(data, decisions);
  if (budget.remaining < 0) errors.push({ code: 'BUDGET_EXCEEDED', message: `Не хватает ${-budget.remaining} ед. бюджета. Лимит — ${budget.limit}.` });
  for (const conflict of rules.incompatibilities ?? []) {
    const items = conflict.initiatives.map(id => decisions.find(decision => decision?.initiativeId === id));
    if (items.every(Boolean) && (conflict.scope === 'global' || items.every(item => item.districtId === items[0].districtId))) errors.push({ code: 'INCOMPATIBLE', message: conflict.message });
  }
  return errors;
}

export function applyChange(data, current, change) {
  let next = current.map(decision => ({ ...decision }));
  if (change.type === 'reset') next = [];
  else if (change.type === 'load') next = change.decisions.map(decision => ({ ...decision }));
  else if (change.type === 'remove') next.splice(change.index, 1);
  else if (change.type === 'save') {
    const item = data.initiatives.find(initiative => initiative.id === change.decision.initiativeId);
    const decision = { initiativeId: change.decision.initiativeId };
    if (item?.scope === 'district') decision.districtId = change.decision.districtId;
    if (change.index == null) next.push(decision);
    else next.splice(change.index, 1, decision);
  } else return { ok: false, decisions: current, errors: [{ code: 'UNKNOWN_ACTION', message: 'Неизвестное действие.' }] };
  const errors = validateDecisions(data, next);
  return errors.length ? { ok: false, decisions: current, errors } : { ok: true, decisions: next, errors: [] };
}

export const referenceDecisions = [
  { initiativeId: 'M7', districtId: 'nura' },
  { initiativeId: 'M8', districtId: 'nura' },
  { initiativeId: 'M10', districtId: 'nura' },
  { initiativeId: 'M12' },
  { initiativeId: 'M5', districtId: 'saryarka' },
];

export function isCurrentResponse(response, version) {
  return response?.scenarioVersion === version;
}
