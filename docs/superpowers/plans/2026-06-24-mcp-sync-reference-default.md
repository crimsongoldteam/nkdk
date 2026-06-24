# MCP Sync Reference Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MCP tool `nkdk.sync_to_xml` pass `xmlDir` as `referenceDir` when `referenceDir` is omitted.

**Architecture:** Keep the default at the MCP service boundary. The public MCP input contract stays unchanged: `referenceDir` remains optional, while `syncToXml` computes the effective reference directory before calling `syncConfigurationToXML`.

**Tech Stack:** TypeScript, Vitest, `packages/mcp` service layer, `@nakidka/core` sync API.

---

## File Structure

- Modify `packages/mcp/src/services/syncToXml.test.ts`: add a focused unit test for the omitted `referenceDir` case.
- Modify `packages/mcp/src/services/syncToXml.ts`: compute `referenceDir` as `input.referenceDir ?? input.xmlDir` and pass it to core.
- Do not modify `packages/mcp/src/contracts/syncToXml.ts`: `referenceDir` stays optional.
- Do not modify `packages/cli/src/commands/sync.ts` or `packages/core/**`: the change is MCP-only.

### Task 1: Cover MCP reference default

**Files:**
- Modify: `packages/mcp/src/services/syncToXml.test.ts`

- [ ] **Step 1: Add the failing test**

Insert this test between `requires allowWrite before calling core` and `passes referenceDir and maps failures`:

```ts
  it("defaults referenceDir to xmlDir when referenceDir is omitted", async () => {
    const syncConfigurationToXML = vi.fn().mockResolvedValue({
      succeeded: 1,
      failed: [],
    })

    const result = await syncToXml({ yamlDir: "/yaml", xmlDir: "/xml", allowWrite: true }, { syncConfigurationToXML })

    expect(syncConfigurationToXML).toHaveBeenCalledWith(
      expect.objectContaining({
        inputDir: "/yaml",
        outputDir: "/xml",
        referenceDir: "/xml",
      }),
    )
    expect(result).toEqual({
      ok: true,
      succeeded: 1,
      failed: [],
    })
  })
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/mcp test -- syncToXml
```

Expected: FAIL for `defaults referenceDir to xmlDir when referenceDir is omitted`, because the current service does not pass `referenceDir` when it is absent from input.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/mcp/src/services/syncToXml.test.ts
git commit -m "test: :white_check_mark: описать reference по умолчанию для MCP sync"
```

### Task 2: Implement MCP reference default

**Files:**
- Modify: `packages/mcp/src/services/syncToXml.ts`

- [ ] **Step 1: Compute effective referenceDir**

In `syncToXml`, after `const core = deps ?? (await loadCoreApi())`, add:

```ts
    const referenceDir = input.referenceDir ?? input.xmlDir
```

Then replace the current conditional spread:

```ts
      ...(input.referenceDir !== undefined ? { referenceDir: input.referenceDir } : {}),
```

with:

```ts
      referenceDir,
```

The relevant block should become:

```ts
  try {
    const core = deps ?? (await loadCoreApi())
    const referenceDir = input.referenceDir ?? input.xmlDir
    const result = await core.syncConfigurationToXML({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          configDumpInfo: new Map(),
          version: "2.20",
          context: {
            forms: [],
            templates: [],
            parentName: "",
            metadataForNumbering: [],
          },
        },
      },
      inputDir: input.yamlDir,
      outputDir: input.xmlDir,
      referenceDir,
    })
```

- [ ] **Step 2: Run the focused MCP test**

Run:

```bash
pnpm --filter @nakidka/mcp test -- syncToXml
```

Expected: PASS. The new default test and the existing explicit `referenceDir` test both pass.

- [ ] **Step 3: Check the contract stays optional**

Run:

```bash
rg -n "referenceDir: z\\.string\\(\\)\\.min\\(1\\)\\.optional\\(\\)" packages/mcp/src/contracts/syncToXml.ts
```

Expected output includes:

```text
referenceDir: z.string().min(1).optional(),
```

- [ ] **Step 4: Commit the implementation**

```bash
git add packages/mcp/src/services/syncToXml.ts
git commit -m "fix: :bug: подставить XML как reference для MCP sync"
```

### Task 3: Verify the package and project

**Files:**
- No file changes.

- [ ] **Step 1: Run MCP package tests**

Run:

```bash
pnpm --filter @nakidka/mcp test
```

Expected: all `@nakidka/mcp` tests pass.

- [ ] **Step 2: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Inspect final diff**

Run:

```bash
git status --short
git diff --stat HEAD~2..HEAD
```

Expected:

```text
```

for `git status --short`, and the diff stat lists only:

```text
packages/mcp/src/services/syncToXml.test.ts
packages/mcp/src/services/syncToXml.ts
```

The spec and this plan may appear in earlier commits, but implementation commits should only touch the MCP service and its test.

## Self-Review

- Spec coverage: Task 1 covers the omitted `referenceDir` case; Task 2 implements `input.referenceDir ?? input.xmlDir`; Task 2 Step 3 confirms the MCP contract remains optional; Task 3 verifies package and project tests.
- Scope check: the plan excludes CLI, core, contracts, and XML fixtures, matching the approved design.
- Type consistency: all names match current code: `syncToXml`, `SyncToXmlInput`, `syncConfigurationToXML`, `inputDir`, `outputDir`, `referenceDir`, `yamlDir`, `xmlDir`, `allowWrite`.
