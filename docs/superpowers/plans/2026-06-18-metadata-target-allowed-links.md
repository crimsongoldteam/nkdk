# Metadata Target Allowed Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разрешить ровно те metadata-ссылки, которые перечислены в контрольных XML для `Catalog.basedOn`, `FunctionalOption.content` и `Subsystem.content`.

**Architecture:** Расширяем общий `metadataTargets` точными path-ограничениями, не ломая существующие `roots`, `objectRoots`, `nestedObjectRoots` и `memberKinds`. Новые правила трех свойств используют закрытые списки путей; парсер и форматтер продолжают возвращать canonical model strings.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser`, существующий metadata orchestration слой.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
  - Добавить новые корни, новые виды member-сегментов и точные path-ограничения.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
  - Добавить YAML-имена для новых корней и member-сегментов.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
  - Научить parser object/member ссылкам `ExternalDataSource.Table`, `ExternalDataSource.Cube`, `ExternalDataSource.Cube.DimensionTable`, `ExternalDataSource.Function` и точной проверке path-ограничений.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`
  - Форматировать новые корни и member-сегменты в YAML.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
  - Покрыть новые корни, новые пути и отрицательные случаи.
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
  - Заменить `basedOn.metadataTarget` на закрытый список из `СправочникПолный.xml`.
- Modify: `packages/core/metadata/appliedObjects/metadataFunctionalOption/rules.ts`
  - Заменить списки `content*` на закрытые path-ограничения из `ФункциональнаяОпцияВсеСвойства.xml`.
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`
  - Заменить `allowNested: true` на закрытый список object-путей из `ПодсистемаВсеСвойства.xml`.
- Create: `packages/core/metadata/appliedObjects/metadataFunctionalOption/__fixtures__/all-targets.xml`
  - Локальная тестовая фикстура на основании `/home/nikita/git/round-trip/all/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml`.
- Create: `packages/core/metadata/appliedObjects/metadataSubsystem/__fixtures__/all-targets.xml`
  - Локальная тестовая фикстура на основании `/home/nikita/git/round-trip/all/Subsystems/ПодсистемаВсеСвойства.xml`.
- Modify: `packages/core/metadata/appliedObjects/metadataFunctionalOption/fromXML.test.ts`
  - Добавить round-trip тест новой фикстуры.
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/fromXML.test.ts`
  - Добавить round-trip тест новой фикстуры.
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts`
  - Добавить отрицательный тест на запрет member-ссылок в subsystem content.

## Task 1: MetadataTargets Failing Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Add failing tests for new roots and exact paths**

Append this block near the other parser tests in `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`:

```ts
  it("parses and formats additional top-level roots used by subsystem content", () => {
    const cases = [
      ["ПодпискаНаСобытие.ПодпискаНаСобытиеВсеСвойства", "EventSubscription.ПодпискаНаСобытиеВсеСвойства", "EventSubscription"],
      ["ПакетXDTO.ПакетXDTOВсеСвойства", "XDTOPackage.ПакетXDTOВсеСвойства", "XDTOPackage"],
      ["WSСсылка.WSСсылкаВсеСвойства", "WSReference.WSСсылкаВсеСвойства", "WSReference"],
      [
        "ПараметрФункциональныхОпций.ПараметрФункциональныхОпцийВсеСвойства",
        "FunctionalOptionParameter.ПараметрФункциональныхОпцийВсеСвойства",
        "FunctionalOptionParameter",
      ],
    ] as const

    for (const [yaml, canonical, root] of cases) {
      const constraint = { kind: "object", allowedObjectPaths: [[root]] } as const
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("parses and formats external data source object paths", () => {
    const constraint = {
      kind: "object",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube"],
        ["ExternalDataSource", "Cube", "DimensionTable"],
        ["ExternalDataSource", "Function"],
      ],
    } as const

    const cases = [
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.ТаблицаИзмерения.ТаблицаИзмеренияВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.DimensionTable.ТаблицаИзмеренияВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Функция.ФункцияВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Function.ФункцияВсеСвойства",
      ],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("parses and formats exact external data source member paths", () => {
    const constraint = {
      kind: "member",
      owner: "explicit",
      allowedObjectPaths: [
        ["ExternalDataSource", "Table"],
        ["ExternalDataSource", "Cube", "DimensionTable"],
      ],
      allowedMemberPaths: [
        ["ExternalDataSource", "Table", "Field"],
        ["ExternalDataSource", "Table", "Command"],
        ["ExternalDataSource", "Cube", "DimensionTable", "Field"],
        ["ExternalDataSource", "Cube", "Dimension"],
        ["ExternalDataSource", "Cube", "Resource"],
        ["ExternalDataSource", "Cube", "Command"],
      ],
    } as const

    const cases = [
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства.Поле.ПолеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства.Field.ПолеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Таблица.ТаблицаВсеСвойства.Команда.Команда1",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Table.ТаблицаВсеСвойства.Command.Команда1",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.ТаблицаИзмерения.ТаблицаИзмеренияВсеСвойства.Поле.ПолеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.DimensionTable.ТаблицаИзмеренияВсеСвойства.Field.ПолеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Измерение.ИзмерениеВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Dimension.ИзмерениеВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Ресурс.РесурсВсеСвойства",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Resource.РесурсВсеСвойства",
      ],
      [
        "ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства.Куб.КубВсеСвойства.Команда.Команда1",
        "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства.Command.Команда1",
      ],
    ] as const

    for (const [yaml, canonical] of cases) {
      expect(parseMetadataTargetFromYAML({ value: yaml, constraint })).toMatchObject({ ok: true, canonical })
      expect(parseMetadataTargetFromModel({ canonical, constraint })).toMatchObject({ ok: true, canonical })
      expect(formatMetadataTargetToYAML({ canonical, constraint })).toBe(yaml)
    }
  })

  it("rejects exact target paths outside the configured allow list", () => {
    expect(
      parseMetadataTargetFromModel({
        canonical: "ExternalDataSource.ВнешнийИсточникДанныхВсеСвойства.Cube.КубВсеСвойства",
        constraint: { kind: "object", allowedObjectPaths: [["ExternalDataSource", "Table"]] },
      })
    ).toMatchObject({ ok: false, code: "disallowed-kind" })

    expect(
      parseMetadataTargetFromModel({
        canonical: "AccumulationRegister.РегистрНакопленияВсеСвойстваОбороты",
        constraint: {
          kind: "member",
          owner: "explicit",
          allowedMemberPaths: [["AccumulationRegister", "Dimension"]],
        },
      })
    ).toMatchObject({ ok: false, code: "invalid-shape" })

    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом",
        constraint: { kind: "object", allowedObjectPaths: [["Catalog"]] },
      })
    ).toMatchObject({ ok: false, code: "unknown-segment" })
  })
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts --no-isolate
```

Expected: FAIL. The failures should mention unsupported roots, unknown segments like `Table`/`Field`, or missing `allowedObjectPaths`/`allowedMemberPaths` type support.

## Task 2: Extend MetadataTarget Types And Roots

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`

