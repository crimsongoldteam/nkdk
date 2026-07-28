# Проекция `BaseForm` расширения — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Строить `BaseForm` из текущей формы основной конфигурации как допустимую проекцию для выбранного расширения и получить точный побайтовый round-trip всех поддерживаемых `cfe`.

**Architecture:** Отдельный построитель формирует обычную промежуточную `ClientApplicationFormYAML`, после чего существующий преобразователь создаёт XML. Состав и свойства проецируются декларативно по `rules.ts`; особое поведение недоступных ссылок регистрируется рядом с property-типами формы. Идентификаторы элементов берутся из снимка `cf`, а локальные идентификаторы явно заимствованных реквизитов, команд и параметров — из снимка выбранного `cfe`.

**Tech Stack:** TypeScript 6, Vitest 4, TypeBox, существующие `rules.ts`, снимки конфигурации и полная XML-синхронизация.

## Global Constraints

- Этот план выполняется после `2026-07-28-extension-form-event-bindings.md`.
- Не хранить входной `BaseForm` ни в YAML, ни в снимке расширения.
- Не добавлять отдельный XML-построитель и не вычитать узлы из готового XML.
- Не копировать всю текущую форму `cf`.
- Не добавлять условия по `BaseForm`, `DataPath`, `CommandName`, `Events` или каталогам форм в общие слои `metadata/orchestration`, `metadata/project`, `metadata/validation`.
- Не реализовывать будущую валидацию ограничений редактирования формы; она уже зафиксирована в `.agents/restrictions.md`.
- Не изменять существующие XML-фикстуры.
- Не создавать `ConfigDumpInfo.xml`.
- Не изменять пользовательский файл `packages/mcp/README.md`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test` и полный round-trip `/Users/nikita/git/round-trip/cfe`.

---

## File Map

- `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts` — выбор компонентов и рекурсивная проекция YAML по правилам.
- `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.test.ts` — состав, виды, вложенность и свойства проекции.
- `packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.ts` — локальный реестр поведения property-типов при построении основы.
- `packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts` — отсутствие неявных обходов для недоступных ссылок.
- `packages/core/metadata/forms/commonObjects/event/baseFormProjection.ts` — исключение событий.
- `packages/core/metadata/forms/commonObjects/dataPath/baseFormProjection.ts` — удаление недоступного пути.
- `packages/core/metadata/forms/commonObjects/commandName/baseFormProjection.ts` — значение `0` для недоступной команды.
- `packages/core/metadata/forms/commonObjects/index.ts` — регистрация обработчиков проекции вместе с остальными обработчиками формы.
- `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts` — чтение XML-порядка и идентификаторов из правильного снимка.
- `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts` — выбор `cf`/`cfe` для элементов и явных компонентов.
- `packages/core/metadata/forms/clientApplicationForm/baseForm.ts` — сборка проекции и вызов обычного преобразователя.
- `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts` — итоговый XML `BaseForm`.
- `packages/core/metadata/fullSyncToXml/componentProfile.ts` — снимок `cf` в описании источника базовых форм.
- `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts` — передача подтверждённого снимка `cf`.
- `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts` — профиль расширения.
- `packages/core/metadata/fullSyncToXml/worker.ts` — создание reader снимка `cf` один раз на worker.
- `packages/core/metadata/fullSyncToXml/worker.test.ts` — доступность обоих снимков при обработке формы.
- `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts` — интеграционная полная синхронизация расширения.

---

### Task 1: Описать локальный договор проекции свойств формы

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts`
- Create: `packages/core/metadata/forms/commonObjects/event/baseFormProjection.ts`
- Create: `packages/core/metadata/forms/commonObjects/dataPath/baseFormProjection.ts`
- Create: `packages/core/metadata/forms/commonObjects/commandName/baseFormProjection.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`

**Interfaces:**

- Consumes: `PropertyRule`, значение из `cf`, значение из `cfe` и ограниченный контекст компонентов проекции.
- Produces: включённое значение, пропуск свойства либо ошибка недоступной ссылки.

- [ ] **Step 1: Написать тест реестра**

Зафиксировать три решения:

