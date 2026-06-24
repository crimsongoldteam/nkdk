# Raw Picture LoadTransparent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `xr:LoadTransparent` and `xr:TransparentPixel` for raw `Picture` refs during XML round-trip.

**Architecture:** Extend only the raw picture branch in `packages/core/metadata/commonObjects/picture`. Linked pictures keep their current model and export path; raw refs gain optional XML-only fields that are copied through import/export without guessing defaults.

**Tech Stack:** TypeScript, Vitest, existing metadata type-rule registration.

---

### File Map

- Modify: `packages/core/metadata/commonObjects/picture/types.ts`
  - Add optional `loadTransparent` and `transparentPixel` to `RawPictureRef`.
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.ts`
  - Parse raw `xr:LoadTransparent` only when the XML node exists.
  - Parse raw `xr:TransparentPixel` the same way linked pictures do.
- Modify: `packages/core/metadata/commonObjects/picture/toXML.ts`
  - Export raw `xr:LoadTransparent` and `xr:TransparentPixel` only when present in the model.
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.test.ts`
  - Add import tests for raw refs with `false`, `true`, and transparent pixel.
- Modify: `packages/core/metadata/commonObjects/picture/toXML.test.ts`
  - Add export tests for raw refs with `false`, `true`, and transparent pixel.

### Task 1: Add Failing Raw Picture XML Import Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.test.ts`

- [ ] **Step 1: Add tests after `should import empty raw ref from XML`**

```ts
  it("should import raw ref with LoadTransparent=false from XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": false,
    })

    expect(result).toEqual({ rawRef, loadTransparent: false })
  })

  it("should import raw ref with LoadTransparent=true from XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
    })

    expect(result).toEqual({ rawRef, loadTransparent: true })
  })

  it("should import raw ref with transparent pixel from XML", () => {
    const rawRef = "0"
    const result = importPictureFromXML(mockContextFromXML(), mockRule, {
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
      "xr:TransparentPixel": { _x: "12", _y: "2" },
    })

    expect(result).toEqual({
      rawRef,
      loadTransparent: true,
      transparentPixel: { x: 12, y: 2 },
    })
  })
```

- [ ] **Step 2: Run import tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/picture/fromXML.test.ts
```

Expected: the new raw ref tests fail because `importPictureFromXML` currently returns only `{ rawRef }`.

### Task 2: Add Failing Raw Picture XML Export Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/toXML.test.ts`

- [ ] **Step 1: Add tests after `should export empty raw ref to XML`**

```ts
  it("should export raw ref with LoadTransparent=false to XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef, loadTransparent: false })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": false,
    })
  })

  it("should export raw ref with LoadTransparent=true to XML", () => {
    const rawRef = "0:ca5b178d-2d5a-4cf7-b88e-6fbdb2e56065"
    const result = exportPictureToXML(mockContext, mockRule, { rawRef, loadTransparent: true })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
    })
  })

  it("should export raw ref with transparent pixel to XML", () => {
    const rawRef = "0"
    const result = exportPictureToXML(mockContext, mockRule, {
      rawRef,
      loadTransparent: true,
      transparentPixel: { x: 12, y: 2 },
    })

    expect(result).toEqual({
      "xr:Ref": rawRef,
      "xr:LoadTransparent": true,
      "xr:TransparentPixel": { _x: 12, _y: 2 },
    })
  })
```

- [ ] **Step 2: Run export tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/picture/toXML.test.ts
```

Expected: the new export tests fail because `exportPictureToXML` currently drops raw ref transparency fields.

### Task 3: Preserve Raw Picture Transparency Fields

**Files:**
- Modify: `packages/core/metadata/commonObjects/picture/types.ts`
- Modify: `packages/core/metadata/commonObjects/picture/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/picture/toXML.ts`

- [ ] **Step 1: Extend `RawPictureRef` in `types.ts`**

Replace:

```ts
export type RawPictureRef = { rawRef: string }
```

with:

```ts
export type RawPictureRef = {
  rawRef: string
  loadTransparent?: boolean
  transparentPixel?: {
    x: number
    y: number
  }
}
```

- [ ] **Step 2: Add a shared transparent pixel reader in `fromXML.ts`**

Insert above `importPictureFromXML`:

```ts
const importTransparentPixel = (
  transparentPixel: PictureXML["xr:TransparentPixel"] | undefined
): { x: number; y: number } | undefined => {
  if (!transparentPixel) return undefined

  return {
    x: Number.parseInt(String(transparentPixel._x)),
    y: Number.parseInt(String(transparentPixel._y)),
  }
}
```

- [ ] **Step 3: Preserve raw ref fields in `fromXML.ts`**

Replace the raw ref branch:

```ts
  if (xmlRef && isRawPictureRefValue(xmlRef)) {
    return { rawRef: xmlRef }
  }