- [ ] **Step 1: Add model types for exact path constraints**

In `packages/core/metadata/commonObjects/metadataTargets/types.ts`, extend the existing unions and interfaces to include these definitions:

```ts
export type MetadataRootName =
  | "Constant"
  | "Catalog"
  | "Document"
  | "Enum"
  | "DefinedType"
  | "Characteristic"
  | "CommandGroup"
  | "Role"
  | "InformationRegister"
  | "AccumulationRegister"
  | "AccountingRegister"
  | "CalculationRegister"
  | "ExchangePlan"
  | "ChartOfAccounts"
  | "ChartOfCharacteristicTypes"
  | "ChartOfCalculationTypes"
  | "BusinessProcess"
  | "BusinessProcessRoutePoint"
  | "Task"
  | "DataProcessor"
  | "Report"
  | "DocumentNumerator"
  | "CommonCommand"
  | "CommonPicture"
  | "CommonTemplate"
  | "CommonModule"
  | "CommonAttribute"
  | "CommonForm"
  | "FilterCriterion"
  | "ScheduledJob"
  | "IntegrationService"
  | "Language"
  | "Style"
  | "StyleItem"
  | "FunctionalOption"
  | "FunctionalOptionParameter"
  | "DocumentJournal"
  | "HTTPService"
  | "WebSocketClient"
  | "WebService"
  | "Bot"
  | "ExternalDataSource"
  | "EventSubscription"
  | "XDTOPackage"
  | "WSReference"
  | "SessionParameter"
  | "SettingsStorage"
  | "Subsystem"

export type MetadataObjectPathKind = "Table" | "Cube" | "DimensionTable" | "Function"

export type MetadataMemberKind =
  | "Attribute"
  | "StandardAttribute"
  | "TabularSection"
  | "Dimension"
  | "Resource"
  | "Form"
  | "Template"
  | "Command"
  | "AccountingFlag"
  | "Field"
  | "ExtDimensionAccountingFlag"
  | "AddressingAttribute"

export type MetadataTargetPath = readonly [
  MetadataRootName,
  ...(MetadataObjectPathKind | MetadataMemberKind)[],
]
```

