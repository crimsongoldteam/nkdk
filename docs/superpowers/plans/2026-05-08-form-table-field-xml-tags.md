# Form Table Field XML Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make table field XML fixtures use their real platform XML root tags while preserving table-only child nodes and round-trip coverage.

**Architecture:** Table field metadata keeps `itemType` values such as `TableInputField`, but XML fixtures for those table columns use the non-table root tag from each rule's `xmlTag`. Existing round-trip tests should resolve fixtures by `getElementXMLTagName()` for import and export, so fixtures can use `InputField`, `LabelField`, `PictureField`, and `CheckBoxField` roots without changing model `itemType`.

**Tech Stack:** TypeScript, Vitest, pnpm workspaces, fast-xml-parser XML import/export, Langium-generated test setup.

---

## File Structure

- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`
  - Responsibility: Full table input field XML fixture. Must keep all table-only child nodes from the previous `TableInputField` fixture while changing only the root tag to `InputField`.
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml`
  - Responsibility: Minimal table input field fixture. Root tag should be `InputField`.
- Modify: `packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml`
  - Responsibility: Full table label field fixture. Root tag should be `LabelField`.
- Modify: `packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml`
  - Responsibility: Minimal table label field fixture. Root tag should be `LabelField`.
- Modify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml`
  - Responsibility: Full table picture field fixture. Root tag should be `PictureField`.
- Modify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml`
  - Responsibility: Minimal table picture field fixture. Root tag should be `PictureField`.
- Modify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml`
  - Responsibility: Full table checkbox fixture. Root tag should be `CheckBoxField`; use ASCII `C`, not Cyrillic `С`.
- Modify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml`
  - Responsibility: Minimal table checkbox fixture. Root tag should be `CheckBoxField`.
- Verify: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
  - Responsibility: Import each element fixture by model `itemType`, using `getElementXMLTagName(model.itemType)` when the XML root is different from `itemType`.
- Verify: `packages/core/tests/element/exportElementToXML.ts`
  - Responsibility: Export elements using the same XML root key as the reference fixture, preferring `itemType` when present and otherwise using `xmlTag`.

## Implementation Tasks

### Task 1: Prepare Test Harness

**Files:**
- Verify: `packages/language/src/generated/ast.ts`
- Verify: `packages/language/src/generated/grammar.ts`
- Verify: `packages/language/src/generated/module.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Install workspace dependencies from the local pnpm store**

Run:

```bash
pnpm install --offline --frozen-lockfile
```

Expected: command exits `0`, prints `Lockfile is up to date`, and creates workspace `node_modules` links. Warnings from `patch-package` about unrecognized patch filenames are acceptable for this repository.

- [ ] **Step 2: Generate Langium files required by Vitest setup**

Run:

```bash
pnpm --filter nkdk-language run langium:generate
```

Expected: command exits `0` and prints:

```text
Langium generator finished successfully
```

- [ ] **Step 3: Run the focused round-trip tests before fixture fixes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t 'Table(InputField|LabelField|PictureField|CheckBoxField)'
```

Expected before implementation: FAIL in one or more of the selected table-field cases. The important failures are XML/model mismatches for table input field child nodes or missing parsed XML when the root key is `InputField`, `LabelField`, `PictureField`, or `CheckBoxField`.

### Task 2: Restore Full Table Input Field Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Rebuild the full table input fixture from the last committed table fixture**

Run:

```bash
tmp_file="$(mktemp)"
git show HEAD:packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml > "$tmp_file"
perl -0pi -e 's/^<TableInputField\b/<InputField/; s|</TableInputField>\z|</InputField>|' "$tmp_file"
cp "$tmp_file" packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
rm "$tmp_file"
perl -0pi -e 's/\n\z//' packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
```

Expected: the file keeps the full table fixture contents and changes only the root XML element name.

- [ ] **Step 2: Confirm table-only input nodes are present**

Run:

```bash
rg -n '<AssociatedTableElementId|<AutoCellHeight|<ChoiceParameterLinks|<FixingInTable|<HeaderHorizontalAlign|<MultipleValueDataPath|<MultipleValuePictureDataPath|<MultipleValuePresentDataPath|<TypeRestriction' packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
```

Expected: output includes these lines:

```text
<AssociatedTableElementId xsi:type="xs:string">Таблица</AssociatedTableElementId>
<AutoCellHeight>false</AutoCellHeight>
<ChoiceParameterLinks>
<FixingInTable>None</FixingInTable>
<HeaderHorizontalAlign>Left</HeaderHorizontalAlign>
<MultipleValueDataPath>Реквизит.РеквизитТаблицы</MultipleValueDataPath>
<MultipleValuePictureDataPath>Реквизит.РеквизитТаблицы</MultipleValuePictureDataPath>
<MultipleValuePresentDataPath>Реквизит.РеквизитТаблицы</MultipleValuePresentDataPath>
<TypeRestriction>
```