```ts
expect(projectProperty({
  rule: { type: "Events" },
  baseValue: { onChange: "ОсновнойОбработчик" },
  extensionValue: { onChange: "РасширениеОбработчик" },
  context,
})).toEqual({ kind: "omit" })

expect(projectProperty({
  rule: { type: "DataPath" },
  baseValue: "Объект.Код",
  extensionValue: "Объект2.Код",
  context: contextWithoutAttribute("Объект"),
})).toEqual({ kind: "omit" })

expect(projectProperty({
  rule: { type: "CommandName" },
  baseValue: "Команда1",
  extensionValue: "Команда1",
  context: contextWithoutCommand("Команда1"),
})).toEqual({ kind: "include", value: "0" })
```

Добавить искусственный ссылочный property-тип без регистрации и ожидать ошибку, если его цель недоступна.

- [ ] **Step 2: Запустить тест и подтвердить отсутствие реестра**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Ввести нейтральные локальные типы**

В `baseFormProjectionRegistry.ts` определить:

```ts
export interface BaseFormProjectionContext {
  readonly attributeNames: ReadonlySet<string>
  readonly commandNames: ReadonlySet<string>
  readonly parameterNames: ReadonlySet<string>
}

export type BaseFormPropertyProjection =
  | { readonly kind: "include"; readonly value: unknown }
  | { readonly kind: "omit" }

export interface BaseFormPropertyProjector {
  project(params: {
    readonly rule: PropertyRule
    readonly baseValue: unknown
    readonly extensionValue: unknown
    readonly context: BaseFormProjectionContext
  }): BaseFormPropertyProjection
}
```

Реестр индексировать по `PropertyRuleType`. Если обработчика нет, обычное свойство возвращает значение `cf`; недоступную ссылку разрешает только зарегистрированный обработчик.

- [ ] **Step 4: Зарегистрировать три поведения рядом с типами**

`Events`:

```ts
registerBaseFormPropertyProjector("Events", {
  project: () => ({ kind: "omit" }),
})
```

`DataPath`:

- разобрать корневой сегмент существующим разбором пути формы;
- сохранить значение `cf`, если корень есть среди `attributeNames`;
- удалить свойство, если корня нет;
- значение `0` и пустое значение не считать ссылкой на реквизит.

`CommandName`:

- сохранить значение `cf`, если имя команды разрешается среди `commandNames`;
- вернуть строку `"0"` при недоступной команде;
- исходное `"0"` сохранить.

Не дублировать разбор `DataPath`: использовать существующий resolver/индекс формы через маленький переходник с понятным именем.

- [ ] **Step 5: Подключить регистрации**

Экспортировать новые файлы из соответствующих `index.ts`, чтобы стандартный импорт `forms/commonObjects` зарегистрировал поведение до построения формы.

- [ ] **Step 6: Запустить тесты реестра**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts \
  metadata/forms/commonObjects/dataPath \
  metadata/forms/commonObjects/commandName
```

Expected: PASS.

- [ ] **Step 7: Закоммитить договор**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts \
  packages/core/metadata/forms/commonObjects/event/baseFormProjection.ts \
  packages/core/metadata/forms/commonObjects/dataPath/baseFormProjection.ts \
  packages/core/metadata/forms/commonObjects/commandName/baseFormProjection.ts \
  packages/core/metadata/forms/commonObjects/index.ts
git commit -m "feat: :sparkles: описать правила проекции BaseForm"
```

---