Then add optional fields:

```ts
export interface ObjectTargetConstraint {
  kind: "object"
  roots?: readonly MetadataRootName[]
  scope?: "project" | "owner"
  allowNested?: boolean
  allowedObjectPaths?: readonly MetadataTargetPath[]
  filters?: readonly MetadataTargetFilter[]
}

export interface MemberTargetConstraint {
  kind: "member"
  owner: "this" | "explicit"
  roots?: readonly MetadataRootName[]
  objectRoots?: readonly MetadataRootName[]
  nestedObjectRoots?: readonly MetadataRootName[]
  memberKinds?: readonly MetadataMemberKind[]
  allowedObjectPaths?: readonly MetadataTargetPath[]
  allowedMemberPaths?: readonly MetadataTargetPath[]
  filters?: readonly MetadataTargetFilter[]
  allowOwner?: boolean
}
```

- [ ] **Step 2: Add YAML names for new roots and member/object path tokens**

In `packages/core/metadata/commonObjects/metadataTargets/roots.ts`, add:

```ts
export const rootToYAML = {
  // keep existing entries
  EventSubscription: "ПодпискаНаСобытие",
  XDTOPackage: "ПакетXDTO",
  WSReference: "WSСсылка",
  // keep existing entries
} as const satisfies Record<MetadataRootName, string>
```

Extend `memberKindToYAML`:

```ts
export const memberKindToYAML = {
  Attribute: "Реквизит",
  StandardAttribute: "СтандартныйРеквизит",
  TabularSection: "ТабличнаяЧасть",
  Dimension: "Измерение",
  Resource: "Ресурс",
  Form: "Форма",
  Template: "Макет",
  Command: "Команда",
  AccountingFlag: "ПризнакУчета",
  Field: "Поле",
  ExtDimensionAccountingFlag: "ПризнакУчетаСубконто",
  AddressingAttribute: "РеквизитАдресации",
} as const satisfies Record<MetadataMemberKind, string>
```

Add object path token maps below `fieldKindFromYAML`:

```ts
export const objectPathKindToYAML = {
  Table: "Таблица",
  Cube: "Куб",
  DimensionTable: "ТаблицаИзмерения",
  Function: "Функция",
} as const satisfies Record<MetadataObjectPathKind, string>

export const objectPathKindFromYAML = Object.fromEntries(
  Object.entries(objectPathKindToYAML).map(([model, yaml]) => [yaml, model])
) as Partial<Record<string, MetadataObjectPathKind>>
```

- [ ] **Step 3: Run type check and parser tests**

Run:

```bash
pnpm --dir packages/core exec tsc --noEmit
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts --no-isolate
```

Expected: TypeScript may still fail in `parse.ts`/`format.ts` because new fields are not implemented. Parser tests still fail.

