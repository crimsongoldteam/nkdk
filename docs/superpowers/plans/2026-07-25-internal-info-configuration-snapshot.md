# Сохранение InternalInfo в снимке конфигурации — план реализации

> **Для agentic workers:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans` для выполнения плана по задачам. Шаги отслеживаются флажками (`- [ ]`).

**Цель:** Сохранить UUID из `InternalInfo` вне пользовательского YAML и восстановить их при XML → YAML → XML, а для новых элементов создавать разные устойчивые UUID.

**Архитектура:** Общая оркестрация получает нейтральную зарегистрированную операцию сбора данных снимка и вызывает её для фактически найденного XML-свойства до исключения `forReferenceOnly` из YAML-преобразования. Реализация типа `InternalInfo` единолично знает структуру `ThisNode`, `GeneratedType` и `ContainedObject`, строит их семантические логические адреса и использует среду экспорта снимка для восстановления или создания UUID.

**Стек:** TypeScript 6, metadata type-rule registry, configuration index, Vitest, pnpm, XML/YAML round-trip.

## Общие ограничения

- Пользовательский YAML-договор не меняется: `InternalInfo` не появляется в YAML.
- Общая оркестрация не знает имён `ThisNode`, `GeneratedType`, `ContainedObject` и конкретных metadata item types.
- Сведения о структуре `InternalInfo` находятся только в `metadata/commonObjects/internalInfo`.
- Логические адреса строятся через `childSegmentUid()` и `childUid()`, а не конкатенацией строк.
- Существующие XML-фикстуры не изменяются.
- Совместимость с прежним, фактически отсутствующим форматом снимка не добавляется.
- Порядок XML-свойств в эту задачу не входит.
- Реализация выполняется через RED → GREEN → REFACTOR.

---

### Задача 1: Нейтральная операция сбора данных снимка из XML

**Файлы:**

- Изменить: `packages/core/metadata/orchestration/property/fn.ts:300-425`
- Изменить: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts:1-140`
- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts:95-165`
- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts:285-345`

**Интерфейсы:**

- Создаёт: `CollectConfigurationIndexFromXMLFunction`
- Регистрирует: операцию типа `collectConfigurationIndexFromXML`
- Вызывает: операцию только для свойства, реально найденного в XML
- Гарантирует: операция выполняется и для `forReferenceOnly`, но сама не преобразует значение в YAML

- [ ] **Шаг 1: Добавить RED-тест нейтрального вызова для reference-only свойства**

В `fromXMLToYAML.test.ts` зарегистрировать тестовый тип, который записывает полученное значение через доступный в контексте сборщик:

```ts
it("collects configuration-index data before skipping a reference-only property", () => {
  const indexCollector = createConfigurationIndexCollector()
  const context = withConfigurationIndexCollector(mockContextFromXML(), indexCollector, "Справочник.Товары")

  registerTypeRule("TestReferenceIndex" as PropertyRuleType, "collectConfigurationIndexFromXML", ({
    context,
    xml,
  }) => {
    context.fromXML.configurationIndex?.collector.setUuid(
      "Справочник.Товары.ТехническийUUID",
      String(xml)
    )
  })

  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule: {
      itemType: "TestDirectItem",
      properties: {
        technical: {
          type: "TestReferenceIndex",
          xml: "Technical",
          forReferenceOnly: true,
        },
      },
    } as MetadataItemRule,
    xml: { Technical: "00000000-0000-4000-8000-000000000001" },
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
  })

  expect(yaml).toEqual({})
  expect(indexCollector.fragment("test.yaml").identities).toEqual([
    {
      logicalAddress: "Справочник.Товары.ТехническийUUID",
      kind: "uuid",
      value: "00000000-0000-4000-8000-000000000001",
    },
  ])
})
```

- [ ] **Шаг 2: Запустить RED-тест**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Ожидаемый результат: TypeScript или тест сообщает, что операция `collectConfigurationIndexFromXML` ещё не зарегистрирована и не вызывается.

- [ ] **Шаг 3: Добавить нейтральный договор операции**

В `fn.ts` определить:

```ts
export type CollectConfigurationIndexFromXMLFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
}) => void
```

Добавить `collectConfigurationIndexFromXML` в `TypeRule`, `TypeRulesOperations` и условный тип `importExportFunction`.

