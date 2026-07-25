# Полный порядок XML-свойств в снимке конфигурации — план реализации

> **Для agentic workers:** ОБЯЗАТЕЛЬНЫЙ SUB-SKILL: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans` для выполнения плана по задачам. Шаги отслеживаются флажками (`- [ ]`).

**Цель:** Сохранять в существующем `ConfigurationXmlNode.order` полный порядок всех распознанных XML-свойств, включая `forReferenceOnly`, и восстанавливать его без добавления технических полей в YAML.

**Архитектура:** XML-план остаётся единым источником сопоставления XML-узлов с каноническими ключами `rules.ts`. Оркестрация сначала наблюдает фактически найденное свойство для снимка, затем независимо решает, преобразовывать ли его в YAML. Наблюдения всех частичных источников группируются по логическому адресу физического XML-узла, устойчиво объединяются и передаются в `setOrder()` ровно один раз; существующий экспорт уже читает этот список и вставляет новые свойства по декларативному порядку.

**Стек:** TypeScript 6, metadata property orchestration, configuration index, Vitest, pnpm, XML/YAML round-trip.

## Общие ограничения

- Формат снимка не расширяется: используется существующее поле `ConfigurationXmlNode.order`.
- В `order` записываются канонические ключи `rules.ts`, а исходные XML-имена остаются в `aliases`.
- `forReferenceOnly` участвует в наблюдении порядка, но не в YAML-преобразовании.
- Неизвестные `rules.ts` XML-узлы в порядок не попадают.
- Общая оркестрация не знает про `InternalInfo` и конкретные metadata item types.
- Существующие XML-фикстуры не изменяются.
- Правила `fromXML`/`toXML` и пользовательский YAML-договор не меняются.
- Исправление UUID внутри `InternalInfo` выполняется отдельным планом.
- Реализация выполняется через RED → GREEN → REFACTOR.

---

### Задача 1: Наблюдать reference-only свойства до исключения из YAML

**Файлы:**

- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts:95-145`
- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts:470-590`

**Инвариант:**

```text
фактически найдено в XML
        ↓
наблюдение order / alias / significant presence
        ↓
forReferenceOnly? ── да ──> остановить YAML-преобразование
        │
        нет
        ↓
обычный XML → модель → YAML
```

- [ ] **Шаг 1: Добавить RED-тест полного порядка без изменения YAML**

В `fromXMLToYAML.test.ts` описать три контейнера в порядке XML:

```ts
const rule = {
  itemType: "TestDirectItem",
  properties: {
    internalInfo: {
      type: "string",
      xml: "InternalInfo",
      forReferenceOnly: true,
    },
    name: {
      type: "string",
      xml: "Name",
      xmlParents: ["Properties"],
      yaml: "Имя",
    },
    resources: {
      type: "string",
      xml: "Resource",
      xmlParents: ["ChildObjects"],
      yaml: "Ресурсы",
    },
  },
} as MetadataItemRule
```

Импортировать:

```ts
{
  InternalInfo: {},
  Properties: { Name: "Товары" },
  ChildObjects: { Resource: "Ресурс1" },
}
```

Проверить:

```ts
expect(yaml).toEqual({ Имя: "Товары", Ресурсы: "Ресурс1" })
expect(indexCollector.fragment("Справочник/Товары/Свойства.yaml").xmlNodes).toEqual([
  {
    logicalAddress: "Справочник.Товары",
    order: ["internalInfo", "name", "resources"],
  },
])
```

- [ ] **Шаг 2: Добавить RED-тест неизвестного XML-узла**

В тот же XML между `InternalInfo` и `Properties` добавить `Unknown: {}` и сохранить прежнее ожидание `order`. Это фиксирует, что наблюдение строится по XML-плану, а не через необработанный `Object.keys(xml)`.

- [ ] **Шаг 3: Запустить RED-тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Ожидаемый результат: текущий код исключает `internalInfo` раньше записи порядка, поэтому снимок содержит только `["name", "resources"]`.

- [ ] **Шаг 4: Перенести наблюдение перед ранним выходом**

В `importMatch()` выполнить для найденного `sourceXMLKey`:

1. добавить канонический `key` в наблюдаемый порядок;
2. сохранить alias, если XML использует неканоническое имя;
3. сохранить significant presence;
4. вызвать зарегистрированный сбор данных снимка типа, если он есть;
5. только после этого применить:

```ts
if (!forReference && propertyRule.forReferenceOnly === true) return
```

Не переносить выше раннего выхода преобразование значения, вычисление default, экспорт в YAML и сбор локальных фактов.

- [ ] **Шаг 5: Запустить GREEN-тесты импорта**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Ожидаемый результат: `internalInfo` присутствует только в `order`, неизвестный узел отсутствует и в YAML, и в снимке.

- [ ] **Шаг 6: Закоммитить наблюдение reference-only**

```bash
git add packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "fix: :bug: учитывать reference-only в порядке XML"
```

---

### Задача 2: Единожды записывать объединённый порядок физического XML-узла

**Файлы:**

- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts:55-90, 390-455`
- Изменить: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts:110-150`

**Интерфейсы:**

- Создаёт внутри обхода: аккумулятор порядка по `xmlNodeLogicalAddress`
- Объединяет: канонические ключи устойчиво, с удалением повторов
- Вызывает: `collector.setOrder(address, keys)` один раз на логический адрес

- [ ] **Шаг 1: Добавить RED-тест двух частичных источников одного XML-узла**

Создать два tagged-источника с одним `ConfigurationIndexCollector` и одинаковым `xmlNodeLogicalAddress`:

```ts
const context = withConfigurationIndexCollector(
  mockContextFromXML(),
  indexCollector,
  "Справочник.Товары"
)

