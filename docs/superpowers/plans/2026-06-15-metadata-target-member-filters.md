# Metadata Target Member Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести YAML-представление metadataTarget на единое описание допустимых целей через `member` и типизированные фильтры, чтобы локальные ссылки на формы/макеты писались коротко, а сложные ограничения вроде Boolean-реквизитов жили вне `rules.ts`.

**Architecture:** Чистый слой `commonObjects/metadataTargets` разбирает, форматирует и описывает JSON Schema без чтения проекта. Слой `orchestration/property` применяет этот слой ко всем строковым свойствам с `metadataTarget`, передавая контекст текущего объекта. Слой `validation` резолвит найденные цели и применяет фильтры через `ProjectMetadataResolver`, не перенося доменную логику в `rules.ts`.

**Tech Stack:** TypeScript, TypeBox, YAML AST, Vitest, pnpm, существующие `rules.ts`, `ProjectYamlCache`, `OwnerMetadataCache`, `ProjectMetadataResolver`.

---

## Scope

План покрывает:

- новый `MetadataTargetConstraint.kind === "member"` вместо `field` и `localChild`;
- фильтры `hasType`, `styleItemType`, `stringIndexedAttribute` как данные;
- общий YAML import/export для `type: "string"` с `metadataTarget`;
- проверку целей и фильтров через `validate`;
- миграцию правил форм, макетов, полей ввода по строке, `styleItem`, `commonPicture` и старого `allowedValues: cypherSet(...)`;
- регрессионный прогон ERP import/validate.

План не меняет XML-фикстуры, XML import/export и graph import.

Перед изменениями исполнитель читает обязательные документы:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,240p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,260p' .agents/knowledge/metadata/metadata-item-implementation.md
sed -n '1,240p' .agents/knowledge/metadata/registries.md
sed -n '1,520p' .agents/architecture-orchestration.md
```

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`  
  Add `member`, `MetadataMemberKind`, `MetadataTargetFilter`, remove legacy `field`, `localChild`, `styleItem`, `commonPicture` after migrations.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`  
  Add YAML names for member kinds and owner-root helpers.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`  
  Parse `member` from local YAML, full YAML and compatible canonical model strings.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`  
  Format canonical member paths back to shortest unambiguous YAML according to `owner` and `memberKinds`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`  
  Build schemas for `member` and append filter descriptions.
- Modify tests: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`, `schema.test.ts`.
- Create: `packages/core/metadata/orchestration/property/metadataTargetString.ts`  
  Shared string import/export helper for property rules with `metadataTarget`.
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`, `fromYAML.ts`  
  Call `metadataTargetString.ts` for `type: "string"` without custom type handler.
- Modify tests: `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`.
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts`  
  Replace `field` fallback with `member owner:"explicit"` fallback.
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`  
  Add `resolveMember` and `matchesMetadataTargetFilter`.
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`, `validateProject.ts`  
  Pass owner context into validation handlers.
- Modify tests: `packages/core/metadata/validation/projectMetadataResolver.test.ts`, `metadataTargetTraversal.test.ts`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`  
  Validate `member`, object filters and `string` metadata targets.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`  
  Detect local form references through `member owner:"this" memberKinds:["Form"]`.
- Modify rules found by `rg -n 'localChild|kind: "field"|kind: "styleItem"|kind: "commonPicture"|allowedValues|cypherSet' packages/core/metadata -g '*.ts'`.
- Modify or delete: `packages/core/metadata/orchestration/property/cypherPredicate.ts`, `cypherPredicate.test.ts` after `allowedValues` has no production users.

---

### Task 1: Add `member` Target Types And YAML Names

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/roots.ts`
- Modify test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Write failing member parser tests**

Add these tests to `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`:

```ts
  it("parses local member names for the current owner", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "ФормаДокумента",
        owner,
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      }),
    ).toEqual({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [{ kind: "Form", name: "ФормаДокумента" }],
      },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      }),
    ).toBe("ФормаДокумента")
  })

  it("keeps member kind in YAML when several local member kinds are allowed", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const
    const constraint = { kind: "member", owner: "this", memberKinds: ["Form", "Template"] } as const

    expect(parseMetadataTargetFromYAML({ value: "Форма.ФормаДокумента", owner, constraint })).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })
    expect(parseMetadataTargetFromYAML({ value: "Макет.ПечатнаяФорма", owner, constraint })).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Template.ПечатнаяФорма",
    })
    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Template.ПечатнаяФорма",
        owner,
        constraint,
      }),
    ).toBe("Макет.ПечатнаяФорма")
  })

  it("parses explicit owner member paths", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Документ.АвансовыйОтчет.Реквизит.Организация",
        constraint: { kind: "member", owner: "explicit", roots: ["Document"], memberKinds: ["Attribute"] },
      }),
    ).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Attribute.Организация",
      target: {
        kind: "member",
        root: "Document",
        objectName: "АвансовыйОтчет",
        segments: [{ kind: "Attribute", name: "Организация" }],
      },
    })
  })

  it("accepts old canonical full member paths on import and normalizes them on export", () => {
    const owner = { root: "Document", objectName: "АвансовыйОтчет" } as const
    const constraint = { kind: "member", owner: "this", memberKinds: ["Form"] } as const

    expect(
      parseMetadataTargetFromYAML({
        value: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint,
      }),
    ).toMatchObject({
      ok: true,
      canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        owner,
        constraint,
      }),
    ).toBe("ФормаДокумента")
  })

  it("requires owner context for local member targets", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "ФормаДокумента",
        constraint: { kind: "member", owner: "this", memberKinds: ["Form"] },
      }),
    ).toEqual({
      ok: false,
      code: "invalid-shape",
      message: 'Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта',
    })
  })
```

- [ ] **Step 2: Run parser tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: FAIL with TypeScript or runtime errors because `kind: "member"` and `owner` input are not implemented.

- [ ] **Step 3: Add target types**

Update `packages/core/metadata/commonObjects/metadataTargets/types.ts` by replacing `MetadataFieldKind`, filter and constraint definitions with this shape:

```ts
export type MetadataMemberKind =
  | "Attribute"
  | "StandardAttribute"
  | "TabularSection"
  | "Dimension"
  | "Resource"
  | "Form"
  | "Template"
  | "Command"

export type MetadataFieldKind = Extract<
  MetadataMemberKind,
  "Attribute" | "StandardAttribute" | "TabularSection" | "Dimension" | "Resource"
>
export type MetadataValueKind = "predefinedValue" | "enumValue" | "emptyRef"
export type MetadataTypeFilterValue = "string" | "decimal" | "dateTime" | "boolean" | "ValueStorage" | "UUID"
export type StyleItemTargetType = "Color" | "Font" | "Border"

export type MetadataTargetFilter =
  | { kind: "hasType"; type: MetadataTypeFilterValue }
  | { kind: "styleItemType"; values: readonly StyleItemTargetType[] }
  | { kind: "stringIndexedAttribute" }

export interface MetadataTargetOwner {
  root: MetadataRootName
  objectName: string
}

export type MetadataTargetConstraint =
  | {
      kind: "object"
      roots?: readonly MetadataRootName[]
      scope?: "project" | "owner"
      allowNested?: boolean
      filters?: readonly MetadataTargetFilter[]
    }
  | {
      kind: "member"
      owner: "this" | "explicit"
      roots?: readonly MetadataRootName[]
      memberKinds?: readonly MetadataMemberKind[]
      filters?: readonly MetadataTargetFilter[]
      allowOwner?: boolean
    }
  | {
      kind: "value"
      roots?: readonly MetadataRootName[]
      valueKinds?: readonly MetadataValueKind[]
      allowEmptyRef?: boolean
    }
  | {
      kind: "type"
      roots?: readonly MetadataRootName[]
      typeKinds?: readonly ("ref" | "object" | "primitive")[]
      primitives?: readonly ("string" | "decimal" | "dateTime" | "boolean" | "ValueStorage")[]
    }
  | { kind: "dataPath"; context: "form"; allowedKinds?: readonly string[]; allowComposite?: boolean }
```

Also replace the parsed member branch:

```ts
export type ParsedMetadataTarget =
  | { kind: "object"; root: MetadataRootName; objectName: string; segments?: MetadataObjectSegment[] }
  | { kind: "member"; root: MetadataRootName; objectName: string; segments: MetadataMemberSegment[] }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "predefinedValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "enumValue"; valueName: string }
  | { kind: "value"; root: MetadataRootName; objectName: string; valueKind: "emptyRef" }

export interface MetadataMemberSegment {
  kind: MetadataMemberKind
  name: string
}

export type MetadataFieldSegment = MetadataMemberSegment & { kind: MetadataFieldKind }
```

- [ ] **Step 4: Add YAML names for member kinds**

Update `packages/core/metadata/commonObjects/metadataTargets/roots.ts`:

```ts
import type { MetadataMemberKind, MetadataRootName } from "./types"
```

Replace `fieldKindToYAML` with `memberKindToYAML` and keep aliases for current imports during migration:

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
} as const satisfies Record<MetadataMemberKind, string>

export const memberKindFromYAML = Object.fromEntries(
  Object.entries(memberKindToYAML).map(([model, yaml]) => [yaml, model]),
) as Partial<Record<string, MetadataMemberKind>>

export const fieldKindToYAML = memberKindToYAML
export const fieldKindFromYAML = memberKindFromYAML
```

- [ ] **Step 5: Run type-check to capture parser compile failures**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: FAIL in `metadataTargets/parse.ts`, `format.ts`, `schema.ts`, validation resolver and tests because they still use `field`, `localChild`, `styleItem`, `commonPicture`.

- [ ] **Step 6: Commit type and root names**

```bash
git add packages/core/metadata/commonObjects/metadataTargets/types.ts packages/core/metadata/commonObjects/metadataTargets/roots.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
git commit -m "feat: :sparkles: описать member metadataTarget"
```

---

### Task 2: Implement Member Parse And Format

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`
- Modify test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`

- [ ] **Step 1: Extend parse input contracts**

In `parse.ts`, add `owner?: MetadataTargetOwner` to both input interfaces:

```ts
export interface ParseMetadataTargetFromYAMLInput {
  value: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}

export interface ParseMetadataTargetFromModelInput {
  canonical: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}
```

- [ ] **Step 2: Replace field parsing branch with member branch**

Replace `case "field"` with:

```ts
    case "member": {
      const constraint = input.constraint
      return parseMemberTargetFromYAML(parts, constraint, input.owner)
    }
```

and in model parsing:

```ts
    case "member": {
      const constraint = input.constraint
      return parseMemberTargetFromModel(parts, constraint, input.owner)
    }
```

- [ ] **Step 3: Add member parse helpers**

Add these helpers near the old field parser. The old `parseFieldTarget` body is the starting point, but the new functions must accept `Form`, `Template` and `Command`:

```ts
function parseMemberTargetFromYAML(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner | undefined,
): MetadataTargetParseResult {
  if (constraint.owner === "this") {
    const fullModel = parseFullModelMemberCompatibility(parts, constraint)
    if (fullModel.ok) return ensureCurrentOwner(fullModel.target, owner)

    const fullYaml = parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
      parseMemberSegments(root, objectName, tail, constraint, "yaml"),
    )
    if (fullYaml.ok) return ensureCurrentOwner(fullYaml.target, owner)

    if (!owner) return missingOwnerContext()
    return parseLocalOwnerMember(parts, constraint, owner)
  }

  return parseRootedTargetFromYAML(parts, constraint, (root, objectName, tail) =>
    parseMemberSegments(root, objectName, tail, constraint, "yaml"),
  )
}

