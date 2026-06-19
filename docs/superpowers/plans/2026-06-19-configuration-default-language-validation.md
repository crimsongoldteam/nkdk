# Configuration Default Language Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `ОсновнойЯзык` обязательным в YAML-конфигурации, убрать скрытый `defaultValueXML: "Language.Русский"` и заменить `roleReferenceYAML: "name"` общим правилом коротких object-ссылок при единственном допустимом корне.

**Architecture:** Сокращение ссылок реализуется в общем слое `metadataTargets`: parse, format и JSON Schema. Роли переходят с частного `roleReferenceYAML` на `metadataTarget: { kind: "object", roots: ["Role"] }`. Обязательность `ОсновнойЯзык` проверяется в проектном validation-пути для корневой конфигурации, чтобы не включать все `required: true` глобально в схемах, которые используются как частичные вложенные фрагменты.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, `pnpm`, существующий metadata orchestration слой.

---

## File Structure

- `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
  - Добавить короткий YAML-разбор object-ссылок, когда `constraint.kind === "object"` и `constraint.roots` содержит ровно один корень.
  - Полные YAML-формы с тем же корнем при единственном корне должны возвращать ошибку, а не канонизироваться.
- `packages/core/metadata/commonObjects/metadataTargets/format.ts`
  - Экспортировать object-ссылки без YAML-корня, когда корень однозначен.
  - Оставить полную форму для отсутствующего `roots`, нескольких `roots`, вложенных object-путей и `allowedObjectPaths`.
- `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
  - Для object-ссылки с ровно одним корнем строить schema на короткое имя.
  - Для нескольких корней оставить текущую полную форму.
- `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
  - Покрыть короткие object-ссылки и запрет полной формы при одном корне.
- `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`
  - Покрыть schema для короткой object-ссылки и неизменность schema для нескольких корней.
- `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`
  - Удалить ветку `roleReferenceYAML: "name"` и UUID/opaque passthrough для ролей.
- `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`
  - Удалить экспортную ветку `roleReferenceYAML: "name"` и passthrough для ролей.
- `packages/core/metadata/commonObjects/metadataRef/fromYAML.test.ts`
  - Заменить role-specific тесты тестами на `metadataTarget: { kind: "object", roots: ["Role"] }`.
- `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`
  - Заменить role-specific экспортные тесты.
- `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`
  - Заменить `roleNameRule` на обычное metadataTarget-правило роли.
- `packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts`
  - Проверить, что `Администратор` принимается, а `Role.Администратор` и `Роль.Администратор` отклоняются.
- `packages/core/metadata/commonObjects/rootCommandInterface/toYAML.test.ts`
  - Проверить экспорт роли в короткой форме.
- `packages/core/metadata/commonObjects/homePageWorkArea/register.ts`
  - Заменить `roleNameRule` на обычное metadataTarget-правило роли.
- `packages/core/metadata/commonObjects/homePageWorkArea/fromYAML.test.ts`
  - Проверить, что `Администратор` принимается, а полные формы и opaque-ключи отклоняются.
- `packages/core/metadata/commonObjects/homePageWorkArea/toYAML.test.ts`
  - Проверить экспорт роли в короткой форме.
- `packages/core/metadata/orchestration/property/types.ts`
  - Удалить `roleReferenceYAML?: "full" | "name"` из `BasePropertyRule`.
- `packages/core/metadata/appliedObjects/configuration/rules.ts`
  - Удалить `defaultValueXML: "Language.Русский"` у `defaultLanguage`.
  - Оставить `required: true`.
- `packages/core/metadata/validation/validateProject.ts`
  - Добавить проектную проверку отсутствующего `ОсновнойЯзык` в `Конфигурация.yaml`.
- `packages/core/metadata/validation/validateProject.test.ts`
  - Добавить red-green проверки для обязательного `ОсновнойЯзык`, короткой формы и запрета полной формы.

---

### Task 1: Red Tests For Generic Object Short Names

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`

- [ ] **Step 1: Add failing parser tests**

Append these tests inside `describe("metadataTargets parser", () => { ... })` in `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`:

