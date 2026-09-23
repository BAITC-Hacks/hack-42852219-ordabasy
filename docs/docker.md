# Docker: запуск и проверка

Команды выполняются из корня `hack-42852219-ordabasy`. Нужны Docker Engine/Desktop
и Docker Compose v2+. Единственный рабочий сервис — существующий FastAPI backend,
который также отдаёт `web/`. База данных, Redis, отдельный frontend-сервис и тома
не требуются.

## Быстрый запуск

```sh
docker compose up --build -d --wait backend
```

Приложение: <http://localhost:8000/>, документация API: <http://localhost:8000/docs>,
проверка работоспособности: <http://localhost:8000/api/health>.

Сервер слушает `0.0.0.0:8000` внутри контейнера. По умолчанию Compose публикует
`127.0.0.1:8000` на компьютере. Если порт занят:

```sh
APP_PORT=8001 docker compose up --build -d --wait backend
```

Тогда браузер открывает <http://localhost:8001/>. Чтобы явно разрешить доступ
другим устройствам в локальной сети, задайте `APP_HOST=0.0.0.0` и используйте IP
компьютера с опубликованным портом.

Логи и остановка без удаления контейнеров или томов:

```sh
docker compose logs --tail=100 backend
docker compose stop backend
```

## Настройки и секреты

Файл `.env` необязателен: значения по умолчанию позволяют запуск без OpenAI.
При необходимости скопируйте `.env.example` в `.env`, не перезаписывая уже
существующий файл, и настройте значения. Compose считывает `.env` для подстановки
и передаёт backend только явно перечисленные переменные.

| Переменная | Значение по умолчанию | Назначение |
|---|---|---|
| `APP_APP_NAME` | `AstanaInnovation` | Название API |
| `APP_ENV` | `development` | Окружение |
| `APP_DEBUG` | `false` | Режим отладки |
| `APP_API_V1_PREFIX` | `/api/v1` | Префикс существующих legacy-маршрутов |
| `APP_PUBLIC_API_BASE_URL` | `/api` | Адрес API, доступный браузеру |
| `APP_CORS_ORIGINS` | JSON-массив localhost/127.0.0.1 с портами 3000 и 5173 | Разрешённые источники отдельного frontend |
| `APP_ANALYSIS_MODE` | `remote` | `remote`, демонстрационный `mock` или `disabled` |
| `APP_OPENAI_MODEL` | `gpt-4o-mini` | Модель OpenAI для `POST /api/analysis` |
| `APP_HOST` | `127.0.0.1` | Интерфейс публикации порта на компьютере |
| `APP_PORT` | `8000` | Опубликованный порт на компьютере |
| `OPENAI_API_KEY` | пустая строка | Ключ для `POST /api/analysis` (режим `remote`) |

Бюджет 100 и число решений 5 — фиксированные правила датасета, не параметры
окружения. `OPENAI_API_KEY` не требуется для расчёта и не используется во время
сборки. Без ключа или при `APP_ANALYSIS_MODE` не `remote` маршрут
`POST /api/analysis` отвечает 404, а расчёт остаётся полностью доступен. `.env`, вложенные `.env.*`, ключи и сертификаты исключены из Docker
build context; runtime-образ копирует только зависимости, `app/` и `web/`.
Реальные `.env` исключены из Git. Не публикуйте вывод `docker compose config`
без `--quiet`, если в окружении настроен ключ: Compose может раскрыть его
подставленное значение.

## Адреса frontend и backend

При запуске из Compose frontend и API имеют один origin. Браузер запрашивает
`/api/config`, затем использует `APP_PUBLIC_API_BASE_URL=/api`. Дополнительный
proxy и CORS для этого варианта не нужны.

Если frontend запущен отдельно, его API URL должен быть доступен браузеру,
например `http://localhost:8000/api`, а его origin должен присутствовать в
`APP_CORS_ORIGINS`. Как передать URL отдельно размещённому frontend, описано в
основном README. `http://backend:8000` — имя сервиса внутри Docker-сети; оно
подходит другим контейнерам, но не браузеру пользователя.

`APP_ANALYSIS_MODE=remote` использует контракт `POST /api/analysis`, который
реализует напарник. До его подключения недоступность AI не блокирует Score.
`mock` предназначен только для явно помеченного демонстрационного объяснения.

## Воспроизводимость и тесты

Базовый Python 3.12 образ закреплён digest; прямые и транзитивные зависимости
закреплены точными версиями в `requirements.txt` и `requirements-dev.txt`.
Версии разрешены для Python 3.12/Linux. `pyproject.toml` описывает допустимые
диапазоны зависимостей; Docker устанавливает зафиксированные версии. При
обновлении зависимостей обновляйте оба requirements-файла согласованно и
запускайте весь набор тестов. Приложение работает от непривилегированного
пользователя `app` (UID 10001).

```sh
docker compose config --quiet
docker compose --profile test run --build --rm tests
```

Тестовый образ добавляет pytest/httpx к runtime; production-образ тестовые
зависимости не содержит. Команда `run --rm tests` удаляет только созданный ей
одноразовый тестовый контейнер. Рабочий backend и его состояние не затрагиваются.

Проверка HTTP после запуска:

```sh
curl --fail http://localhost:8000/api/health
curl --fail http://localhost:8000/api/bootstrap
curl --fail http://localhost:8000/api/config
```

Эталонный JSON-запрос и ожидаемый Score приведены в основном README. Проверка
health не зависит от OpenAI и контролирует доступность серверного приложения.
Статус контейнера:

```sh
docker compose ps
```

Для установки тех же зависимостей локально:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest
```
