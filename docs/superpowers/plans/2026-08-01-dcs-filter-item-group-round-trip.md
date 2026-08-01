# DCS Filter Item Group Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранить логическое дерево `AndGroup`/`OrGroup`/`NotGroup` и его reference XML при полном XML → YAML → XML.

**Architecture:** Исправление остаётся внутри типа `FilterItem`. Импортёр отличает контейнер коллекции от готового элемента по `_xsi:type`, а semantic reference identity использует полное системное перечисление типов групп вместо ручного неполного ветвления.

**Tech Stack:** TypeScript 7, Vitest 4, rules.ts metadata orchestration, Stryker mutation testing, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Сначала расширять существующие тесты того же наблюдаемого договора.
- Не добавлять частные знания DCS в общие orchestration-слои.
- Не менять общие типы правил и параметры построителей.
- Не добавлять специальные `fromXML`/`toXML`/`fromYAML`/`toYAML` в `rules.ts`.
- Не исправлять служебные default, заголовки колонок и порядок командного интерфейса.
- Перед завершением обязательно выполнить mutation testing изменённых строк, `pnpm type-check` и `pnpm test`.

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts` — распознавание контейнера и готового XML-элемента.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts` — semantic reference identity для всех типов групп.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts` — регрессии одиночной корневой и глубоко вложенной группы.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts` — reference XML для `NotGroup`.

---

### Task 1: Сохранить группу как XML-элемент при импорте

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts:6-8`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts:18-95`

**Interfaces:**
- Consumes: `ImportFromXMLToYAMLFunction`, XML-объекты с `_xsi:type`, контейнеры с `dcsset:item`, массивы элементов.
- Produces: `importFilterItemFromXMLToYAML`, сохраняющий сам `FilterItemGroup` и рекурсивно импортирующий его детей.

- [ ] **Step 1: Добавить падающую регрессию одиночной корневой группы**

Расширить существующий `describe("export FilterItem to YAML")` тестом с XML непосредственно в `xmlString`. Проверка должна фиксировать оператор внешней группы, её свойства и вложенные операторы:

```ts
it("сохраняет одиночную корневую группу вместе с вложенными группами", () => {
  const result = testExportPropertyModelThroughXMLToYAML({
    rule,
    value: undefined,
    xmlRootTag: "dcsset:item",
    xmlString: `<dcsset:item
      xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings"
      xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xmlns:xs="http://www.w3.org/2001/XMLSchema"
      xmlns:v8="http://v8.1c.ru/8.1/data/core"
      xsi:type="dcsset:FilterItemGroup">
      <dcsset:use>false</dcsset:use>
      <dcsset:groupType>OrGroup</dcsset:groupType>
      <dcsset:item xsi:type="dcsset:FilterItemGroup">
        <dcsset:groupType>AndGroup</dcsset:groupType>
        <dcsset:item xsi:type="dcsset:FilterItemComparison">
          <dcsset:left xsi:type="dcscor:Field">Ссылка</dcsset:left>
          <dcsset:comparisonType>Equal</dcsset:comparisonType>
          <dcsset:right xsi:type="xs:boolean">true</dcsset:right>
        </dcsset:item>
        <dcsset:item xsi:type="dcsset:FilterItemGroup">
          <dcsset:groupType>NotGroup</dcsset:groupType>
          <dcsset:item xsi:type="dcsset:FilterItemGroup">
            <dcsset:groupType>OrGroup</dcsset:groupType>
            <dcsset:item xsi:type="dcsset:FilterItemComparison">
              <dcsset:left xsi:type="dcscor:Field">ПометкаУдаления</dcsset:left>
              <dcsset:comparisonType>Equal</dcsset:comparisonType>
              <dcsset:right xsi:type="xs:boolean">true</dcsset:right>
            </dcsset:item>
          </dcsset:item>
        </dcsset:item>
      </dcsset:item>
      <dcsset:presentation xsi:type="v8:LocalStringType">
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Корневая группа</v8:content>
        </v8:item>
      </dcsset:presentation>
      <dcsset:viewMode>Normal</dcsset:viewMode>
      <dcsset:userSettingID>11111111-1111-1111-1111-111111111111</dcsset:userSettingID>
    </dcsset:item>`,
  })

  expect(result).toMatchObject({
    Элементы: [
      {
        Использование: "Ложь",
        ТипГруппы: "ГруппаИли",
        Представление: {
          Тип: "МногоязычнаяСтрока",
          Значение: "Корневая группа",
        },
        РежимОтображения: "Обычный",
        ИспользоватьПользовательскуюНастройку: "11111111-1111-1111-1111-111111111111",
        Элементы: [
          {
            ТипГруппы: "ГруппаИ",
            Элементы: [
              { ЛевоеЗначение: ".Ссылка" },
              {
                ТипГруппы: "ГруппаНе",
                Элементы: [
                  {
                    ТипГруппы: "ГруппаИли",
                    Элементы: [{ ЛевоеЗначение: ".ПометкаУдаления" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })
})
```