```ts
  it("parses short object references when exactly one root is allowed", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Русский",
        constraint: { kind: "object", roots: ["Language"] },
      }),
    ).toEqual({
      ok: true,
      canonical: "Language.Русский",
      target: { kind: "object", root: "Language", objectName: "Русский" },
    })

    expect(
      formatMetadataTargetToYAML({
        canonical: "Language.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      }),
    ).toBe("Русский")
  })

  it("rejects full object references when exactly one root is allowed", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Язык.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      }),
    ).toEqual({
      ok: false,
      code: "invalid-shape",
      message: "Ожидалось имя объекта без корня, потому что корень задан правилом",
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Language.Русский",
        constraint: { kind: "object", roots: ["Language"] },
      }),
    ).toEqual({
      ok: false,
      code: "unknown-root",
      message: 'Неизвестный корень "Language"',
    })
  })

  it("keeps full object references when roots are ambiguous", () => {
    expect(
      parseMetadataTargetFromYAML({
        value: "Справочник.Товары",
        constraint: { kind: "object", roots: ["Catalog", "Document"] },
      }),
    ).toMatchObject({
      ok: true,
      canonical: "Catalog.Товары",
    })

    expect(
      parseMetadataTargetFromYAML({
        value: "Товары",
        constraint: { kind: "object", roots: ["Catalog", "Document"] },
      }),
    ).toMatchObject({
      ok: false,
      code: "unknown-root",
    })
  })
```

- [ ] **Step 2: Add failing schema tests**

Append this test inside `describe("buildMetadataTargetSchema", () => { ... })` in `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`:

```ts
  it("requires short object references when exactly one root is allowed", () => {
    const schema = buildMetadataTargetSchema({ kind: "object", roots: ["Language"] })

    expectMatches(schema, "Русский")
    expectNotMatches(schema, "Язык.Русский")
    expectNotMatches(schema, "Language.Русский")
  })
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: FAIL. The new short object tests fail because current object parsing and schema require a YAML root.

- [ ] **Step 4: Commit red tests**

```bash
git add packages/core/metadata/commonObjects/metadataTargets/parse.test.ts packages/core/metadata/commonObjects/metadataTargets/schema.test.ts
git commit -m "test: :test_tube: описать короткие object-ссылки metadataTarget"
```

---

### Task 2: Implement Generic Object Short Names

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/parse.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/format.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/parse.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`

- [ ] **Step 1: Add helper for single-root object constraints**

In `packages/core/metadata/commonObjects/metadataTargets/parse.ts`, add this helper near `parseRootedTargetFromYAML`:

```ts
function singleObjectRoot(
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" | "value" }>,
): MetadataRootName | undefined {
  if (constraint.kind !== "object") return undefined
  if (constraint.allowedObjectPaths !== undefined) return undefined
  if (constraint.allowNested === true) return undefined
  if (constraint.nestedObjectRoots !== undefined) return undefined
  return constraint.roots?.length === 1 ? constraint.roots[0] : undefined
}
```

- [ ] **Step 2: Parse short object YAML before rooted YAML**

Replace the beginning of `parseRootedTargetFromYAML` with this implementation:

```ts
function parseRootedTargetFromYAML(
  parts: readonly string[],
  constraint: Extract<MetadataTargetConstraint, { kind: "object" | "member" | "value" }>,
  parseTarget: (root: MetadataRootName, objectName: string, tail: readonly string[]) => MetadataTargetParseResult
): MetadataTargetParseResult {
  const rootToken = parts[0]
  if (rootToken === undefined || rootToken === "") {
    return invalidShape()
  }

  const shortRoot = singleObjectRoot(constraint)
  if (shortRoot !== undefined) {
    if (parts.length === 1 && isValidMetadataName(rootToken)) {
      return parseTarget(shortRoot, rootToken, [])
    }

    const yamlRoot = rootFromYAML[rootToken]
    if (yamlRoot === shortRoot || isMetadataRootName(rootToken)) {
      return invalidShape("Ожидалось имя объекта без корня, потому что корень задан правилом")
    }
  }

  const root = rootFromYAML[rootToken]
  if (!root) {
    return error("unknown-root", `Неизвестный корень "${rootToken}"`)
  }

  return parseRootedTarget(root, parts, constraint.roots, parseTarget)
}
```

- [ ] **Step 3: Format single-root object references as short names**

In `packages/core/metadata/commonObjects/metadataTargets/format.ts`, add this helper before `formatParsedMetadataTargetToYAML`:

```ts
function shouldUseShortObjectYAML(target: ParsedMetadataTarget, constraint: MetadataTargetConstraint): boolean {
  if (target.kind !== "object") return false
  if (constraint.kind !== "object") return false
  if (constraint.allowedObjectPaths !== undefined) return false
  if (constraint.allowNested === true) return false
  if (constraint.nestedObjectRoots !== undefined) return false
  if (target.segments !== undefined && target.segments.length > 0) return false
  return constraint.roots?.length === 1 && constraint.roots[0] === target.root
}
```