function parseMemberTargetFromModel(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner | undefined,
): MetadataTargetParseResult {
  const parsed = parseRootedTargetFromModel(parts, constraint, (root, objectName, tail) =>
    parseMemberSegments(root, objectName, tail, constraint, "model"),
  )
  if (!parsed.ok || constraint.owner !== "this") return parsed
  return ensureCurrentOwner(parsed.target, owner)
}
```

Use this local member rule:

```ts
function parseLocalOwnerMember(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "member" }>,
  owner: MetadataTargetOwner,
): MetadataTargetParseResult {
  const memberKinds = constraint.memberKinds ?? allMemberKinds()
  const canOmitKind = memberKinds.length === 1
  const localParts = canOmitKind ? [memberKinds[0], parts[0]] : [parts[0], parts[1]]
  const source = canOmitKind ? "model" : "yaml"

  if (parts.length !== 1 && parts.length !== 2) return invalidShape()
  return parseMemberSegments(owner.root, owner.objectName, localParts, constraint, source)
}
```

The helper `parseMemberSegments` should keep the old field rule: intermediate segments can only be `TabularSection`; terminal segment must match `memberKinds`. For `Form`, `Template` and `Command`, only a terminal segment is allowed.

- [ ] **Step 4: Add explicit owner checks**

Add these helpers:

```ts
function ensureCurrentOwner(
  target: ParsedMetadataTarget,
  owner: MetadataTargetOwner | undefined,
): MetadataTargetParseResult {
  if (target.kind !== "member") return success(formatCanonicalTarget(target), target)
  if (!owner) return missingOwnerContext()
  if (target.root !== owner.root || target.objectName !== owner.objectName) {
    return error("disallowed-root", `Цель "${formatCanonicalTarget(target)}" не принадлежит текущему объекту`)
  }
  return success(formatCanonicalTarget(target), target)
}

function missingOwnerContext(): MetadataTargetParseResult {
  return invalidShape('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
}
```

- [ ] **Step 5: Format member YAML**

In `format.ts`, extend input and add the member branch:

```ts
export interface FormatMetadataTargetToYAMLInput {
  canonical: string
  constraint: MetadataTargetConstraint
  owner?: MetadataTargetOwner
}
```

Add:

```ts
    case "member":
      return formatMemberTargetToYAML(target, input.constraint, input.owner)
```

and implement:

```ts
function formatMemberTargetToYAML(
  target: Extract<ParsedMetadataTarget, { kind: "member" }>,
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined,
): string {
  const full = [
    rootToYAML[target.root],
    target.objectName,
    ...target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)]),
  ].join(".")

  if (constraint.kind !== "member" || constraint.owner !== "this") return full
  if (!owner) throw new Error('Для metadataTarget kind "member" owner "this" требуется контекст текущего объекта')
  if (target.root !== owner.root || target.objectName !== owner.objectName) {
    throw new Error(`Цель "${target.root}.${target.objectName}" не принадлежит текущему объекту "${owner.root}.${owner.objectName}"`)
  }

  const memberKinds = constraint.memberKinds ?? allMemberKinds()
  const localSegments = target.segments.flatMap((segment) => [memberKindToYAML[segment.kind], formatMemberSegmentName(segment)])
  if (target.segments.length === 1 && memberKinds.length === 1) return formatMemberSegmentName(target.segments[0])
  return localSegments.join(".")
}
```

- [ ] **Step 6: Run parser tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit parser and formatter**

```bash
git add packages/core/metadata/commonObjects/metadataTargets/parse.ts packages/core/metadata/commonObjects/metadataTargets/format.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts
git commit -m "feat: :sparkles: разбирать member metadataTarget"
```

---

### Task 3: Build Member JSON Schema And Filter Descriptions

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
- Modify test: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add to `schema.test.ts`:

```ts
  it("builds local member schema for single current-owner member kind", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("ФормаДокумента")).toBe(true)
    expect(compiled.Check("Document.АвансовыйОтчет.Form.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Форма.ФормаДокумента")).toBe(false)
    expect(schema.description).toContain("Имя дочерней формы текущего объекта")
  })

  it("keeps member kind in schema when several current-owner member kinds are allowed", () => {
    const schema = buildMetadataTargetSchema({ kind: "member", owner: "this", memberKinds: ["Form", "Template"] })
    const compiled = TypeCompiler.Compile(schema)

    expect(compiled.Check("Форма.ФормаДокумента")).toBe(true)
    expect(compiled.Check("Макет.ПечатнаяФорма")).toBe(true)
    expect(compiled.Check("ФормаДокумента")).toBe(false)
  })

  it("describes hasType filters without narrowing the string pattern", () => {
    const schema = buildMetadataTargetSchema({
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "hasType", type: "boolean" }],
    })

    expect(schema.description).toContain("тип которых содержит Булево")
  })
```

- [ ] **Step 2: Run schema tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: FAIL because `member` schema is missing.

- [ ] **Step 3: Replace field/localChild branches**

In `buildMetadataTargetSchema`, replace:

```ts
  if (constraint.kind === "field") return fieldSchema(constraint)
  if (constraint.kind === "localChild") return localChildSchema(constraint)
  if (constraint.kind === "styleItem") { ... }
  if (constraint.kind === "commonPicture") { ... }
```

with:

```ts
  if (constraint.kind === "member") return memberSchema(constraint)
```

- [ ] **Step 4: Add member schema builder**

Add:

```ts
const allMemberKinds = Object.keys(memberKindToYAML) as MetadataMemberKind[]