Этот один сценарий защищает уникальный класс входа: единственный XML-элемент коллекции является группой с собственными `dcsset:item`. Он одновременно проверяет четыре уровня вложенности и `AND`/`OR`/`NOT`, не размножая эквивалентные тесты.

В том же файле добавить границу с несколькими корневыми элементами. Она уже должна проходить до исправления и защищает массив от появления лишней обёртки:

```ts
it("сохраняет несколько корневых элементов без дополнительной группы", () => {
  const result = testExportPropertyModelThroughXMLToYAML({
    rule,
    value: undefined,
    yaml: [
      {
        ТипГруппы: "ГруппаИли",
        Элементы: [fullFilterItemComparisonYAML],
      },
      fullFilterItemComparisonYAML,
    ],
  })

  expect(result).toMatchObject({
    Элементы: [
      {
        ТипГруппы: "ГруппаИли",
        Элементы: [expect.objectContaining({ ЛевоеЗначение: ".Ссылка" })],
      },
      expect.objectContaining({ ЛевоеЗначение: ".Ссылка" }),
    ],
  })
})
```

- [ ] **Step 2: Запустить тест и подтвердить правильное падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts --no-isolate
```

Expected: тест одиночной группы падает, потому что `Элементы[0].ТипГруппы` равен `ГруппаИ`, а ожидается `ГруппаИли`; граница нескольких корневых элементов и существующие тесты проходят.

- [ ] **Step 3: Исправить распознавание контейнера**

В `importFilterItemFromXMLToYAML` заменить безусловное извлечение `dcsset:item` проверкой `_xsi:type`:

```ts
export const importFilterItemFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const xmlRecord = asRecord(xml)
  const source = xmlRecord?.["_xsi:type"] === undefined ? (xmlRecord?.["dcsset:item"] ?? xml) : xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
```

Не менять дальнейший выбор `FilterItemComparisonRules`/`FilterItemGroupRules`: он уже использует `_xsi:type` и рекурсивный `filterItemRule`.

- [ ] **Step 4: Запустить целевой тест и проверить зелёный результат**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts --no-isolate
```

Expected: PASS; новый тест сохраняет `ГруппаИли → ГруппаИ → ГруппаНе → ГруппаИли`.

- [ ] **Step 5: Создать коммит первого изменения**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts
git commit -m "fix: :bug: сохранить вложенные группы DCS при импорте XML"
```

---

### Task 2: Сопоставить NotGroup с reference XML

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts:7-26`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts:20-49,177-195`

**Interfaces:**
- Consumes: `DataCompositionFilterItemsGroupTypeFromYAML`, YAML `ТипГруппы`, XML `dcsset:groupType`.
- Produces: одинаковый semantic identity `group:<XML type>` для `ГруппаИ`, `ГруппаИли` и `ГруппаНе`.

- [ ] **Step 1: Расширить тестовые построители типом NOT**

Изменить допустимые типы существующих помощников:

```ts
const groupYAML = (groupType: "ГруппаИ" | "ГруппаИли" | "ГруппаНе", extra: Record<string, unknown> = {}) => ({
  ТипГруппы: groupType,
  ИспользоватьПользовательскуюНастройку: "Истина",
  ...extra,
})

const groupXML = (
  groupType: "AndGroup" | "OrGroup" | "NotGroup",
  guid?: string,
  extra: Record<string, unknown> = {}
): Record<string, unknown> => ({
  "_xsi:type": "dcsset:FilterItemGroup",
  "dcsset:groupType": groupType,
  ...(guid === undefined ? {} : { "dcsset:userSettingID": guid }),
  ...extra,
})
```

- [ ] **Step 2: Добавить NotGroup в существующий тест semantic reference matching**

Усилить тест `FilterItemGroup: сопоставляет по groupType`, добавив третий элемент и обратный порядок reference:

```ts
const guidNotGroup = "eeeeeeee-0000-0000-0000-000000000008"
const notGroup: FilterItemGroup = { itemType: "FilterItemGroup", groupType: "NotGroup", userSettingID: true }