Then replace the `case "object":` branch in `formatParsedMetadataTargetToYAML` with:

```ts
    case "object":
      if (shouldUseShortObjectYAML(target, constraint)) return target.objectName
      return [
        rootToYAML[target.root],
        target.objectName,
        ...(target.segments ?? []).flatMap((segment) => [formatObjectSegmentKind(segment.kind), segment.objectName]),
      ].join(".")
```

- [ ] **Step 4: Update object JSON Schema for single-root constraints**

In `packages/core/metadata/commonObjects/metadataTargets/schema.ts`, replace the return block at the end of `objectSchema` with:

```ts
  const singleRootShort =
    selectedRoots.length === 1 &&
    constraint.allowedObjectPaths === undefined &&
    constraint.allowNested !== true &&
    constraint.nestedObjectRoots === undefined

  return Type.String({
    pattern:
      selectedRoots.length === 0
        ? noMatchPattern
        : singleRootShort
          ? `^(${METADATA_NAME_PATTERN})$`
          : `^((${yamlRoots})\\.${METADATA_NAME_PATTERN}${tailPattern})$`,
    examples: singleRootShort
      ? [fieldObjectName(selectedRoots[0])]
      : objectExamples(selectedRoots, constraint.allowNested === true),
    description:
      selectedRoots.length === 0
        ? "Ссылка на объект метаданных. Ограничение не разрешает корневые типы; подробная проверка выполняется validate."
        : singleRootShort
          ? `Ссылка на объект метаданных с корнем ${yamlRoots}: <ИмяОбъекта>. Реальные имена объектов берутся из YAML-проекта и проверяются validate.`
          : `Ссылка на объект метаданных: ${yamlRoots}.<ИмяОбъекта>. Реальные имена объектов берутся из YAML-проекта и проверяются validate.`,
  })
```

- [ ] **Step 5: Run metadataTarget tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets/parse.test.ts metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit generic short object implementation**

```bash
git add packages/core/metadata/commonObjects/metadataTargets/parse.ts packages/core/metadata/commonObjects/metadataTargets/format.ts packages/core/metadata/commonObjects/metadataTargets/schema.ts packages/core/metadata/commonObjects/metadataTargets/parse.test.ts packages/core/metadata/commonObjects/metadataTargets/schema.test.ts
git commit -m "feat: :sparkles: сокращать object-ссылки с одним корнем"
```

---

### Task 3: Replace `roleReferenceYAML` With Generic Role Targets

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/rootCommandInterface/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/homePageWorkArea/register.ts`
- Modify: `packages/core/metadata/commonObjects/homePageWorkArea/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/homePageWorkArea/toYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Test: metadataRef, rootCommandInterface, homePageWorkArea tests

- [ ] **Step 1: Rewrite metadataRef import tests**

In `packages/core/metadata/commonObjects/metadataRef/fromYAML.test.ts`, replace the role-specific tests with:

```ts
  it("imports short role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(importMetadataItemLinkFromYAML(mockContext, rule, "Администратор")).toBe("Role.Администратор")
  })

  it("rejects prefixed role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "Role.Администратор")).toThrow(
      'Неизвестный корень "Role"',
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "Роль.Администратор")).toThrow(
      "Ожидалось имя объекта без корня, потому что корень задан правилом",
    )
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toThrow()
    expect(() => importMetadataItemLinkFromYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toThrow()
  })
```

For list import tests, replace the short-role list tests with:

```ts
  it("imports short role reference lists through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор"])).toEqual(["Role.Администратор"])
  })

  it("rejects opaque role list entries through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => importMetadataItemLinksFromYAML(mockContext, rule, ["Администратор", "ЛокальныйПуть.НачалоРаботы"])).toThrow()
  })
```

- [ ] **Step 2: Rewrite metadataRef export tests**

In `packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts`, replace role-specific tests with:

```ts
  it("exports role references through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(exportMetadataItemLinkToYAML(mockContext, rule, "Role.Администратор")).toBe("Администратор")
  })

  it("rejects opaque values in role metadataTarget mode", () => {
    const rule = { type: "MetadataItemLink", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "418deaa0-683e-4862-9348-c0086ba6909f")).toThrow()
    expect(() => exportMetadataItemLinkToYAML(mockContext, rule, "ЛокальныйПуть.НачалоРаботы")).toThrow()
  })
```