## Task 3: Implement Exact Path Parsing And Formatting

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`

- [ ] **Step 1: Import object path maps and types**

At the top of `parse.ts`, update imports:

```ts
import {
  isMetadataRootName,
  METADATA_NAME_PATTERN,
  memberKindFromYAML,
  memberKindToYAML,
  objectPathKindFromYAML,
  objectPathKindToYAML,
  rootFromYAML,
  standardAttributeFromYAML,
} from "./roots"
import type {
  MetadataMemberKind,
  MetadataMemberSegment,
  MetadataObjectPathKind,
  MetadataObjectSegment,
  MetadataRootName,
  MetadataTargetConstraint,
  MetadataTargetOwner,
  MetadataTargetParseErrorCode,
  MetadataTargetParseResult,
  MetadataTargetPath,
  MetadataValueKind,
  ParsedMetadataTarget,
} from "./types"
```

- [ ] **Step 2: Replace object parsing with exact path support**

Replace `parseObjectTarget` with:

```ts
function parseObjectTarget(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "object" }>,
  source: "yaml" | "model"
): MetadataTargetParseResult {
  const parsed = parseObjectSegments(tail, source)
  if (!parsed.ok) return parsed

  if (parsed.segments.length === 0) {
    const target = { kind: "object" as const, root, objectName }
    return ensureObjectPathAllowed(target, constraint)
  }

  if (!constraint.allowNested && !constraint.allowedObjectPaths) {
    return unknownSegment(tail[0])
  }

  const target = { kind: "object" as const, root, objectName, segments: parsed.segments }
  return ensureObjectPathAllowed(target, constraint)
}
```

Update both call sites to pass `constraint` instead of `constraint.allowNested === true`:

```ts
return parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
  parseObjectTarget(root, objectName, tail, constraint, "yaml")
)
```

```ts
return parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
  parseObjectTarget(root, objectName, tail, constraint, "model")
)
```

- [ ] **Step 3: Add object segment parser helpers**

Add below `parseObjectTarget`:

```ts
function parseObjectSegments(
  tail: readonly string[],
  source: "yaml" | "model"
):
  | { ok: true; segments: MetadataObjectSegment[] }
  | { ok: false; code: MetadataTargetParseErrorCode; message: string } {
  if (tail.length === 0) return { ok: true, segments: [] }
  if (tail.length % 2 !== 0) return invalidShape()

  const segments: MetadataObjectSegment[] = []
  for (let index = 0; index < tail.length; index += 2) {
    const kindToken = tail[index]
    const kind = source === "yaml" ? parseObjectPathKindFromYAML(kindToken) : parseObjectPathKindFromModel(kindToken)
    if (!kind) return unknownSegment(kindToken)

    const objectName = tail[index + 1]
    if (!isValidMetadataName(objectName)) return invalidShape()

    segments.push({ root: kind, objectName })
  }

  return { ok: true, segments }
}

function parseObjectPathKindFromYAML(value: string | undefined): MetadataObjectPathKind | undefined {
  return value === undefined ? undefined : objectPathKindFromYAML[value]
}

function parseObjectPathKindFromModel(value: string | undefined): MetadataObjectPathKind | undefined {
  return value !== undefined && Object.prototype.hasOwnProperty.call(objectPathKindToYAML, value)
    ? (value as MetadataObjectPathKind)
    : undefined
}
```

- [ ] **Step 4: Make `MetadataObjectSegment.root` accept object path kinds**

In `types.ts`, change:

```ts
export interface MetadataObjectSegment {
  root: MetadataRootName
  objectName: string
}
```

to:

```ts
export interface MetadataObjectSegment {
  root: MetadataObjectPathKind
  objectName: string
}
```

Also change the member branch of `ParsedMetadataTarget` in `types.ts` so member references can carry nested object owners before the terminal member path:

```ts
export type ParsedMetadataTarget =
  | { kind: "object"; root: MetadataRootName; objectName: string; segments?: MetadataObjectSegment[] }
  | {
      kind: "member"
      root: MetadataRootName
      objectName: string
      objectSegments?: MetadataObjectSegment[]
      segments: MetadataMemberSegment[]
    }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "predefinedValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "enumValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "emptyRef" }
```

- [ ] **Step 5: Add exact path allow checks**

Add these helpers in `parse.ts`:

```ts
function ensureObjectPathAllowed(
  target: Extract<ParsedMetadataTarget, { kind: "object" }>,
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" }>
): MetadataTargetParseResult {
  if (constraint.allowedObjectPaths && !pathAllowed(objectTargetPath(target), constraint.allowedObjectPaths)) {
    return disallowedKind(objectTargetPath(target).join("."))
  }

  return success(formatCanonicalTarget(target), target)
}

function ensureMemberPathAllowed(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>
): MetadataTargetParseResult {
  if (constraint.allowedMemberPaths && !pathAllowed(memberTargetPath(target), constraint.allowedMemberPaths)) {
    return disallowedKind(memberTargetPath(target).join("."))
  }

  return success(formatCanonicalTarget(target), target)
}

function objectTargetPath(target: Extract<ParsedMetadataTarget, { kind: "object" }>): MetadataTargetPath {
  return [target.root, ...(target.segments ?? []).map((segment) => segment.root)]
}