### Task 2: Построить состав компонентов промежуточной формы

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.test.ts`

**Interfaces:**

- Consumes: текущая `ClientApplicationFormYAML` из `cf` и внешняя форма `cfe`.
- Produces: промежуточная `ClientApplicationFormYAML` без XML и идентификаторов.
- Produces: множества явно заимствованных реквизитов, команд и параметров.

- [ ] **Step 1: Написать тест состава**

Подготовить `baseYaml`:

```ts
{
  Элементы: {
    Группа: {
      Вид: "ОбычнаяГруппа",
      Элементы: {
        Код: { Вид: "ПолеВвода", Ширина: 10 },
      },
    },
  },
  Реквизиты: {
    Объект: { Тип: "CatalogObject.Товары" },
    ТолькоОснова: { Тип: "string" },
  },
  Команды: {
    Команда1: { Заголовок: { ru: "Основная команда" } },
  },
  Параметры: {
    Параметр1: { Тип: "string" },
  },
}
```

И `extensionYaml`, где:

- `Код` перемещён в собственную группу и имеет вид поля надписи;
- присутствует собственный элемент `Дополнение`;
- явно присутствуют `Объект`, `Команда1`, `Параметр1`;
- добавлены собственные реквизит, команда и параметр.

Проверить, что проекция:

- сохраняет дерево `Группа → Код` из `cf`;
- сохраняет `Вид: ПолеВвода` для `Код`;
- не содержит собственную группу и `Дополнение`;
- содержит только пересечение имён трёх явных коллекций;
- берёт значения совпавших компонентов из `cf`.

- [ ] **Step 2: Написать тест сопоставления по имени**

Внешний `Код` разместить в другой ветви и сменить `Вид`. Проверить, что
сопоставление для проекции свойств выполняется по имени во всём дереве внешней
формы, а не по пути или виду. Все элементы `cf` включаются автоматически:
отсутствие одноимённого внешнего узла не удаляет базовый элемент из
промежуточной формы.

Добавить ошибку для двух внешних элементов с одним именем: построитель не должен угадывать соответствие.

- [ ] **Step 3: Запустить тесты и подтвердить отсутствие построителя**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormProjection.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Реализовать выбор компонентов**

Экспортировать:

```ts
export interface ProjectedBaseForm {
  readonly yaml: ClientApplicationFormYAML
  readonly explicitComponents: {
    readonly attributes: ReadonlySet<string>
    readonly commands: ReadonlySet<string>
    readonly parameters: ReadonlySet<string>
  }
}

export function projectClientApplicationBaseForm(params: {
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
}): ProjectedBaseForm
```

Алгоритм:

1. один раз обойти внешнее дерево и построить `Map<имя, узел>`;
2. рекурсивно пройти только дерево `cf`;
3. включить каждый базовый элемент независимо от наличия внешнего совпадения;
4. внешнее совпадение по имени использовать только для пересечения свойств;
5. структуру, порядок и `Вид` брать только из `cf`;
6. для реквизитов, команд и параметров построить пересечение record-ключей;
7. собственные record-ключи `cfe` игнорировать.

Построитель исходит из будущей валидации, но обязан выдать ошибку при неоднозначном имени, потому что иначе результат недетерминирован.

- [ ] **Step 5: Не переносить свойства на этом шаге**

На первом проходе оставить у выбранных компонентов только имя/ключ, `Вид`, коллекции детей и маркеры выбранного состава. Полную рекурсивную проекцию добавить следующей задачей, чтобы тесты разделяли состав и свойства.

- [ ] **Step 6: Запустить тесты состава**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormProjection.test.ts
```

Expected: PASS только для блока тестов состава.

- [ ] **Step 7: Закоммитить состав**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjection.test.ts
git commit -m "feat: :sparkles: выбрать компоненты BaseForm"
```

---

### Task 3: Спроецировать свойства по `rules.ts`

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.test.ts`

**Interfaces:**

- Consumes: `ClientApplicationFormRules`, правила фактического вида каждого элемента и выбранный состав.
- Produces: рекурсивное пересечение YAML-свойств со значениями `cf`.

- [ ] **Step 1: Добавить тест скалярных и вложенных свойств**

Проверить:

- `Ширина` присутствует в обеих формах — в проекции значение из `cf`;
- `Высота` есть только в `cf` — отсутствует;
- `Группировка` есть только в `cfe` — отсутствует;
- вложенный объект свойства сохраняет только общие YAML-ключи;
- `Events` отсутствуют независимо от наличия в обеих формах.

- [ ] **Step 2: Добавить тест разных видов элемента**

Для `cf InputField` и `cfe LabelField`:

- правило результата выбирать по исходному виду `cf`;
- пересекать свойства по YAML-именам, реально присутствующим в двух узлах;
- не переносить свойство, которого нет в правилах внешнего вида;
- сохранить `Вид` из `cf`.

- [ ] **Step 3: Добавить тесты ссылок**

Проверить четыре случая:

1. `DataPath: Объект.Код`, реквизит `Объект` выбран — путь из `cf` сохранён;
2. тот же путь, реквизит не выбран — свойство отсутствует;
3. `CommandName: Команда1`, команда выбрана — значение из `cf` сохранено;
4. команда не выбрана — значение равно `"0"`.

