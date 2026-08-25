# Осмысленное исключение и локализация известных XML-свойств — план реализации

> **Для исполнителя:** обязательно использовать `superpowers:executing-plans` и выполнять задачи последовательно. Для каждого изменения поведения соблюдать red → green по `superpowers:test-driven-development`. Субагенты во время реализации запрещены по решению разработчика; отдельный субагент подключается только после завершения реализации для итогового ревью.

**Цель:** убрать ложные `!xml/raw` для полностью стандартных реквизитов, локализовать реальные расхождения известных XML-only свойств и снова вычислять `RowFilter` для поддерживаемых источников таблицы.

**Архитектура:** общий `ruleRuntime` фиксирует два независимых факта: успешное осмысленное исключение пустого значения (`semanticallyElided`) и компактное владение XML-only поддеревом (`structurallyClaimed`). `anomalyProof` использует эти факты без знаний о формах и стандартных реквизитах. Специальная операция импорта управляемой формы передаёт в Rules те же адресные XML-узлы, audit и аннотации, что и общий путь. Экспорт локального `!xml/raw` разрешает логическое YAML-имя через существующий `PropertyRule`, а вычисляемый `RowFilter` создаётся обычным правилом таблицы.

**Технологии:** TypeScript, Vitest, pnpm, собственные XML/YAML runtime NKDK, LMDB, e2e round-trip.

**Спецификация:** `docs/superpowers/specs/2026-08-25-semantic-xml-elision-design.md`.

## Обязательные ограничения

- Работать только в worktree `codex/standard-attribute-default-equivalence`.
- Не менять существующие XML-фикстуры: они остаются источником истины.
- Не добавлять поля в `PropertyRule`, `BasePropertyRule` и параметры построителей правил.
- Не добавлять в нейтральные слои условия по `itemType`, `Form`, `RowFilter`, `StandardAttributeDescriptions` или конкретным XML-путям.
- Не менять `.agents/architecture.md`: согласованный дизайн не меняет направления зависимостей.
- После каждого завершённого слоя запускать `pnpm duplicates -- --base b26f1d181`.
- До финального утверждения результата запустить `pnpm test`, `pnpm type-check`, `pnpm test:architecture:rules`, `pnpm test:architecture` и `pnpm test:e2e`.
- Измерить `cf/doc` до изменения runtime и после реализации. Допустимая регрессия тёплой медианы — не более 3%, пикового RSS — не более 5%.

---

### Задача 1. Зафиксировать исходную производительность и расширить договор import audit

**Файлы:**

- Изменить: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.ts`
- Изменить: `packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts`

**Шаг 1. Измерить исходный профиль**

До изменения runtime выполнить четыре импорта, чтобы первый был холодным, а следующие три образовали тёплую выборку:

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /private/tmp/nkdk-semantic-elision-before \
  --runs 4 --json > /private/tmp/nkdk-semantic-elision-before.json
```

Сохранить вне репозитория тёплую медиану общего времени и максимальный `peakRssMb`.

**Шаг 2. Написать падающие тесты атомарного осмысленного исключения**

Добавить тесты, которые доказывают:

- полностью однозначно заявленное поддерево атомарно переходит в `semanticallyElided`;
- неизвестный, неоднозначный или дублированный дочерний узел запрещает переход и не меняет ни одного состояния;
- `rawCandidate` внутри поддерева запрещает переход;
- `rekeyYamlPath` переносит границу осмысленно исключённого свойства.

Запустить:

```bash
pnpm --filter @nkdk/runtime exec vitest run \
  metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts --project unit
```

Ожидаемый результат: новые тесты падают из-за отсутствующих состояния и операции.

**Шаг 3. Написать падающие тесты компактного структурного владения**

Добавить тесты, которые доказывают:

- `claimStructuralSubtree(root, boundary)` сохраняет одну границу на корне;
- дочерние узлы считаются покрытыми и после `finalize()` не становятся независимыми `unknown`;
- пересечение с другой смысловой или структурной границей отклоняется без частичного изменения;
- `rekeyYamlPath` переносит путь структурной границы;
- число сохранённых копий boundary не зависит от размера поддерева.

Снова запустить тот же точечный тест и подтвердить ожидаемое падение.

**Шаг 4. Реализовать минимальный общий API**

Расширить `XmlImportAuditState` состояниями:

```ts
| "semanticallyElided"
| "structurallyClaimed"
| "structurallyCovered"
```

Добавить в `XmlImportAuditSession`:

