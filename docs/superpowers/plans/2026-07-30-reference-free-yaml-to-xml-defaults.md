# Reference-Free YAML to XML Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить `preserveFromReferenceXML` и восстанавливать известные XML-default из `rules.ts` без исходного XML и снимка.

**Architecture:** Общий прямой конвейер YAML → XML перестаёт блокировать отсутствующие YAML-свойства по признаку наличия reference. Все затронутые правила переходят на обычные `defaultValueXML`, `defaultValueXMLRaw`, `implicitValueYAML` и обработчики типов; reference остаётся только источником неизвестных XML-данных, а не условием экспорта известного default.

**Tech Stack:** TypeScript, Vitest, pnpm, declarative metadata `rules.ts`, `round-trip-yaml`.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не добавлять данные или признаки присутствия в снимок конфигурации 1.3.
- Не добавлять частные условия по `itemType` в общую оркестрацию.
- Реализовывать каждый этап через RED → GREEN.
- Перед завершением выполнить полный `pnpm test`.

---

### Task 1: Удалить reference-зависимый договор общей оркестрации

**Files:**
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `PropertyRule.defaultValueXML`, `PropertyRule.defaultValueXMLRaw`, `PropertyRule.implicitValueYAML`, зарегистрированные `importFromYAML`/`exportToXML`.
- Produces: единый путь экспорта известного свойства без `PropertyRule.preserveFromReferenceXML`.

- [ ] **Step 1: Написать регрессионный тест**

В `fromYAMLToXML.test.ts` добавить проверку отсутствующего YAML-свойства без reference:

```ts
it("восстанавливает XML-default по rules без reference", () => {
  const result = convertPropertiesFromYAMLToXML({
    context: context(),
    yaml: {},
    rule: testRule({
      dataHistory: {
        type: "SystemEnumeration",
        typeSE: "DataHistoryUse",
        yaml: "ИсторияДанных",
        xml: "DataHistory",
        defaultValueXML: "Use",
        implicitValueYAML: "Use",
      },
    }),
    outputs: [{ key: "owner" }],
  })

  expect(result.outputs.get("owner")).toEqual({ DataHistory: "Use" })
})
```

- [ ] **Step 2: Проверить RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: новый тест падает, потому что отсутствующее YAML-свойство не доходит до канонического XML-default.

- [ ] **Step 3: Удалить договор**

В `types.ts` удалить:

```ts
preserveFromReferenceXML?: true
```

В `helpers.ts` удалить отдельную ветку `preserveFromReferenceXML` из `shouldProcessProperty`.

В `fromYAMLToXML.ts`:

- удалить условия, пропускающие свойство только из-за `preserveFromReferenceXML`;
- удалить ветку копирования значения исключительно для `preserveFromReferenceXML`;
- упростить `shouldConvertYAMLProperty`, чтобы известное свойство обрабатывалось без reference;
- оставить `exportWithoutReferenceXML` как явный запрос вычислить XML-only значение при отсутствующем YAML;
- сохранить существующее слияние неизвестных XML-узлов с reference.

- [ ] **Step 4: Мигрировать тесты общего договора**

Удалить тесты, проверяющие условный экспорт по `preserveFromReferenceXML`. Сохранить проверки:

- канонического XML-ключа при наличии alias;
- `exportNilValue` без reference;
- отсутствия данных `present`/`aliases`/`excludedEqualName` в снимке.

Обновить тестовые правила так, чтобы они больше не содержали удалённое поле.

- [ ] **Step 5: Проверить GREEN общей оркестрации**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/orchestration/property/fromYAMLToXML.test.ts \
  metadata/orchestration/property/helpers.test.ts \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/configurationIndex/fromYAMLToXML.test.ts
```

Expected: все выбранные тесты проходят.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/property packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts
git commit -m "refactor!: :recycle: убрать preserveFromReferenceXML"
```

Body:

