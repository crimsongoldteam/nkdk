# Task 6: layered second pass и безопасная деградация

## Изменения

- `SecondPassPoolParams` принимает `ProjectValidationGraph` и
  `blockedComponentPaths`; прежний общий `ValidationObjectTableSnapshot` из
  second pass удалён.
- Pool один раз создаёт `SharedProjectValidationGraph`, распределяет пары
  `{ componentPath, reference }` между активными worker и перед отправкой
  группирует их как `{ componentPath, references }`.
- Worker кеширует owner/reference view для каждого `componentPath`. Расширение
  видит собственный слой, затем `cf`, но не видит соседние расширения; для
  DataPath и metadata references действует одинаковая политика.
- Заблокированные расширения полностью пропускают semantic second pass:
  отбрасываются их pending references и component-scoped worker states.
- Координатор сохраняет syntax и JSON Schema diagnostics, добавляет ровно одну
  блокирующую cross-file диагностику на расширение и отдельную structure
  диагностику при отсутствии `cf`.
- Все публичные пути диагностик нормализуются относительно корня проекта в
  виде `cf/...` или `cfe/<Имя>/...`; выход за `projectDir` считается нарушением
  внутреннего договора и приводит к ошибке.
- Из профиля удалено устаревшее фиктивное измерение
  `objectTableSnapshot=0`, так как object table больше не создаётся.

## TDD: RED / GREEN

### Component-scoped references

- RED: ссылка из `cfe/Склад` ошибочно разрешалась через локальный объект
  `cfe/Продажи`.
- GREEN: два интеграционных сценария подтвердили изоляцию sibling-расширений и
  отсутствие конфликта при одноимённых объектах в `cf` и текущем `cfe`.

### Component-scoped DataPath

- До принятия RED исправлена некорректная тестовая форма: owner задан через
  `Тип: СправочникОбъект.Общий`, чтобы тест доходил до DataPath resolver.
- RED: общий owner cache позволял слою `cfe/Склад` перекрыть `cf` для формы
  `cfe/Продажи`.
- GREEN: форма расширения видит owner из `cf`; локальный owner имеет приоритет
  только внутри своего расширения и невидим sibling-компоненту.

### Деградация

- RED: четыре блокирующих сценария не создавали blocking/missing-cf
  diagnostics; два контрольных сценария уже сохраняли независимость second
  pass.
- GREEN: шесть сценариев покрывают syntax, JSON Schema и registered first-pass
  failure в `cf`, ошибку `cf` только во втором проходе, независимый сломанный
  `cfe/A` и отсутствующую `cf`.
- Точная блокирующая диагностика проверена целиком: путь, координата,
  severity, source и сообщение.

### Публичные пути

- RED: `validateProject` возвращал абсолютные пути вместо `cf/...` и
  `cfe/<Имя>/...`.
- GREEN: все ожидания `validateProject.test.ts` переведены на пути от корня;
  отдельный тест проверяет ошибку при пути за пределами `projectDir`.

## Проверки

- `pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts metadata/validation/projectMetadataReferences.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/sharedProjectReferenceIndex.test.ts metadata/validation/sharedValidationBinaryOwners.test.ts`
  — 5 файлов, 189 тестов passed.
- `pnpm --filter @nkdk/core type-check` — PASS.
- `git diff --check` — PASS.
- Полный `pnpm test` не запускался по прямому указанию brief; он отложен до
  завершающей задачи.

## Файлы

- `packages/core/metadata/validation/validationWorkerPoolTypes.ts`
- `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- `packages/core/metadata/validation/validateProject.ts`
- `packages/core/metadata/validation/validateProject.test.ts`

## Самопроверка и риски

- XML-фикстуры, rules.ts и component-local тип
  `PendingMetadataTargetReference` не изменялись.
- В общие metadata-слои не добавлены ветвления по `itemType`, прикладным
  объектам или каталогам конкретных metadata.
- Поведение проверяется настоящим `validateProject` и worker pool без mock
  owner/reference index; прямой вызов используется только для защитного
  договора нормализации пути.
- `cf` не входит в `blockedComponentPaths`: readiness блокирует только пути
  `cfe/<Имя>`, а ошибка `cf`, найденная во втором проходе, не блокирует
  расширения.
- Единственный оставшийся риск — полный набор пакетов не прогнан в этой задаче
  согласно ограничению brief.

## Fix round 1

Исправлена атрибуция затрат component-scoped views в worker profile.
Уникальные component paths теперь заранее вычисляются только из
незаблокированных worker states и назначенных worker reference layers, а
owner/reference views создаются внутри подэтапа
`Построение контекста worker`. `Проверка ссылок` и `Worker second pass` только
читают готовую Map; их `items` считают pending references и active states
соответственно. Неожиданная blocked reference layer безопасно отбрасывается,
а отсутствие заранее построенного active view завершается явной ошибкой.

Covering test использует настоящий worker, graph и shared indexes. Управляемый
доступ к reference buffer детерминированно сдвигает подменённые часы, поэтому
профиль показывает, в каком именно подэтапе был создан view; два blocked states
одновременно проверяют точность `items`.

RED:

- `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts`
  — 1 failed / 5 passed; `Построение контекста worker` вернул
  `items=3 time=0.00ms` вместо одного active view с ненулевым временем.

GREEN:

- `pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProjectWorker.test.ts`
  — 1 файл, 6 тестов passed.
- `pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts metadata/validation/projectMetadataReferences.test.ts metadata/validation/dataPath/resolver.test.ts metadata/validation/sharedProjectReferenceIndex.test.ts metadata/validation/sharedValidationBinaryOwners.test.ts`
  — 5 файлов, 189 тестов passed.
- `pnpm --filter @nkdk/core type-check` — PASS.
- `git diff --check` — PASS.