В `typeRuleRegistry.ts` добавить функцию в объединение реестра и отдельную ветку условного результата `getTypeRule()` перед завершающей веткой `never`:

```ts
O extends "collectConfigurationIndexFromXML"
  ? CollectConfigurationIndexFromXMLFunction | undefined
```

- [ ] **Шаг 4: Вызвать операцию до исключения reference-only**

В `importMatch()` после сбора стандартного `_uuid`/`_id`, но до:

```ts
if (!forReference && propertyRule.forReferenceOnly === true) return
```

вызвать зарегистрированную операцию в том же контексте свойства, который используется остальными type handlers:

```ts
const collectConfigurationIndex = getTypeRule(propertyRule.type, "collectConfigurationIndexFromXML")
if (sourceXMLKey !== undefined && collectConfigurationIndex !== undefined) {
  runWithConfigurationIndexPropertyContext(
    sourceContext,
    propertyRule.yaml ?? key,
    configurationIndexUidSegment,
    (propertyContext) =>
      collectConfigurationIndex({
        context: propertyContext,
        rule: propertyRule,
        xml: sourceXMLValue,
      }),
    { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
  )
}
```

Вычисление `configurationIndexUidSegment` поднять перед ранним выходом и переиспользовать в дальнейшем преобразовании. Не вызывать `importFromXML`, `importFromXMLToYAML` или `exportToYAML` для исключённого свойства.

- [ ] **Шаг 5: Запустить GREEN-тест оркестрации**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Ожидаемый результат: тест проходит; reference-only значение отсутствует в YAML, но запись снимка создана.

- [ ] **Шаг 6: Закоммитить нейтральный договор**

```bash
git add packages/core/metadata/orchestration/property/fn.ts \
  packages/core/metadata/orchestration/property/typeRuleRegistry.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "feat: :sparkles: добавить сбор данных снимка из XML-свойств"
```

---

### Задача 2: Семантические адреса и сбор UUID InternalInfo

**Файлы:**

- Создать: `packages/core/metadata/commonObjects/internalInfo/configurationIndex.ts`
- Изменить: `packages/core/metadata/commonObjects/internalInfo/fromXML.ts`
- Изменить: `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`

**Интерфейсы:**

- Создаёт: `collectInternalInfoConfigurationIndexFromXML`
- Создаёт: внутренние функции адресов для `ThisNode`, `GeneratedType` и `ContainedObject`
- Регистрирует: `InternalInfo:collectConfigurationIndexFromXML`
- Пишет UUID по адресам владельца, не по адресу свойства `Свойство.internalInfo`

- [ ] **Шаг 1: Добавить RED-тест всех UUID InternalInfo**

Расширить тестовый XML в `fromXML.test.ts` одним `xr:ContainedObject`, выполнить обычный, не reference-import через `importPropertiesFromXMLToYAML()` и проверить:

```ts
expect(yaml).toEqual({})
expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").identities).toEqual([
  {
    logicalAddress: "Справочник.Товары.InternalInfo.GeneratedType.ExchangePlanRef.TypeId",
    kind: "uuid",
    value: "00000000-0000-0000-0000-000000000001",
  },
  {
    logicalAddress: "Справочник.Товары.InternalInfo.GeneratedType.ExchangePlanRef.ValueId",
    kind: "uuid",
    value: "00000000-0000-0000-0000-000000000003",
  },
  {
    logicalAddress: "Справочник.Товары.InternalInfo.ThisNode",
    kind: "uuid",
    value: "00000000-0000-0000-0000-000000000002",
  },
  {
    logicalAddress:
      "Справочник.Товары.InternalInfo.ContainedObject.00000000-0000-0000-0000-000000000101.ObjectId",
    kind: "uuid",
    value: "00000000-0000-0000-0000-000000000201",
  },
])
```

Тест обязан проходить через общую оркестрацию, чтобы доказать работу при `forReferenceOnly`, а не вызывать новый сборщик напрямую.

- [ ] **Шаг 2: Запустить RED-тест InternalInfo**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts
```

Ожидаемый результат: YAML пуст, но `identities` не содержит внутренних UUID.

- [ ] **Шаг 3: Реализовать адреса и сбор**

В `configurationIndex.ts` строить адреса:

```ts
const internalInfoAddress = (owner: string) => childSegmentUid(owner, "InternalInfo")

const generatedTypeAddress = (owner: string, name: string) =>
  childUid(internalInfoAddress(owner), "GeneratedType", name)