const { result } = testExportPropertyModelThroughYAMLToXML({
  rule,
  value: [orGroup, andGroup, notGroup],
  yaml: [groupYAML("ГруппаИли"), groupYAML("ГруппаИ"), groupYAML("ГруппаНе")],
  xmlRootTag: "dcsset:item",
  referenceMetadata: [
    groupXML("NotGroup", guidNotGroup),
    groupXML("AndGroup", guidAndGroup),
    groupXML("OrGroup", guidOrGroup),
  ],
})

expect(result).toContain(guidOrGroup)
expect(result).toContain(guidAndGroup)
expect(result).toContain(guidNotGroup)
expect(result.indexOf(guidOrGroup)).toBeLessThan(result.indexOf(guidAndGroup))
expect(result.indexOf(guidAndGroup)).toBeLessThan(result.indexOf(guidNotGroup))
```

Это расширяет существующий договор вместо создания отдельного эквивалентного теста.

- [ ] **Step 3: Запустить тест и подтвердить падение только NotGroup**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts --no-isolate
```

Expected: тест не находит `guidNotGroup`; сопоставление `AndGroup` и `OrGroup` остаётся зелёным.

- [ ] **Step 4: Использовать полное системное перечисление в referenceIdentity**

Дополнить импорт:

```ts
import {
  DataCompositionComparisonTypeFromYAML,
  DataCompositionFilterItemsGroupTypeFromYAML,
} from "../../../systemEnumerations/types"
```

Заменить ручное ветвление:

```ts
if (typeof yaml.ТипГруппы === "string") {
  const groupType =
    DataCompositionFilterItemsGroupTypeFromYAML[
      yaml.ТипГруппы as keyof typeof DataCompositionFilterItemsGroupTypeFromYAML
    ]
  return groupType === undefined ? undefined : `group:${groupType}`
}
```

- [ ] **Step 5: Запустить оба тестовых файла**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts --no-isolate
```

Expected: PASS; `NotGroup` получает свой GUID из reference XML, а дерево XML→YAML остаётся вложенным.

- [ ] **Step 6: Создать коммит второго изменения**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts
git commit -m "fix: :bug: сопоставить NotGroup с reference XML"
```

---

### Task 3: Проверить соседние договоры и устойчивость тестов

**Files:**
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts`
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts`
- Verify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/*.test.ts`

**Interfaces:**
- Consumes: результаты Tasks 1–2.
- Produces: подтверждённый полный договор XML → YAML → XML без регрессий соседних DCS-типов.

- [ ] **Step 1: Запустить соседние DCS-тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/dataCompositionSystem/filterItem \
  metadata/commonObjects/dataCompositionSystem/filter \
  metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem \
  --no-isolate
```

Expected: PASS без изменения существующих ожиданий.

- [ ] **Step 2: Запустить mutation testing изменённых диапазонов**

Run:

```bash
pnpm test:mutation -- --report current \
  --tests packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts,packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.ts:6-9 \
  packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/types.ts:19-28
```

Expected: отчёт достоверный, без `Timeout`, `RuntimeError` и `CompileError`; содержательные мутанты изменённых условий убиты. Если выживает содержательный мутант, усилить ближайший существующий тест, повторить команду и закоммитить только это усиление сообщением:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXMLToYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromYAMLToXML.test.ts
git commit -m "test: :white_check_mark: усилить договор групп DCS"
```

- [ ] **Step 3: Запустить проверку типов**

Run:

```bash
pnpm type-check
```

Expected: PASS во всех workspace-пакетах.

- [ ] **Step 4: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: PASS во всех `packages/*`.

- [ ] **Step 5: Повторить диагностический round-trip на безопасной копии**

Сначала убедиться, что фиксированный временный путь свободен, затем клонировать XML-репозиторий без hardlink:

```bash
test ! -e /private/tmp/nkdk-dcs-filter-group-round-trip
git clone --no-hardlinks /Users/nikita/git/round-trip-compact /private/tmp/nkdk-dcs-filter-group-round-trip
```

Запустить только `cf/doc` во временной копии:

```bash
env \
  NKDK_XML_REPO=/private/tmp/nkdk-dcs-filter-group-round-trip \
  NKDK_XML_DIR=/private/tmp/nkdk-dcs-filter-group-round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected: в `git diff -G '<dcsset:groupType>'` временного репозитория отсутствуют распрямления `FilterItemGroup`; остальные известные категории diff могут остаться и не входят в это изменение.

- [ ] **Step 6: Проверить итоговый diff рабочего дерева**

Run:

```bash
git status --short
git diff --check
git log -3 --oneline
```

Expected: нет незакоммиченных production- или test-изменений; последние коммиты соответствуют Tasks 1–2 и, только при необходимости mutation-усиления, Task 3.
