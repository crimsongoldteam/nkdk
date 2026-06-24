# Font Raw Style Ref ToXML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve raw `Font` refs such as `ref="0"` through `XML -> YAML -> XML`, so generated XML stays loadable by 1C.

**Architecture:** Keep the current YAML contract and add a small internal marker to the `Font` model. The marker tells `toXML` that `ref` came from a raw XML/YAML value and must be emitted unchanged instead of receiving a `style:` or `sys:` prefix.

**Tech Stack:** TypeScript, Vitest, existing metadata `Font` handlers in `packages/core/metadata/commonObjects/font`.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/font/types.ts`
  - Add an optional `rawRef?: boolean` marker to `Font`.
- Modify `packages/core/metadata/commonObjects/font/fromXML.ts`
  - Mark non-prefixed `StyleItem` refs as raw while preserving existing prefix normalization.
- Modify `packages/core/metadata/commonObjects/font/fromYAML.ts`
  - Mark refs imported from `Вид: ЭлементСтиля` + `Значение: ...` as raw.
- Modify `packages/core/metadata/commonObjects/font/toYAML.ts`
  - If `rawRef` is set, export through the explicit `Вид + Значение` shape.
- Modify `packages/core/metadata/commonObjects/font/toXML.ts`
  - If `rawRef` is set, emit `font.ref` unchanged.
- Modify tests in `packages/core/metadata/commonObjects/font/*.test.ts`
  - Cover `fromXML`, `toYAML`, `fromYAML`, and `toXML`.

Current workspace note: there may already be unrelated unstaged changes from diagnostic work. Stage only the files listed in this plan when committing.

---

### Task 1: Add Failing Tests For Raw Font Refs

**Files:**
- Modify: `packages/core/metadata/commonObjects/font/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/toXML.test.ts`

- [ ] **Step 1: Add `fromXML` failing test**

Append this test inside `describe("importFontFromXML", ...)` in `packages/core/metadata/commonObjects/font/fromXML.test.ts`:

```ts
it("marks non-prefixed StyleItem refs as raw", () => {
  const xmlData = importContentFromXML<{ Font: FontXML }>(`<Font ref="0" height="10" kind="StyleItem"/>`)

  const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData.Font)

  expect(result).toEqual({
    ref: "0",
    kind: "StyleItem",
    height: 10,
    rawRef: true,
  })
})
```

- [ ] **Step 2: Add `toYAML` failing test**

In `packages/core/metadata/commonObjects/font/toYAML.test.ts`, replace the existing test named `exports raw non-prefixed ref with Russian font kind` with:

```ts
it("exports raw non-prefixed ref with Russian font kind", () => {
  const result = exportFontToYAML(mockContext, mockRule, {
    ref: "0" as never,
    kind: "StyleItem",
    height: 10,
    rawRef: true,
  })

  expect(result).toEqual({
    Вид: "ЭлементСтиля",
    Значение: "0",
    Размер: 10,
  })
})
```

- [ ] **Step 3: Add `fromYAML` failing test expectation**

In `packages/core/metadata/commonObjects/font/fromYAML.test.ts`, update the existing test named `imports raw non-prefixed ref with Russian font kind` so the expectation includes `rawRef: true`:

```ts
it("imports raw non-prefixed ref with Russian font kind", () => {
  const result = importFontFromYAML(mockContext, mockRule, {
    Вид: "ЭлементСтиля",
    Значение: "0",
    Размер: 10,
  } as never)

  expect(result).toEqual({
    ref: "0",
    kind: "StyleItem",
    height: 10,
    rawRef: true,
  })
})
```

- [ ] **Step 4: Add `toXML` failing test**

Append this test inside `describe("exportFontToXML", ...)` in `packages/core/metadata/commonObjects/font/toXML.test.ts`:

```ts
it("exports raw StyleItem refs without adding style prefix", () => {
  const result = {
    Font: exportFontToXML(mockContext, mockRule, {
      ref: "0" as never,
      kind: "StyleItem",
      height: 10,
      rawRef: true,
    }),
  }

  const xmlString = xmlExport(result, false)

  expect(xmlString).toEqual(`<Font ref="0" height="10" kind="StyleItem"/>`)
})
```

- [ ] **Step 5: Run tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/fromYAML.test.ts metadata/commonObjects/font/toXML.test.ts
```

Expected:
- `fromXML` fails because `rawRef` is missing.
- `fromYAML` fails because `rawRef` is missing.
- `toXML` fails because output is `<Font ref="style:0" height="10" kind="StyleItem"/>`.

---

### Task 2: Implement Raw Ref Marker

**Files:**
- Modify: `packages/core/metadata/commonObjects/font/types.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toXML.ts`

- [ ] **Step 1: Add `rawRef` to `Font` type**

In `packages/core/metadata/commonObjects/font/types.ts`, update `Font`:

```ts
export interface Font {
  kind: SE.FontType
  ref?: FontRef
  rawRef?: boolean
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
}
```

- [ ] **Step 2: Mark raw refs in `fromXML`**

In `packages/core/metadata/commonObjects/font/fromXML.ts`, replace the `if (xml._ref !== undefined)` block with:

```ts
  if (xml._ref !== undefined) {
    const xmlRef = xml._ref
    result.ref = normalizeFontRefFromXML(result.kind, PrefixedFontsFromXML[xmlRef as PrefixedFontsXML] ?? xmlRef)
    if (isRawFontRefFromXML(result.kind, xmlRef)) result.rawRef = true
  }
```

Add this helper below `normalizeFontRefFromXML`:

```ts
function isRawFontRefFromXML(kind: SE.FontType, ref: string): boolean {
  if (kind === "StyleItem") return !ref.startsWith("style:")
  if (kind === "WindowsFont") return !ref.startsWith("sys:")
  return false
}
```

- [ ] **Step 3: Mark raw refs in `fromYAML`**

In `packages/core/metadata/commonObjects/font/fromYAML.ts`, update the `Вид + Значение` branch:

```ts
  if (fullData.Вид !== undefined && fullData.Значение !== undefined) {
    const kind = SE.FontTypeFromYAML[fullData.Вид as SE.FontTypeYAML]
    if (kind !== undefined) {
      result.kind = kind
      result.ref = fullData.Значение
      result.rawRef = true
    }
  }
```

- [ ] **Step 4: Preserve explicit `Вид + Значение` in `toYAML`**

In `packages/core/metadata/commonObjects/font/toYAML.ts`, add this block after `const result: FontFullYAML = {}` and before the existing `if (ref !== undefined)` branch:

```ts
  if (font.rawRef === true && font.ref !== undefined) {
    result.Вид = SE.FontTypeToYAML[font.kind]
    result.Значение = font.ref
  } else if (ref !== undefined) {
    result.Вид = ref
  } else if (font.ref !== undefined) {
    result.Вид = SE.FontTypeToYAML[font.kind]
    result.Значение = font.ref
  } else {
    result.ВидXML = font.kind
  }
```

Remove the old `if (ref !== undefined) ... else if ... else ...` block so the branching is not duplicated.

- [ ] **Step 5: Preserve raw refs in `toXML`**

In `packages/core/metadata/commonObjects/font/toXML.ts`, update `exportFontRefToXML`:

```ts
function exportFontRefToXML(font: Font): string {
  const ref = font.ref
  if (ref === undefined) return ""
  if (font.rawRef === true) return ref
  const prefixedRef = PrefixedFontsToXML[ref as keyof typeof PrefixedFontsToXML]
  if (prefixedRef !== undefined) return prefixedRef
  if (font.kind === "StyleItem") return `style:${ref}`
  if (font.kind === "WindowsFont") return `sys:${ref}`
  return ref
}
```

- [ ] **Step 6: Run font tests to verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/fromYAML.test.ts metadata/commonObjects/font/toXML.test.ts
```

Expected:
- All selected `Font` tests pass.

- [ ] **Step 7: Commit task 2**

Stage only the `Font` files:

```bash
git add packages/core/metadata/commonObjects/font/types.ts \
  packages/core/metadata/commonObjects/font/fromXML.ts \
  packages/core/metadata/commonObjects/font/fromYAML.ts \
  packages/core/metadata/commonObjects/font/toYAML.ts \
  packages/core/metadata/commonObjects/font/toXML.ts \
  packages/core/metadata/commonObjects/font/fromXML.test.ts \
  packages/core/metadata/commonObjects/font/fromYAML.test.ts \
  packages/core/metadata/commonObjects/font/toYAML.test.ts \
  packages/core/metadata/commonObjects/font/toXML.test.ts
git commit -m "fix: :bug: сохранить raw-ссылки шрифта"
```

---

### Task 3: Verify `acc` And Full Test Suite

**Files:**
- No source edits expected.

- [ ] **Step 1: Re-run `acc` 1C diagnostic**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'env NKDK_XML_REPO=/home/codexwsl/round-trip NKDK_XML_DIR=/home/codexwsl/round-trip/acc NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c NKDK_1C_DATA=/tmp/round-trip-yaml-1c-base NKDK_1C_DB_PATH=/tmp/round-trip-yaml-1c-base NKDK_1C_IBCMD=/opt/1cv8/x86_64/8.3.27.2214/ibcmd ./.agents/skills/round-trip-yaml-1c/round-trip.sh'
```

Expected:
- `XML -> YAML` succeeds.
- `YAML -> XML` succeeds.
- 1C import no longer fails on `style:0`.
- If another unrelated 1C error appears, stop and report the new file and message.

- [ ] **Step 2: Confirm generated XML preserves raw refs**

Run:

```bash
rg -n 'ref="style:0"|ref="0"' /tmp/round-trip-yaml-1c-xml/acc/CommonForms/ВводДанныхДляРасчетаСреднегоЗаработкаОбщий/Ext/Form.xml /tmp/round-trip-yaml-1c-xml/acc/CommonForms/ВводДанныхДляРасчетаСреднегоЗаработкаФСС/Ext/Form.xml
```

Expected:
- Matches for `ref="0"`.
- No matches for `ref="style:0"`.

- [ ] **Step 3: Run full project tests**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected:
- All project tests pass.

- [ ] **Step 4: Report final status**

Include:
- whether `acc` passed 1C import;
- whether `style:0` disappeared from generated XML;
- full `pnpm test` result;
- reminder that `/home/codexwsl/round-trip` still contains intentional ERP deletion changes unless they have been committed or reverted separately.