Добавить искусственное ссылочное правило без зарегистрированного поведения и ожидать ошибку.

- [ ] **Step 4: Запустить новые тесты и подтвердить ошибки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormProjection.test.ts
```

Expected: FAIL в новых тестах свойств.

- [ ] **Step 5: Реализовать обход правил**

Для каждого `MetadataItemRule`:

- сопоставлять модельный ключ с YAML-ключом через `propertyRule.yaml ?? propertyKey`;
- включать обычное свойство только при `hasOwn` в обоих YAML-объектах;
- значение брать из `baseYaml`;
- для вложенного plain object рекурсивно пересекать ключи;
- для вложенной metadata-коллекции использовать её `itemRule`, а не слепой обход объекта;
- для коллекций элементов разрешать правило через `resolveFormElementRule`;
- перед обычным включением вызывать зарегистрированный проектор property-типа;
- не использовать XML-имена свойств.

Код конкретной формы может знать о её коллекциях `Элементы`, `Реквизиты`, `Команды`, `Параметры`, но не должен переносить это знание в общий metadata-оркестратор.

- [ ] **Step 6: Построить ограниченный контекст ссылок**

После выбора коллекций создать:

```ts
const projectionContext = {
  attributeNames: new Set(Object.keys(projectedAttributes)),
  commandNames: new Set(Object.keys(projectedCommands)),
  parameterNames: new Set(Object.keys(projectedParameters)),
}
```

Этот контекст использовать только для `BaseForm`. Обычная внешняя форма продолжает использовать существующий составной контекст `cfe → cf`.

- [ ] **Step 7: Запустить тесты проекции**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/baseFormProjection.test.ts \
  metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 8: Закоммитить свойства**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjection.test.ts
git commit -m "feat: :sparkles: спроецировать свойства BaseForm"
```

---

### Task 4: Выбрать правильный снимок для идентификаторов

**Files:**

- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/componentProfile.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts`
- Modify: `packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.test.ts`

**Interfaces:**

- Consumes: снимок текущей `cf`, снимок выбранного `cfe` и состав проекции.
- Produces: `ConfigurationIndexReader` для обычного преобразователя `ClientApplicationForm`.

- [ ] **Step 1: Написать тест составного reader**

Создать два небольших индекса:

- `cf`: элемент `Код` с `xmlId=4`, реквизит `Объект` с `xmlId=4`;
- `cfe`: элемент `Код` с тем же `xmlId=4`, реквизит `Объект` с `xmlId=1000001`.

Проверить:

```ts
expect(reader.identity(elementAddress("Код"), "xmlId")).toBe("4")
expect(reader.identity(attributeAddress("Объект"), "xmlId")).toBe("1000001")
expect(reader.xmlNode(elementAddress("Код"))).toEqual(baseReader.xmlNode(...))
expect(reader.xmlValue(elementPropertyAddress(...))).toEqual(baseReader.xmlValue(...))
```

Для отсутствующего обязательного `xmlId` ожидать ошибку с логическим адресом, а не генерацию нового значения.

- [ ] **Step 2: Запустить тест и подтвердить отсутствие reader**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormIndex.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Реализовать reader проекции**

Экспортировать:

```ts
export function createBaseFormConfigurationIndexReader(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): ConfigurationIndexReader
```

Договор:

- `identity` для адресов явно заимствованных реквизитов, команд и параметров читает `extension`;
- остальные `identity`, `xmlNode`, `xmlValue`, порядок и aliases читает `base`;
- `binding`, `projectFiles` и `snapshot` относятся к `base`;
- методы перечисления возвращают согласованное представление, достаточное для диагностики, но преобразователь использует точечные методы;
- обёртка не создаёт и не изменяет снимки.

Адреса локальной идентичности строить существующими функциями logical address, не анализом строковых XML-путей.

- [ ] **Step 4: Передать снимок `cf` в worker**

В `FullXmlSyncWorkerProfileRuntime.baseForms` добавить:

```ts
readonly snapshot: SharedConfigurationIndexSnapshot
```

В профиле расширения передавать `base.snapshot`. В `worker.ts` при `initialize` один раз создать `baseIndex` и хранить его рядом с `state.index`.

Не читать файл снимка повторно для каждой формы и не включать данные формы в `BaseFormSource`: источник YAML и источник идентификаторов остаются двумя независимо кэшируемыми входами.

- [ ] **Step 5: Обновить тесты профиля и worker**

Проверить:

- профиль передаёт тот же shared snapshot `cf`;
- worker создаёт базовый reader при инициализации расширения;
- профиль обычной конфигурации не требует базового снимка;
- `dispose` освобождает ссылку вместе с остальным состоянием worker.

- [ ] **Step 6: Запустить тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  metadata/fullSyncToXml/worker.test.ts
```