const sources = [
  {
    context,
    xml: { First: "1", Third: "3" },
    tags: ["main"],
  },
  {
    context,
    xml: { Second: "2" },
    tags: ["additional"],
  },
]
```

Правило связывает `first`/`third` с тегом `main`, а `second` — с `additional`. Проверить один узел:

```ts
expect(indexCollector.fragment("test.yaml").xmlNodes).toEqual([
  {
    logicalAddress: "Справочник.Товары",
    order: ["first", "third", "second"],
  },
])
```

И отдельно проверить YAML всех трёх обычных свойств. Порядок источников задаёт устойчивую последовательность между частичными XML-представлениями; порядок внутри каждого источника задаёт его XML.

- [ ] **Шаг 2: Запустить RED-тест объединения**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Ожидаемый результат: первый `setOrder()` записывает неполный список, второй вызывает конфликт снимка по тому же `logicalAddress`.

- [ ] **Шаг 3: Заменить списки источников общим аккумулятором**

В начале `importPropertiesFromXMLToYAML()` создать:

```ts
const observedOrderByXmlNode = new Map<
  string,
  {
    collector: ConfigurationIndexCollector
    keys: string[]
    seen: Set<string>
  }
>()
```

При наблюдении найденного свойства:

```ts
const observation = observedOrderByXmlNode.get(xmlNodeLogicalAddress) ?? {
  collector: indexCollection.collector,
  keys: [],
  seen: new Set<string>(),
}
if (!observation.seen.has(key)) {
  observation.seen.add(key)
  observation.keys.push(key)
}
observedOrderByXmlNode.set(xmlNodeLogicalAddress, observation)
```

После завершения всех source traversals:

```ts
for (const [logicalAddress, observation] of observedOrderByXmlNode) {
  if (observation.keys.length > 0) {
    observation.collector.setOrder(logicalAddress, observation.keys)
  }
}
```

Удалить `importedKeysInSourceOrder` из `sourceStates` и прежний цикл `setOrder()` по источникам. Не менять проверку, запрещающую преобразовывать одно свойство из нескольких источников.

- [ ] **Шаг 4: Защитить границу сборщиков**

Если два источника объявляют один `xmlNodeLogicalAddress`, но используют разные экземпляры `ConfigurationIndexCollector`, завершать импорт понятной ошибкой до записи:

```text
Для одного XML-узла Справочник.Товары используются разные сборщики снимка
```

Добавить короткий тест этой ошибки. Молчаливое объединение между разными заданиями недопустимо.

- [ ] **Шаг 5: Запустить GREEN-тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
pnpm --filter @nkdk/core run type-check
```

Ожидаемый результат: один полный `order` без конфликта; существующие тесты tagged sources и разных физических узлов проходят.

- [ ] **Шаг 6: Закоммитить объединение порядка**

```bash
git add packages/core/metadata/orchestration/property/fromXMLToYAML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts
git commit -m "refactor: :recycle: объединять порядок частичных XML-источников"
```

---

### Задача 3: Зафиксировать применение полного порядка при экспорте

**Файлы:**

- Изменить: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Изменить при обнаружении дефекта: `packages/core/metadata/orchestration/property/helpers.ts:235-330`
- Изменить: `packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts`

**Существующий механизм:**

- `getConfigurationIndexPropertyOrder(context)` читает `ConfigurationXmlNode.order`;
- `getOrderedKeysToXML()` закрепляет существующие ключи в порядке снимка;
- новые ключи вставляются по `order` из `rules.ts`;
- без снимка действует порядок контейнеров `InternalInfo → Properties → ChildObjects`.