```ts
elideSubtree(node: XmlElementNode, boundary: XmlImportAuditBoundary): boolean
claimStructuralSubtree(node: XmlElementNode, boundary: XmlImportAuditBoundary): boolean
```

Реализовать обе операции как двухфазные: сначала проверить всё поддерево, затем изменить состояния. Для структурного владения boundary хранить только у корня; дочерним узлам назначать `structurallyCovered` без boundary. `rawCandidate` проверять по ссылкам уже разобранных узлов, не копируя XML и не перечитывая файл.

**Шаг 5. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/runtime exec vitest run \
  metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts --project unit
pnpm duplicates -- --base b26f1d181
```

**Шаг 6. Закоммитить слой**

```bash
git add packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.ts \
  packages/runtime/metadata/ruleRuntime/xmlAnomaly/importAudit.test.ts
git commit -m "feat(runtime): ✨ различать исключение и структурное владение XML"
```

---

### Задача 2. Связать состояния аудита с общим импортом PropertyRule

**Файлы:**

- Изменить: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Изменить: `packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts`

**Шаг 1. Написать падающий тест осмысленного исключения**

Создать правило вложенного известного свойства, у которого присутствующий XML полностью преобразуется в `{}`, а `getExportToYAMLResult` исключает пустой объект. Проверить, что:

- YAML-ключ отсутствует;
- корень и все дочерние XML-узлы имеют `semanticallyElided`;
- лишний неизвестный дочерний узел оставляет обычный подробный audit и не принимается автоматически.

**Шаг 2. Написать падающий тест XML-only свойства**

Для присутствующего свойства с `fromXML: false` проверить, что ранний выход:

- не создаёт YAML-значение;
- вызывает структурное заявление всего известного поддерева;
- сохраняет `propertyKey`, `rulePath` и YAML-путь владельца.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts --project core-metadata --no-isolate
```

Ожидаемый результат: новые ожидания падают.

**Шаг 3. Реализовать вызов `claimStructuralSubtree` перед ранним выходом**

В общем `importMatch` при `presentInXML && propertyRule.fromXML === false` использовать адресный `xmlNode` и существующий boundary. Не объявлять структурно свойства, отсутствующие в XML, и не вводить условия по типу свойства.

**Шаг 4. Реализовать вызов `elideSubtree` после успешного преобразования**

До выхода при `exportedValues === undefined` проверять строго согласованный случай:

```ts
presentInXML
&& convertedDirectly
&& canExportPropertyToYAML({ context, rule: propertyRule })
&& (isEmptyRecord(exportedYamlValue) || isEmptyArray(exportedYamlValue))
```

Вызывать `elideSubtree` только после успешного преобразования и только для адресного корня свойства. `undefined`, исключение обработчика и `toYAML: false` не считать осмысленным исключением.

**Шаг 5. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/fromXMLToYAML.test.ts --project core-metadata --no-isolate
pnpm duplicates -- --base b26f1d181
```

**Шаг 6. Закоммитить слой**

```bash
git add packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts \
  packages/rules/metadata/ruleRuntime/property/fromXMLToYAML.test.ts
git commit -m "feat(runtime): ✨ фиксировать осмысленно исключённые свойства"
```

---

### Задача 3. Научить anomaly proof обоим новым договорам

**Файлы:**

- Изменить: `packages/rules/metadata/importFromXml/anomalyProof.ts`
- Изменить: `packages/rules/metadata/importFromXml/anomalyProof.test.ts`

**Шаг 1. Написать падающие тесты `semanticallyElided`**

Проверить три случая:

- свойство присутствовало, осмысленно исключено и отсутствует в контрольном XML — raw не создаётся;
- контрольный XML создаёт иное значение — обычный proof создаёт локальный raw;
- неизвестный узел внутри похожего пустого свойства не принимается и остаётся причиной raw.

**Шаг 2. Написать падающие тесты `structurallyClaimed`**

Проверить:

- полный структурный hash исходного корня сравнивается с контрольным XML;
- точное совпадение не создаёт raw;
- различие атрибута или дочернего узла создаёт raw на YAML-пути владельца;
- дочерние `structurallyCovered` не создают отдельные границы и не поднимают поправку к корню документа;
- отсутствие исходного XML-only свойства при появлении в контрольном экспорте даёт локальный `$xml: null`.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/importFromXml/anomalyProof.test.ts --project core-metadata --no-isolate
```

