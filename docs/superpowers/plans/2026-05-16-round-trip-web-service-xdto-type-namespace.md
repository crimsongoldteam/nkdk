# Web Service XDTO Type Namespace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve web service XDTO value type names and namespace declarations.

**Architecture:** Add a dedicated `XDTOTypeName` property type for web service XDTO value type fields. The model/YAML remains a string, while XML import/export preserves namespace attributes from reference when the text matches.

**Tech Stack:** TypeScript, Vitest, metadata web service common objects.

---

### Task 1: Add XDTO Namespace Regression

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/xdto-type-namespace.xml`
- Test: `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts`

- [ ] **Step 1: Add XML fixture**

Create XML with:

```xml
<XDTOValueType xmlns:d4p1="http://example.org/schema">d4p1:Customer</XDTOValueType>
```

and returning value:

```xml
<XDTOReturningValueType xmlns:d4p1="http://example.org/schema">d4p1:CustomerResponse</XDTOReturningValueType>
```

- [ ] **Step 2: Add model expectation**

Use plain strings:

```ts
xdtoValueType: "d4p1:Customer",
xdtoReturningValueType: "d4p1:CustomerResponse",
```

- [ ] **Step 3: Verify red**

Run: `pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataWebServiceOperation -t "XDTO"`

Expected: FAIL because namespace attributes are lost.

### Task 2: Implement XDTOTypeName

**Files:**
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts`
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/types.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/rules.ts`

- [ ] **Step 1: Add type**

Create:

```ts
export type XDTOTypeName = string
export type XDTOTypeNameXML = string & { [attribute: `_xmlns${string}`]: string | undefined }
```

- [ ] **Step 2: Import string and source namespaces**

Import text as string and keep namespace attributes in reference metadata for this property.

- [ ] **Step 3: Export with reference namespace**

If value equals reference value, return the reference XML object including `_xmlns:*` attributes.

- [ ] **Step 4: Update rules**

Change XDTO fields to:

```ts
type: "XDTOTypeName"
```

- [ ] **Step 5: Verify green**

Run the same Vitest command from Task 1. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects
git commit -m "fix: :bug: сохранить namespace XDTO-типа"
```