Expected: PASS.

- [ ] **Step 7: Закоммитить источники идентификаторов**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormIndex.test.ts \
  packages/core/metadata/fullSyncToXml/componentProfile.ts \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.ts \
  packages/core/metadata/fullSyncToXml/profiles/configurationExtension.test.ts \
  packages/core/metadata/fullSyncToXml/worker.ts \
  packages/core/metadata/fullSyncToXml/worker.test.ts
git commit -m "feat: :sparkles: передать снимок cf для BaseForm"
```

---

### Task 5: Преобразовать проекцию обычным обработчиком формы

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`

**Interfaces:**

- Consumes: `ProjectedBaseForm`, base reader и extension reader.
- Produces: `ClientApplicationFormXML` без корневых namespace и без событий.

- [ ] **Step 1: Заменить тест полной копии тестом проекции**

Текущий тест `builds a full form body through regular rules` изменить так, чтобы:

- `Ширина` была в `cf` и `cfe` и попала в `BaseForm` со значением `cf`;
- `Высота` была только в `cf` и не попала;
- события были в обеих формах и не попали;
- внешняя форма осталась неизменной.

- [ ] **Step 2: Добавить XML-тест элементов и идентификаторов**

С двумя reader проверить:

- базовое дерево, вид, порядок и `id` элемента из `cf`;
- локальный `id` явно заимствованного реквизита из `cfe`;
- исключение собственного элемента и собственной команды;
- `DataPath` удалён без корневого реквизита;
- `CommandName` равен `0` без команды.

- [ ] **Step 3: Запустить тесты и подтвердить текущую полную копию**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseForm.test.ts
```

Expected: FAIL — текущий код преобразует весь `baseYaml`.

- [ ] **Step 4: Встроить проекцию**

Изменить сигнатуру:

```ts
export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex: ConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly formName: string
}): ClientApplicationFormXML
```

Внутри:

1. вызвать `projectClientApplicationBaseForm`;
2. получить адреса локальных идентичностей явно заимствованных компонентов;
3. создать reader проекции из `baseIndex` и текущего `context.exportToXML.configurationIndex.source`;
4. заменить source в копии runtime, сохранив collector-пустышку;
5. вызвать `convertClientApplicationFormFromYAMLToXML` с `yaml: projected.yaml`;
6. для `dataPathYaml` использовать ту же `projected.yaml`, а не полную внешнюю форму;
7. удалить только корневые `_xmlns*`, сохранить `_version`.

Не выполнять проход по готовому XML.

- [ ] **Step 5: Передать base reader до точки построения**

Расширить подготовку assignment и обе ветви создания формы так, чтобы `baseIndex` передавался вместе с `basePreparedYamlFile`:

- прямой `prepareFormXML`;
- вложенный property-тип `ClientApplicationForm`.

Не добавлять чтение файлов или снимков в `baseForm.ts`.

- [ ] **Step 6: Сохранить запрет записи BaseForm в снимок cfe**

Оставить `withDiscardedConfigurationIndexWrites`, но source заменить составным reader. Тест collector из `baseForm.test.ts` должен по-прежнему возвращать пустой фрагмент.

- [ ] **Step 7: Запустить тесты формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/baseForm.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Закоммитить построитель**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/baseForm.ts \
  packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts \
  packages/core/metadata/forms/clientApplicationForm/syncToXML.ts \
  packages/core/metadata/fullSyncToXml/prepareAssignment.ts
git commit -m "feat: :sparkles: строить проекцию BaseForm"
```

---

