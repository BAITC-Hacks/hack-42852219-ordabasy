# Контракт для разработчика AI

Серверный расчёт готовится `SimulationService.analysis_context(ScenarioRequest)`.
Метод самостоятельно проверяет ID и районы, загружает цены/эффекты из серверного
каталога и вызывает единственный расчётный движок. Полученное значение является
контекстом AI. Принимать бюджет, показатели или готовый Score от браузера нельзя.

## Вход публичного обработчика

**POST /api/analysis** реализован в `app/modules/simulations/public_router.py`
и использует `app/modules/analysis/` (system prompt, вызов OpenAI Structured
Outputs, проверка чисел, повтор один раз). При `APP_ANALYSIS_MODE != "remote"`
или пустом `OPENAI_API_KEY` маршрут отвечает 404: UI показывает недоступность
AI и позволяет повторить запрос, а результаты расчёта остаются доступны.

Тело такое же, как у `/api/simulate`: `scenarioVersion` (строка) и `decisions`
(массив объектов `initiativeId`, `districtId`). Городская мера получает null или
не имеет districtId. Тип запроса — `ScenarioRequest`; неизвестные поля запрещены.
Эталон: [reference-scenario.json](../examples/reference-scenario.json).

Для интеграции используйте `get_simulation_service` как FastAPI dependency, затем
`service.analysis_context(request)`. Это серверный вызов, второй HTTP-запрос к
собственному API не нужен. Валидация возвращает стандартную ошибку 422 с русскими
сообщениями и машинными кодами.

## Контекст модели

- `scenarioVersion`, `datasetVersion` — версии сценария и правил.
- `decisions` — выбранные мероприятия и целевые районы.
- `budget` — limit, spent, remaining.
- `baseline`, `result` — Score, среднее по населению, минимум, критические значения,
  показатели и баллы каждого района.
- `scoreChange` — разница без промежуточного округления.
- `scoreBreakdown.before/after` — averageScore, minimumScore, criticalCount,
  weightedAverage, weightedMinimum, penalty.
- `effects` — полные и реализованные эффекты, коэффициенты лагов и целевые районы.
- `synergies` — фиксированные бонусы и районы их применения.

Готовый контекст эталонного примера сохранён в `examples/reference-analysis.json`.
Он должен совпадать с результатом расчёта сценария. Эталонный Score: 56.54307,
база: 52.55768, стоимость: 95, остаток: 5, критических показателей после мер: 0.

## Выход

Общая Pydantic-схема `AnalysisResponse` находится в
`app/modules/simulations/schemas.py`. Поля:

| Поле | Тип |
| --- | --- |
| scenarioVersion | string, та же версия, что во входе |
| summary | string |
| strengths | string[] |
| risks | string[] |
| tradeoffs | string[] |
| recommendations | string[] |

AI объясняет предоставленные факты. Не изменяет Score, цены, эффекты, каталог и
правила. Численные рекомендации должны подтверждаться движком. Из-за минимума,
штрафов, клиппинга и синергий вклады отдельных мер в итоговый Score неаддитивны.
Для предлагаемых наборов сначала выполните тот же валидатор/расчёт. Применение
альтернативы всегда является явным действием пользователя.

UI отправляет новый scenarioVersion после изменения выбора и игнорирует старые
ответы. AI-ошибка не должна скрывать расчёт; таймаут/ошибку API сообщайте отдельным
статусом. Повтор запроса должен оставаться возможным.

## Окружение и границы ответственности

`OPENAI_API_KEY` передаётся контейнеру во время запуска. Не добавляйте его в JS,
`APP_PUBLIC_API_BASE_URL`, ответы `/api/config`, образ или логи. Расчётный API
запускается без ключа. Запрос к OpenAI делается через stdlib `urllib` (без SDK),
Chat Completions с `response_format: json_schema` (strict), модель — `APP_OPENAI_MODEL`
(по умолчанию `gpt-4o-mini`).

`APP_ANALYSIS_MODE=remote` — обычный режим, вызывает OpenAI.
`mock` — явно обозначенный демонстрационный frontend-адаптер, без LLM-запросов.
`disabled` — анализ отключён, расчёт доступен.

Существующий `app/modules/ai_analysis/` сохранён без изменений. Его старый маршрут
`/api/v1/ai-analysis` использует несовместимые initiative_ids и возвращает
контролируемую ошибку миграции `legacy_request` — он не связан с новым
`/api/analysis` и прежнюю формулу восстанавливать не нужно.
