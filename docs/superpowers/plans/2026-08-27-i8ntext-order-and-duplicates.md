# I8nText order and duplicate languages implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять порядок, незарегистрированные языки и повторные `v8:item` локализованного текста без `!xml/raw`, используя общий механизм именованных YAML-коллекций.

**Architecture:** `I8nText` сохраняет обычный словарь `items` для смыслового доступа и невидимую последовательность исходных вхождений для точного XML-экспорта. XML → YAML передаёт эти вхождения существующему `projectNamedXmlCollectionForImport`, а YAML → XML читает логические ключи существующим `xmlAnnotatedMappingEntries`; собственная нумерация дублей в `I8nText` запрещена.

**Tech Stack:** TypeScript 7, Vitest, `@nkdk/runtime` YAML/XML annotations, metadata PropertyRule runtime.

**Spec:** `docs/superpowers/specs/2026-08-23-common-types-xml-anomaly-framework-design.md`, раздел «Матрица повторной классификации I8nText».

## Global Constraints

- Публичные теги дублей остаются общими: `!xml/invalid`, `!xml/invalid/2`, `/3` и далее.
- Порядок хранится порядком YAML mapping; отдельные поля и `#order` не добавляются.
- Незарегистрированный язык получает `!xml/invalid` на ключе языка.
- Неканонический порядок без `!xml/invalid` на карте является ошибкой проверки; экспорт всё равно сохраняет заданный порядок.
- `!xml/raw` допустим только для непонятной структуры самого `v8:item`, но не для понятного порядка, языка или дубля.
- Первый элемент языка остаётся смысловым значением `I8nText.items[language]`; все вхождения сохраняются для XML-экспорта.
- Существующие XML-фикстуры не изменяются.
- После каждого слоя выполняется `pnpm duplicates -- --base 53085c216`.
- Проверка на каталоге `doc` в этот план не входит; проверяется целевой код и e2e.

---

### Task 1: Сохранить повторные языки во внутреннем значении I8nText

**Files:**
- Modify: `packages/rules/metadata/commonObjects/i8nText/anomalies.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/fromXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts`

**Interfaces:**
- Produces: `localizedItemOccurrences(items)` — упорядоченные `{ language, content }[]`, включая повторы.
- Produces: `copyLocalizedItemTags(source, target)` — переносит и порядок, и внутренние вхождения.
- Consumes: существующие `markYAMLMappingKeyOrder` и `yamlMappingKeys` для обычных значений без повторов.

- [ ] **Step 1: Добавить падающий тест XML → модель для разных и разнесённых дублей**

```ts
it("keeps the first semantic value and all ordered language occurrences", () => {
  const result = importI8nTextFromXML(multilingualXMLContext, mockRule, {
    "v8:item": [
      { "v8:lang": "ru", "v8:content": "Первый" },
      { "v8:lang": "en", "v8:content": "Text" },
      { "v8:lang": "ru", "v8:content": "Второй" },
    ],
  })!

  expect(result.items).toEqual({ ru: "Первый", en: "Text" })
  expect(localizedItemOccurrences(result.items)).toEqual([
    { language: "ru", content: "Первый" },
    { language: "en", content: "Text" },
    { language: "ru", content: "Второй" },
  ])
})
```

- [ ] **Step 2: Запустить тест и подтвердить текущее исключение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit packages/rules/metadata/commonObjects/i8nText/fromXML.test.ts
```

Expected: FAIL с `Неподдерживаемый повтор языка "ru"`.

- [ ] **Step 3: Заменить частную обработку соседних дублей сохранением всех вхождений**

В `anomalies.ts` хранить последовательность в `WeakMap`, чтобы не добавлять служебное поле в YAML или публичный `I8nText`:

```ts
export interface LocalizedItemOccurrence {
  readonly language: string
  readonly content: string
}

const localizedOccurrences = new WeakMap<object, readonly LocalizedItemOccurrence[]>()