function memberTargetPath(target: Extract<ParsedMetadataTarget, { kind: "member" }>): MetadataTargetPath {
  const path: string[] = [target.root]
  for (const segment of target.segments) {
    path.push(segment.kind)
  }
  return path as unknown as MetadataTargetPath
}

function pathAllowed(path: MetadataTargetPath, allowedPaths: readonly MetadataTargetPath[]): boolean {
  return allowedPaths.some((allowed) => allowed.length === path.length && allowed.every((part, index) => part === path[index]))
}
```

- [ ] **Step 6: Route member object targets through exact object path checks**

In `parseMemberObjectTarget`, after `parseObjectTarget(...)`, ensure the result uses the member constraint:

```ts
const parsed = parseObjectTarget(root, objectName, tail, { kind: "object", allowedObjectPaths: constraint.allowedObjectPaths, allowNested: true }, source)
if (!parsed.ok || parsed.target.kind !== "object") return parsed
return ensureObjectPathAllowed(parsed.target, constraint)
```

Keep the existing checks for `objectRoots` and `nestedObjectRoots` before this block, so old rules keep their behavior.

- [ ] **Step 7: Add exact member path parsing before the legacy member parser**

At the start of `parseMemberOrOwnerTarget`, before `parseMemberSegments(...)`, add:

```ts
if (constraint.allowedMemberPaths) {
  const exact = parseExactMemberPath(root, objectName, tail, constraint, source)
  if (exact.ok) return exact
  if (exact.code !== "invalid-shape") return exact
}
```

Add this helper below `parseMemberSegments`:

```ts
function parseExactMemberPath(
  root: MetadataRootName,
  objectName: string,
  tail: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  source: "yaml" | "model"
): MetadataTargetParseResult {
  if (tail.length === 0 || tail.length % 2 !== 0) return invalidShape()

  for (const allowedPath of constraint.allowedMemberPaths ?? []) {
    if (allowedPath[0] !== root) continue

    const objectSegments: MetadataObjectSegment[] = []
    const memberSegments: MetadataMemberSegment[] = []
    let tailIndex = 0
    let matched = true

    for (let pathIndex = 1; pathIndex < allowedPath.length; pathIndex += 1) {
      const expectedKind = allowedPath[pathIndex]
      const kindToken = tail[tailIndex]
      const nameToken = tail[tailIndex + 1]
      if (kindToken === undefined || nameToken === undefined || !isValidMetadataName(nameToken)) {
        matched = false
        break
      }

      const objectKind =
        source === "yaml" ? parseObjectPathKindFromYAML(kindToken) : parseObjectPathKindFromModel(kindToken)
      if (objectKind === expectedKind) {
        objectSegments.push({ root: objectKind, objectName: nameToken })
        tailIndex += 2
        continue
      }

      const memberKind = source === "yaml" ? parseMemberKindFromYAML(kindToken) : parseMemberKindFromModel(kindToken)
      if (memberKind === expectedKind) {
        memberSegments.push({ kind: memberKind, name: normalizeMemberSegmentName(memberKind, nameToken, source) })
        tailIndex += 2
        continue
      }

      matched = false
      break
    }

    if (!matched || tailIndex !== tail.length || memberSegments.length === 0) continue

    const target = {
      kind: "member" as const,
      root,
      objectName,
      objectSegments: objectSegments.length > 0 ? objectSegments : undefined,
      segments: memberSegments,
    }
    return success(formatCanonicalTarget(target), target)
  }

  return disallowedKind([root, ...tail.filter((_, index) => index % 2 === 0)].join("."))
}
```

- [ ] **Step 8: Apply exact member path checks to the legacy member parser**

At the end of `parseMemberSegments`, replace:

```ts
return success([root, objectName, ...canonicalSegments].join("."), { kind: "member", root, objectName, segments })
```

with:

```ts
return ensureMemberPathAllowed(
  { kind: "member", root, objectName, segments },
  constraint
)
```

- [ ] **Step 9: Include objectSegments in canonical member formatting**

In `formatCanonicalTarget`, replace the member case with:

```ts
case "member":
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.root, segment.objectName]),
    ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")
```

- [ ] **Step 10: Format object path segments with object path YAML names**

In `format.ts`, import `objectPathKindToYAML`:

```ts
import { memberKindToYAML, objectPathKindToYAML, rootToYAML, standardAttributeToYAML } from "./roots"
```

Replace object formatting with:

```ts
case "object":
  return [
    rootToYAML[target.root],
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [objectPathKindToYAML[segment.root], segment.objectName]),
  ].join(".")