```text
Известные XML-default должны восстанавливаться из rules.ts при чистом
YAML → XML и не зависеть от наличия исходного XML.

BREAKING CHANGE: из PropertyRule удалено поле preserveFromReferenceXML.
Миграция: удалить поле из rules.ts и задать каноническое поведение через
defaultValueXML, defaultValueXMLRaw или обработчик типа.
```

### Task 2: Перевести производственные правила на канонические XML-default

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: общий reference-free договор из Task 1.
- Produces: ноль производственных вхождений `preserveFromReferenceXML`; канонические defaults всех ранее помеченных полей.

- [ ] **Step 1: Написать регрессионный тест реквизита**

В `metadataAttribute/fromYAMLToXML.test.ts` добавить минимальный YAML-реквизит без reference и проверить:

```ts
expect(xml).toMatchObject({
  Properties: {
    FillFromFillingValue: false,
    Indexing: "DontIndex",
    FullTextSearch: "Use",
    DataHistory: "Use",
  },
})
```

- [ ] **Step 2: Проверить RED**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts
```

Expected: отсутствуют как минимум четыре канонических XML-default.

- [ ] **Step 3: Удалить 19 применений**

Удалить `preserveFromReferenceXML: true` из восьми производственных `rules.ts`.

Для каждого правила проверить наличие детерминированного поведения:

- скалярные defaults задаются `defaultValueXML`;
- пустые и `xsi:nil` задаются `defaultValueXMLRaw`;
- вычисляемые значения формируются обработчиком типа;
- допустимое отсутствие XML не требует дополнительного признака.

В `dcsMetadataValue/fromXML.ts` удалить проверку удалённого поля, сохранив условие, относящееся к `valueType` и `exportNilValue`.

- [ ] **Step 4: Проверить отсутствие договора**

Run:

```bash
rg -n "preserveFromReferenceXML" packages/core/metadata -g "*.ts"
```

Expected: нет совпадений.

- [ ] **Step 5: Проверить GREEN затронутых модулей**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute \
  metadata/commonObjects/characteristicsDescription \
  metadata/commonObjects/dataCompositionSystem/dcsParameter \
  metadata/commonObjects/metadataTabularSection \
  metadata/forms/clientApplicationForm \
  metadata/forms/commonObjects/dynamicList \
  metadata/forms/elements/table
```

Expected: все выбранные тесты проходят.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts \
  packages/core/metadata/commonObjects \
  packages/core/metadata/forms
git commit -m "fix: :bug: восстанавливать XML-default по rules"
```

Body:

```text
Прямой YAML → XML должен формировать канонический результат без чтения
исходного XML. Правила теперь используют собственные defaults и обработчики.
```

### Task 3: Проверить проект и полный round-trip

**Files:**
- No production changes expected.
- Diagnostic XML repository: `/Users/nikita/git/round-trip/cf/doc`

**Interfaces:**
- Consumes: реализацию Tasks 1–2.
- Produces: подтверждение отсутствия регрессий и массовой группы XML-default.

- [ ] **Step 1: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все пакеты и тесты проходят без ошибок.

- [ ] **Step 2: Очистить предыдущий диагностический результат**

Использовать ранее данное пользователем разрешение на reset диагностического
каталога:

```bash
git -C /Users/nikita/git/round-trip restore -- cf/doc
git -C /Users/nikita/git/round-trip clean -fd -- cf/doc
```

- [ ] **Step 3: Запустить round-trip**

Run:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: импорт и синхронизация завершаются успешно.

- [ ] **Step 4: Проверить массовую группу**

Run:

```bash
git -C /Users/nikita/git/round-trip diff --name-only \
  -G"<(DataHistory|Indexing|FillFromFillingValue|FullTextSearch)" \
  -- cf/doc
```

Expected: прежние массовые удаления отсутствуют; оставшиеся совпадения,
если есть, классифицированы как канонизация или отдельная ошибка.

- [ ] **Step 5: Зафиксировать итоговую статистику**

Run:

```bash
git -C /Users/nikita/git/round-trip diff --name-only -- cf/doc | wc -l
```

Сравнить результат с текущими 4 970 файлами и отдельно привести количество
файлов по четырём XML-тегам.

