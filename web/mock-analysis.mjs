// Explicit demonstration adapter. Never presented as an actual OpenAI response.
export async function mockAnalysis(simulation) {
  const weakest = simulation.result.districts.find(district => district.id === simulation.result.weakestDistrictId);
  return {
    scenarioVersion: simulation.scenarioVersion,
    summary: `Демонстрационный разбор: модель оценила сценарий в ${simulation.result.score.toFixed(2)} балла. Это шаблон на основе расчёта, без запроса к AI.`,
    strengths: [`Выбрано ${simulation.decisions.length} мер в пределах бюджета: ${simulation.budget.spent} из ${simulation.budget.limit} ед.`],
    risks: [`Показателей ниже порога: ${simulation.result.criticalCount}. Их необходимо учитывать при дальнейшем планировании.`],
    tradeoffs: [`Слабейший район — ${weakest?.name ?? 'не определён'}. Его балл влияет на 30% взвешенной части индекса; каждый критический показатель дополнительно снижает результат.`],
    recommendations: ['Сравните текущий план с другим допустимым набором мер, обращая внимание на слабейший район и показатели ниже 40.'],
  };
}
