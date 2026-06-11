# userSettingPresentation Short XML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export single-language `dcsset:userSettingPresentation` as `xsi:type="xs:string"` even when there is no reference XML.

**Architecture:** Keep the change inside the existing `userSettingPresentationXML` helper. The helper remains specific to `SettingsParameterValue.userSettingPresentation`; generic `I8nText` behavior is unchanged.

**Tech Stack:** TypeScript, Vitest, existing metadata DCS XML helpers, `round-trip-yaml-1c`.

---

### Task 1: Export Single-Language userSettingPresentation As xs:string

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts`

- [ ] **Step 1: Write the failing test**

Add this test to `userSettingPresentationXML.test.ts` after `preserves xs:string short form for unchanged reference`:

```ts
  it("exports single-language value as xs:string without reference", () => {
    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "Период с" } },
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "Период с" })
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts
```

Expected: the new test fails because export without reference returns regular `I8nText` XML with `v8:item`.

- [ ] **Step 3: Implement minimal export rule**

In `userSettingPresentationXML.ts`, add this helper near `itemsEqual`:

```ts
const getSingleLanguageText = (items: I8nText["items"]): string | undefined => {
  const entries = Object.entries(items)
  if (entries.length !== 1) return undefined
  return entries[0]?.[1]
}
```

Then update `exportUserSettingPresentationToXML` after the reference short-form branch and before `exportI8nTextToXML`:

```ts
  const singleLanguageText = getSingleLanguageText(data.items)
  if (singleLanguageText !== undefined) {
    return { "_xsi:type": "xs:string", "#text": singleLanguageText }
  }
```

- [ ] **Step 4: Run focused test**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm --dir packages/core exec vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts
```

Expected: all tests in this file pass.

- [ ] **Step 5: Verify 1C import for small**

Run:

```bash
mkdir -p /tmp/round-trip-yaml-1c-base
env PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH NODE_OPTIONS=--dns-result-order=ipv4first \
  NKDK_XML_REPO=/home/codexwsl/round-trip \
  NKDK_XML_DIR=/home/codexwsl/round-trip/small \
  NKDK_1C_DATA=/tmp/round-trip-yaml-1c-base \
  NKDK_1C_DB_PATH=/tmp/round-trip-yaml-1c-base \
  NKDK_1C_IBCMD=/opt/1cv8/x86_64/8.3.27.2214/ibcmd \
  ./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: the previous `userSettingPresentation` XDTO error is gone. If another 1C import error appears, stop and report the new error.

- [ ] **Step 6: Run full project tests**

Run:

```bash
PATH=/tmp/node-v22.22.3-linux-x64/bin:$PATH pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts
git commit -m "fix: :bug: экспортировать userSettingPresentation строкой"
```

Expected: commit is created with only the implementation and focused test changes.

---

## Self-Review

- Spec coverage: Task 1 covers the chosen approach, preserves reference behavior, keeps multi-language fallback as regular `I8nText`, and includes focused test plus `round-trip-yaml-1c` verification.
- Placeholder scan: no placeholders or unspecified code steps.
- Type consistency: uses existing `I8nText["items"]`, `exportUserSettingPresentationToXML`, and existing test helpers.
