# Remove Invalid Extension XML Workarounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Удалить три решения, добавленные для некорректных XML-данных расширения, сохранив нужные общие механизмы round-trip.

**Architecture:** Изменения выполняются рядом с конкретными типами метаданных: `XDTOPackages`, `RootCommandInterface` и тестами `BaseForm`. Общие слои снимка, разрешения ссылок и преобразования `DataPath` не меняются; каждый удаляемый обход заменяется проверкой корректного договора.

**Tech Stack:** TypeScript 6, Vitest 4, TypeBox, существующие `rules.ts` и реестр обработчиков типов metadata.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые `fromXML`, `toXML`, `fromYAML` или `toYAML`; удалять только подтверждённые обходы.
- Не удалять поддержку внутренних имён команд вида `0:<UUID>` и `1:<UUID>`.
- Не изменять преобразование `DataPath` полной итоговой формы расширения.
- Не проектировать в этом плане хранение пустого `xr:MDObjectRef` и точный состав `BaseForm`.
- Не изменять пользовательский файл `packages/mcp/README.md`.
- Перед завершением обязательно выполнить `pnpm type-check` и `pnpm test` из корня worktree.

---

## File Map

- `packages/core/metadata/commonObjects/xDTOPackages/toXML.ts` — определяет XML-тип элемента списка пакетов XDTO.
- `packages/core/metadata/commonObjects/xDTOPackages/toXML.test.ts` — фиксирует различие ссылки `XDTOPackage.<Имя>` и обычной строки.
- `packages/core/metadata/commonObjects/rootCommandInterface/register.ts` — преобразует ссылки ролей и порядок подсистем интерфейса команд.
- `packages/core/metadata/commonObjects/rootCommandInterface/fromXMLToYAML.test.ts` — проверяет только поддерживаемые XML-значения интерфейса команд.
- `packages/core/metadata/commonObjects/rootCommandInterface/fromYAMLToXML.test.ts` — запрещает UUID, не являющиеся metadata-ссылками, но сохраняет внутренние имена команд.
- `packages/core/metadata/commonObjects/rootCommandInterface/toJSONSchema.test.ts` — запрещает произвольный UUID в `ПорядокПодсистем`.
- `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts` — сохраняет подтверждённые инварианты построения `BaseForm` без неверного требования к `DataPath`.

---

### Task 1: Удалить UUID-эвристику пакетов XDTO

**Files:**

- Modify: `packages/core/metadata/commonObjects/xDTOPackages/toXML.test.ts:1-30`
- Modify: `packages/core/metadata/commonObjects/xDTOPackages/toXML.ts:1-9`

**Interfaces:**

- Consumes: `exportXDTOPackagesToXML(context, rule, value: XDTOPackages | undefined): XDTOPackagesXML | undefined`.
- Produces: правило выбора `_xsi:type`, основанное только на префиксе `XDTOPackage.`.

- [ ] **Step 1: Заменить тест некорректного UUID проверками договора**

Заменить единственный тест в `toXML.test.ts` двумя тестами:

```ts
describe("exportXDTOPackagesToXML", () => {
  it("выгружает имя пакета XDTO как ссылку на объект метаданных", () => {
    expect(
      exportXDTOPackagesToXML(
        context,
        { type: "XDTOPackages" },
        ["XDTOPackage.Основной"]
      )
    ).toEqual({
      "xr:Item": [{
        "xr:Presentation": "",
        "xr:CheckState": 0,
        "xr:Value": {
          "_xsi:type": "xr:MDObjectRef",
          "#text": "XDTOPackage.Основной",
        },
      }],
    })
  })

  it("не считает UUID ссылкой на пакет XDTO", () => {
    const value = "12345678-1234-4234-9234-123456789abc"

    expect(
      exportXDTOPackagesToXML(
        context,
        { type: "XDTOPackages" },
        [value]
      )
    ).toEqual({
      "xr:Item": [{
        "xr:Presentation": "",
        "xr:CheckState": 0,
        "xr:Value": {
          "_xsi:type": "xs:string",
          "#text": value,
        },
      }],
    })
  })
})
```

UUID из удалённого XML `70d80fbc-fade-411f-b1bd-5058df6b4362` в тестах не использовать.

- [ ] **Step 2: Запустить тест и подтвердить ошибку**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/xDTOPackages/toXML.test.ts
```

Expected: FAIL в тесте `не считает UUID ссылкой на пакет XDTO`, потому что текущий `UUID_PATTERN` выбирает `xr:MDObjectRef`.

- [ ] **Step 3: Удалить UUID-эвристику**

В `toXML.ts` удалить `UUID_PATTERN` и оставить:

```ts
const getXDTOPackageXMLType = (value: string): "xr:MDObjectRef" | "xs:string" =>
  value.startsWith("XDTOPackage.") ? "xr:MDObjectRef" : "xs:string"