```

In `formatMemberTargetToYAML`, include `target.objectSegments` before member segments:

```ts
const full = [
  rootToYAML[target.root],
  target.objectName,
  ...(target.objectSegments ?? []).flatMap((segment) => [objectPathKindToYAML[segment.root], segment.objectName]),
  ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)]),
].join(".")
```

- [ ] **Step 11: Run parser tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts --no-isolate
```

Expected: PASS for `parse.test.ts`.

- [ ] **Step 12: Commit parser support**

```bash
git add packages/core/metadata/commonObjects/metadataTargets
git commit -m "feat: :sparkles: уточнить metadataTarget пути"
```

## Task 4: Apply Exact Constraints To Three Rules

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataFunctionalOption/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts`

- [ ] **Step 1: Update catalog basedOn**

Replace `basedOn.metadataTarget` in `metadataCatalog/rules.ts` with:

```ts
metadataTarget: {
  kind: "object",
  allowedObjectPaths: [
    ["ChartOfAccounts"],
    ["ExternalDataSource", "Table"],
    ["ExchangePlan"],
    ["Catalog"],
    ["Document"],
    ["ChartOfCharacteristicTypes"],
    ["BusinessProcess"],
    ["ChartOfCalculationTypes"],
    ["Task"],
  ],
},
```

- [ ] **Step 2: Replace functional option content constants**

In `metadataFunctionalOption/rules.ts`, remove `contentObjectRoots` and `contentMemberRoots`. Add:

```ts
const contentObjectPaths = [
  ["Catalog"],
  ["Subsystem"],
  ["CommonAttribute"],
  ["ExchangePlan"],
  ["FilterCriterion"],
  ["CommonForm"],
  ["CommonCommand"],
  ["DocumentJournal"],
  ["Enum"],
  ["DataProcessor"],
  ["ChartOfCharacteristicTypes"],
  ["ChartOfAccounts"],
  ["ChartOfCalculationTypes"],
  ["InformationRegister"],
  ["AccountingRegister"],
  ["CalculationRegister"],
  ["BusinessProcess"],
  ["Task"],
  ["ExternalDataSource", "Cube"],
  ["ExternalDataSource", "Table"],
  ["ExternalDataSource", "Cube", "DimensionTable"],
  ["ExternalDataSource", "Function"],
] as const