function memberSchema(constraint: Extract<MetadataTargetConstraint, { kind: "member" }>): TSchema {
  const memberKinds = constraint.memberKinds ?? allMemberKinds
  const memberGroup = memberKinds.map((kind) => memberKindToYAML[kind]).join("|")
  const modelMemberGroup = memberKinds.join("|")
  const fullModelCompatibility = `[A-Za-z]+\\.${METADATA_NAME_PATTERN}\\.(?:${modelMemberGroup})\\.${METADATA_NAME_PATTERN}`

  if (constraint.owner === "this" && memberKinds.length === 1) {
    const kind = memberKinds[0]
    return Type.String({
      pattern: `^(?:${METADATA_NAME_PATTERN}|${fullModelCompatibility})$`,
      examples: [kind === "Form" ? "ФормаДокумента" : "ИмяЧлена"],
      description: `${singleLocalMemberDescription(kind)}${filterDescriptionSuffix(constraint.filters)} Совместимый полный модельный путь принимается при импорте, export нормализует его в локальное имя.`,
    })
  }

  if (constraint.owner === "this") {
    return Type.String({
      pattern: `^(?:(${memberGroup})\\.${METADATA_NAME_PATTERN}|${fullModelCompatibility})$`,
      examples: memberKinds.slice(0, 2).map((kind) => `${memberKindToYAML[kind]}.ИмяЧлена`),
      description: `Ссылка на член текущего объекта: ${memberGroup}.<ИмяЧлена>.${filterDescriptionSuffix(constraint.filters)}`,
    })
  }

  const selectedRoots = selectRoots(constraint.roots)
  const yamlRoots = yamlRootGroup(constraint.roots)
  return Type.String({
    pattern:
      selectedRoots.length === 0 || memberKinds.length === 0
        ? noMatchPattern
        : `^(?:(${yamlRoots})\\.${METADATA_NAME_PATTERN}\\.(?:${memberGroup})\\.${METADATA_NAME_PATTERN})$`,
    examples: memberKinds.includes("Attribute")
      ? ["Документ.АвансовыйОтчет.Реквизит.Организация"]
      : [`${rootToYAML[selectedRoots[0] ?? "Document"]}.ИмяОбъекта.${memberKindToYAML[memberKinds[0] ?? "Attribute"]}.ИмяЧлена`],
    description: `Полный путь члена объекта: ${yamlRoots}.<ИмяОбъекта>.${memberGroup}.<ИмяЧлена>.${filterDescriptionSuffix(constraint.filters)}`,
  })
}
```

- [ ] **Step 5: Add filter descriptions**

Add:

```ts
function filterDescriptionSuffix(filters: readonly MetadataTargetFilter[] | undefined): string {
  if (!filters || filters.length === 0) return ""
  return ` ${filters.map(filterDescription).join(" ")}`
}

function filterDescription(filter: MetadataTargetFilter): string {
  switch (filter.kind) {
    case "hasType":
      return `Допустимы только члены, тип которых содержит ${typeFilterToYAML[filter.type]}.`
    case "styleItemType":
      return `Допустимы только элементы стиля типов: ${filter.values.map((value) => styleItemTypeToYAML[value]).join(", ")}.`
    case "stringIndexedAttribute":
      return "Допустимы только реквизиты, пригодные для ввода по строке."
  }
}

const typeFilterToYAML = {
  string: "Строка",
  decimal: "Число",
  dateTime: "ДатаВремя",
  boolean: "Булево",
  ValueStorage: "ХранилищеЗначения",
  UUID: "UUID",
} as const satisfies Record<MetadataTypeFilterValue, string>

const styleItemTypeToYAML = {
  Color: "Цвет",
  Font: "Шрифт",
  Border: "Рамка",
} as const satisfies Record<StyleItemTargetType, string>
```

- [ ] **Step 6: Run schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit schema**

```bash
git add packages/core/metadata/commonObjects/metadataTargets/schema.ts packages/core/metadata/commonObjects/metadataTargets/schema.test.ts
git commit -m "feat: :sparkles: описать member metadataTarget в schema"
```

---

### Task 4: Apply MetadataTarget To Plain String YAML Import/Export

**Files:**
- Create: `packages/core/metadata/orchestration/property/metadataTargetString.ts`
- Modify: `packages/core/metadata/orchestration/property/toYAML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAML.ts`
- Test: `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`

- [ ] **Step 1: Write failing property tests**

Create `packages/core/metadata/orchestration/property/metadataTargetString.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportPropertiesToYAML } from "./toYAML"
import { importPropertiesFromYAML } from "./fromYAML"
import type { MetadataItemRule } from "./types"

const documentRule = {
  itemType: "MetadataDocument",
  itemTypePrefix: "Документ",
  properties: {
    name: { type: "string", defaultValue: ({ name }: { name?: string }) => name },
    defaultObjectForm: {
      yaml: "ОсновнаяФормаОбъекта",
      type: "string",
      metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
    },
  },
} as const satisfies MetadataItemRule

describe("string metadataTarget YAML", () => {
  it("exports canonical local member strings to short YAML", () => {
    expect(
      exportPropertiesToYAML({
        context: mockContext,
        rule: documentRule,
        data: {
          itemType: "MetadataDocument",
          name: "АвансовыйОтчет",
          defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
        },
      }),
    ).toEqual({
      ОсновнаяФормаОбъекта: "ФормаДокумента",
    })
  })

  it("imports short YAML member strings to canonical model strings", () => {
    expect(
      importPropertiesFromYAML({
        context: mockContext,
        metadataRule: documentRule,
        name: "АвансовыйОтчет",
        yaml: { ОсновнаяФормаОбъекта: "ФормаДокумента" },
      }),
    ).toMatchObject({
      defaultObjectForm: "Document.АвансовыйОтчет.Form.ФормаДокумента",
    })
  })
})
```

- [ ] **Step 2: Run property test to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/metadataTargetString.test.ts
```

Expected: FAIL because plain `string` values are returned unchanged.

- [ ] **Step 3: Create string metadataTarget helper**

Create `metadataTargetString.ts`:

```ts
import { formatMetadataTargetToYAML, parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { MetadataTargetOwner } from "~/metadata/commonObjects/metadataTargets/types"
import type { MetadataItemRule, PropertyRule } from "./types"

export function metadataTargetOwnerFromRule(params: {
  itemRule: MetadataItemRule
  name: string | undefined
}): MetadataTargetOwner | undefined {
  const prefix = params.itemRule.itemTypePrefix
  if (!prefix || !params.name) return undefined

  const root = rootFromYAML[prefix] ?? itemTypePrefixRootFallback[prefix]
  return root ? { root, objectName: params.name } : undefined
}

export function exportStringMetadataTargetToYAML(params: {
  rule: PropertyRule
  value: unknown
  owner: MetadataTargetOwner | undefined
}): unknown {
  if (!params.rule.metadataTarget || typeof params.value !== "string" || params.value === "") return params.value
  return formatMetadataTargetToYAML({
    canonical: params.value,
    constraint: params.rule.metadataTarget,
    owner: params.owner,
  })
}

export function importStringMetadataTargetFromYAML(params: {
  rule: PropertyRule
  value: unknown
  owner: MetadataTargetOwner | undefined
}): unknown {
  if (!params.rule.metadataTarget || typeof params.value !== "string" || params.value === "") return params.value
  const result = parseMetadataTargetFromYAML({
    value: params.value,
    constraint: params.rule.metadataTarget,
    owner: params.owner,
  })
  if (!result.ok) throw new Error(result.message)
  return result.canonical
}

const itemTypePrefixRootFallback = {
  Нумератор: "DocumentNumerator",
} as const
```

- [ ] **Step 4: Wire helper into property export**

In `toYAML.ts`, import:

```ts
import { exportStringMetadataTargetToYAML, metadataTargetOwnerFromRule } from "./metadataTargetString"
```

In `exportPropertiesToYAML`, compute owner once:

```ts
  const owner = metadataTargetOwnerFromRule({
    itemRule: rule,
    name: typeof data["name" as keyof typeof data] === "string" ? (data["name" as keyof typeof data] as string) : undefined,
  })
```

Pass `owner` to `exportPropertyToYAML`.

In `exportPropertyToYAML`, add `owner?: MetadataTargetOwner` to params and before `getExportToYAMLResult` for missing type handler:

```ts
  if (!typeExportFn) {
    const exportedValue =
      rule.type === "string" ? exportStringMetadataTargetToYAML({ rule, value, owner: params.owner }) : value
    return getExportToYAMLResult(rule, yamlKey, exportedValue, value)
  }
```

- [ ] **Step 5: Wire helper into property import**

In `fromYAML.ts`, import:

```ts
import { importStringMetadataTargetFromYAML, metadataTargetOwnerFromRule } from "./metadataTargetString"
```

Compute owner in `importPropertiesFromYAML`:

```ts
  const owner = metadataTargetOwnerFromRule({ itemRule: metadataRule, name })
```

Pass `owner` to `importPropertyFromYAML`.

In `importPropertyFromYAML`, add `owner?: MetadataTargetOwner` and replace the no-type-handler value:

```ts
  if (!typeimportFn) {
    const rawValue = value ?? sourceValue
    const imported =
      rule.type === "string" ? importStringMetadataTargetFromYAML({ rule, value: rawValue, owner: params.owner }) : rawValue
    return getValueOrDefault({
      context,
      rule,
      value: imported,
      yaml,
      name,
      operation: "importFromYAML",
    })
  }
```

- [ ] **Step 6: Run property tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/metadataTargetString.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit string YAML handling**

```bash
git add packages/core/metadata/orchestration/property/metadataTargetString.ts packages/core/metadata/orchestration/property/toYAML.ts packages/core/metadata/orchestration/property/fromYAML.ts packages/core/metadata/orchestration/property/metadataTargetString.test.ts
git commit -m "feat: :sparkles: применять metadataTarget к строкам YAML"
```

---

### Task 5: Resolve Members And Validate `hasType`

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify tests: `packages/core/metadata/validation/projectMetadataResolver.test.ts`, `metadataTargetTraversal.test.ts`

- [ ] **Step 1: Write resolver tests for members and hasType**

Add to `projectMetadataResolver.test.ts`:

```ts
  it("resolves current object members and returns field details", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Провести:",
      "    Тип: Булево",
      "Формы:",
      "  ФормаДокумента",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Форма.ФормаДокумента") })).toMatchObject({
      ok: true,
    })
    expect(resolver.resolveMember({ target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести") })).toMatchObject({
      ok: true,
      details: expect.objectContaining({
        typeInfo: expect.objectContaining({ kinds: expect.arrayContaining(["boolean"]) }),
      }),
    })
  })

  it("applies hasType filter to member fields", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Документ/АвансовыйОтчет/Свойства.yaml", [
      "Реквизиты:",
      "  Провести:",
      "    Тип: Булево",
      "  Комментарий:",
      "    Тип: Строка",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Провести"),
        filters: [{ kind: "hasType", type: "boolean" }],
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("Документ.АвансовыйОтчет.Реквизит.Комментарий"),
        filters: [{ kind: "hasType", type: "boolean" }],
      }),
    ).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ message: expect.stringContaining("тип которых содержит Булево") })],
    })
  })
```

Add the helper:

```ts
function memberTarget(value: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "member", owner: "explicit" } })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "member" }>
}
```

- [ ] **Step 2: Run resolver tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts
```

Expected: FAIL because `resolveMember` is absent.

- [ ] **Step 3: Add resolver method signature**

In `projectMetadataResolver.ts`:

```ts
export interface ProjectMetadataResolver {
  resolveObject(params: { target: Extract<ParsedMetadataTarget, { kind: "object" }>; filters?: readonly MetadataTargetFilter[] }): MetadataResolveResult
  resolveMember(params: { target: Extract<ParsedMetadataTarget, { kind: "member" }>; filters?: readonly MetadataTargetFilter[] }): MetadataResolveResult
  resolveValue(params: { target: Extract<ParsedMetadataTarget, { kind: "value" }> }): MetadataResolveResult
  resolveStyleItem(params: { name: string; expectedTypes: readonly StyleItemTargetType[] }): MetadataResolveResult
  resolveCommonPicture(params: { name: string }): MetadataResolveResult
}
```

- [ ] **Step 4: Implement member resolution**

Replace `resolveField` with `resolveMember`:

```ts
    resolveMember({ target, filters }) {
      const object = this.resolveObject({ target: { kind: "object", root: target.root, objectName: target.objectName } })
      if (!object.ok) return object

      const owner = ownerCache.get({ kind: rootToYAML[target.root], name: target.objectName })
      if (owner.status !== "ok") return { ok: false, diagnostics: owner.diagnostics }

      const resolved = resolveMemberSegments(owner.owner, target.segments)
      if (!resolved.ok) {
        return referenceError(owner.owner.filePath, `Не найден член "${formatMemberTarget(target)}": ${resolved.message}`)
      }

      const filterResult = applyMetadataTargetFilters({
        filePath: owner.owner.filePath,
        displayName: formatMemberTarget(target),
        details: resolved.details,
        filters,
      })
      if (!filterResult.ok) return filterResult

      return { ok: true, filePath: owner.owner.filePath, details: resolved.details }
    },