**Шаг 3. Реализовать proof без частных знаний**

- Исключить `structurallyCovered` из самостоятельной группировки.
- Для `structurallyClaimed` построить одну captured target по корню с полной `structuralHash`, без поверхностной подписи.
- Для `semanticallyElided` сформировать границу допустимой канонизации: отсутствие свойства в контрольном XML считается точным результатом; появившееся или изменённое значение проходит обычное сравнение.
- Не включать осмысленно исключённую границу в восстановление `#order`, если свойство отсутствует в контрольном XML.

**Шаг 4. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/importFromXml/anomalyProof.test.ts --project core-metadata --no-isolate
pnpm duplicates -- --base b26f1d181
```

**Шаг 5. Закоммитить слой**

```bash
git add packages/rules/metadata/importFromXml/anomalyProof.ts \
  packages/rules/metadata/importFromXml/anomalyProof.test.ts
git commit -m "feat(rules): ✨ учитывать канонизацию и XML-only в proof"
```

---

### Задача 4. Передать структурный контекст через операцию импорта управляемой формы

**Файлы:**

- Изменить: `packages/rules/metadata/importFromXml/prepareYaml.ts`
- Изменить: `packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts`
- Изменить: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Изменить: `packages/rules/metadata/forms/clientApplicationForm/xmlImportSources.ts`
- Изменить: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`

**Шаг 1. Написать падающий тест источников формы**

Разобрать минимальные `Form` и `MetaDataObject` через структурный XML-парсер и проверить, что `createClientApplicationFormImportSources` передаёт в `DirectImportXMLSource.xml` именно адресные `XmlElementNode`, сохраняя существующие tags и контексты. Compatibility-объекты оставить только для определения типа формы и augmenter.

**Шаг 2. Написать падающий тест операции формы**

Проверить, что `importClientApplicationFormFromXMLToYAML` принимает и передаёт в `importPropertiesFromXMLToYAML`:

- body/metadata `XmlElementNode`;
- общий `XmlImportAuditSession`;
- общую таблицу XML-аннотаций.

При этом публичный результат обычной формы должен остаться прежним.

**Шаг 3. Написать сквозной падающий тест локализации**

В `prepareYaml.integration.test.ts` импортировать форму с известным XML-only свойством внутри элемента. После контрольного экспорта проверить, что расхождение относится к локальному YAML-владельцу и не создаёт корневой `@Form: !xml/raw`.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts \
  metadata/importFromXml/prepareYaml.integration.test.ts \
  --project integration --no-isolate
```

**Шаг 4. Реализовать единый operation boundary**

- Расширить параметры операции формы адресными корнями body и metadata, audit и annotations.
- В `prepareYaml` извлечь корни из уже разобранных `document.roots`, не разбирая XML повторно.
- В источниках формы предпочесть структурный узел, а compatibility-объект использовать только там, где нужен прежний предметный доступ.
- Не смешивать корень body с metadata и BaseForm companion.

**Шаг 5. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts \
  metadata/importFromXml/prepareYaml.integration.test.ts \
  --project integration --no-isolate
pnpm duplicates -- --base b26f1d181
```

**Шаг 6. Закоммитить слой**

```bash
git add packages/rules/metadata/importFromXml/prepareYaml.ts \
  packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts \
  packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.ts \
  packages/rules/metadata/forms/clientApplicationForm/xmlImportSources.ts \
  packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
git commit -m "refactor(forms): ♻️ передавать audit через импорт формы"
```

---

### Задача 5. Восстанавливать локальный `!xml/raw` по логическому свойству Rules

**Файлы:**

- Изменить: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts`
- Изменить: `packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts`

**Шаг 1. Написать падающий тест разрешения логического имени**

Для локального ключа вида `@Form\\ОтборСтрок` внутри владельца `TableRules` проверить, что поправка записывается по `PropertyRule.xmlPath` (`RowFilter`), а не создаёт XML-элемент `ОтборСтрок`.

**Шаг 2. Написать падающий тест канонической позиции**

При отсутствующем обычном значении свойства проверить, что вставленный `RowFilter` занимает позицию из `TableRules.xmlOrder` между соседями и не требует публичного `#order`. Добавить защитный тест для неоднозначного логического имени.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts \
  --project integration --no-isolate
