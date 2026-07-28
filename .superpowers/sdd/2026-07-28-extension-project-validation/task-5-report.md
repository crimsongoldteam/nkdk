# Task 5: общий first pass и пригодность `cf`

## Изменения

- `ProjectValidationFirstPassResult` разделяет `schemaDiagnostics` и `contributedFacts`: чтение, syntax и зарегистрированный structural validator не дают вклад; JSON Schema error после extraction вклад сохраняет.
- Worker разрешает каждый descriptor в контексте его компонента, одним проходом формирует `fileResults` и группирует diagnostics/facts по `componentPath`.
- Pool по-прежнему делит общий смешанный список round-robin и сливает одноимённые component results; плоские diagnostics/schemaDiagnostics/fileResults оставлены только координатору.
- `evaluateProjectFirstPass` требует каталог `cf`, успешные вклады всех файлов `cf`, отсутствие schema errors и отдельный успешный `cf/Конфигурация.yaml`. При неготовой `cf` блокирует все `cfe`, публикует все first-pass diagnostics `cf` и только schema diagnostics расширений.
- `validateProject` использует общий список файлов `cf`/`cfe`, вычисляет readiness после first pass и сохраняет совместимость с прежним layout одного `cf`.
- Layered second pass и его деградация намеренно не добавлялись: это границы Task 6.

## TDD

RED:

- `projectFirstPassReadiness.test.ts`: suite завершался ошибкой `Cannot find module './projectFirstPassReadiness'`.
- `projectValidationPasses.test.ts`: три сценария падали на `undefined` для `contributedFacts`/`schemaDiagnostics`.
- Отдельный сценарий ошибки чтения показал утечку `external-file` diagnostic в `schemaDiagnostics`.

GREEN:

- Матрица readiness покрывает готовую `cf`, JSON Schema error, отсутствие вклада и отсутствие `cf`; отдельно проверено обязательное наличие `cf/Конфигурация.yaml`.
- First-pass тесты покрывают read/syntax/JSON Schema/registered-validator границы.
- Worker-boundary тест на смешанных `cf` + два `cfe` проверяет три независимых вклада и `yamlLifetime.parsed === 3`.
- Интеграционный тест `validateProject` проверяет, что main process не читает ни один из четырёх YAML смешанного проекта.

## Проверки

- `pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationPasses.test.ts` — 14/14 PASS после GREEN.
- `pnpm --filter @nkdk/core exec vitest run metadata/validation/projectFirstPassReadiness.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/validateProject.test.ts` — 77/77 PASS.
- `pnpm --filter @nkdk/core type-check` — PASS.
- `git diff --check` — PASS.
- Полный `pnpm test` не запускался по прямому указанию brief; он отложен до Task 8.

## Файлы

- Созданы `projectFirstPassReadiness.ts` и `projectFirstPassReadiness.test.ts`.
- Изменены first-pass договоры и реализация: `projectValidationPasses.ts`, `validationWorkerPoolTypes.ts`.
- Изменены worker/pool и их тесты: `preparedYamlProjectWorker.ts`, `preparedYamlProjectWorkerPool.ts`, `preparedYamlProjectWorker.test.ts`, `preparedYamlProject.test.ts`.
- Изменены координатор и интеграционные тесты: `validateProject.ts`, `validateProject.test.ts`.
- Фабрика resource context компонента опубликована в `projectComponents.ts`, чтобы common worker не разбирал конкретные виды компонентов.

## Самопроверка и риски

- Проверены мутации: отсутствие проверки root YAML, игнорирование schema error, публикация semantic cfe при блокировке, объединение вкладов разных компонентов и повторное чтение YAML ловятся добавленными тестами.
- Component-local snapshot formats и XML-фикстуры не менялись.
- Независимое ревью diff не выявило Critical/Important замечаний.
- Текущий second pass ещё использует прежнюю общую object table; корректные component layers и политика деградации будут подключены в Task 6.

## Fix round 1

Исправлено молчаливое исчезновение descriptor, который worker не смог классифицировать как `ValidationProjectFile`. Теперь для него сохраняются component-scoped `structure` diagnostic и `fileResult` с абсолютным `filePath`, исходным `rootProjectPath`, `contributedFacts: false` и пустыми `schemaDiagnostics`; readiness из-за такого корневого файла остаётся `false`.

Covering test:

- `packages/core/metadata/project/preparedYamlProjectWorker.test.ts` выполняет настоящий worker first pass с неклассифицируемым descriptor и проверяет failed `fileResult`, несхемную диагностику и заблокированное расширение через `evaluateProjectFirstPass`.

RED:

- `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts` — FAIL: ожидался один failed `fileResult`, получен пустой массив; 1 failed, 4 passed.

GREEN:

- `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts` — PASS, 5/5.
- `pnpm --filter @nkdk/core exec vitest run metadata/validation/projectFirstPassReadiness.test.ts metadata/project/preparedYamlProjectWorker.test.ts metadata/validation/projectValidationPasses.test.ts metadata/validation/validateProject.test.ts` — PASS, 78/78.
- `pnpm --filter @nkdk/core type-check` — PASS.
- `git diff --check` — PASS.
- Независимое ревью fix diff — Critical/Important замечаний нет.
