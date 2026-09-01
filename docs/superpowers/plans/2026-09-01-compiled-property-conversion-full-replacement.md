# Полная замена преобразований свойств: план реализации

> **Для исполнителя:** обязателен навык `executing-plans-with-review`; выполнять задачи последовательно, после каждого слоя делать отдельный коммит и проверку дублирования.

**Цель:** ускорить оба направления преобразования свойств, полностью заменив для выбранных типов цепочки `fromXML → toYAML` и `fromYAML → toXML` одним прямым преобразователем, а также не обходить отсутствующие YAML-свойства, если правило гарантированно не может породить XML.

**Архитектура:** при сборке metadata runtime один раз компилируется план свойства. План хранит готовые операции обоих направлений и консервативную стратегию отсутствующего YAML-ключа: `skip`, `default` или `evaluate`. Для типа с прямым преобразователем старые PropertyRule-обработчики этого преобразования не регистрируются и не используются как резервный путь. Контрольное YAML → XML преобразование строит результат только из YAML, правил и индексов; исходный XML участвует лишь в последующем сравнении.

**Технологии:** TypeScript, Vitest, pnpm, существующий metadata rule runtime, import-profile, round-trip-yaml.

**Спецификация:** `docs/superpowers/specs/2026-09-01-compiled-property-conversion-plan-design.md`

**Исторический план Tasks 1–5:** `docs/superpowers/plans/2026-09-01-compiled-property-conversion-plan.md`. Его коммиты уже находятся в ветке; этот документ заменяет его оставшуюся часть, если формулировки расходятся со спецификацией.

**База сравнения:** `be4708d9438dfb1d5955900c881923938e7c016a`.

**Ограничения:**

- не менять XML-фикстуры;
- не добавлять поля в общие типы `PropertyRule`;
- не добавлять `!xml`;
- не запускать ERP;
- производительность и round-trip проверять на `/Users/nikita/git/round-trip-compact/cf/doc`;
- ключ, присутствующий в YAML со значением `undefined`, не считать отсутствующим;
- неизвестное или сложное правило всегда исполнять, а не пропускать;
- не сравнивать новый код со старыми функциями в unit-тестах: ожидаемый результат задавать явно или брать из неизменяемых фикстур.

## Задача 1. Скомпилировать стратегию отсутствующего YAML-ключа

**Файлы:**

- изменить `packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`;
- при необходимости изменить `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXMLTypes.ts`;
- изменить тесты в `packages/rules/metadata/ruleRuntime/property/compiledPropertyPlan.test.ts`;
- изменить тесты в `packages/rules/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`.

### Шаг 1. Написать падающие тесты матрицы отсутствия

Покрыть следующие случаи:

1. ключ отсутствует, XML-default и вычислений нет — стратегия `skip`, обработчик не вызывается;
2. ключ отсутствует, задан `defaultValueXML: false` — XML получает `false`;
3. ключ отсутствует, заданы `implicitValueYAML: true` и `implicitValueXML: false` — правило исполняется и XML получает ожидаемое значение;
4. правило с `evaluateWhenYAMLMissing` исполняется;
5. ключ присутствует как `{ Включено: undefined }` — это не `skip`;
6. неизвестное или составное правило получает `evaluate`.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/ruleRuntime/property/compiledPropertyPlan.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts
```

Ожидается падение новых тестов.

### Шаг 2. Добавить внутреннюю стратегию плана

Ввести внутренний, не экспортируемый в `PropertyRule` договор:

```ts
type MissingYAMLStrategy = 'skip' | 'default' | 'evaluate'
```

Компилятор выбирает:

- `skip` только когда отсутствие ключа доказанно не может создать или изменить XML;
- `default` только для полностью статического XML-default, который не требует контекста;
- `evaluate` для функций, `evaluateWhenYAMLMissing`, implicit/default-вариантов с вычислениями, вложенных правил, `exportNilValue`, условий исключения и любого неоднозначного случая.

Стратегия вычисляется один раз при компиляции плана, а не на каждом объекте.

### Шаг 3. Применить стратегию до дорогой обработки

В `fromYAMLToXML` сначала вычислить `source.has(nameYAML)`. Если ключ отсутствует и стратегия `skip`, немедленно перейти к следующему свойству до поиска совпадающих выходов, вычисления default и вызова преобразователя. Присутствующий `undefined` проходит обычную семантику правила.

### Шаг 4. Проверить слой и зафиксировать

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/ruleRuntime/property/compiledPropertyPlan.test.ts metadata/ruleRuntime/property/fromYAMLToXML.test.ts
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
```