```

with:

```ts
  if (xmlRef && isRawPictureRefValue(xmlRef)) {
    return {
      rawRef: xmlRef,
      ...(xml["xr:LoadTransparent"] !== undefined
        ? { loadTransparent: importBooleanFromXML(context, undefined, xml["xr:LoadTransparent"]) }
        : {}),
      ...(xml["xr:TransparentPixel"] !== undefined
        ? { transparentPixel: importTransparentPixel(xml["xr:TransparentPixel"]) }
        : {}),
    }
  }
```

- [ ] **Step 4: Reuse the helper for linked pictures in `fromXML.ts`**

Replace:

```ts
  const transparentPixel = xml["xr:TransparentPixel"]
    ? {
        x: Number.parseInt(String(xml["xr:TransparentPixel"]._x)),
        y: Number.parseInt(String(xml["xr:TransparentPixel"]._y)),
      }
    : undefined
```

with:

```ts
  const transparentPixel = importTransparentPixel(xml["xr:TransparentPixel"])
```

- [ ] **Step 5: Preserve raw ref fields in `toXML.ts`**

Replace:

```ts
  if (isRawPictureRef(picture)) {
    return { "xr:Ref": picture.rawRef }
  }
```

with:

```ts
  if (isRawPictureRef(picture)) {
    return {
      "xr:Ref": picture.rawRef,
      ...(picture.loadTransparent !== undefined ? { "xr:LoadTransparent": picture.loadTransparent } : {}),
      ...(picture.transparentPixel
        ? { "xr:TransparentPixel": { _x: picture.transparentPixel.x, _y: picture.transparentPixel.y } }
        : {}),
    }
  }
```

- [ ] **Step 6: Run focused picture tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/picture/fromXML.test.ts packages/core/metadata/commonObjects/picture/toXML.test.ts
```

Expected: all picture import/export XML tests pass.

### Task 4: Verify And Commit Raw Picture Fix

**Files:**
- Verify: `packages/core/metadata/commonObjects/picture/fromXML.test.ts`
- Verify: `packages/core/metadata/commonObjects/picture/toXML.test.ts`
- Verify: `packages/core/metadata/commonObjects/picture/types.ts`
- Verify: `packages/core/metadata/commonObjects/picture/fromXML.ts`
- Verify: `packages/core/metadata/commonObjects/picture/toXML.ts`

- [ ] **Step 1: Run the focused tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/picture/fromXML.test.ts packages/core/metadata/commonObjects/picture/toXML.test.ts
```

Expected: all tests pass.

- [ ] **Step 2: Check the diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/picture/types.ts packages/core/metadata/commonObjects/picture/fromXML.ts packages/core/metadata/commonObjects/picture/toXML.ts packages/core/metadata/commonObjects/picture/fromXML.test.ts packages/core/metadata/commonObjects/picture/toXML.test.ts
```

Expected: only raw picture transparency support and tests are changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/picture/types.ts packages/core/metadata/commonObjects/picture/fromXML.ts packages/core/metadata/commonObjects/picture/toXML.ts packages/core/metadata/commonObjects/picture/fromXML.test.ts packages/core/metadata/commonObjects/picture/toXML.test.ts
git commit -m "fix: :bug: сохранить прозрачность raw Picture"
```

Expected: commit succeeds.

---

## Self-Review

- Spec coverage: `LoadTransparent=false`, `LoadTransparent=true`, raw `0` with `TransparentPixel`, no heuristic defaults, and no linked-picture changes are covered.
- Placeholder scan: no placeholders remain.
- Type consistency: `RawPictureRef.loadTransparent` and `RawPictureRef.transparentPixel` are used consistently across import, export, and tests.