export function localizedItemOccurrences(items: Record<string, string>): readonly LocalizedItemOccurrence[] {
  return localizedOccurrences.get(items) ?? yamlMappingKeys(items).map((language) => ({
    language,
    content: items[language] ?? "",
  }))
}

function markLocalizedItemOccurrences(
  items: Record<string, string>,
  occurrences: readonly LocalizedItemOccurrence[],
): void {
  localizedOccurrences.set(items, occurrences.map((entry) => ({ ...entry })))
  markYAMLMappingKeyOrder(items, [...new Set(occurrences.map(({ language }) => language))])
}
```

`importLocalizedItems` проходит каждый `v8:item`, записывает в `items` только первое значение каждого языка и всегда передаёт полный список в `markLocalizedItemOccurrences`. Удалить `unsupportedDuplicate` и пропуск второго соседнего элемента.

- [ ] **Step 4: Добавить падающий тест точного модель → XML экспорта**

```ts
it("exports every remembered language occurrence in source order", () => {
  const value = importI8nTextFromXML(multilingualXMLContext, mockRule, {
    "v8:item": [
      { "v8:lang": "ru", "v8:content": "Первый" },
      { "v8:lang": "en", "v8:content": "Text" },
      { "v8:lang": "ru", "v8:content": "Второй" },
    ],
  })!

  expect(exportI8nTextToXML(mockContext, mockRule, value)?.["v8:item"]).toEqual([
    { "v8:lang": "ru", "v8:content": "Первый" },
    { "v8:lang": "en", "v8:content": "Text" },
    { "v8:lang": "ru", "v8:content": "Второй" },
  ])
})
```

- [ ] **Step 5: Перевести `exportLocalizedItems` на сохранённые вхождения**

Использовать `localizedItemOccurrences(params.items)` вместо обхода ключей. Для `emptyDefaultIsMarker` отфильтровать только синтетический пустой маркер основного языка; реальные непустые и повторные элементы не менять. В `copyLocalizedItemTags` копировать WeakMap-последовательность вместе с порядком.

- [ ] **Step 6: Запустить тесты слоя и проверку дублей**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit packages/rules/metadata/commonObjects/i8nText/fromXML.test.ts packages/rules/metadata/commonObjects/i8nText/toYAML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts
pnpm duplicates -- --base 53085c216
```

Expected: PASS; новых дубликатов кода нет.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/i8nText/anomalies.ts packages/rules/metadata/commonObjects/i8nText/fromXML.test.ts packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts
git commit -m "fix: :bug: сохранить повторные языки I8nText"
```

---

### Task 2: Проецировать I8nText в YAML общим механизмом дублей

**Files:**
- Create: `packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.ts`
- Create: `packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toYAML.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`

**Interfaces:**
- Consumes: `localizedItemOccurrences(items)` из Task 1.
- Consumes: `projectNamedXmlCollectionForImport` из `@nkdk/runtime`.
- Produces: `importI8nTextFromXMLToYAML: ImportFromXMLToYAMLFunction`.

- [ ] **Step 1: Добавить интеграционный тест общей адресации дублей**

Построить минимальный metadata-item с `I8nText`-свойством и вызвать штатный `importPropertiesFromXMLToYAML` с `createXmlAnomalyAnnotations`. Проверить сериализацию:

```yaml
Заголовок:
  ru: Первый
  en: Text
  !xml/invalid ru: Второй
  !xml/invalid/2 ru: Третий
