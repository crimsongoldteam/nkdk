# Preserve Empty I8n XML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять `<Synonym/>` через полный XML → YAML → XML round-trip как `Синоним: ""`.

**Architecture:** Правило `I8nText` получает признак `preserveEmptyXML`, который делает пустой XML-узел значимым пустым значением во всех трёх представлениях. Явная пустота передаётся через пользовательский YAML; снимок конфигурации и специальные условия по типам метаданных не используются.

**Tech Stack:** TypeScript 6, Vitest 4, pnpm, декларативные `rules.ts`, XML/YAML-преобразователи `@nakidka/core`.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые специальные `fromXML`/`toXML`/`fromYAML`/`toYAML` для объектов метаданных.
- Не использовать снимок конфигурации для пустого синонима.
- Не добавлять совместимость с именем `emptyAsRawXML`.
- Строки из пробелов и переводов строк не считать пустыми.
- Общая оркестрация не должна знать имена `Synonym`, типы объектов или частные XML-пути.
- Перед завершением выполнить `pnpm test` из корня worktree.

---

### Task 1: Переименовать договор правила I8nText

**Files:**
- Modify: `packages/core/metadata/commonObjects/i8nText/types.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `I8nTextPropertyRule`.
- Produces: `I8nTextPropertyRule.preserveEmptyXML?: true`.
- Removes: `I8nTextPropertyRule.emptyAsRawXML`.

- [ ] **Step 1: Перевести тестовые правила на новое имя**

В `fromXML.test.ts`, `toXML.test.ts` и функции `synonymRule()` из
`fromYAMLToXML.test.ts` заменить признак:

```ts
const preserveEmptyXMLRule: I8nTextPropertyRule = {
  yaml: "Шапка",
  type: "I8nText",
  preserveEmptyXML: true,
}
```

- [ ] **Step 2: Запустить проверку типов и подтвердить несовместимость**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: FAIL с ошибкой о неизвестном свойстве `preserveEmptyXML`, пока
интерфейс сохраняет старое имя.

- [ ] **Step 3: Переименовать признак в типе и потребителях**

В `I8nTextPropertyRule` заменить поле и комментарий:

```ts
/** Сохранять явно пустой XML-узел через модель и YAML. */
preserveEmptyXML?: true
```

В `fromXML.ts` сохранить существующую семантику под новым именем:

```ts
if (xml === "") return narrowRule.preserveEmptyXML ? { items: {} } : undefined
if (!xml) return undefined
if (!xml["v8:item"]) return narrowRule.preserveEmptyXML ? { items: {} } : undefined
```

В `toXML.ts` заменить условие:

```ts
if (narrowRule.preserveEmptyXML) {
  return {}
}
```

В `fromXMLToYAML.ts` и трёх общих `rules.ts` заменить только имя
`emptyAsRawXML` на `preserveEmptyXML`.

- [ ] **Step 4: Проверить отсутствие старого имени**

Run:

```bash
rg -n "emptyAsRawXML" packages --glob '*.ts'
```

Expected: команда не выводит совпадений.

- [ ] **Step 5: Запустить модульные тесты и проверку типов**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/i8nText/fromXML.test.ts metadata/commonObjects/i8nText/toXML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts
pnpm --filter @nakidka/core type-check
```

Expected: оба запуска завершаются успешно.

- [ ] **Step 6: Зафиксировать несовместимое переименование**

```bash
git add packages/core/metadata/commonObjects/i8nText/types.ts packages/core/metadata/commonObjects/i8nText/fromXML.ts packages/core/metadata/commonObjects/i8nText/toXML.ts packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/commonObjects/metadataTabularSection/rules.ts packages/core/metadata/commonObjects/metadataRegisterField/rules.ts packages/core/metadata/commonObjects/i8nText/fromXML.test.ts packages/core/metadata/commonObjects/i8nText/toXML.test.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts
git commit -m "refactor!: :recycle: переименовать признак пустого XML I8nText" -m "BREAKING CHANGE: emptyAsRawXML заменён на preserveEmptyXML. Миграция: переименовать признак в правилах I8nText."
```

---

### Task 2: Выводить явно пустой I8nText в YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: `I8nTextPropertyRule.preserveEmptyXML`.
- Produces: `exportI8nTextToYAML(...) === ""` для `{ items: {} }` при включённом признаке.

- [ ] **Step 1: Добавить модульные тесты YAML-договора**

В `toYAML.test.ts` добавить два теста:

