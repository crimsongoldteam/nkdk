# Identity and Required XML Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить обязательные одиночные элементы форм, все их числовые ID, вычисляемый `InternalInfo` и два вида обязательной пустой XML-структуры после перехода на тонкий снимок.

**Architecture:** Обычное XML-состояние не возвращается в снимок. Одиночные элементы материализуются существующим `nestedItemIdentity.reserveWhenAbsent`; созданные XML-объекты регистрируются с эффективным runtime снимка и получают ID единым проходом по независимым пространствам. `InternalInfo` строится предметным экспортёром из UUID снимка, а пустые `Comment` и `AdditionalFields` восстанавливаются существующими XML-default/`!xml` правилами.

**Tech Stack:** TypeScript 7, Vitest 4, metadata rules, configuration index runtime, `fast-xml-parser`, YAML-теги NKDK.

## Global Constraints

- Реализовать только `docs/superpowers/specs/2026-08-13-form-singleton-id-restoration-design.md` и связанный договор `AdditionalFields` из `2026-08-12-xml-values-without-snapshot-design.md`.
- Работать в `/Users/nikita/git/nkdk/.worktrees/lmdb-configuration-index-design` на ветке `codex/lmdb-configuration-index-design`; не менять `develop` или `main`.
- Не менять формат, версию и кодек снимка; не возвращать `present`, `xmlName` или `xml.*` для обычной конфигурации.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей правил.
- Не изменять существующие XML-фикстуры.
- Соблюдать TDD: каждый production-шаг начинается с наблюдаемого падающего теста.
- После каждого законченного слоя запускать `pnpm duplicates -- --base 54b32c509`.
- Перед завершением обязательны `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules`, `pnpm test:architecture`, `pnpm duplicates -- --base 54b32c509` и `pnpm test:e2e`.

---

## Карта файлов и обязанностей

| Область | Файлы | Ответственность |
|---|---|---|
| Материализация singleton | `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts` | Не пропускать зарегистрированный обязательный вложенный item при отсутствующем YAML и identity |
| Регистрация ID | `packages/runtime/metadata/configurationIndex/formXmlIdReservation.ts`, `ruleRuntime/formElement/{fromYAMLToXML,ruleFactory}.ts`, form attribute/command rules | Связать созданный XML-объект с logicalAddress, runtime, пространством ID и специальным ID |
| Распределение ID | `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts`, `convertYAMLToXML.ts` | Выбрать snapshot → reference → special → свободный ID, проверить коллизии и записать результат в collector |
| `InternalInfo` | `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`, `packages/rules/metadata/commonObjects/internalInfo/toXML.ts` | Всегда вычислять непустое правило и восстанавливать UUID снимка без YAML/reference XML |
| Пустой XML | `clientApplicationForm/rules.ts`, путь импорта/экспорта additional indexes | Канонически создавать `<Comment/>` и переносить `<AdditionalFields/>` через `!xml` |

---

### Task 1: Материализовать обязательные одиночные элементы без identity

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/requiredIdentity.ts`

**Interfaces:**
- Consumes: `nestedItemIdentity.reserveWhenAbsent`, `yamlToXMLNestedRule`, `typeRule()`.
- Produces: отсутствующий YAML singleton преобразуется как `{}`; отсутствие `xmlId` больше не останавливает построение формы до распределителя.

- [ ] **Step 1: Добавить падающий тест реального преобразователя формы**

В `fromYAMLToXML.test.ts` построить форму с полем ввода, у которого в YAML отсутствуют `КонтекстноеМеню` и `РасширеннаяПодсказка`, и с пустым configuration index. Проверить литерально:

```ts
expect(inputField.ContextMenu).toMatchObject({
  _name: "ПолеКонтекстноеМеню",
})
expect(inputField.ExtendedTooltip).toMatchObject({
  _name: "ПолеРасширеннаяПодсказка",
})
```

Отдельно проверить корневой `AutoCommandBar` без YAML-поля и identity.

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: обязательный singleton отсутствует либо преобразование завершается ошибкой `Не найден обязательный xmlId`.

- [ ] **Step 3: Использовать существующий договор `reserveWhenAbsent`**

В `fromYAMLToXML.ts` определить локальный предикат через реестр типов:

```ts
const reservesNestedItemWhenAbsent = (rule: PropertyRule): boolean =>
  typeRule(rule.type, "nestedItemIdentity")?.reserveWhenAbsent === true