Коммит: `perf: :zap: пропускать безопасные отсутствующие свойства`.

## Задача 2. Завершить общий договор прямого преобразователя

**Файлы:**

- изменить `packages/runtime/metadata/ruleRuntime/property/atomicConversion.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/compiledPropertyPlan.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`;
- изменить `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`;
- изменить `packages/runtime/rule-kit.ts`;
- изменить профиль в `.agents/skills/import-profile/import-profile.mjs` и его тест.

### Шаг 1. Зафиксировать договор тестами

Добавить тесты, доказывающие:

- прямой преобразователь возвращает семантическое значение и готовое представление целевого формата за один вызов;
- план хранит уже найденный преобразователь и не ищет его в реестре на каждом объекте;
- для типа с прямым преобразователем старые операции `importFromXML`, `exportToYAML`, `importFromYAML`, `exportToXML` не составляют путь выполнения;
- общий оркестратор сначала решает отсутствие/default, затем передаёт преобразователю итоговое входное значение;
- составной metadata-код может вызвать тот же скомпилированный прямой преобразователь через нейтральный помощник, не возвращаясь к старой цепочке.

### Шаг 2. Реализовать единый договор

Оставить решение default/implicit/отсутствия в общем оркестраторе. Прямой преобразователь отвечает только за преобразование уже выбранного значения и возвращает пару:

```ts
interface AtomicConversionResult<TSemantic, TRepresentation> {
  semanticValue: TSemantic
  representation: TRepresentation
}
```

Если для типа зарегистрирован прямой преобразователь, компилятор плана не добавляет старые функции этого направления. Если прямого преобразователя у типа нет, тип продолжает использовать существующий договор — это не резервный путь для уже переведённого типа.

### Шаг 3. Сохранить профиль только по запросу

Под `NKDK_PROFILE` считать вызовы прямых преобразователей и пропуски отсутствующих свойств по типам. Без переменной профиля не выполнять подсчёты и не создавать дополнительные объекты на горячем пути.

### Шаг 4. Проверить и зафиксировать

```bash
pnpm --filter @nkdk/runtime test:isolated
pnpm --filter @nkdk/rules exec vitest run metadata/ruleRuntime
node --test .agents/skills/import-profile/import-profile.test.mjs
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
```

Коммит: `perf: :zap: завершить договор прямых преобразователей`.

## Задача 3. Полностью заменить Boolean в обоих направлениях

**Файлы:**

- изменить `packages/rules/metadata/commonObjects/boolean/atomicConversion.ts` и тест;
- изменить `packages/rules/metadata/composition/staticPropertyRules.ts`;
- изменить `packages/rules/metadata/composition/metadataRules.test.ts`;
- изменить `packages/rules/metadata/configurationExtension/propertyStates.ts` и тест;
- изменить тесты runtime преобразования свойств.

### Шаг 1. Написать полный набор ожидаемых результатов

Проверить без вызова старых функций:

- XML `true`, `false` и объект с `#text` переходят в semantic boolean и YAML `Истина`/`Ложь`;
- YAML `Истина`, `Ложь`, `true`, `false` переходят в semantic boolean и XML boolean;
- отсутствующий ключ без default пропускается;
- отсутствующий ключ с `defaultValueXML: false` создаёт `false`;
- implicit/default-сочетание не теряет значение;
- присутствующий `undefined` сохраняет прежнюю семантику;
- состояния расширения конфигурации сохраняют ожидаемые `{ Включено: undefined }`, `Истина`/`Ложь` и пустой placeholder там, где этого требует правило.

### Шаг 2. Удалить старую цепочку Boolean из состава PropertyRule

Не регистрировать для Boolean старые преобразовательные операции. Чистые функции могут остаться для составного кода, только если не участвуют в PropertyRule-оркестраторе; `propertyStates` должен использовать общий прямой помощник.