```ts
it("exports explicit empty text when empty XML must be preserved", () => {
  const rule: I8nTextPropertyRule = { type: "I8nText", preserveEmptyXML: true }

  const result = exportI8nTextToYAML({
    context: contextWithExportToYAML,
    rule,
    value: { items: {} },
  })

  expect(result).toBe("")
})

it("omits empty text without empty XML preservation", () => {
  const rule: I8nTextPropertyRule = { type: "I8nText" }

  const result = exportI8nTextToYAML({
    context: contextWithExportToYAML,
    rule,
    value: { items: {} },
  })

  expect(result).toBeUndefined()
})
```

- [ ] **Step 2: Добавить интеграционный тест ресурса регистра**

В `metadataRegisterResource/fromXMLToYAML.test.ts` импортировать
`testPropertyFromXMLToYAML` и `MetadataItemRule`, объявить локальное правило
коллекции:

```ts
const rule = {
  itemType: "MetadataRegisterResourcesProbe",
  properties: {
    value: { type: "MetadataRegisterResources", yaml: "Значение", xml: "Resource" },
  },
} as MetadataItemRule
```

Добавить проверку исходного пустого XML без новой фикстуры:

```ts
it("exports empty resource synonym as explicit empty YAML", () => {
  const result = testPropertyFromXMLToYAML({
    rule,
    xml: {
      Resource: {
        Properties: {
          Name: "Ресурс1",
          Synonym: "",
          Type: {
            "v8:Type": "xs:decimal",
            "v8:NumberQualifiers": {
              "v8:Digits": 10,
              "v8:FractionDigits": 0,
              "v8:AllowedSign": "Any",
            },
          },
        },
      },
    },
  })

  expect(result.yaml).toHaveProperty("Значение.Ресурс1.Синоним", "")
})
```