```

**Шаг 3. Реализовать разрешение через существующий план Rules**

- После разбора публичного пути отделить селектор документа от последнего логического сегмента.
- Разрешить последний сегмент через `propertyForYamlKey` текущего правила-владельца.
- Использовать `property.xmlPath`, `tag` и `filePath` так же, как для обычного свойства.
- Построить `siblingOrder` из `getYAMLToXMLPlan(rule)`/`xmlOrder`, включая вставляемое свойство и существующих соседей; не добавлять поле `order` в правила.
- Если имя не разрешилось, сохранить текущую обработку настоящего XML-пути.

**Шаг 4. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts \
  --project integration --no-isolate
pnpm duplicates -- --base b26f1d181
```

**Шаг 5. Закоммитить слой**

```bash
git add packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts \
  packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.integration.test.ts
git commit -m "feat(rules): ✨ локализовать XML-поправки по Rules"
```

---

### Задача 6. Восстановить вычисляемый `RowFilter`

**Файлы:**

- Изменить: `packages/rules/metadata/forms/elements/table/rules.ts`
- Изменить: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts`
- Проверить: `packages/rules/metadata/forms/elements/table/dynamicListProperties.test.ts`

**Шаг 1. Расширить падающую матрицу экспорта**

В тестах экспорта формы зафиксировать договор:

- `ValueTable`, `TabularSection`, `RegisterRecordSet`, отсутствующий/пустой/неразрешённый путь → `<RowFilter xsi:nil="true"/>`;
- direct `DynamicList`, `ValueTree`, `ValueList`, `GanttChart`, `SettingsComposer`, scalar и явно нетабличный источник → `RowFilter` отсутствует;
- `Объект.ТабличнаяЧасть` классифицируется как `TabularSection` и получает `RowFilter`.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts \
  metadata/forms/elements/table/dynamicListProperties.test.ts \
  --project integration --no-isolate
```

Ожидаемый результат: случаи профиля `rowFilter` падают.

**Шаг 2. Восстановить декларативное правило**

Импортировать `hasRowFilterTableSource` в `table/rules.ts` и задать существующими параметрами:

```ts
rowFilter: {
  yaml: "ОтборСтрок",
  type: "boolean",
  fromXML: false,
  toYAML: false,
  fromYAML: false,
  evaluateWhenYAMLMissing: true,
  toXML: hasRowFilterTableSource,
  defaultValueXMLRaw: { "_xsi:nil": "true" },
}
```

Не добавлять частное условие в exporter и не менять классификатор без теста, доказывающего ошибку его текущего договора.

**Шаг 3. Подтвердить green и отсутствие дублирования**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts \
  metadata/forms/elements/table/dynamicListProperties.test.ts \
  --project integration --no-isolate
pnpm duplicates -- --base b26f1d181
```

**Шаг 4. Закоммитить слой**

```bash
git add packages/rules/metadata/forms/elements/table/rules.ts \
  packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.integration.test.ts
