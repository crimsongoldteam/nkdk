# AJV standalone для validation worker-ов

## Контекст

В worktree `/Users/nikita/git/nkdk/.worktrees/ajv-standalone-validation-workers` уже был реализован подход, где проектные JSON Schema для validation worker-ов компилируются в AJV standalone при сборке `@nakidka/core`.

Текущий `develop` уже содержит свежие изменения вокруг persistent validation pool и профилирования worker-ов, поэтому перенос нужно делать не механическим merge, а аккуратной адаптацией старого решения к текущему `projectValidationWorker` и `projectValidationPasses`.

## Цель

Перевести схемы validation worker-ов в standalone-режим: компилировать их при сборке `@nakidka/core` и подключать worker-ы к готовым AJV-функциям.

Критерии успеха:

- worker-ы не компилируют проектные JSON Schema через `new Ajv()` в runtime;
- worker-ы используют generated-модуль из `dist`;
- поддерживается только текущий продукционный context `version: "2.20"`, `defaultLanguage: "ru"`, `exportToYAML.toTyped: false`;
- для другого context worker падает с понятной ошибкой, без скрытого fallback на runtime-компиляцию;
- diagnostics совпадают с текущим runtime-путём;
- `pnpm test` проходит из корня.

## Границы

Входит:

- standalone-валидаторы только для project validation worker-ов;
- валидатор формы и валидаторы properties по всем `ValidationProjectSpec`;
- build-time generator внутри `@nakidka/core`;
- loader generated-модуля из `dist`;
- wrapper готовых AJV-функций под текущий интерфейс `ValidationSchemaValidator`;
- тесты loader-а, wrapper-а, build-output и worker-пути.

Не входит:

- публичный API для standalone-схем;
- standalone для всех вызовов `compileValidationSchema`;
- поддержка нескольких версий, языков или режимов `toTyped`;
- автоматический runtime fallback в worker-е;
- исправление unrelated validation diagnostics.

## Архитектура

Generated-схемы являются внутренним ресурсом worker-а. Главный процесс не передаёт функции между потоками и не должен знать детали generated-модуля.

`@nakidka/core build` собирает обычные entrypoint-ы и создаёт рядом с worker-ом файл `dist/projectValidationAjvStandalone.js`. В модуле хранится:

- формат модуля, например `project-validation-ajv-standalone-v1`;
- context, для которого собраны схемы;
- refs/schema context, нужный для диагностики;
- валидатор формы;
- карта валидаторов properties по `spec.dir`.

Worker при `init` загружает generated-модуль, проверяет формат и context, затем строит `ValidationSchemaCache` поверх готовых функций. Wrapper сохраняет текущий договор `Check/Errors/Schema/Context`: `Check` нужен для совместимости интерфейса, а основной диагностический путь берёт ошибки через `Errors`.

`compileValidationSchema` остаётся runtime-компилятором для тестов, не-worker путей и обычных локальных вызовов. Он не становится loader-ом standalone-модуля.

## Поток Сборки

1. `packages/core/scripts/build.mjs` собирает `index.js` и `projectValidationWorker.js`.
2. Build отдельно собирает generator standalone-схем.
3. Generator создаёт набор схем для стандартного context.
4. AJV standalone пишет ESM-модуль `dist/projectValidationAjvStandalone.js`.
5. Если генерация падает, build падает.

## Поток Worker-А

1. Worker получает `init` с context и rules snapshot.
2. Вместо runtime-компиляции схем worker загружает `projectValidationAjvStandalone.js`.
3. Loader проверяет формат модуля и соответствие context.
4. Loader создаёт cache с методами `form()` и `properties(spec)`.
5. Первый проход validation получает валидатор из cache и вызывает готовую AJV-функцию.
6. Невалидные YAML получают diagnostics из `validate.errors`, нормализованных в текущий формат.

Если generated-модуль отсутствует, имеет неподдерживаемый формат или не содержит валидатор для нужного `spec.dir`, worker должен завершить подготовку с понятной ошибкой.

## Диагностики И Ошибки

Пользовательский результат validation не должен измениться. Standalone wrapper должен возвращать ошибки, совместимые с текущим `typeboxErrorsToDiagnostics` и fast discriminated union diagnostics.

Если AJV standalone errors отличаются от текущего runtime-адаптера, правка делается в нормализации ошибок wrapper-а и покрывается тестом. Скрытый fallback на runtime-компиляцию не используется, потому что он маскирует потерю основной цели.

## Проверка

Минимальная проверка:

- focused-тест `createValidationSchemaFromAjvFunction` или аналогичного wrapper-а;
- тест loader-а на generated-like модуле;
- build-output тест, который проверяет наличие и импорт `dist/projectValidationAjvStandalone.js`;
- worker-тест, подтверждающий, что worker использует standalone cache;
- parity-проверка diagnostics на реальном YAML-проекте, если он доступен локально;
- `pnpm --filter @nakidka/core type-check`;
- `pnpm test` из корня перед закрытием задачи.

## Риски

- Generated JS может увеличить RSS; после переноса нужно сравнить память worker-ов с текущими замерами.
- Старый worktree может конфликтовать с текущим persistent validation pool, поэтому перенос должен идти по смысловым блокам.
- Поддержка только одного context должна быть явной ошибкой, иначе можно получить проверку не тем набором схем.