```

Тест должен дополнительно проверить `xmlAnnotatedMappingEntries` и убедиться, что логические ключи равны `ru, en, ru, ru`, а внутренних `__NKDK_XML_ANOMALY_KEY_...` в тексте нет.

- [ ] **Step 2: Запустить тест и подтвердить падение на существующем `I8nText`-обработчике**

```bash
pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.integration.test.ts
```

Expected: FAIL — дубли не представлены отдельными YAML-записями.

- [ ] **Step 3: Добавить прямой обработчик XML → YAML**

Обработчик сначала использует существующие `importI8nTextFromXML` и `exportI8nTextToYAML`, чтобы сохранить договоры `preserveEmptyXML` и `excludeIfEqualNameYAML`. Если результат — mapping либо в исходной последовательности есть повтор, он формирует `NamedXmlCollectionEntry<string>[]`:

```ts
const entries = yamlOccurrences.map(({ language, content }) => ({
  key: language,
  value: content,
  ...(context.languages.registeredSet.has(language) ? {} : { invalid: true }),
}))

return projectNamedXmlCollectionForImport({
  entries,
  annotations: traversal.annotations,
})
```

Служебные коды `""` и `"#"` не классифицировать как незарегистрированные: для них остаётся прежний legacy-договор. Синтетический пустой маркер основного языка для `excludeIfEqualNameYAML` добавить один раз перед остальными языками, но не считать XML-вхождением.

- [ ] **Step 4: Удалить канонизацию порядка из обычного `toYAML`**

`exportFullI8nTextToYAML` должен возвращать mapping в порядке `localizedItemOccurrences`, а не строить `canonicalItems`. Для уникального основного языка scalar-свёртка сохраняется; при двух вхождениях одного языка результат обязан остаться mapping.

- [ ] **Step 5: Зарегистрировать новый обработчик в статической композиции**

Добавить импорт `metadataPropertyRule000` из `../commonObjects/i8nText/fromXMLToYAML` в `staticPropertyRules.ts` рядом с остальными операциями `I8nText`, не меняя направления зависимостей.

- [ ] **Step 6: Добавить случаи незарегистрированного языка и сочетания с дублем**

Проверить две сериализации:

```yaml
Заголовок:
  ru: Текст
  !xml/invalid de: Text
```

```yaml
Заголовок:
  !xml/invalid de: Eins
  !xml/invalid/2 de: Zwei
```

Во втором случае применяется единая нумерация общего построителя: отдельной нумерации `I8nText` нет.

- [ ] **Step 7: Запустить тесты слоя и проверку дублей**

```bash
pnpm --filter @nkdk/rules exec vitest run --project unit packages/rules/metadata/commonObjects/i8nText/toYAML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.integration.test.ts
pnpm duplicates -- --base 53085c216
```

Expected: PASS; новые теги совпадают с общим договором именованных коллекций.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.ts packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.integration.test.ts packages/rules/metadata/commonObjects/i8nText/toYAML.ts packages/rules/metadata/composition/staticPropertyRules.ts
git commit -m "feat: :sparkles: проецировать дубли I8nText общим механизмом"
```

---

### Task 3: Восстановить повторные v8:item из аннотированного YAML

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/fromYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts`

**Interfaces:**
- Produces: необязательный `annotations?: XmlAnomalyAnnotations` в `ImportFromYAMLFunctionNew` и `AtomicFromYAMLParams`.
- Consumes: `xmlAnnotatedMappingEntries(value, annotations)` для чтения логических ключей.
- Consumes: внутреннее сохранение вхождений из Task 1.

- [ ] **Step 1: Добавить падающий runtime-тест передачи таблицы аннотаций атомарному обработчику**

В `fromYAMLToXML.test.ts` разобрать mapping с `!xml/invalid`-ключом и зарегистрировать тестовый `importFromYAML`:

```ts
expect(received.annotations).toBe(parsed.annotations)
```

Это проверяет только границу runtime; предметную логику I8nText сюда не помещать.

- [ ] **Step 2: Передать аннотации без изменения общих PropertyRule**

Расширить только параметры функции операции:

```ts
export type ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  yaml?: unknown
  annotations?: XmlAnomalyAnnotations
  source?: unknown
  value: unknown
  // остальные существующие поля
}) => unknown | undefined
```

`convertPropertiesFromYAMLToXML` передаёт `params.annotations` в `AtomicFromYAMLParams`, а `callAtomicFromYAML` — в обработчик. Нового поля в `BasePropertyRule` и `PropertyRule` не добавлять.

- [ ] **Step 3: Добавить падающий I8nText YAML → XML тест**

Разобрать:

```yaml
ru: Первый
en: Text
!xml/invalid ru: Второй
!xml/invalid/2 ru: Третий
```

Передать `parsed.data` и `parsed.annotations` штатной атомарной границе и ожидать четыре `v8:item` в том же порядке.

- [ ] **Step 4: Читать mapping через общий декодер логических ключей**

В `importI8nTextFromYAML` для object-значения:

```ts
const entries = annotations === undefined
  ? Object.entries(data)
  : xmlAnnotatedMappingEntries(data, annotations)