```

`resolveMemberSegments` must:

- use `owner.fieldIndex.fields` for `Attribute`, `StandardAttribute`, `TabularSection`, `Dimension`, `Resource`;
- use `metadataRecord(owner.model).forms` for `Form`;
- use `metadataRecord(owner.model).templates` for `Template`;
- use `metadataRecord(owner.model).commands` for `Command`;
- keep existing table-section traversal for nested `TabularSection.Attribute`.

- [ ] **Step 5: Implement filter checks**

Add:

```ts
function applyMetadataTargetFilters(params: {
  filePath: string
  displayName: string
  details: unknown
  filters: readonly MetadataTargetFilter[] | undefined
}): MetadataResolveResult {
  for (const filter of params.filters ?? []) {
    if (filter.kind === "hasType" && !memberDetailsHasType(params.details, filter.type)) {
      return referenceError(
        params.filePath,
        `Цель "${params.displayName}" не подходит: допустимы только члены, тип которых содержит ${typeFilterToYAML[filter.type]}`,
      )
    }
    if (filter.kind === "stringIndexedAttribute" && !memberDetailsIsStringIndexedAttribute(params.details)) {
      return referenceError(
        params.filePath,
        `Цель "${params.displayName}" не подходит: допустимы только реквизиты, пригодные для ввода по строке`,
      )
    }
  }

  return { ok: true }
}
```

Use `ObjectField.typeInfo` for `memberDetailsHasType`. For `boolean`, check `typeInfo.kinds.includes("boolean")`; for `string`, `decimal`, `dateTime`, `ValueStorage`, `UUID`, check `typeInfo.sourceText` contains the model type. For `stringIndexedAttribute`, accept `Attribute` and `StandardAttribute` whose type is `string`, `decimal`, `dateTime`, `boolean`, `UUID` or unknown.

- [ ] **Step 6: Update validation handlers**

In `validationHandlers.ts`:

```ts
  if (params.parsed.kind === "member" && params.constraint.kind === "member") {
    const result = params.resolver.resolveMember({
      target: params.parsed,
      filters: params.constraint.filters,
    })
    return result.ok ? [] : result.diagnostics
  }
```

Add:

```ts
registerTypeRule("string", "validateMetadataTarget", validateStringTarget)
```

- [ ] **Step 7: Pass owner context to validation parsing**

Extend `ValidateMetadataTargetFunction` params in `fn.ts`:

```ts
  owner?: MetadataTargetOwner
```

Extend `validateMetadataTargetsInModel` params:

```ts
  owner?: MetadataTargetOwner
```

Pass it to handlers. In `validateProject.ts`, compute owner from `ValidationProjectFile.owner.dir`:

```ts
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"

const ownerRoot = rootFromYAML[params.file.owner.dir]
const owner = ownerRoot ? { root: ownerRoot, objectName: params.file.owner.name } : undefined
```

Then pass `owner` to `validateMetadataTargetsInModel`. Do not add a new field to `ValidationProjectFile`: `owner.dir` is already the YAML root name used by validation discovery.

- [ ] **Step 8: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts metadata/validation/metadataTargetTraversal.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit validation support**

```bash
git add packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts packages/core/metadata/validation/metadataTargetTraversal.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectMetadataResolver.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts packages/core/metadata/orchestration/property/fn.ts
git commit -m "feat: :sparkles: проверять member metadataTarget"
```

---

### Task 6: Migrate MetadataPath Fallbacks From `field` To `member`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataPath/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataPath/toJSONSchema.ts`
- Modify tests: `packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts`, `toYAML.test.ts`, `packages/core/metadata/commonObjects/metadataField/toJSONSchema.test.ts`

- [ ] **Step 1: Update fallback constants**

Replace:

```ts
const metadataFieldTargetFallback = { kind: "field", owner: "explicit" } as const satisfies MetadataTargetConstraint
```

with:

```ts
const metadataFieldTargetFallback = { kind: "member", owner: "explicit" } as const satisfies MetadataTargetConstraint
```

in all three metadataPath files.

- [ ] **Step 2: Update tests that mention `field`**

In tests, replace constraints:

```ts
metadataTarget: { kind: "field", owner: "explicit", roots: ["Catalog"], fieldKinds: ["Attribute", "StandardAttribute"] }
```

with:

```ts
metadataTarget: { kind: "member", owner: "explicit", roots: ["Catalog"], memberKinds: ["Attribute", "StandardAttribute"] }
```

- [ ] **Step 3: Run metadataPath tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataPath/fromYAML.test.ts metadata/commonObjects/metadataPath/toYAML.test.ts metadata/commonObjects/metadataField/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit metadataPath migration**

```bash
git add packages/core/metadata/commonObjects/metadataPath/fromYAML.ts packages/core/metadata/commonObjects/metadataPath/toYAML.ts packages/core/metadata/commonObjects/metadataPath/toJSONSchema.ts packages/core/metadata/commonObjects/metadataPath/fromYAML.test.ts packages/core/metadata/commonObjects/metadataPath/toYAML.test.ts packages/core/metadata/commonObjects/metadataField/toJSONSchema.test.ts
git commit -m "refactor: :recycle: заменить field metadataTarget на member"
```

---

### Task 7: Migrate Local Form And Field Rules