For list export tests, replace role-specific tests with:

```ts
  it("exports role reference lists through single-root metadataTarget", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор"])).toEqual(["Администратор"])
  })

  it("rejects opaque values in role metadataTarget lists", () => {
    const rule = { type: "MetadataItemLinks", metadataTarget: { kind: "object", roots: ["Role"] } } as const

    expect(() =>
      exportMetadataItemLinksToYAML(mockContext, rule, ["Role.Администратор", "ЛокальныйПуть.НачалоРаботы"]),
    ).toThrow()
  })
```

- [ ] **Step 3: Run metadataRef tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/fromYAML.test.ts metadata/commonObjects/metadataRef/toYAML.test.ts
```

Expected: FAIL until implementation removes `roleReferenceYAML` and generic short object support is in place.

- [ ] **Step 4: Replace role rules in root command interface**

In `packages/core/metadata/commonObjects/rootCommandInterface/register.ts`, replace:

```ts
const roleNameRule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const satisfies PropertyRule
```

with:

```ts
const roleNameRule = {
  type: "MetadataItemLink",
  metadataTarget: { kind: "object", roots: ["Role"] },
} as const satisfies PropertyRule
```

- [ ] **Step 5: Replace role rules in home page work area**

In `packages/core/metadata/commonObjects/homePageWorkArea/register.ts`, replace:

```ts
const roleNameRule = { type: "MetadataItemLink", roleReferenceYAML: "name" } as const satisfies PropertyRule
```

with:

```ts
const roleNameRule = {
  type: "MetadataItemLink",
  metadataTarget: { kind: "object", roots: ["Role"] },
} as const satisfies PropertyRule
```

- [ ] **Step 6: Update root command interface YAML tests**

In `packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts`, keep the existing `Администратор` positive case and add:

```ts
  it("rejects prefixed and opaque role visibility keys", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: RootCommandInterfaceRules,
        yaml: {
          ВидимостьПодсистем: {
            "Subsystem.ПодсистемаПоУмолчанию": {
              Роли: {
                "Роль.Администратор": "Ложь",
              },
            },
          },
        },
      }),
    ).toThrow("Ожидалось имя объекта без корня, потому что корень задан правилом")

    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: RootCommandInterfaceRules,
        yaml: {
          ВидимостьПодсистем: {
            "Subsystem.ПодсистемаПоУмолчанию": {
              Роли: {
                "ЛокальныйПуть.НачалоРаботы": "Ложь",
              },
            },
          },
        },
      }),
    ).toThrow()
  })
```

- [ ] **Step 7: Update home page work area YAML tests**

In `packages/core/metadata/commonObjects/homePageWorkArea/fromYAML.test.ts`, change the positive test so it only uses short role names:

```ts
Роли: {
  Администратор: "Ложь",
  ПолныеПрава: "Истина",
}
```

Then add:

```ts
  it("rejects prefixed role names in item visibility", () => {
    expect(() =>
      importMetadataItemFromYAML({
        context: mockContext,
        rule: HomePageWorkAreaRules,
        yaml: {
          ШаблонРабочейОбласти: "ДвеКолонкиПеременнойШирины",
          ЛеваяКолонка: [
            {
              Форма: "CommonForm.НачалоРаботы",
              Видимость: {
                Роли: {
                  "Role.Администратор": "Ложь",
                },
              },
            },
          ],
        },
      }),
    ).toThrow('Неизвестный корень "Role"')
  })
```

- [ ] **Step 8: Remove roleReferenceYAML logic**

In `packages/core/metadata/commonObjects/metadataRef/fromYAML.ts`, remove `UUID_PATTERN`, `fromRoleYAML`, `canPassThroughShortRoleValue`, `isMetadataLikeRoot`, and `throwUnknownRoot`.

Replace `importMetadataItemLinkFromYAML` with:

```ts
export const importMetadataItemLinkFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinkYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLink | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  return importMetadataObjectStringFromYAML(context, rule, data, owner)
}
```

- [ ] **Step 9: Remove roleReferenceYAML export logic**

In `packages/core/metadata/commonObjects/metadataRef/toYAML.ts`, remove `toRoleYAML`, `canPassThroughShortRoleValue`, `isMetadataLikeRoot`, and `throwUnknownRoot`.

Replace `exportMetadataItemLinkToYAML` with:

```ts
export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinkYAML | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  return exportMetadataObjectStringToYAML(context, rule, data, owner)
}
```

- [ ] **Step 10: Remove roleReferenceYAML from property rule types**

In `packages/core/metadata/orchestration/property/types.ts`, delete this line from `BasePropertyRule`:

```ts
  roleReferenceYAML?: "full" | "name"