```

Сформировать смысловой `items` по первому вхождению каждого языка и сохранить полный порядок через helper Task 1. При объединении с reference YAML-языки целиком заменяют все reference-вхождения тех же кодов; языки только из reference добавляются после YAML в исходном reference-порядке.

- [ ] **Step 5: Проверить удаление и перенумерацию ключевых тегов**

Добавить проверки:

- удаление `!xml/invalid/2` удаляет только соответствующий третий `v8:item`;
- ручная последовательность `!xml/invalid/2` без первого `!xml/invalid` блокируется существующей проверкой `xml/anomaly-address-invalid`;
- изменение текста второго дубля меняет только второй повторный `v8:item`.

- [ ] **Step 6: Запустить тесты слоя, type-check и проверку дублей**

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project unit packages/rules/metadata/commonObjects/i8nText/fromYAML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts
pnpm type-check
pnpm duplicates -- --base 53085c216
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/property/fn.ts packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.test.ts packages/rules/metadata/commonObjects/i8nText/fromYAML.ts packages/rules/metadata/commonObjects/i8nText/fromYAML.test.ts packages/rules/metadata/commonObjects/i8nText/toXML.integration.test.ts
git commit -m "fix: :bug: восстановить повторные языки из YAML"
```

---

### Task 4: Проверять канонический порядок I8nText

**Files:**
- Modify: `packages/runtime/metadata/validation/localizedTextYAML.ts`
- Modify: `packages/runtime/metadata/validation/localizedTextYAML.test.ts`
- Modify: `packages/runtime/metadata/validation/excludeIfEqualNameYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/i8nText/anomalies.ts`
- Modify: `packages/rules/metadata/validation/excludeIfEqualNameYAML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts`

**Interfaces:**
- Consumes: `XmlAnomalyAnnotations` и `xmlAnnotatedMappingEntries`.
- Produces: ошибка на границе всей карты при неканоническом порядке.
- Produces: ошибки незарегистрированных языков по логическим, а не внутренним runtime-ключам.

- [ ] **Step 1: Заменить существующий тест, разрешающий неканонический порядок, на падающий договор**

```ts
it("rejects a noncanonical language order at the mapping boundary", () => {
  expect(issuesFor("Заголовок:\n  en: Text\n  ru: Текст")).toEqual([
    expect.objectContaining({
      path: ["Заголовок"],
      message: expect.stringMatching(/порядок языков/iu),
    }),
  ])
})
```

Отдельно оставить проверку незарегистрированного `de`: она должна вернуть и ошибку порядка карты, и ошибку самого ключа, если обе причины присутствуют.

- [ ] **Step 2: Исправить определение канонического порядка**

`isCanonicalLanguageOrder` должен сравнивать порядок первых вхождений уникальных кодов:

```ts
const uniqueCodes = [...new Set(codes)]
return uniqueCodes.every((code, index) =>
  code === canonicalCodes(uniqueCodes, defaultCode)[index]
)
```

Повтор сам по себе проверяется общим механизмом дублей и не создаёт вторую ошибку порядка.

