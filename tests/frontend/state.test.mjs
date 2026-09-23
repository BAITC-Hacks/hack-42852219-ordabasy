import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChange, validateDecisions, budgetOf, isCurrentResponse } from '../../web/state.mjs';

const data = {
  categories: [{ id: 'transport', name: 'Транспорт' }, { id: 'social', name: 'Социальная инфраструктура' }, { id: 'ecology', name: 'Экология' }],
  districts: [{ id: 'nura' }, { id: 'esil' }],
  initiatives: [
    { id: 'M1', category: 'transport', scope: 'district', cost: 30 },
    { id: 'M2', category: 'transport', scope: 'city', cost: 20 },
    { id: 'M3', category: 'transport', scope: 'district', cost: 10 },
    { id: 'M4', category: 'ecology', scope: 'district', cost: 25 },
    { id: 'M5', category: 'ecology', scope: 'district', cost: 10 },
    { id: 'M7', category: 'social', scope: 'district', cost: 35 },
    { id: 'M8', category: 'social', scope: 'district', cost: 15 },
  ],
  rules: { budget: 100, decisionCount: 5, maxPerCategory: 2, incompatibilities: [
    { initiatives: ['M1', 'M3'], scope: 'global', message: 'Глобальный конфликт' },
    { initiatives: ['M4', 'M7'], scope: 'sameDistrict', message: 'Конфликт в районе' },
  ] },
};
const districtDecision = (initiativeId, districtId = 'nura') => ({ initiativeId, districtId });

test('invalid replacement preserves original plan and computed budget', () => {
  const current = [districtDecision('M1'), { initiativeId: 'M2' }, districtDecision('M7')];
  const changed = applyChange(data, current, { type: 'save', index: 1, decision: districtDecision('M3', 'esil') });
  assert.equal(changed.ok, false);
  assert.strictEqual(changed.decisions, current);
  assert.equal(budgetOf(data, current).spent, 85);
  assert.ok(changed.errors.some(error => error.code === 'INCOMPATIBLE'));
});

test('same-district conflict can be resolved by moving a project to another district', () => {
  const current = [districtDecision('M4'), districtDecision('M7', 'esil')];
  assert.deepEqual(validateDecisions(data, current), []);
  const changed = applyChange(data, current, { type: 'save', index: 1, decision: districtDecision('M7') });
  assert.equal(changed.ok, false);
  assert.deepEqual(changed.decisions, current);
});

test('city replacement discards district and recovers budget', () => {
  const current = [districtDecision('M7')];
  const changed = applyChange(data, current, { type: 'save', index: 0, decision: districtDecision('M2') });
  assert.equal(changed.ok, true);
  assert.deepEqual(changed.decisions, [{ initiativeId: 'M2' }]);
  assert.deepEqual(budgetOf(data, changed.decisions), { limit: 100, spent: 20, remaining: 80 });
});

test('exactly 100 is allowed, overspending and incomplete submission are rejected', () => {
  const current = [districtDecision('M1'), { initiativeId: 'M2' }, districtDecision('M4'), districtDecision('M5'), districtDecision('M8')];
  assert.equal(budgetOf(data, current).spent, 100);
  assert.deepEqual(validateDecisions(data, current, { complete: true }), []);
  const over = current.map(item => ({ ...item }));
  over[4] = districtDecision('M7', 'esil');
  assert.ok(validateDecisions(data, over).some(error => error.code === 'BUDGET_EXCEEDED'));
  assert.deepEqual(validateDecisions(data, [], { complete: false }), []);
  assert.ok(validateDecisions(data, [], { complete: true }).some(error => error.code === 'DECISION_COUNT'));
});

test('duplicate, third category measure, sixth measure, and invalid targets are rejected', () => {
  assert.ok(validateDecisions(data, [districtDecision('M1'), districtDecision('M1', 'esil')]).some(error => error.code === 'DUPLICATE_INITIATIVE'));
  assert.ok(validateDecisions(data, [districtDecision('M1'), { initiativeId: 'M2' }, districtDecision('M3')]).some(error => error.code === 'CATEGORY_LIMIT'));
  assert.ok(validateDecisions(data, Array.from({ length: 6 }, () => ({ initiativeId: 'M2' }))).some(error => error.code === 'DECISION_COUNT'));
  assert.ok(validateDecisions(data, [{ initiativeId: 'M1' }]).some(error => error.code === 'INVALID_DISTRICT'));
  assert.ok(validateDecisions(data, [districtDecision('M2')]).some(error => error.code === 'CITY_TARGET'));
});

test('remove and add restore the original costs without accumulated budget drift', () => {
  const current = [districtDecision('M1'), { initiativeId: 'M2' }];
  const removed = applyChange(data, current, { type: 'remove', index: 1 });
  assert.equal(budgetOf(data, removed.decisions).remaining, 70);
  const restored = applyChange(data, removed.decisions, { type: 'save', decision: { initiativeId: 'M2' } });
  assert.deepEqual(restored.decisions, current);
  assert.equal(budgetOf(data, restored.decisions).remaining, 50);
});

test('stale AI or simulation response cannot match the new scenario version', () => {
  assert.equal(isCurrentResponse({ scenarioVersion: 'session:1' }, 'session:2'), false);
  assert.equal(isCurrentResponse({ scenarioVersion: 'session:2' }, 'session:2'), true);
  assert.equal(isCurrentResponse({}, 'session:2'), false);
});

test('malformed saved entries are rejected without crashing the validator', () => {
  assert.ok(validateDecisions(data, [null]).some(error => error.code === 'UNKNOWN_INITIATIVE'));
  assert.ok(validateDecisions(data, [{}]).some(error => error.code === 'UNKNOWN_INITIATIVE'));
  assert.ok(validateDecisions(data, null).some(error => error.code === 'INVALID_DECISIONS'));
});