```

Исключить такое свойство из раннего indexed-пропуска и включить этот предикат в ветку, которая подставляет `nestedYAML = {}`. Не добавлять поле к `PropertyRule`.

Проверку `requiredIdentity: "xmlId"` не выполнять до постобработки формы: ID теперь может быть взят из целевого XML или назначен распределителем. Остальные виды identity не ослаблять.

- [ ] **Step 4: Проверить GREEN и дубли**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
pnpm duplicates -- --base 54b32c509
```

Expected: тест проходит; обязательные singleton существуют без снимка.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/runtime/metadata/ruleRuntime/property/requiredIdentity.ts packages/rules/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
git commit -m "fix: :bug: создавать обязательные элементы формы без ID"
```

---

### Task 2: Распределить ID по независимым пространствам и опубликовать их

**Files:**
- Create: `packages/runtime/metadata/configurationIndex/formXmlIdReservation.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts`
- Create: `packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/formElement/ruleFactory.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/rules/metadata/forms/commonObjects/formCommand/types.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts`

**Interfaces:**
- Produces: `registerFormXmlIdReservation(node, { runtime, space, specialId? })` и `assignFormXmlIds(generated, reference)`.
- Spaces: `"elements" | "attributes" | "commands" | "parameters"`.
- Side effect: каждый итоговый ID записывается `reservation.runtime.collector.setIdentity(reservation.runtime.logicalAddress, "xmlId", id)`.

- [ ] **Step 1: Добавить падающие тесты распределителя**

В новом тесте зарегистрировать реальные XML-объекты и проверить отдельными случаями:

```ts
expect(assign("snapshot", "reference", "special")).toBe("snapshot")
expect(assign(undefined, "17", "-1")).toBe("17")
expect(assign(undefined, undefined, "-1")).toBe("-1")
expect(assign(undefined, undefined, undefined)).toBe("1")
```

Добавить форму, где элемент, реквизит и команда одновременно получают `id="1"`, а два элемента одного пространства с `id="1"` дают ошибку. Добавить случай, где занятый элемент ниже по XML заставляет новый элемент выбрать следующий свободный ID.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts
```

Expected: модуль отсутствует или старый общий `Set` ошибочно смешивает пространства/не публикует ID.

- [ ] **Step 3: Реализовать нейтральную регистрацию**

В runtime-модуле хранить `WeakMap<object, FormXmlIdReservation>`. Регистрация принимает только созданный XML-объект, эффективный `ConfigurationIndexExportRuntime`, пространство и необязательный специальный ID; она ничего не сериализует и не изменяет общие типы правил.

В обоих form-element преобразователях регистрировать именно итоговый объект после `transformOutput`. Для коллекций реквизитов и команд регистрировать объект из `mapItemOutput` с текущим item-context. `directId="-1"` передавать как `specialId`, а не присваивать раньше snapshot/reference.

- [ ] **Step 4: Реализовать двухпроходное назначение**

В `formXmlIdAssignment.ts`:

1. собрать все зарегистрированные узлы, их одноимённые reference-узлы и занятые неотрицательные ID отдельно по каждому пространству;
2. для каждого узла выбрать уже установленный snapshot-ID, затем reference-ID, затем `specialId`, затем минимальный свободный положительный ID;
3. проверить повтор неотрицательного ID внутри пространства и допустимость отрицательного ID только при совпадении со `specialId`;
4. записать выбранный ID в XML и collector соответствующего runtime.

Заменить старый `assignGeneratedIds` в `convertYAMLToXML.ts` вызовом нового модуля.

- [ ] **Step 5: Проверить обычную форму и `BaseForm`**

В `baseForm.test.ts` проверить литеральные ID: автоматически заимствованный singleton берёт ID из reader `cf`, явно заимствованные реквизит/команда — из `cfe`; временный collector `BaseForm` не публикует базовые identity в `cfe`. Новый собственный объект основной формы `cfe` публикует назначенный ID.

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts
pnpm duplicates -- --base 54b32c509
```

Expected: все проверки проходят, одинаковые ID разных пространств разрешены.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/runtime/metadata/configurationIndex/formXmlIdReservation.ts packages/runtime/metadata/ruleRuntime/formElement packages/rules/metadata/forms/commonObjects/formAttribute/rules.ts packages/rules/metadata/forms/commonObjects/formCommand/types.ts packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.ts packages/rules/metadata/forms/clientApplicationForm/formXmlIdAssignment.test.ts packages/rules/metadata/forms/clientApplicationForm/convertYAMLToXML.ts packages/rules/metadata/forms/clientApplicationForm/baseForm.test.ts
git commit -m "fix: :bug: сохранять назначенные ID элементов формы"
```