const contentMemberPaths = [
  ["Catalog", "Attribute"],
  ["Catalog", "TabularSection"],
  ["Catalog", "TabularSection", "Attribute"],
  ["Catalog", "Command"],
  ["ExchangePlan", "Attribute"],
  ["ExchangePlan", "Command"],
  ["ExchangePlan", "TabularSection"],
  ["ExchangePlan", "TabularSection", "Attribute"],
  ["FilterCriterion", "Command"],
  ["Document", "Attribute"],
  ["Document", "TabularSection", "Attribute"],
  ["Document", "Command"],
  ["DocumentJournal", "Command"],
  ["Enum", "Command"],
  ["DataProcessor", "Attribute"],
  ["DataProcessor", "TabularSection"],
  ["DataProcessor", "TabularSection", "Attribute"],
  ["DataProcessor", "Command"],
  ["ChartOfCharacteristicTypes", "TabularSection"],
  ["ChartOfCharacteristicTypes", "TabularSection", "Attribute"],
  ["ChartOfCharacteristicTypes", "Command"],
  ["ChartOfAccounts", "Attribute"],
  ["ChartOfAccounts", "AccountingFlag"],
  ["ChartOfAccounts", "ExtDimensionAccountingFlag"],
  ["ChartOfAccounts", "TabularSection"],
  ["ChartOfAccounts", "TabularSection", "Attribute"],
  ["ChartOfAccounts", "Command"],
  ["ChartOfCalculationTypes", "Attribute"],
  ["ChartOfCalculationTypes", "TabularSection"],
  ["ChartOfCalculationTypes", "TabularSection", "Attribute"],
  ["ChartOfCalculationTypes", "Command"],
  ["InformationRegister", "Dimension"],
  ["InformationRegister", "Resource"],
  ["InformationRegister", "Attribute"],
  ["InformationRegister", "Command"],
  ["AccumulationRegister", "Dimension"],
  ["AccumulationRegister", "Resource"],
  ["AccumulationRegister", "Attribute"],
  ["AccumulationRegister", "Command"],
  ["AccountingRegister", "Dimension"],
  ["AccountingRegister", "Resource"],
  ["AccountingRegister", "Attribute"],
  ["AccountingRegister", "Command"],
  ["CalculationRegister", "Dimension"],
  ["CalculationRegister", "Resource"],
  ["CalculationRegister", "Attribute"],
  ["CalculationRegister", "Command"],
  ["BusinessProcess", "Attribute"],
  ["BusinessProcess", "TabularSection"],
  ["BusinessProcess", "TabularSection", "Attribute"],
  ["BusinessProcess", "Command"],
  ["Task", "AddressingAttribute"],
  ["Task", "Attribute"],
  ["Task", "TabularSection"],
  ["Task", "TabularSection", "Attribute"],
  ["Task", "Command"],
  ["ExternalDataSource", "Table", "Field"],
  ["ExternalDataSource", "Table", "Command"],
  ["ExternalDataSource", "Cube", "DimensionTable", "Field"],
  ["ExternalDataSource", "Cube", "Dimension"],
  ["ExternalDataSource", "Cube", "Resource"],
  ["ExternalDataSource", "Cube", "Command"],
] as const
```

Then replace `content.metadataTarget` with:

```ts
metadataTarget: {
  kind: "member",
  owner: "explicit",
  allowedObjectPaths: contentObjectPaths,
  allowedMemberPaths: contentMemberPaths,
},
```

- [ ] **Step 3: Update subsystem content**

In `metadataSubsystem/rules.ts`, add near constants:

```ts
const contentObjectPaths = [
  ["Document"],
  ["DocumentNumerator"],
  ["InformationRegister"],
  ["ChartOfCharacteristicTypes"],
  ["Catalog"],
  ["CommonModule"],
  ["SessionParameter"],
  ["Role"],
  ["CommonAttribute"],
  ["ExchangePlan"],
  ["FilterCriterion"],
  ["EventSubscription"],
  ["ScheduledJob"],
  ["Bot"],
  ["FunctionalOption"],
  ["FunctionalOptionParameter"],
  ["DefinedType"],
  ["SettingsStorage"],
  ["CommonCommand"],
  ["CommandGroup"],
  ["CommonForm"],
  ["CommonTemplate"],
  ["CommonPicture"],
  ["XDTOPackage"],
  ["WebService"],
  ["HTTPService"],
  ["WSReference"],
  ["WebSocketClient"],
  ["IntegrationService"],
  ["StyleItem"],
  ["Style"],
  ["Constant"],
  ["DocumentJournal"],
  ["Enum"],
  ["Report"],
  ["DataProcessor"],
  ["ChartOfAccounts"],
  ["ChartOfCalculationTypes"],
  ["AccumulationRegister"],
  ["AccountingRegister"],
  ["CalculationRegister"],
  ["BusinessProcess"],
  ["Task"],
  ["ExternalDataSource", "Table"],
  ["ExternalDataSource", "Cube", "DimensionTable"],
  ["ExternalDataSource", "Cube"],
] as const
```

Replace `content.metadataTarget` with:

```ts
metadataTarget: { kind: "object", allowedObjectPaths: contentObjectPaths },
```

- [ ] **Step 4: Run rule type check**

Run:

```bash
pnpm --dir packages/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit rule changes**

```bash
git add packages/core/metadata/appliedObjects/metadataCatalog/rules.ts packages/core/metadata/appliedObjects/metadataFunctionalOption/rules.ts packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts
git commit -m "fix: :bug: ограничить metadataTarget ссылки правилами"
```

## Task 5: Add Applied Object Fixtures And Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataFunctionalOption/__fixtures__/all-targets.xml`
- Create: `packages/core/metadata/appliedObjects/metadataSubsystem/__fixtures__/all-targets.xml`
- Modify: `packages/core/metadata/appliedObjects/metadataFunctionalOption/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts`

- [ ] **Step 1: Create local fixture copies**

Run:

```bash
cp /home/nikita/git/round-trip/all/FunctionalOptions/ФункциональнаяОпцияВсеСвойства.xml packages/core/metadata/appliedObjects/metadataFunctionalOption/__fixtures__/all-targets.xml
cp /home/nikita/git/round-trip/all/Subsystems/ПодсистемаВсеСвойства.xml packages/core/metadata/appliedObjects/metadataSubsystem/__fixtures__/all-targets.xml
```