const containedObjectAddress = (owner: string, classId: string) =>
  childUid(internalInfoAddress(owner), "ContainedObject", classId)
```

В `collectInternalInfoConfigurationIndexFromXML()`:

- получить владельца через `getConfigurationIndexCollectionContext(context)?.logicalAddress`;
- нормализовать одиночные и множественные `xr:GeneratedType`/`xr:ContainedObject` в массивы;
- взять имя `GeneratedType` тем же способом, что и текущий импорт: `item._name.split(".")[0]`;
- записать непустые значения через `collector.setUuid()`;
- не создавать модель и не менять XML.

Зарегистрировать обработчик рядом с типом:

```ts
registerTypeRule(
  "InternalInfo",
  "collectConfigurationIndexFromXML",
  collectInternalInfoConfigurationIndexFromXML
)
```

Существующий reference-import в `fromXML.ts` оставить без изменения поведения.

- [ ] **Шаг 4: Запустить GREEN-тест импорта**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts
```

Ожидаемый результат: все четыре категории UUID записаны по разным семантическим адресам, YAML остаётся пустым.

- [ ] **Шаг 5: Закоммитить сбор InternalInfo**

```bash
git add packages/core/metadata/commonObjects/internalInfo/configurationIndex.ts \
  packages/core/metadata/commonObjects/internalInfo/fromXML.ts \
  packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
git commit -m "feat: :sparkles: сохранять UUID InternalInfo в снимке"
```

---

### Задача 3: Восстановление и устойчивое создание UUID при экспорте

**Файлы:**

- Изменить: `packages/core/metadata/commonObjects/internalInfo/configurationIndex.ts`
- Изменить: `packages/core/metadata/commonObjects/internalInfo/toXML.ts`
- Изменить: `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`

**Интерфейсы:**

- Создаёт: `resolveInternalInfoUuid(context, logicalAddress, fallback?)`
- Читает: UUID из исходного снимка
- Создаёт: UUID через `identityOrCreate("uuid", logicalAddress)` только при отсутствии снимка и существующего значения
- Пишет: восстановленный, существующий или новый UUID в сборщик результата

- [ ] **Шаг 1: Добавить RED-тест восстановления через снимок**

Использовать `createDirectRoundTripContexts({ logicalAddress: "Справочник.Товары" })`:

1. импортировать `InternalInfo` обычным XML → YAML обходом;
2. экспортировать без `referenceMetadata`;
3. проверить исходные `ThisNode`, `TypeId`, `ValueId` и `ObjectId`.

Ключевая проверка:

```ts
expect(exported).toMatchObject({
  "xr:ThisNode": "00000000-0000-0000-0000-000000000002",
  "xr:GeneratedType": [{
    "xr:TypeId": "00000000-0000-0000-0000-000000000001",
    "xr:ValueId": "00000000-0000-0000-0000-000000000003",
  }],
  "xr:ContainedObject": [{
    "xr:ClassId": "00000000-0000-0000-0000-000000000101",
    "xr:ObjectId": "00000000-0000-0000-0000-000000000201",
  }],
})
```

- [ ] **Шаг 2: Добавить RED-тест нового InternalInfo**

Создать два независимых export-контекста с одинаковым исходным пустым снимком и одним `logicalAddress`. Экспортировать объявленные `thisNode`, два `GeneratedType` и два `ContainedObject`, затем проверить:

```ts
expect(new Set(allGeneratedUuids).size).toBe(allGeneratedUuids.length)
expect(secondExport).toEqual(firstExport)
```

Так тест фиксирует одновременно два свойства: разные адреса не получают UUID владельца, а повторный экспорт создаёт те же значения независимо от порядка вызовов.