- [ ] **Step 3: Confirm root tag changed and model data did not drift**

Run:

```bash
sed -n '1p;$p' packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
rg -n '<DataPath>Реквизит</DataPath>|<MinValue>1</MinValue>|<MaxValue>99</MaxValue>|<ContextMenu name="ПолеВводаКонтекстноеМеню" id="2">' packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
```

Expected:

```text
<InputField name="ПолеВвода" id="1" DisplayImportance="High">
</InputField>
<DataPath>Реквизит</DataPath>
<MinValue>1</MinValue>
<MaxValue>99</MaxValue>
<ContextMenu name="ПолеВводаКонтекстноеМеню" id="2">
```

- [ ] **Step 4: Run the focused input field round-trip tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t 'TableInputField'
```

Expected: `4 passed`, covering full and minimal `TableInputField` import/export.

- [ ] **Step 5: Commit the input fixture repair**

Run:

```bash
git add packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml
git commit -m "test: restore table input field fixture nodes"
```

Expected: commit succeeds with only `inputField/__fixtures__/fullTable.xml` staged.

### Task 3: Rename Table Fixture XML Roots

**Files:**
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml`
- Modify: `packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml`
- Modify: `packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml`
- Modify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml`
- Modify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml`
- Modify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Rename table XML roots to rule `xmlTag` values**

Run:

```bash
perl -0pi -e 's/<TableInputField\b/<InputField/g; s|</TableInputField>|</InputField>|g' \
  packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml
perl -0pi -e 's/<TableLabelField\b/<LabelField/g; s|</TableLabelField>|</LabelField>|g' \
  packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml
perl -0pi -e 's/<TablePictureField\b/<PictureField/g; s|</TablePictureField>|</PictureField>|g' \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml
perl -0pi -e 's/<TableCheckBoxField\b/<CheckBoxField/g; s/<СheckBoxField\b/<CheckBoxField/g; s|</TableCheckBoxField>|</CheckBoxField>|g' \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml
```

Expected: roots use `InputField`, `LabelField`, `PictureField`, and `CheckBoxField`.

- [ ] **Step 2: Confirm no table-prefixed XML roots remain in table fixtures for these field types**

Run:

```bash
rg -n '</?Table(InputField|LabelField|PictureField|CheckBoxField)\b|<СheckBoxField\b' \
  packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml
```

Expected: command exits `1` with no matches.

- [ ] **Step 3: Confirm checkbox root uses ASCII C**

Run:

```bash
sed -n '1p;$p' packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml
sed -n '1p;$p' packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml
```

Expected:

```text
<CheckBoxField name="Флажок" id="1" DisplayImportance="High">
</CheckBoxField>
<CheckBoxField name="Флажок" id="1">
</CheckBoxField>
```

- [ ] **Step 4: Run focused table-field round-trip tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t 'Table(InputField|LabelField|PictureField|CheckBoxField)'
```

Expected: `16 passed`, covering full and minimal import/export for the four table field types.

- [ ] **Step 5: Commit the root rename fixtures**

Run:

```bash
git add \
  packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml
git commit -m "test: use xml tags for table field fixtures"
```

Expected: commit succeeds with only the listed fixture files staged.

### Task 4: Verify Test Fallbacks For `xmlTag`

**Files:**
- Verify: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Verify: `packages/core/tests/element/exportElementToXML.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Confirm import tests resolve XML by `itemType` or `xmlTag`**

Run:

```bash
sed -n '1,45p' packages/core/metadata/forms/elements/__tests__/fromXML.test.ts
```

Expected: the file contains this code:

```ts
import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"

const xmlTag = getElementXMLTagName(model.itemType)
const result = importElementFromXML({
  context: mockContextFromXML(),
  itemType: model.itemType,
  xml: xmlData[model.itemType] ?? xmlData[xmlTag],
})
```

- [ ] **Step 2: Patch import tests if the fallback is absent**

Apply this patch only when Step 1 does not show the fallback:

```diff
diff --git a/packages/core/metadata/forms/elements/__tests__/fromXML.test.ts b/packages/core/metadata/forms/elements/__tests__/fromXML.test.ts
--- a/packages/core/metadata/forms/elements/__tests__/fromXML.test.ts
+++ b/packages/core/metadata/forms/elements/__tests__/fromXML.test.ts
@@
 import type { CollectableElement, ElementXML } from "~/metadata/orchestration"
 import { importElementFromXML } from "~/metadata/orchestration"
+import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"
@@
+      const xmlTag = getElementXMLTagName(model.itemType)
       const result = importElementFromXML({
         context: mockContextFromXML(),
         itemType: model.itemType,
-        xml: xmlData[model.itemType],
+        xml: xmlData[model.itemType] ?? xmlData[xmlTag],
       })
```