---

### Task 3: Восстановить `InternalInfo` из UUID снимка

**Files:**
- Modify: `packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/rules/metadata/commonObjects/internalInfo/toXML.ts`
- Modify: `packages/rules/metadata/commonObjects/internalInfo/fromXML.test.ts`

**Interfaces:**
- Consumes: `InternalInfo.evaluateWhenYAMLMissing`, `resolveInternalInfoUuid()`.
- Produces: непустой `InternalInfoRootXML` из предметного правила; пустой набор правила возвращает `undefined` и не создаёт произвольный `<InternalInfo/>`.

- [ ] **Step 1: Добавить pipeline-регрессию**

В `configurationIndex/fromYAMLToXML.test.ts` импортировать объект с `GeneratedType`, очистить reference XML и экспортировать только из YAML и собранного снимка. Проверить полные литеральные `_name`, `_category`, `xr:TypeId`, `xr:ValueId`. Отдельно проверить `ContainedObject` и `ThisNode`.

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit --no-isolate metadata/configurationIndex/fromYAMLToXML.test.ts metadata/commonObjects/internalInfo/fromXML.test.ts
```

Expected: pipeline пропускает `InternalInfo`, хотя UUID присутствуют в снимке.

- [ ] **Step 3: Убрать неверный ранний пропуск**

Удалить ветку, которая пропускает любое `forReferenceOnly + evaluateWhenYAMLMissing` при наличии владельца в снимке. Предметный экспортёр `InternalInfo` должен выполниться; если правило не объявляет `items`, `thisNode` или `containedObjectClassIds`, он возвращает `undefined`, поэтому отсутствующее пустое свойство не материализуется.

Сохранить приоритет UUID: снимок → reference/model fallback → новый UUID. Каждый выбранный UUID остаётся записанным в collector через `resolveInternalInfoUuid`.

- [ ] **Step 4: Проверить GREEN и дубли**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit --no-isolate metadata/configurationIndex/fromYAMLToXML.test.ts metadata/commonObjects/internalInfo
pnpm duplicates -- --base 54b32c509
```

Expected: структура восстановлена без YAML/reference XML; пустое правило ничего не создаёт.

- [ ] **Step 5: Зафиксировать слой**

```bash
git add packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/rules/metadata/configurationIndex/fromYAMLToXML.test.ts packages/rules/metadata/commonObjects/internalInfo
git commit -m "fix: :bug: восстанавливать InternalInfo из снимка"
```

---

### Task 4: Восстановить обязательные пустые XML-элементы

**Files:**
- Modify: `packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/rules/metadata/commonObjects/additionalIndex/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/rules/metadata/importFromXml/worker.ts`

**Interfaces:**
- Produces: отсутствующий `Комментарий` формы → `Comment: ""`; `ДополнительныеПоля: !xml` переживает запись/чтение проекта и экспортируется как `{ AdditionalFields: {} }`.

- [ ] **Step 1: Добавить RED для пустого комментария**

В интеграционном тесте импортировать metadata формы с `<Comment/>`, убедиться, что `Комментарий` отсутствует в YAML, затем экспортировать без reference XML и проверить `Properties.Comment === ""`.

- [ ] **Step 2: Добавить RED дискового round-trip `AdditionalFields`**

В `importConfiguration.test.ts` провести реальный import XML с пустым `AdditionalFields`, сериализовать YAML штатным writer, прочитать штатным parser и экспортировать. Проверить:

```ts
expect(projectYaml).toContain("ДополнительныеПоля: !xml")
expect(exported.AdditionalFields).toEqual({})
```