- [ ] **Step 3: Научить локальную проверку читать логические mapping entries**

Добавить `annotations?: XmlAnomalyAnnotations` в параметры `validateLocalizedTextYAMLProperty`. Если таблица передана, получать коды через `xmlAnnotatedMappingEntries(items, annotations)`; иначе использовать обычные ключи. `validateExcludedEqualNameYAML` передаёт `params.parsed.annotations`.

- [ ] **Step 4: Подтвердить поведение тегов интеграционным тестом импорта**

Для XML-порядка `en, ru` итоговый YAML должен быть:

```yaml
Заголовок: !xml/invalid
  en: Text
  ru: Текст
```

Для `de, ru, ru` итоговый YAML должен одновременно содержать invalid карты, invalid ключа `de` и общий ключ `!xml/invalid ru` для дубля. После удаления тега карты обычная проверка сообщает ошибку порядка; экспорт порядка при этом не меняется.

- [ ] **Step 5: Запустить проверки слоя и проверку дублей**

```bash
pnpm --filter @nkdk/runtime exec vitest run --project unit packages/runtime/metadata/validation/localizedTextYAML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project unit packages/rules/metadata/validation/excludeIfEqualNameYAML.test.ts
pnpm --filter @nkdk/rules exec vitest run --project integration packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts
pnpm duplicates -- --base 53085c216
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/metadata/validation/localizedTextYAML.ts packages/runtime/metadata/validation/localizedTextYAML.test.ts packages/runtime/metadata/validation/excludeIfEqualNameYAML.ts packages/rules/metadata/commonObjects/i8nText/anomalies.ts packages/rules/metadata/validation/excludeIfEqualNameYAML.test.ts packages/rules/metadata/importFromXml/prepareYaml.integration.test.ts
git commit -m "feat: :sparkles: проверять порядок языков I8nText"
```

---

### Task 5: Сквозная проверка e2e и архитектуры

**Files:**
- Modify only if generated output changes: `e2e/fixtures/nkdk/**/*.yaml`
- Verify: `e2e/metadata-project.test.ts`

**Interfaces:**
- Consumes: завершённые договоры Tasks 1–4.
- Produces: подтверждённый XML → YAML → XML без списков исключений.

- [ ] **Step 1: Пересоздать только NKDK e2e YAML-фикстуры**

```bash
pnpm fixtures:e2e:nkdk
```

Не изменять `e2e/fixtures/xml`. Просмотреть diff и оставить только изменения, объясняемые новым порядком или удалением широкого raw `I8nText`.

- [ ] **Step 2: Запустить e2e вне песочницы**

```bash
pnpm test:e2e
```

Expected: все тесты проходят; списков исключений XML-сравнения нет.

- [ ] **Step 3: Проверить отсутствие новых широких raw**

```bash
rg -n -U "!xml/raw(?:\n[[:space:]]+.*){4}" e2e/fixtures/nkdk
```

Expected: новые большие raw локализованного текста отсутствуют; ранее согласованные `ЗначениеЗаполнения` и `Settings` не меняются этой задачей.

- [ ] **Step 4: Выполнить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 53085c216
```

Expected: все команды завершаются успешно.

- [ ] **Step 5: Зафиксировать только фактические e2e-изменения**

Если diff e2e отсутствует, коммит не создавать. Иначе:

```bash
git add e2e/fixtures/nkdk e2e/metadata-project.test.ts
git commit -m "test: :white_check_mark: закрепить I8nText без raw"
```

- [ ] **Step 6: Сверить результат со спецификацией**

Подтвердить в итоговом отчёте четыре независимых договора:

1. неканонический порядок сохраняется и требует invalid карты;
2. незарегистрированный язык требует invalid ключа;
3. повторы используют общий ряд `!xml/invalid`, `/2`, `/3`;
4. понятные `v8:item` не поднимают raw на весь `I8nText`.