```

Остальной код `exportXDTOPackagesToXML` не менять.

- [ ] **Step 4: Запустить тесты пакетов XDTO**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/xDTOPackages
```

Expected: PASS.

- [ ] **Step 5: Закоммитить задачу**

```bash
git add \
  packages/core/metadata/commonObjects/xDTOPackages/toXML.ts \
  packages/core/metadata/commonObjects/xDTOPackages/toXML.test.ts
git commit -m "fix: :bug: удалить UUID-эвристику пакетов XDTO"
```

---

### Task 2: Удалить поддержку незначащих UUID интерфейса команд

**Files:**

- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/register.ts:1-14,192-209,606-638,694-709`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/fromXMLToYAML.test.ts:42-61,99-102`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/fromYAMLToXML.test.ts:24-60,150-153`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/toJSONSchema.test.ts:9-22`

**Interfaces:**

- Consumes: `importMetadataItemLinkFromYAML`, `importMetadataItemLinksFromYAML`, `exportMetadataItemLinkToYAML`, `exportMetadataItemLinksToYAML`.
- Produces: роли разрешаются только через `roleNameRule`; `ПорядокПодсистем` принимает metadata-ссылки `Subsystem`, вложенные подсистемы и пустой разделитель `""`.

- [ ] **Step 1: Удалить тесты импорта некорректного XML**

Из `fromXMLToYAML.test.ts` удалить тесты:

```text
keeps a platform UUID visibility key as a string
keeps a platform UUID in subsystem order as a string
```

Удалить больше не используемые константы:

```ts
const UUID_ROLE = "00000000-efd0-f8ea-3002-0000aa2905e2"
const UUID_SUBSYSTEM = "f8eaf128-0230-0000-28f1-eaf830020000"
const ROOT = `...`
```

Сохранить `UUID_COMMAND`: он подтверждён основной конфигурацией и используется тестом внутренних имён команд.

- [ ] **Step 2: Заменить положительные UUID-тесты YAML отрицательными**

В `fromYAMLToXML.test.ts` удалить два теста `keeps a platform UUID ...` и добавить:

```ts
it("отклоняет UUID вместо ссылки на роль", () => {
  expect(() =>
    convertYAML({
      ВидимостьКоманд: [{
        Команда: UUID_COMMAND,
        Роли: { [OPAQUE_UUID]: "Ложь" },
      }],
    })
  ).toThrow()
})

it("отклоняет UUID вместо ссылки на подсистему", () => {
  expect(() =>
    convertYAML({ ПорядокПодсистем: [OPAQUE_UUID] })
  ).toThrow()
})
```

Внизу файла оставить:

```ts
const UUID_COMMAND = "0:2f109eaa-d341-4592-a04f-3f199e75d879"
const OPAQUE_UUID = "12345678-1234-4234-9234-123456789abc"
```

- [ ] **Step 3: Запретить UUID схемой порядка подсистем**

В `toJSONSchema.test.ts` добавить к существующему тесту:

```ts
expect(
  compiled.Check({
    ПорядокПодсистем: ["12345678-1234-4234-9234-123456789abc"],
  })
).toBe(false)
```

- [ ] **Step 4: Запустить тесты и подтвердить ошибки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/rootCommandInterface/fromYAMLToXML.test.ts \
  metadata/commonObjects/rootCommandInterface/toJSONSchema.test.ts
```

Expected:

- FAIL: преобразование пока пропускает `OPAQUE_UUID`;
- FAIL: схема пока принимает UUID по `PLATFORM_UUID_PATTERN`.

- [ ] **Step 5: Вернуть обычное разрешение ссылок ролей**

В импортах `register.ts` вернуть функции списков:

```ts
import {
  importMetadataItemLinkFromYAML,
  importMetadataItemLinksFromYAML,
} from "../metadataRef/fromYAML"
import {
  exportMetadataItemLinkToYAML,
  exportMetadataItemLinksToYAML,
} from "../metadataRef/toYAML"
```

Удалить `PLATFORM_UUID_PATTERN`, `roleReferenceToYAML` и `roleReferenceFromYAML`.

В `importVisibilityFromYAMLValue` использовать:

```ts
const importedRoleName =
  importMetadataItemLinkFromYAML(context, roleNameRule, roleName)
```

В `exportVisibilityToYAMLValue` использовать:

```ts
const exportedRoleName =
  exportMetadataItemLinkToYAML(context, roleNameRule, roleName)
```

- [ ] **Step 6: Вернуть обычное разрешение порядка подсистем**

Удалить функции:

```text
exportCommandInterfaceSubsystemsOrderToYAML
importCommandInterfaceSubsystemsOrderFromYAML
```

Вернуть схему:

```ts
const exportCommandInterfaceSubsystemsOrderToJSONSchema: ExportToJSONSchemaFn = ({ rule }) => {
  const subsystemSchema = buildMetadataTargetSchema(
    rule.metadataTarget ?? { kind: "object", roots: ["Subsystem"], allowNested: true }
  )
  return Type.Array(Type.Union([subsystemSchema, Type.Literal("")]))
}
```

Вернуть регистрации:

```ts
registerTypeRule(
  "CommandInterfaceSubsystemsOrder",
  "importFromYAML",
  importMetadataItemLinksFromYAML
)
registerTypeRule(
  "CommandInterfaceSubsystemsOrder",
  "exportToYAML",
  exportMetadataItemLinksToYAML
)
```

- [ ] **Step 7: Запустить все тесты интерфейса команд**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/rootCommandInterface
```