### Шаг 3. Запустить корректность и четырёхкратный профиль doc

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/commonObjects/boolean metadata/configurationExtension/propertyStates.test.ts metadata/ruleRuntime/property
pnpm --filter @nkdk/rules test:isolated
node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-boolean-profile --runs 4 --json
```

Сохранить медиану общего времени и времена Boolean в обоих направлениях. Если корректность нарушена, слой не завершён. Замедление исследовать по профилю, а не возвращать старый Boolean-путь.

### Шаг 4. Проверить дублирование и зафиксировать

```bash
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
```

Коммит: `perf: :zap: полностью заменить boolean-преобразование`.

## Задача 4. По очереди оценить SystemEnumeration, string и number

Для каждого кандидата выполнить одинаковый цикл: падающие тесты → прямой преобразователь обоих направлений → удаление старых PropertyRule-регистраций этого типа → целевые тесты → профиль `doc` → отдельный коммит.

Если кандидат не даёт измеримой пользы или требует нарушения архитектурных границ, удалить его прямой преобразователь целиком. Нельзя оставлять одновременно новый и старый путь одного типа.

### SystemEnumeration

**Файлы:** `packages/rules/metadata/commonObjects/systemEnumerations/*`, `packages/rules/metadata/composition/staticPropertyRules.ts`, интеграционные round-trip-тесты.

Один раз подготовить таблицы значений и XML-псевдонимы при сборке runtime. Покрыть обычные значения, псевдонимы, ошибку неизвестного значения, default и отсутствующий ключ.

Коммит при сохранении кандидата: `perf: :zap: заменить преобразование системных перечислений`.

### string

**Файлы:** реализация string-правила, статическая композиция, runtime-тесты.

Покрыть scalar, `#text`, пространство имён, default, отсутствующий ключ и присутствующий `undefined`. Составные metadata-правила должны использовать общую семантику оркестратора, а не старый резервный обработчик.

Коммит при сохранении кандидата: `perf: :zap: заменить строковое преобразование`.

### number

**Файлы:** реализация number-правила, статическая композиция, runtime-тесты.

Покрыть number, числовую строку, `#text`, typed XML, `xs:string`, default, отсутствующий ключ и присутствующий `undefined`. Регистрации configuration index и схемы не относятся к цепочке преобразования и сохраняются.

Коммит при сохранении кандидата: `perf: :zap: заменить числовое преобразование`.

После каждого кандидата:

```bash
pnpm --filter @nkdk/rules test:isolated
node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip-compact/cf/doc /private/tmp/nkdk-atomic-profile --runs 4 --json
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
```

## Задача 5. Проверить контрольное преобразование и round-trip doc

**Файлы:**

- проверить `packages/rules/metadata/importFromXml/controlExport.ts`;
- проверить `packages/rules/metadata/importFromXml/prepareYaml.ts`;
- проверить `packages/rules/metadata/importFromXml/worker.ts`;
- при необходимости изменить их интеграционные тесты.

### Шаг 1. Доказать источник контрольного XML

Интеграционный тест должен подтвердить: известные свойства контрольного XML строятся из созданного YAML, правил и индексов. Исходный XML передаётся только функции сравнения и не восстанавливает отсутствующие значения.

### Шаг 2. Исправить совместимость с новой методикой MCP

Проверить, что round-trip запускает актуальный MCP runtime ветки, корректно завершает/перезапускает соединение между прогонами и не использует устаревший сервер. Причину `Connection closed`, если она воспроизводится, установить тестом или диагностическим журналом до изменения кода.

### Шаг 3. Запустить doc

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc ./.agents/skills/round-trip-yaml/round-trip.sh
```

Ожидается завершённый XML → YAML → XML прогон без ошибок и необъяснённых расхождений. ERP не запускать.

## Задача 6. Полная проверка и независимое ревью

### Шаг 1. Проверить проект

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base be4708d9438dfb1d5955900c881923938e7c016a
pnpm test:architecture:rules
pnpm test:architecture
git status --short
```

Все команды должны завершиться успешно; незакоммиченные изменения должны быть объяснены и затем зафиксированы отдельным Conventional Commit.

### Шаг 2. Передать независимому рецензенту весь результат

Рецензент получает:

- спецификацию;
- этот план;
- базу `be4708d9438dfb1d5955900c881923938e7c016a`;
- полный diff базы с `HEAD`, staged/unstaged diff и список untracked;
- явные договоры: полная замена пути для зарегистрированного типа, консервативный `skip/default/evaluate`, различение missing и present `undefined`, отсутствие использования исходного XML при контрольном преобразовании, отсутствие ERP-прогона.

Рецензент проверяет соответствие, корректность, тесты, производительность и архитектурные границы. Существенные замечания исправить и повторно проверить; при спорном замечании остановиться и передать пользователю факты и варианты.

### Шаг 3. Повторить финальную проверку на неизменившемся дереве

После одобрения рецензента повторить затронутые тесты и `git status --short`. Только после этого сообщать о завершении.