Expected: two new fixture files exist inside `packages/core/metadata/appliedObjects/**/__fixtures__`.

- [ ] **Step 2: Add functional option fixture case**

In `metadataFunctionalOption/fromXML.test.ts`, change `cases` to:

```ts
const cases = [
  { fixture: "full.xml", name: "ФункциональнаяОпцияВсеСвойства" },
  { fixture: "minimal.xml", name: "ФункциональнаяОпцияПоУмолчанию" },
  { fixture: "all-targets.xml", name: "ФункциональнаяОпцияВсеСвойства" },
]
```

- [ ] **Step 3: Add subsystem fixture case**

In `metadataSubsystem/fromXML.test.ts`, change `cases` to:

```ts
const cases = [
  { fixture: "full.xml", name: "ПодсистемаВсеСвойства" },
  { fixture: "minimal.xml", name: "ПодсистемаПоУмолчанию" },
  { fixture: "all-targets.xml", name: "ПодсистемаВсеСвойства" },
]
```

- [ ] **Step 4: Add negative subsystem member test**

Append to `metadataSubsystem/metadataTarget.test.ts`:

```ts
import { parseMetadataTargetFromModel } from "~/metadata/commonObjects/metadataTargets"
import { MetadataSubsystemRules } from "./rules"

describe("MetadataSubsystem content metadataTarget", () => {
  it("rejects member targets because subsystem content contains only objects", () => {
    const rule = MetadataSubsystemRules.properties.content.metadataTarget
    expect(
      parseMetadataTargetFromModel({
        canonical: "Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом",
        constraint: rule,
      })
    ).toMatchObject({ ok: false })
  })
})
```

If the file already imports these symbols, merge imports instead of duplicating them.

- [ ] **Step 5: Run applied object tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/metadataFunctionalOption/fromXML.test.ts metadata/appliedObjects/metadataSubsystem/fromXML.test.ts metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 6: Commit fixture and applied tests**

```bash
git add packages/core/metadata/appliedObjects/metadataFunctionalOption packages/core/metadata/appliedObjects/metadataSubsystem
git commit -m "test: :white_check_mark: проверить точные metadataTarget ссылки"
```

## Task 6: Round-Trip Import Verification

**Files:**
- No source edits.

- [ ] **Step 1: Ensure `nakidka-core` tree is clean**

Run:

```bash
git status --short
```

Expected: no output. If there is output, stop and inspect; do not run round-trip with unrelated uncommitted changes.

- [ ] **Step 2: Run diagnostic round-trip until import passes current errors**

Run:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip NKDK_XML_DIR=/home/nikita/git/round-trip/all ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: the previous three import errors are gone:

```text
MetadataCatalog "СправочникПолный": Корень "ExternalDataSource" не разрешён для цели метаданных
MetadataFunctionalOption "ФункциональнаяОпцияБулево": Корень "ExternalDataSource" не разрешён для цели метаданных
MetadataSubsystem "ПодсистемаИспользуетсяВПримерах": Неизвестный сегмент "Table"
```

If `sync` later fails or XML diff appears, record that output separately; it is outside this plan unless caused by the exact metadataTarget changes.

- [ ] **Step 3: Run focused tests again**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/appliedObjects/metadataFunctionalOption/fromXML.test.ts metadata/appliedObjects/metadataSubsystem/fromXML.test.ts metadata/appliedObjects/metadataSubsystem/metadataTarget.test.ts --no-isolate
```

Expected: PASS.

- [ ] **Step 4: Run full project tests before closing issue**

Run from repo root:

```bash
pnpm test
```

Expected: all package tests pass.

## Self-Review

- Spec coverage: covered exact roots for `Catalog.basedOn`, `FunctionalOption.content`, and `Subsystem.content`; covered local fixtures based on the two external XML files requested by the user; covered round-trip import verification.
- Placeholder scan: no `TBD`, `TODO`, or "implement later" placeholders are present.
- Type consistency: plan uses `allowedObjectPaths`, `allowedMemberPaths`, `MetadataTargetPath`, `MetadataObjectPathKind`, and the same names across type, parser, formatter, and rule tasks.