- [ ] **Шаг 3: Запустить RED-тесты экспорта**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts
```

Ожидаемый результат: текущий код вызывает `getUUID(context)` без отдельного адреса, поэтому новые `TypeId`/`ValueId` совпадают, а UUID из снимка не восстанавливаются.

- [ ] **Шаг 4: Реализовать единое разрешение UUID**

В `configurationIndex.ts`:

```ts
export function resolveInternalInfoUuid(params: {
  context: ConfigurationContext
  logicalAddress: string
  fallback?: string
}): string {
  const runtime = params.context.exportToXML?.configurationIndex
  if (runtime === undefined) return params.fallback ?? getUUID(params.context)

  const stored = runtime.identity("uuid", params.logicalAddress)
  if (stored !== undefined) {
    runtime.collector.setUuid(params.logicalAddress, stored)
    return stored
  }
  if (params.fallback !== undefined) {
    runtime.collector.setUuid(params.logicalAddress, params.fallback)
    return params.fallback
  }
  return runtime.identityOrCreate("uuid", params.logicalAddress)
}
```

Не использовать голый `getUUID(context)` внутри нового пути снимка.

- [ ] **Шаг 5: Перевести все ветви InternalInfo на семантические адреса**

В `toXML.ts` получить адрес владельца из:

```ts
const ownerAddress = context.exportToXML?.configurationIndex?.logicalAddress
```

Для каждого значения применять один и тот же приоритет:

1. UUID из снимка;
2. существующее значение из reference/model как `fallback`;
3. устойчиво созданный UUID.

Применить это к:

- `xr:ThisNode`;
- `xr:GeneratedType/xr:TypeId`;
- `xr:GeneratedType/xr:ValueId`;
- объявленным и дополнительным `xr:ContainedObject/xr:ObjectId`.

Если среды снимка нет, сохранить прежнее поведение тестового и production-контекста через `getUUID()`.

- [ ] **Шаг 6: Запустить GREEN-тесты InternalInfo и типов**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/internalInfo/fromXML.test.ts metadata/commonObjects/internalInfo/toXML.test.ts
pnpm --filter @nkdk/core run type-check
```

Ожидаемый результат: исходные UUID восстановлены, новые UUID различны и устойчивы, прежние тесты без снимка проходят.

- [ ] **Шаг 7: Закоммитить экспорт InternalInfo**

```bash
git add packages/core/metadata/commonObjects/internalInfo/configurationIndex.ts \
  packages/core/metadata/commonObjects/internalInfo/toXML.ts \
  packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
git commit -m "fix: :bug: восстанавливать UUID InternalInfo из снимка"
```

---

### Задача 4: Сквозная проверка и round-trip cf/all

**Файлы:**

- Изменить при необходимости только тест: `packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts`
- Не изменять XML-фикстуры.

- [ ] **Шаг 1: Добавить сквозной XML → YAML → XML тест**

Через `testPropertyFromXMLToYAML()` и `testPropertyFromYAMLToXML()` с общим `createDirectRoundTripContexts()` проверить, что:

- YAML не содержит `InternalInfo`;
- результирующий XML содержит исходные UUID;
- сборщик export runtime содержит те же identity-записи.

- [ ] **Шаг 2: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/commonObjects/internalInfo/fromXML.test.ts \
  metadata/commonObjects/internalInfo/toXML.test.ts
pnpm --filter @nkdk/core run type-check
```

- [ ] **Шаг 3: Запустить весь проект**

```bash
pnpm test
```

Ожидаемый результат: все пакеты и тесты проходят.

- [ ] **Шаг 4: Закоммитить сквозной тест, если он был отдельным изменением**

```bash
git add packages/core/metadata/commonObjects/internalInfo/fromXML.test.ts
git commit -m "test: :white_check_mark: проверить round-trip UUID InternalInfo"
```

- [ ] **Шаг 5: Запустить диагностический round-trip на cf/all**

Перед этим рабочее дерево `nkdk` должно быть чистым. Скрипт сам откатывает XML-репозиторий и очищает заданный YAML-каталог:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all \
  NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Критерий задачи: в `git -C /Users/nikita/git/round-trip diff -- cf/all` нет изменений `xr:ThisNode`, `xr:TypeId`, `xr:ValueId` и `xr:ObjectId`, вызванных потерей снимка. Расхождения порядка и другие категории фиксируются отдельно и не блокируют эту задачу.

---

## Итоговая самопроверка

- [ ] В общей оркестрации нет строк `InternalInfo`, `ThisNode`, `GeneratedType` и `ContainedObject`.
- [ ] У каждого технического UUID отдельный семантический логический адрес.
- [ ] Обычный XML → YAML импорт собирает UUID, но не выводит `InternalInfo` в YAML.
- [ ] Экспорт переносит использованные UUID в новый частичный снимок.
- [ ] Новые UUID различаются по адресам и повторяются при неизменном входе.
- [ ] `pnpm test` проходит.
- [ ] Round-trip `cf/all` больше не содержит расхождений UUID `InternalInfo`.