```

- [ ] **Step 11: Run role-related tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/fromYAML.test.ts metadata/commonObjects/metadataRef/toYAML.test.ts metadata/commonObjects/rootCommandInterface metadata/commonObjects/homePageWorkArea
```

Expected: PASS.

- [ ] **Step 12: Commit roleReferenceYAML removal**

```bash
git add packages/core/metadata/commonObjects/metadataRef/fromYAML.ts packages/core/metadata/commonObjects/metadataRef/toYAML.ts packages/core/metadata/commonObjects/metadataRef/fromYAML.test.ts packages/core/metadata/commonObjects/metadataRef/toYAML.test.ts packages/core/metadata/commonObjects/rootCommandInterface/register.ts packages/core/metadata/commonObjects/rootCommandInterface/fromYAML.test.ts packages/core/metadata/commonObjects/rootCommandInterface/toYAML.test.ts packages/core/metadata/commonObjects/homePageWorkArea/register.ts packages/core/metadata/commonObjects/homePageWorkArea/fromYAML.test.ts packages/core/metadata/commonObjects/homePageWorkArea/toYAML.test.ts packages/core/metadata/orchestration/property/types.ts
git commit -m "refactor: :recycle: заменить roleReferenceYAML общими metadataTarget-ссылками"
```

---

### Task 4: Require Configuration Default Language In Project Validation

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add failing validation tests**

In `packages/core/metadata/validation/validateProject.test.ts`, after the existing `"validates the root configuration YAML file"` test, add:

```ts
  it("requires the root configuration default language in YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", ["Имя: Конфигурация"])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
          path: "/ОсновнойЯзык",
        }),
      ]),
    )
  })

  it("accepts a short root configuration default language reference", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Русский",
    ])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", [
      "Комментарий: язык конфигурации",
      "КодЯзыка: ru",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual([])
  })

  it("rejects a full root configuration default language reference", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Язык.Русский",
    ])
    writeProjectFile(projectDir, "Язык/Русский/Свойства.yaml", [
      "Комментарий: язык конфигурации",
      "КодЯзыка: ru",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Конфигурация.yaml"),
          source: "structure",
          severity: "error",
          path: "/ОсновнойЯзык",
        }),
      ]),
    )
  })

  it("reports a missing short root configuration default language target", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Конфигурация.yaml", [
      "Имя: Конфигурация",
      "ОсновнойЯзык: Русский",
    ])

    const diagnostics = validateProject({ projectDir, context: mockContext }).diagnostics

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filePath: join(projectDir, "Язык", "Русский", "Свойства.yaml"),
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Язык.Русский"',
        }),
      ]),
    )
  })
```

- [ ] **Step 2: Run validation tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: FAIL. Missing `ОсновнойЯзык` currently passes, and short `Русский` currently does not parse as `Language.Русский`.

- [ ] **Step 3: Remove XML default from configuration rule**

In `packages/core/metadata/appliedObjects/configuration/rules.ts`, change `defaultLanguage` from:

```ts
    defaultLanguage: {
      yaml: "ОсновнойЯзык",
      type: "MetadataItemLink",
      metadataTarget: { kind: "object", roots: ["Language"] },
      required: true,
      defaultValueXML: "Language.Русский",
      preserveExplicitDefaultXML: true,
      xmlParents: configurationProperties,
    },
```

to:

```ts
    defaultLanguage: {
      yaml: "ОсновнойЯзык",
      type: "MetadataItemLink",
      metadataTarget: { kind: "object", roots: ["Language"] },
      required: true,
      xmlParents: configurationProperties,
    },
```

- [ ] **Step 4: Add project-level required key diagnostic**

In `packages/core/metadata/validation/validateProject.ts`, add this helper above `validateProjectFileSchema`:

```ts
function validateRequiredConfigurationYAMLKeys(params: {
  file: ValidationProjectFile
  parsed: ParsedYaml
}): Diagnostic[] {
  if (params.file.owner.spec.rule.itemType !== "MetadataConfiguration") return []
  if (params.parsed.data === null || typeof params.parsed.data !== "object" || Array.isArray(params.parsed.data)) return []

  const diagnostics: Diagnostic[] = []
  const data = params.parsed.data as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(data, "ОсновнойЯзык")) {
    diagnostics.push({
      filePath: params.file.absolutePath,
      line: 1,
      col: 1,
      severity: "error",
      source: "structure",
      path: "/ОсновнойЯзык",
      message: "Expected required property",
    })
  }

  return diagnostics
}
```

Then in `validateProjectProperties`, after `diagnostics` is created and after the parsed entry is known, add:

```ts
  const requiredDiagnostics = validateRequiredConfigurationYAMLKeys({
    file: params.file,
    parsed: entry.parsed,
  })
```

Return early when the required key is missing, then keep the existing model-based diagnostics path unchanged for valid files:

```ts
  if (requiredDiagnostics.length > 0) return [...diagnostics, ...requiredDiagnostics]

  return [
    ...diagnostics,
    ...validateUniqueNameScopes({
      filePath: params.file.absolutePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
    }),
    ...validateMetadataTargetsInModel({
      filePath: params.file.absolutePath,
      parsed: entry.parsed,
      model: imported.model,
      rule: params.file.owner.spec.rule,
      resolver: params.metadataResolver,
      owner,
    }),
  ]
```

- [ ] **Step 5: Keep diagnostics deterministic**

Place the required-key check before `importPropertiesModel` is called:

```ts
  const requiredDiagnostics = validateRequiredConfigurationYAMLKeys({
    file: params.file,
    parsed: entry.parsed,
  })
```

Keep schema diagnostics, skip model import for that file, and return only structure diagnostics:

```ts
  if (requiredDiagnostics.length > 0) return [...diagnostics, ...requiredDiagnostics]
```

- [ ] **Step 6: Run configuration validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts metadata/appliedObjects/configuration/rootIO.test.ts metadata/appliedObjects/configuration/rootXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit configuration validation**

```bash
git add packages/core/metadata/appliedObjects/configuration/rules.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "fix: :bug: требовать ОсновнойЯзык в YAML-конфигурации"
```

---

### Task 5: CLI Regression And Full Verification

**Files:**
- No code files for this task.
- Verify: `/home/nikita/git/new-test-yaml`

- [ ] **Step 1: Run CLI validate on the reported project**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/new-test-yaml
```

Expected: exit code `1`, output includes a diagnostic for `Конфигурация.yaml` and `/ОсновнойЯзык`, then `summary: 1 error, 0 warning` or a higher error count if the project contains other real errors.

- [ ] **Step 2: Manually verify the original masking is gone**

Run:

```bash
rg -n 'defaultValueXML: "Language\\.Русский"' packages/core/metadata/appliedObjects/configuration/rules.ts
```

Expected: no matches.

- [ ] **Step 3: Run targeted test groups**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTargets metadata/commonObjects/metadataRef metadata/commonObjects/rootCommandInterface metadata/commonObjects/homePageWorkArea metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 5: Verify the working tree after checks**

Run:

```bash
git status --short
```

Expected: only the intentional source and test files from Tasks 1-4 are present, and no generated test output files were created.

---

## Self-Review

**Spec coverage:**

- Удаление `defaultValueXML: "Language.Русский"` покрыто Task 4 Step 3.
- Обязательность `ОсновнойЯзык` покрыта Task 4 Steps 1, 4, 5.
- Короткая object-ссылка при одном корне покрыта Tasks 1 and 2.
- Запрет полной формы при одном корне покрыт Tasks 1, 2, 4.
- Удаление `roleReferenceYAML: "name"` покрыто Task 3.
- Запрет UUID и `ЛокальныйПуть.НачалоРаботы` в `Роли` покрыт Task 3.
- CLI regression для `/home/nikita/git/new-test-yaml` покрыт Task 5.
- Полный `pnpm test` покрыт Task 5.

**Placeholder scan:** План не содержит `TBD`, `TODO`, "implement later", "add appropriate", "write tests for the above", "similar to". Все шаги с изменением кода содержат конкретные фрагменты.

**Type consistency:** В плане используются существующие имена `MetadataTargetConstraint`, `MetadataRootName`, `MetadataTargetParseResult`, `PropertyRule`, `Diagnostic`, `ValidationProjectFile`, `ParsedYaml`, `MetadataConfiguration`, `defaultLanguage`, `ОсновнойЯзык`.