**Files:**
- Modify rules under `packages/core/metadata/appliedObjects/**/rules.ts`
- Modify rules under `packages/core/metadata/commonObjects/**/rules.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify tests touching `localChild` and `field`

- [ ] **Step 1: Replace `localChild` form rules**

Run search:

```bash
rg -n 'metadataTarget: \{ kind: "localChild", owner: "this", childKind: "Form" \}' packages/core/metadata -g '*.ts'
```

For every production rule, replace:

```ts
metadataTarget: { kind: "localChild", owner: "this", childKind: "Form" }
```

with:

```ts
metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] }
```

- [ ] **Step 2: Replace field rules**

Run:

```bash
rg -n 'metadataTarget: \{ kind: "field"' packages/core/metadata -g '*.ts'
```

Use these replacements:

```ts
metadataTarget: { kind: "field", owner: "this" }
```

becomes:

```ts
metadataTarget: { kind: "member", owner: "this" }
```

and:

```ts
metadataTarget: { kind: "field", owner: "this", fieldKinds: ["Attribute", "StandardAttribute"], filters: ["stringIndexedAttribute"] }
```

becomes:

```ts
metadataTarget: {
  kind: "member",
  owner: "this",
  memberKinds: ["Attribute", "StandardAttribute"],
  filters: [{ kind: "stringIndexedAttribute" }],
}
```

and:

```ts
metadataTarget: { kind: "field", owner: "explicit", allowObject: true }
```

becomes:

```ts
metadataTarget: { kind: "member", owner: "explicit", allowOwner: true }
```

- [ ] **Step 3: Update local form detection in XML sync**

In `syncToXML.ts`, replace `isLocalFormReferenceRule` with:

```ts
function isLocalFormReferenceRule(propRule: PropertyRule): boolean {
  const target = propRule.metadataTarget
  if (
    target?.kind === "member" &&
    target.owner === "this" &&
    (target.memberKinds === undefined || target.memberKinds.includes("Form"))
  ) {
    return true
  }

  return propRule.referenceScope?.target === "this" && propRule.referenceScope.kind === "Form"
}
```

- [ ] **Step 4: Run search checks**

Run:

```bash
rg -n 'kind: "localChild"|kind: "field"|fieldKinds|filters: \["stringIndexedAttribute"\]' packages/core/metadata -g '*.ts'
```

Expected: no production matches. Test matches are allowed only in assertions that prove legacy input is rejected; if none are needed, remove them.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/schema.test.ts metadata/orchestration/property/metadataTargetString.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit rules migration**

```bash
git add packages/core/metadata packages/core/metadata/orchestration/appliedObject/syncToXML.ts
git commit -m "refactor: :recycle: мигрировать правила metadataTarget на member"
```

---

### Task 8: Convert Style Items And Common Pictures To Object Targets With Filters

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/fromYAML.ts`, `toYAML.ts`, `types.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`, `toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/border/fromYAML.ts`, `toYAML.ts`, `types.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromYAML.ts`, `toYAML.ts`
- Modify rules under `packages/core/metadata/forms/**/rules.ts`, `packages/core/metadata/appliedObjects/**/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify tests in `metadataTargets/parse.test.ts`, `schema.test.ts`

- [ ] **Step 1: Update parser tests for object replacement**

Replace style/common tests in `parse.test.ts` with object constraints:

```ts
  it("parses and formats style items through object targets with style filters", () => {
    const constraint = { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } as const

    expect(parseMetadataTargetFromYAML({ value: "ЭлементСтиля.ОсновнойЦвет", constraint })).toMatchObject({
      ok: true,
      canonical: "StyleItem.ОсновнойЦвет",
      target: { kind: "object", root: "StyleItem", objectName: "ОсновнойЦвет" },
    })
    expect(formatMetadataTargetToYAML({ canonical: "StyleItem.ОсновнойЦвет", constraint })).toBe("ЭлементСтиля.ОсновнойЦвет")
  })

  it("parses and formats common pictures through object targets", () => {
    const constraint = { kind: "object", roots: ["CommonPicture"] } as const

    expect(parseMetadataTargetFromYAML({ value: "ОбщаяКартинка.Логотип", constraint })).toMatchObject({
      ok: true,
      canonical: "CommonPicture.Логотип",
      target: { kind: "object", root: "CommonPicture", objectName: "Логотип" },
    })
    expect(formatMetadataTargetToYAML({ canonical: "CommonPicture.Логотип", constraint })).toBe("ОбщаяКартинка.Логотип")
  })
```

- [ ] **Step 2: Update Color/Font/Border/Picture helpers**

Use these constraints:

```ts
const colorStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Color"] }],
} as const satisfies MetadataTargetConstraint

const fontStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Font"] }],
} as const satisfies MetadataTargetConstraint

const borderStyleItemTarget = {
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Border"] }],
} as const satisfies MetadataTargetConstraint

const commonPictureTarget = {
  kind: "object",
  roots: ["CommonPicture"],
} as const satisfies MetadataTargetConstraint
```

Replace every direct `{ kind: "styleItem", styleItemTypes: [...] }` and `{ kind: "commonPicture" }` in these helper files with the constants.

- [ ] **Step 3: Apply object filters in validation**

In `validationHandlers.ts`, when parsed target is `object`, pass filters:

```ts
  if (params.parsed.kind === "object" && params.constraint.kind === "object") {
    const result = params.resolver.resolveObject({
      target: params.parsed,
      filters: params.constraint.filters,
    })
    return result.ok ? [] : result.diagnostics
  }