Expected: `fromXML.test.ts` imports `getElementXMLTagName` and uses `xmlData[model.itemType] ?? xmlData[xmlTag]`.

- [ ] **Step 3: Confirm export helper preserves the fixture root key**

Run:

```bash
sed -n '1,60p' packages/core/tests/element/exportElementToXML.ts
```

Expected: the file contains this code:

```ts
import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"

const xmlTagName = getElementXMLTagName(element.itemType)
const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, baseDir)
const metadataType = referenceXMLData[element.itemType] !== undefined ? element.itemType : xmlTagName
const referenceXML = referenceXMLData[metadataType]

const result = xmlExport({ [metadataType]: xmlData }, false)
```

- [ ] **Step 4: Patch export helper if the fallback is absent**

Apply this patch only when Step 3 does not show the fallback:

```diff
diff --git a/packages/core/tests/element/exportElementToXML.ts b/packages/core/tests/element/exportElementToXML.ts
--- a/packages/core/tests/element/exportElementToXML.ts
+++ b/packages/core/tests/element/exportElementToXML.ts
@@
 import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
 import { CollectableElement, ElementXML, exportElementToXML, importElementFromXML } from "~/metadata/orchestration"
+import { getElementXMLTagName } from "~/metadata/orchestration/formElement/ruleFactory"
@@
-  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, baseDir)
-  const referenceXML = referenceXMLData[element.itemType]
+  const xmlTagName = getElementXMLTagName(element.itemType)
+  const referenceXMLData = readAndParseXMLFile<{ [key: string]: ElementXML }>(path, baseDir)
+  const metadataType = referenceXMLData[element.itemType] !== undefined ? element.itemType : xmlTagName
+  const referenceXML = referenceXMLData[metadataType]
@@
-  const result = xmlExport({ [element.itemType]: xmlData }, false)
+  const result = xmlExport({ [metadataType]: xmlData }, false)
```

Expected: `exportElementToXML.ts` imports `getElementXMLTagName`, selects `metadataType`, imports the reference XML by that key, and exports under the same key.

- [ ] **Step 5: Run all element XML round-trip tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts
```

Expected:

```text
Test Files  2 passed (2)
Tests  166 passed (166)
```

- [ ] **Step 6: Commit test fallback changes only if Tasks 4 Step 2 or Step 4 changed files**

Run:

```bash
git add packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/tests/element/exportElementToXML.ts
git commit -m "test: support xml tags for table field round trips"
```

Expected when no fallback patch was needed: do not run this commit command because there are no test helper changes to commit.

### Task 5: Final Verification

**Files:**
- Verify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml`
- Verify: `packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml`
- Verify: `packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml`
- Verify: `packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml`
- Verify: `packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml`
- Verify: `packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml`
- Verify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml`
- Verify: `packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml`

- [ ] **Step 1: Check the final diff is limited to root tag changes plus restored input fixture content**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/forms/elements/checkBoxField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/checkBoxField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/inputField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/inputField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/minimalTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/fullTable.xml \
  packages/core/metadata/forms/elements/pictureField/__fixtures__/minimalTable.xml
```

Expected after Tasks 2 and 3 are committed: no diff. Expected before committing: eight fixture files changed; each diff changes only the opening and closing root tags.

- [ ] **Step 2: Run whitespace validation**

Run:

```bash
git diff --check
```

Expected: no output and exit code `0`.

- [ ] **Step 3: Run the full element XML test pair one last time**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts
```

Expected:

```text
Test Files  2 passed (2)
Tests  166 passed (166)
```

- [ ] **Step 4: Report final status**

Run:

```bash
git status --short
```

Expected after commits: no modified fixture or test helper files remain. If `packages/language/src/generated/*` appears after Langium generation, leave those files unstaged unless this branch intentionally tracks generated language output.

## Self-Review

- Spec coverage: The plan restores the missing `inputField/fullTable.xml` nodes, fixes `CheckBoxField` root spelling, changes table field fixture root tags for input, label, picture, and checkbox fields, and verifies import/export tests account for `xmlTag`.
- Placeholder scan: The plan contains exact file paths, exact shell commands, concrete expected outputs, and concrete patch hunks for test fallback changes.
- Type consistency: The plan consistently uses model item types `TableInputField`, `TableLabelField`, `TablePictureField`, and `TableCheckBoxField`; XML roots `InputField`, `LabelField`, `PictureField`, and `CheckBoxField`; and the existing helper `getElementXMLTagName()`.