git commit -m "fix(forms): 🐛 восстанавливать RowFilter по источнику таблицы"
```

---

### Задача 7. Удалить частный обход стандартных реквизитов и обновить ожидаемый YAML

**Файлы:**

- Изменить: `packages/rules/metadata/appliedObjects/metadataEnumeration/rules.ts`
- Изменить: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.integration.test.ts`
- Изменить при необходимости: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts`
- Изменить: `e2e/fixtures/nkdk/**` только через генератор YAML-фикстур
- Изменить: `.agents/xml-anomalies.md`

**Шаг 1. Написать падающие интеграционные тесты компактного договора**

Зафиксировать:

- полностью стандартный `StandardAttributeDescriptions` отсутствует в YAML и не получает raw;
- при изменении одного стандартного реквизита YAML содержит только изменение, а XML-экспорт создаёт полный блок с дефолтами;
- неизвестный, динамический или частично распознанный реквизит не принимается как осмысленно исключённый;
- отсутствие блока в исходном XML перечисления не создаёт `$xml: null`.

Запустить:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.integration.test.ts \
  metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts \
  --project integration --no-isolate
```

**Шаг 2. Удалить частный обход**

Удалить `evaluateWhenYAMLMissing: true` только из `MetadataEnumerationRules.standardAttributes`. Общий договор коллекции и существующие параметры `completeItemNames`, `sparseItems`, `omitDefaultsForSparseItems` не менять без отдельного падающего теста.

**Шаг 3. Обновить документацию аномалий**

В `.agents/xml-anomalies.md` описать:

- различие `semanticallyElided` и `structurallyClaimed`;
- условия, при которых пустое значение считается канонически исключённым;
- локальный публичный путь XML-only свойства и его разрешение через Rules;
- запрет использовать механизм для неизвестных и частично распознанных поддеревьев.

**Шаг 4. Обновить только производные YAML-фикстуры**

```bash
pnpm fixtures:e2e:nkdk
```

Проверить `git diff -- e2e/fixtures/xml`: он должен быть пустым. В YAML должны исчезнуть 9 полных raw стандартных реквизитов, 4 `$xml: null` и корневой `@Form` формы документа; вычисляемый `RowFilter` не должен заменяться локальным raw.

**Шаг 5. Запустить e2e и анализ результата**

```bash
pnpm test:e2e
```

Если остаются локальные `@Form\\ОтборСтрок`, проверить каждый по профилю источника таблицы: вычисляемые случаи исправить обычным правилом, реальные невосстановимые оставить минимальными. Не добавлять новый `!xml` без отдельного согласования.

**Шаг 6. Проверить слой**

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.integration.test.ts \
  metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.integration.test.ts \
  --project integration --no-isolate
pnpm duplicates -- --base b26f1d181
git diff --check
```

**Шаг 7. Закоммитить слой**

```bash
git add packages/rules/metadata/appliedObjects/metadataEnumeration/rules.ts \
  packages/rules/metadata/commonObjects/standardAttributeDescription \
  .agents/xml-anomalies.md e2e/fixtures/nkdk
git commit -m "fix(metadata): 🐛 исключить канонические XML-блоки без raw"
```

---

### Задача 8. Полная проверка, профиль после изменения и сверка результата

**Файлы:**

- Проверить: все изменённые файлы
- Не сохранять профильные JSON и временный YAML в репозитории

**Шаг 1. Запустить обязательные проверки**

Команды с LMDB запускать вне песочницы:

```bash
pnpm type-check
pnpm test
pnpm test:e2e
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base b26f1d181
git diff --check
```

Не считать известное исходное превышение setup budget новым дефектом, но явно отделить его от новых падений. Любое иное падение расследовать до завершения задачи.

**Шаг 2. Измерить профиль после изменения**

```bash
node .agents/skills/import-profile/import-profile.mjs \
  /Users/nikita/git/round-trip-compact/cf/doc \
  /private/tmp/nkdk-semantic-elision-after \
  --runs 4 --json > /private/tmp/nkdk-semantic-elision-after.json
```

Сравнить три тёплых запуска с baseline:

```text
time_delta_percent = (after_warm_median / before_warm_median - 1) * 100
rss_delta_percent  = (after_peak_rss / before_peak_rss - 1) * 100
```

Если время выросло более чем на 3% или RSS более чем на 5%, не завершать реализацию: профилировать добавленный слой и устранить регрессию либо отдельно согласовать её.

**Шаг 3. Проверить фактический результат по спецификации**

Собрать таблицу с каждым требованием спецификации и ссылкой на реализацию/тест:

- `semanticallyElided` атомарен и не скрывает неизвестное;
- `structurallyClaimed` компактен и локализует XML-only;
- операция формы использует адресные узлы и общий audit;
- локальный raw разрешается через Rules и `xmlOrder`;
- `RowFilter` вычисляется по профилю источника;
- стандартные реквизиты следуют компактному договору;
- XML-фикстуры не изменены;
- ограничения времени и памяти соблюдены.

Сравнить выполненные изменения также с каждым шагом этого плана и отметить осознанные отклонения.

**Шаг 4. Зафиксировать оставшиеся изменения**

Если после проверок появились необходимые корректировки, закоммитить их отдельным Conventional Commit после повторного запуска затронутых тестов и `pnpm duplicates -- --base b26f1d181`.

**Шаг 5. Передать реализацию на независимое ревью**

Только после завершения реализации запустить одного субагента. Попросить его:

- просмотреть diff `b26f1d181..HEAD`;
- найти ошибки корректности, утечки абстракций, регрессии памяти/времени и недостаточные тесты;
- отдельно сверить diff со спецификацией и этим планом;
- вернуть замечания с приоритетом и точными файлами/строками.

Главный исполнитель проверяет каждое замечание по коду, исправляет подтверждённые проблемы через TDD и повторяет затронутые и обязательные проверки.

**Шаг 6. Перейти к завершению ветки**

После чистого ревью и окончательной сверки использовать `superpowers:finishing-a-development-branch`, представить разработчику варианты интеграции и не объединять ветку без выбранного им варианта.