Expected: PASS, включая тесты с `UUID_COMMAND`.

- [ ] **Step 8: Проверить отсутствие удалённых значений**

Run:

```bash
rg -n \
  "00000000-efd0-f8ea-3002-0000aa2905e2|f8eaf128-0230-0000-28f1-eaf830020000|PLATFORM_UUID_PATTERN" \
  packages/core/metadata/commonObjects/rootCommandInterface
```

Expected: код возврата `1`, совпадений нет.

- [ ] **Step 9: Закоммитить задачу**

```bash
git add \
  packages/core/metadata/commonObjects/rootCommandInterface/register.ts \
  packages/core/metadata/commonObjects/rootCommandInterface/fromXMLToYAML.test.ts \
  packages/core/metadata/commonObjects/rootCommandInterface/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/rootCommandInterface/toJSONSchema.test.ts
git commit -m "fix: :bug: запретить UUID интерфейса без metadata-ссылки"
```

---

### Task 3: Удалить неверное ожидание `DataPath` внутри `BaseForm`

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts:1-18,89-148`

**Interfaces:**

- Consumes: `buildClientApplicationBaseForm(...)`.
- Produces: тесты только подтверждённых инвариантов `BaseForm`: полное преобразование по обычным правилам, отсутствие корневых namespace и отсутствие записей построенной базовой формы в снимке результата.

- [ ] **Step 1: Удалить неподтверждённый тест**

Из `baseForm.test.ts` удалить тест:

```text
строит внутреннее имя стандартного реквизита по индексу итоговой формы
```

Удалить используемую только им функцию:

```text
contextWithLayeredCatalogOwner
```

- [ ] **Step 2: Удалить неиспользуемые импорты**

Удалить:

```ts
import { createImportSharedMetadata } from "../../importFromXml/metadataSnapshot"
import {
  createLayeredImportReferenceSnapshot,
  createLayeredOwnerMetadataCache,
} from "../../importFromXml/componentReferenceIndex"
import { createValidationOwnerFacts } from "../../validation/dataPath/ownerFacts"
import { buildObjectFieldIndex } from "../../validation/dataPath/objectFields"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
```

Производственный код `baseForm.ts` на этом шаге не менять: точный состав `BaseForm` ещё не спроектирован.

- [ ] **Step 3: Запустить тесты `BaseForm`**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseForm.test.ts
```

Expected: PASS; остаются два подтверждённых теста.

- [ ] **Step 4: Подтвердить сохранение `DataPath` итоговой формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/commonObjects/metadataPath/fromYAML.test.ts \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS, включая тест `возвращает стандартный реквизит DataPath по готовым индексам расширения`.

- [ ] **Step 5: Закоммитить задачу**

```bash
git add packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts
git commit -m "test: :white_check_mark: убрать неверное ожидание BaseForm"
```

---

### Task 4: Итоговая проверка очистки

**Files:**

- Verify only: весь worktree.

**Interfaces:**

- Consumes: результаты Tasks 1-3.
- Produces: подтверждение типизации, всех тестов проекта и отсутствия случайных изменений.

- [ ] **Step 1: Запустить проверку TypeScript**

Run:

```bash
pnpm type-check
```

Expected: PASS.

- [ ] **Step 2: Запустить все тесты проекта**

Run:

```bash
pnpm test
```

Expected: PASS во всех `packages/*`.

- [ ] **Step 3: Проверить итоговый состав изменений**

Run:

```bash
git status --short
git diff --check
git log --oneline -4
```

Expected:

- нет незакоммиченных изменений реализации;
- `packages/mcp/README.md` остаётся единственным пользовательским изменением и не входит ни в один новый коммит;
- последние три коммита реализации соответствуют Tasks 1-3;
- `git diff --check` не сообщает ошибок.

- [ ] **Step 4: Сверить границы решения со спецификацией**

Проверить вручную:

```text
XDTOPackages:
  XDTOPackage.<Имя> -> xr:MDObjectRef
  UUID-подобная строка -> xs:string

RootCommandInterface:
  UUID роли и подсистемы не поддерживаются
  0:<UUID> и 1:<UUID> внутренних команд поддерживаются

BaseForm:
  неверный тест DataPath удалён
  преобразование DataPath итоговой формы сохранено
```

Если эти утверждения подтверждены результатами тестов, реализация плана завершена. Отдельно остаются проектирование пустого `xr:MDObjectRef` и точного состава `BaseForm`.