```

In `projectMetadataResolver.ts`, when `resolveObject` receives `styleItemType`, reuse existing `resolveStyleItem`:

```ts
function resolveObjectFilters(params: {
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  filters: readonly MetadataTargetFilter[] | undefined
}): MetadataResolveResult {
  for (const filter of params.filters ?? []) {
    if (filter.kind === "styleItemType" && params.target.root === "StyleItem") {
      return resolveStyleItemByName(params.target.objectName, filter.values)
    }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Migrate production rules**

Run:

```bash
rg -n 'kind: "styleItem"|kind: "commonPicture"' packages/core/metadata -g '*.ts'
```

Replace:

```ts
metadataTarget: { kind: "styleItem", styleItemTypes: ["Color"] }
```

with:

```ts
metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] }
```

Replace:

```ts
metadataTarget: { kind: "commonPicture" }
```

with:

```ts
metadataTarget: { kind: "object", roots: ["CommonPicture"] }
```

- [ ] **Step 5: Run style/picture tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/schema.test.ts metadata/validation/projectMetadataResolver.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit style/picture migration**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: заменить styleItem и commonPicture на object filters"
```

---

### Task 9: Replace `allowedValues: cypherSet(...)` With `hasType`

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Delete or keep unused: `packages/core/metadata/orchestration/property/cypherPredicate.ts`
- Delete or update test: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`

- [ ] **Step 1: Replace the Boolean field rule**

In `metadataAttribute/rules.ts`, remove:

```ts
import { cypherSet } from "~/metadata/orchestration/property/cypherPredicate"
```

Replace:

```ts
    allowedValues: cypherSet({
      query:
        "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:MetadataAttribute)-[:TYPE]->(:Type {name: 'Boolean'}) RETURN a.name AS name",
    }),
```

with:

```ts
    metadataTarget: {
      kind: "member",
      owner: "this",
      memberKinds: ["Attribute"],
      filters: [{ kind: "hasType", type: "boolean" }],
    },
```

- [ ] **Step 2: Remove `allowedValues` from property types**

In `property/types.ts`, remove:

```ts
import type { CypherSet } from "./cypherPredicate"
```

and remove this property from `BasePropertyRule`:

```ts
  allowedValues?: CypherSet
```

- [ ] **Step 3: Remove legacy cypher predicate files if unused**

Run:

```bash
rg -n 'cypherSet|allowedValues|CypherSet|isCypherSet' packages/core packages/cli packages/graph -g '*.ts'
```

If only `cypherPredicate.ts` and `cypherPredicate.test.ts` remain, delete both files:

```bash
git rm packages/core/metadata/orchestration/property/cypherPredicate.ts packages/core/metadata/orchestration/property/cypherPredicate.test.ts
```

- [ ] **Step 4: Run type-check**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 5: Commit hasType migration**

```bash
git add packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/orchestration/property/types.ts
git add -u packages/core/metadata/orchestration/property
git commit -m "refactor: :recycle: заменить cypherSet на hasType filter"
```

---

### Task 10: Remove Legacy Target Kinds And Run Full Verification

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Modify tests that still mention legacy kinds

- [ ] **Step 1: Search for legacy target kinds**

Run:

```bash
rg -n 'kind: "field"|kind: "localChild"|kind: "styleItem"|kind: "commonPicture"|fieldKinds|styleItemTypes|allowedValues|cypherSet' packages/core packages/cli packages/graph -g '*.ts'
```

Expected: no production matches. Remove or rewrite test matches unless they intentionally prove backward-compatible parsing of old canonical strings for `member`.

- [ ] **Step 2: Delete legacy parse/schema branches**

In `types.ts`, ensure `MetadataTargetConstraint` contains only:

```ts
export type MetadataTargetConstraint =
  | ObjectTargetConstraint
  | MemberTargetConstraint
  | ValueTargetConstraint
  | TypeTargetConstraint
  | DataPathTargetConstraint
```

In `parse.ts`, no branch should mention `field`, `localChild`, `styleItem`, `commonPicture`.

In `schema.ts`, no schema builder should mention `fieldSchema`, `localChildSchema`, `styleItem` or `commonPicture`.

- [ ] **Step 3: Run focused metadata target tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/schema.test.ts metadata/orchestration/property/metadataTargetString.test.ts metadata/validation/projectMetadataResolver.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run core type-check and tests**

Run:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/core test
```

Expected: both PASS.

- [ ] **Step 5: Run full repository tests**

Run:

```bash
pnpm test
```

Expected: PASS for `packages/graph`, `packages/core`, `packages/cli`.

- [ ] **Step 6: Commit cleanup**

```bash
git add packages/core packages/cli packages/graph
git commit -m "refactor: :recycle: удалить устаревшие metadataTarget kinds"
```

---

### Task 11: ERP Import/Validate Regression

**Files:**
- No source files required unless validation output shows a regression caused by this change.

- [ ] **Step 1: Re-import ERP YAML**

Run from repository root:

```bash
rm -rf /home/nikita/git/temp-yaml
packages/cli/bin/nkdk import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: command exits with code `0`.

- [ ] **Step 2: Validate imported YAML**

Run:

```bash
packages/cli/bin/nkdk validate /home/nikita/git/temp-yaml
```

Expected: validation may still report unrelated groups, but form/template errors of the shape `строка не соответствует шаблону имени` for values like `Document.АвансовыйОтчет.Form.ФормаДокумента` must disappear.

- [ ] **Step 3: Group remaining errors by type**

Run:

```bash
packages/cli/bin/nkdk validate /home/nikita/git/temp-yaml 2>&1 | sed -E 's/[0-9]+:[0-9]+//g' | sort | uniq -c | sort -nr
```

Expected: no grouped line should be caused by local form/template metadataTarget strings. If `строка не соответствует шаблону имени` remains, inspect three examples and verify whether they are DataPath, dynamic-list columns, unknown object segments, or a missed `member` rule.

- [ ] **Step 4: Save result in the implementation summary**

Record these facts in the final response or PR description:

```text
pnpm test: PASS
ERP import: PASS
ERP validate: <remaining grouped errors>
Local form/template name-pattern group: gone
```

- [ ] **Step 5: Commit regression-only fixes if needed**

If Step 2 exposes a missed rule that belongs to this metadataTarget migration, fix the rule, run:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/core test
pnpm test
```

Then commit:

```bash
git add packages/core
git commit -m "fix: :bug: покрыть оставшиеся member metadataTarget правила"
```