- [ ] **Шаг 1: Добавить тест относительного порядка из снимка**

В `helpers.test.ts` создать export runtime с `order`:

```ts
["internalInfo", "name", "resources"]
```

и правилом, где свойства объявлены в другом порядке. Проверить:

```ts
expect(getOrderedKeysToXML({ context, rule, referenceMetadata: undefined })).toEqual([
  "internalInfo",
  "name",
  "resources",
])
```

- [ ] **Шаг 2: Добавить тест нового свойства**

К тому же правилу добавить новое свойство `synonym` внутри `Properties` с декларативным `order` между `name` и `resources`. Проверить:

```ts
expect(result).toEqual(["internalInfo", "name", "synonym", "resources"])
```

Существовавшие ключи `internalInfo`, `name`, `resources` не должны менять взаимный порядок.

- [ ] **Шаг 3: Запустить характеристические тесты**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/helpers.test.ts
```

Ожидаемый результат: тесты проходят на существующем механизме. Если тест нового свойства выявит ошибку, исправить только общий алгоритм `getOrderedKeysToXML()`, не добавляя частного условия для `InternalInfo`.

- [ ] **Шаг 4: Добавить сквозной тест XML → snapshot → XML**

В `configurationIndex/fromYAMLToXML.test.ts`:

1. импортировать синтетический XML с `InternalInfo`, `Properties`, `ChildObjects` через `createDirectRoundTripContexts()`;
2. убедиться, что YAML не содержит reference-only свойство;
3. экспортировать YAML без reference XML;
4. проверить физический порядок ключей результирующего объекта:

```ts
expect(Object.keys(result.outputs.get("owner")!)).toEqual([
  "InternalInfo",
  "Properties",
  "ChildObjects",
])
```

Для проверки порядка вложенных свойств дополнительно сравнить `Object.keys(Properties)`.

- [ ] **Шаг 5: Запустить GREEN-проверки экспорта**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/helpers.test.ts \
  metadata/configurationIndex/fromYAMLToXML.test.ts
pnpm --filter @nkdk/core run type-check
```

- [ ] **Шаг 6: Закоммитить договор экспорта**

Если изменились только тесты:

```bash
git add packages/core/metadata/orchestration/property/helpers.test.ts \
  packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts
git commit -m "test: :white_check_mark: закрепить полный порядок XML из снимка"
```

Если потребовалось исправление `helpers.ts`, использовать отдельный коммит:

```bash
git add packages/core/metadata/orchestration/property/helpers.ts \
  packages/core/metadata/orchestration/property/helpers.test.ts \
  packages/core/metadata/configurationIndex/fromYAMLToXML.test.ts
git commit -m "fix: :bug: восстанавливать полный порядок XML из снимка"
```

---

### Задача 4: Полная проверка и round-trip cf/all

- [ ] **Шаг 1: Запустить все целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/orchestration/property/fromXMLToYAML.test.ts \
  metadata/orchestration/property/helpers.test.ts \
  metadata/configurationIndex/fromYAMLToXML.test.ts
pnpm --filter @nkdk/core run type-check
```

- [ ] **Шаг 2: Запустить весь проект**

```bash
pnpm test
```

Ожидаемый результат: все пакеты и тесты проходят.

- [ ] **Шаг 3: Запустить диагностический round-trip на cf/all**

Рабочее дерево `nkdk` должно быть чистым. Скрипт сам откатывает родительский XML-репозиторий и очищает `/Users/nikita/git/nkdk-yaml/cf`:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all \
  NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

- [ ] **Шаг 4: Классифицировать оставшиеся diff**

Критерий задачи: отсутствуют перестановки распознанных XML-контейнеров и свойств, вызванные отсутствием `forReferenceOnly` в `ConfigurationXmlNode.order`. UUID `InternalInfo`, пустые значения и иные категории оцениваются отдельными задачами.

---

## Итоговая самопроверка

- [ ] `ConfigurationXmlNode.order` содержит обычные и reference-only канонические ключи.
- [ ] Reference-only свойства по-прежнему отсутствуют в пользовательском YAML.
- [ ] Неизвестные XML-узлы не попадают в снимок.
- [ ] На один `xmlNodeLogicalAddress` выполняется ровно один `setOrder()`.
- [ ] Несколько частичных источников объединяются устойчиво и без конфликта.
- [ ] Экспорт сохраняет взаимный порядок существовавших свойств.
- [ ] Новые свойства вставляются по `rules.ts`, не переставляя существовавшие.
- [ ] Без снимка сохраняется порядок `InternalInfo → Properties → ChildObjects`.
- [ ] `pnpm test` проходит.
- [ ] Round-trip `cf/all` больше не содержит расхождений этой категории.