- [ ] **Step 3: Подтвердить оба RED**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts
pnpm --filter @nakidka/rules exec vitest run --project integration --no-isolate metadata/importFromXml/importConfiguration.test.ts
```

Expected: `Comment` и/или scalar tag теряются на полном пути.

- [ ] **Step 4: Исправить минимальные предметные правила**

Для комментария формы заменить импортный-only default на экспортируемый XML-default:

```ts
comment: stringRule({
  yaml: "Комментарий",
  tag: FormRulesTags.Metadata,
  xmlParents: ["Form", "Properties"],
  defaultValueXMLRaw: "",
})
```

Для `AdditionalFields` сохранить регистрацию `AdditionalIndexItem + additionalFields`. В `worker.ts` сериализовать подготовленный additional-index YAML до переноса результата между проходами worker либо восстановить scalar tags из штатных dependent facts непосредственно перед `serializePreparedYaml`, чтобы `yamlScalarTagAt(item, "ДополнительныеПоля") === "xml"` оставался истинным. Общий YAML/runtime не менять.

- [ ] **Step 5: Проверить GREEN и дубли**

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts metadata/commonObjects/additionalIndex/fromYAMLToXML.test.ts
pnpm --filter @nakidka/rules exec vitest run --project integration --no-isolate metadata/importFromXml/importConfiguration.test.ts
pnpm duplicates -- --base 54b32c509
```

Expected: пустые элементы восстановлены без снимка.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/rules/metadata/forms/clientApplicationForm/rules.ts packages/rules/metadata/forms/clientApplicationForm/fromXMLToYAML.integration.test.ts packages/rules/metadata/commonObjects/additionalIndex/fromYAMLToXML.test.ts packages/rules/metadata/importFromXml/importConfiguration.test.ts packages/rules/metadata/importFromXml/worker.ts
git commit -m "fix: :bug: восстанавливать обязательные пустые XML-теги"
```

---

### Task 5: Подтвердить полный договор и e2e

**Files:**
- Modify: `packages/rules/metadata/fullSyncToXml/snapshotBuilder.test.ts`
- Modify: `packages/rules/metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts`
- Modify only if RED exposes a missing behavior already covered by this specification.
- Do not modify: `e2e/fixtures/xml/**`.

**Interfaces:**
- Produces: точный XML round-trip `cf` и `cfe` с тонким снимком; полная и частичная синхронизация публикуют назначенные ID только через snapshot-кандидат.

- [ ] **Step 1: Проверить публикацию ID полной и частичной синхронизацией**

В `snapshotBuilder.test.ts` передать фрагмент формы с новым `xmlId` и проверить его присутствие в итоговом snapshot полной синхронизации. В `preparePartialXmlSyncPackage.test.ts` передать тот же фрагмент, проверить ID в candidate snapshot и неизменность действующего snapshot до finalize.

Run:

```bash
pnpm --filter @nakidka/rules exec vitest run --project integration --no-isolate metadata/fullSyncToXml/snapshotBuilder.test.ts metadata/partialSyncToXml/preparePartialXmlSyncPackage.test.ts
```

- [ ] **Step 2: Запустить целевые проверки областей**

```bash
pnpm --filter @nakidka/rules exec vitest run --project unit --no-isolate metadata/configurationIndex metadata/commonObjects/internalInfo
pnpm --filter @nakidka/rules exec vitest run --project core-metadata --no-isolate metadata/forms/clientApplicationForm metadata/commonObjects/additionalIndex
pnpm --filter @nakidka/rules exec vitest run --project integration --no-isolate metadata/importFromXml metadata/fullSyncToXml metadata/forms/clientApplicationForm
```

- [ ] **Step 3: Запустить обязательные проверки проекта**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base 54b32c509
```

- [ ] **Step 4: Запустить полный e2e**

```bash
pnpm test:e2e
```

Expected: 0 изменённых XML-файлов в exact round-trip для `cf` и `cfe`; существующие XML-фикстуры не изменены.

- [ ] **Step 5: Проверить границы спецификации**

Проверить `git diff 54b32c509 --stat` и `git diff 54b32c509 -- packages/runtime/metadata/configurationIndex/types.ts packages/runtime/metadata/configurationIndex/encode.ts packages/runtime/metadata/configurationIndex/decode.ts`. Второй diff должен быть пустым; общие типы правил и формат снимка не менялись.

- [ ] **Step 6: Зафиксировать только необходимые итоговые правки**

Если Task 5 не потребовал production-изменений, отдельный коммит не создавать. Иначе использовать сообщение:

```bash
git commit -m "fix: :bug: завершить точный round-trip тонкого снимка"
```