- [ ] **Step 3: Запустить тесты и подтвердить потерю пустого значения**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/i8nText/toYAML.test.ts metadata/commonObjects/metadataRegisterResource/fromXMLToYAML.test.ts
```

Expected: FAIL — `exportI8nTextToYAML` возвращает `undefined`, а у
`Ресурс1` отсутствует ключ `Синоним`.

- [ ] **Step 4: Реализовать минимальное преобразование в I8nText**

В `exportI8nTextToYAML` после `getTextWithoutName(...)` и перед
`exportFullI8nTextToYAML(...)` добавить:

```ts
if (i8nRule.preserveEmptyXML && textClean !== undefined && Object.keys(textClean.items).length === 0) {
  return ""
}
```

Не применять `trim()` и не считать пустыми строки `" "` или `"\n"`.

- [ ] **Step 5: Запустить тесты I8nText и ресурса регистра**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/i8nText/toYAML.test.ts metadata/commonObjects/i8nText/fromYAML.test.ts metadata/commonObjects/i8nText/fromXML.test.ts metadata/commonObjects/i8nText/toXML.test.ts metadata/commonObjects/metadataRegisterResource/fromXMLToYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать YAML-договор**

```bash
git add packages/core/metadata/commonObjects/i8nText/toYAML.ts packages/core/metadata/commonObjects/i8nText/toYAML.test.ts packages/core/metadata/commonObjects/metadataRegisterResource/fromXMLToYAML.test.ts
git commit -m "fix: :bug: выгружать пустой синоним в YAML"
```

---

### Task 3: Сделать YAML источником явно пустого синонима

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: явный YAML `Синоним: ""`.
- Produces: пустой `<Synonym/>` только из явного YAML; отсутствие ключа не восстанавливает пустоту из reference для правила `preserveEmptyXML`.

- [ ] **Step 1: Изменить тест отсутствующего ключа с reference**

В `fromYAMLToXML.test.ts` заменить прежнее ожидание сохранения пустого
reference:

```ts
it("does not restore empty synonym from reference when YAML omits synonym", () => {
  const result = convertPropertiesFromYAMLToXML({
    context: context(),
    yaml: {},
    rule: synonymRule(),
    name: "ПравилаОтправкиДокументов",
    outputs: [{ key: "owner", referenceXML: { Synonym: {} } }],
  })

  expect(result.outputs.get("owner")).toEqual({})
})
```

Добавить проверку явного пустого YAML:

```ts
it("exports explicit empty YAML synonym as empty XML", () => {
  const result = convertPropertiesFromYAMLToXML({
    context: context(),
    yaml: { Синоним: "" },
    rule: synonymRule(),
    name: "ПравилаОтправкиДокументов",
    outputs: [{ key: "owner", referenceXML: { Synonym: {} } }],
  })

  expect(result.outputs.get("owner")).toEqual({ Synonym: {} })
})
```

- [ ] **Step 2: Запустить тест и подтвердить старое восстановление**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: FAIL — отсутствующий `Синоним` пока копируется из reference.

- [ ] **Step 3: Не копировать reference для представимой в YAML пустоты**

В ранней ветке `convertPropertiesFromYAMLToXML`, которая напрямую вызывает
`writeXMLValue(...)` для отсутствующего YAML-свойства и существующего
reference, добавить нейтральное условие:

```ts
planned.propertyRule.preserveEmptyXML !== true
```

Условие относится к договору свойства, а не к `Synonym` или типу объекта.
После пропуска ветки стандартный импорт применяет обычное значение по
умолчанию правила либо оставляет свойство отсутствующим.

- [ ] **Step 4: Перевести тесты полей регистра на явный YAML**

В `metadataRegisterField/fromYAMLToXML.test.ts`:

- передавать `{ Синоним: "", Тип: "..." }` вместо пустого синонима только
  в `referenceXML`;
- переименовать `expectEmptyCollectionSynonym` в
  `expectExplicitEmptyCollectionSynonym`;
- добавить `Синоним: ""` в YAML элемента коллекции;
- убрать ненужный `referenceXML` из этих проверок.

В `metadataRegisterResource/fromYAMLToXML.test.ts` заменить тест
`preserves reference empty Synonym...` на проверку явного
`Синоним: ""` без reference:

```ts
const result = testPropertyFromYAMLToXML({
  rule,
  yaml: {
    Значение: {
      Содержание: {
        Синоним: "",
        Тип: "Строка(100)",
      },
    },
  },
})
```

Сохранить ожидания `<Synonym/>` и отсутствия `<v8:item>`.

- [ ] **Step 5: Запустить тесты оркестрации и полей регистра**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterField/fromYAMLToXML.test.ts metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать отказ от скрытого reference**

```bash
git add packages/core/metadata/orchestration/property/fromYAMLToXML.ts packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts packages/core/metadata/commonObjects/metadataRegisterField/fromYAMLToXML.test.ts packages/core/metadata/commonObjects/metadataRegisterResource/fromYAMLToXML.test.ts
git commit -m "fix: :bug: брать пустой синоним из YAML"
```

---

### Task 4: Полная проверка

**Files:**
- Verify: `packages/core/**`
- Verify: `/Users/nikita/git/round-trip/cf/all`
- Verify: `/Users/nikita/git/nkdk-yaml/cf`

**Interfaces:**
- Consumes: завершённые задачи 1–3.
- Produces: подтверждённый полный XML → YAML → XML round-trip для пустого синонима `Ресурс1`.

- [ ] **Step 1: Проверить рабочее дерево**

Run:

```bash
git status --short
```

Expected: нет вывода.

- [ ] **Step 2: Запустить все тесты проекта**

Run:

```bash
pnpm test
```

Expected: все пакеты и тесты завершаются успешно.

- [ ] **Step 3: Запустить полный round-trip на cf/all**

Скрипт сам откатывает `/Users/nikita/git/round-trip`, очищает
`/Users/nikita/git/nkdk-yaml/cf` и оставляет XML diff для анализа.

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: импорт и sync завершаются успешно; диагностический прогон может
сохранить другие известные XML-расхождения.

- [ ] **Step 4: Проверить YAML конкретного ресурса**

Run:

```bash
rg -n -A4 "Ресурс1:" /Users/nikita/git/nkdk-yaml/cf/РегистрБухгалтерии/РегистрБухгалтерии1/Свойства.yaml
```

Expected:

```yaml
Ресурс1:
  Синоним: ""
  Тип: Число(10, 0)
```

- [ ] **Step 5: Проверить отсутствие прежнего расхождения XML**

Run:

```bash
git -C /Users/nikita/git/round-trip diff -- cf/all/AccountingRegisters/РегистрБухгалтерии1.xml
```

Expected: в diff отсутствует замена `<Synonym/>` на
`<v8:content>Ресурс 1</v8:content>`. Остальные категории diff не относятся
к критерию этой реализации и разбираются отдельно.

- [ ] **Step 6: Зафиксировать итоговое состояние**

Run:

```bash
git status --short
git log -4 --oneline
```

Expected: worktree `nkdk` чистый; последние три кодовых коммита соответствуют
задачам 1–3. XML-репозиторий остаётся с диагностическими diff, YAML-каталог —
с результатом прогона.