### Task 6: Проверить полную синхронизацию расширения

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts`
- Modify only if required by public types: `packages/core/metadata/fullSyncToXml/types.ts`

**Interfaces:**

- Consumes: синхронизированная `cf`, расширение с заимствованной формой и оба снимка.
- Produces: внешняя форма с построенным `BaseForm`.

- [ ] **Step 1: Расширить интеграционную фикстуру в памяти**

Не менять существующие XML-файлы. В тестовом проекте создать YAML:

- форма `cf` с вложенным элементом, реквизитом и командой;
- форма `cfe` с перемещённым элементом, сменой допустимого вида, одним явно заимствованным реквизитом и собственной командой;
- события внешнего элемента с `Перед` и `После`.

Снимки создать существующими тестовыми помощниками.

- [ ] **Step 2: Проверить итоговые два слоя формы**

Во внешней форме ожидать:

- вид и расположение из `cfe`;
- собственную команду и события расширения.

В `BaseForm` ожидать:

- вид, расположение и идентификатор элемента из `cf`;
- только явно заимствованный реквизит с идентификатором `cfe`;
- отсутствие собственной команды и всех событий;
- корректные `DataPath`/`CommandName`.

- [ ] **Step 3: Проверить ошибочные входы построителя**

Добавить независимые случаи:

- форма `cf` отсутствует;
- обязательный базовый `xmlId` отсутствует;
- обязательный локальный `xmlId` явно заимствованного компонента отсутствует;
- недоступная ссылка не имеет зарегистрированного поведения.

Проверить диагностический код assignment и отсутствие отката уже записанных предыдущих XML-файлов.

- [ ] **Step 4: Запустить интеграционные тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/configurationExtensionIntegration.test.ts \
  metadata/fullSyncToXml/failureIntegration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Закоммитить интеграцию**

```bash
git add \
  packages/core/metadata/fullSyncToXml/configurationExtensionIntegration.test.ts \
  packages/core/metadata/fullSyncToXml/types.ts
git commit -m "test: :white_check_mark: проверить синхронизацию BaseForm"
```

Если `types.ts` не изменился, не добавлять его в commit.

---

### Task 7: Выполнить полную проверку и точный round-trip

**Files:**

- Modify only for подтверждённые общие ошибки: файлы из предыдущих задач.
- Do not modify: `/Users/nikita/git/round-trip/cf/all/**`
- Do not modify: `/Users/nikita/git/round-trip/cfe/**`

**Interfaces:**

- Consumes: `/Users/nikita/git/round-trip/cf/all` и `/Users/nikita/git/round-trip/cfe`.
- Produces: точное побайтовое совпадение поддерживаемых XML, кроме платформенного `ConfigDumpInfo.xml`.

- [ ] **Step 1: Запустить проверку типов**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Запустить весь проект**

Run:

```bash
pnpm test
```

Expected: PASS во всех `packages/*`.

- [ ] **Step 3: Запустить полный round-trip**

Использовать существующий навык `round-trip-yaml` и рабочий XML-репозиторий пользователя без временной копии:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

До запуска навык должен импортировать `/Users/nikita/git/round-trip/cf/all`, затем синхронизировать `cf`, и только после этого по одному синхронизировать расширения из `/Users/nikita/git/round-trip/cfe`.

- [ ] **Step 4: Проверить результат сравнения**

Expected:

- `cf/all`: 0 расхождений;
- каждое поддерживаемое расширение: 0 расхождений;
- внешние формы, `BaseForm`, события, порядок, идентификаторы, BOM и LF совпадают побайтово;
- `ConfigDumpInfo.xml` исключён из сравнения и не создан NKDK.

Если остаются расхождения:

1. сгруппировать их по XML-пути и виду изменения;
2. не добавлять условия под отдельный файл;
3. исправлять только подтверждённое общее правило проекции либо преобразования;
4. повторить целевые тесты, `pnpm test` и round-trip.

- [ ] **Step 5: Проверить чистоту изменений**

Run:

```bash
git status --short
git diff --check
```

Expected:

- нет незакоммиченных изменений реализации;
- пользовательский `packages/mcp/README.md` остаётся нетронутым и не входит ни в один commit;
- XML-репозиторий не изменён тестовым процессом.

- [ ] **Step 6: Выполнить итоговый commit при наличии исправлений проверки**

Если round-trip потребовал общее исправление:

```bash
git add <только подтверждённые файлы реализации и тестов>
git commit -m "fix: :bug: устранить расхождения BaseForm"
```

Если изменений нет, отдельный пустой commit не создавать.
