# AstanaInnovation API

Минимальный backend для AI-симулятора управления Астаной. Проект построен как
modular monolith: каждый бизнес-модуль разделён на `router → service → repository`.
Районы и инициативы для MVP хранятся в локальных JSON-файлах.

> Показатели районов и эффекты инициатив являются демонстрационными данными MVP,
> а не официальной городской статистикой.

## Требования

- Python 3.12
- pip

## Установка и запуск

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Для Linux/macOS активация окружения и копирование настроек выглядят так:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e '.[dev]'
cp .env.example .env
uvicorn app.main:app --reload
```

После запуска:

- API: `http://127.0.0.1:8000/api/v1`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

CORS по умолчанию разрешён для `http://localhost:3000`.

## Endpoints

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/v1/districts` | Список районов и показателей |
| GET | `/api/v1/districts/{id}` | Один район |
| GET | `/api/v1/initiatives` | Доступные городские инициативы |
| POST | `/api/v1/simulations/validate` | Проверка выбора без ошибки HTTP |
| POST | `/api/v1/simulations/calculate` | Проверка и расчёт Score |
| POST | `/api/v1/ai-analysis` | Текстовый разбор результата |
| GET | `/api/v1/health` | Состояние API и файлов данных |

Пример корректного запроса:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/simulations/calculate \
  -H "Content-Type: application/json" \
  -d '{"initiative_ids":["district-clinics","safe-streets","startup-grants","school-air-monitoring","winter-mobility"]}'
```

## Правила и формула

- общий бюджет — 100 пунктов;
- нужно выбрать ровно 5 разных инициатив;
- несовместимые инициативы нельзя выбирать вместе;
- `/validate` возвращает `valid: false` и список причин;
- `/calculate` для некорректного выбора возвращает централизованную ошибку `422`.

Базовое значение каждого показателя — среднее по районам, взвешенное по
населению. Эффекты выбранных инициатив прибавляются к базе и ограничиваются
диапазоном 0–100. Итоговый Astana Quality of Life Score считается в
`SimulationService`:

```text
Score = mobility × 0.25
      + environment × 0.20
      + health × 0.20
      + safety × 0.20
      + economy × 0.15
```

Модуль `ai_analysis` только объясняет уже рассчитанный результат и не влияет на
Score. В MVP он работает локально и детерминированно, без внешнего LLM API.

## Настройки

Все переменные читаются из `.env` с префиксом `APP_`. Шаблон находится в
`.env.example`. Основные настройки: CORS origins, API prefix, бюджет и число
обязательных инициатив.

## Тесты

```bash
pytest
pytest --cov=app --cov-report=term-missing
```

Тесты проверяют каталог данных, формат ошибок, все правила симуляции,
детерминированность Score, AI-анализ и наличие обязательных путей в OpenAPI.
