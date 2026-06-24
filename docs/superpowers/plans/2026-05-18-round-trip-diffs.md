# Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the current ERP round-trip blockers/diffs while explicitly skipping one invalid source XML case.

**Architecture:** Keep XML round-trip as the first boundary. Add narrow preservation branches for XML-only values (`xsi:nil`, `0:<uuid>` color refs), improve reference matching where the exporter currently chooses the wrong reference item, and teach the round-trip runner to keep known invalid diffs out of the actionable queue.

**Tech Stack:** TypeScript, Vitest, Bash, `round-trip-xml`, metadata common objects, form `CommandInterface`.

---

## File Structure

- Create `.agents/skills/round-trip-xml/known-invalid-diffs.tsv`: auditable list of invalid source XML diffs to skip.
- Modify `.agents/skills/round-trip-xml/round-trip.sh`: classify diffs into actionable vs known-invalid before `--diff-index`/`--triage` selection.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`: add nil XML type and allow `undefined` in XML array imports/exports.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`: accept `_xsi:type` absence in the type-dispatch helper.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`: import `xsi:nil` as `undefined` and preserve array positions.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`: export array `undefined` as `xsi:nil` only with a corresponding reference slot.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: allow `undefined` slots inside `DcsMetadataTypedValue` model arrays.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`: cover single and array nil import.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`: cover reference-backed nil export.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/__fixtures__/data.ts`: add an `InList` comparison with a nil right value.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/__fixtures__/inListWithNil.xml`: XML fixture for the DCS blocker.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`: cover the nil `InList` fixture.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts`: cover export of the nil `InList` fixture.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`: first match reference items by full identity, then fall back to the current coarse match.
- Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandAttributeReferenceOrder.xml`: reference-order fixture for duplicate command/group with different `Type`/`Attribute`.
- Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandAttributeReferenceOrder.ts`: model fixture for the same case.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`: import the new fixture.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`: export the new fixture with reference order.
- Modify `packages/core/metadata/commonObjects/color/types.ts`: add `RawColorRef`, type guard, and narrow raw-ref detector.
- Modify `packages/core/metadata/commonObjects/color/fromXML.ts`: import `0` and `0:<uuid>` as raw refs before prefix parsing.
- Modify `packages/core/metadata/commonObjects/color/toXML.ts`: export raw refs unchanged.
- Modify `packages/core/metadata/commonObjects/color/toYAML.ts`: reject raw color refs as XML-only.
- Modify `packages/core/metadata/commonObjects/color/toEnterprise.ts`: reject raw color refs as XML-only.
- Modify `packages/core/metadata/commonObjects/color/fromXML.test.ts`: cover raw color import.
- Modify `packages/core/metadata/commonObjects/color/toXML.test.ts`: cover raw color export.
- Modify `packages/core/metadata/commonObjects/color/toYAML.test.ts`: cover conservative YAML rejection.
- Modify `packages/core/metadata/commonObjects/color/toEnterprise.test.ts`: cover conservative Enterprise rejection.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`: add a DCS color raw-ref fixture.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/color-raw-ref.xml`: DCS `v8ui:Color` fixture with `0:<uuid>`.

Do not change XML fixtures in `/Users/nikita/git/round-trip-source`; they are source data for verification, not project fixtures.

---

### Task 1: Add Known-Invalid Diff Skip To Round-Trip Runner

**Files:**
- Create: `.agents/skills/round-trip-xml/known-invalid-diffs.tsv`
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Add the known-invalid list**

Create `.agents/skills/round-trip-xml/known-invalid-diffs.tsv` with this exact record:

```text
erp	Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml	invalid duplicate FormAttribute AdditionalColumns name="Реквизит1"
```

- [ ] **Step 2: Add loader and matcher functions**

In `.agents/skills/round-trip-xml/round-trip.sh`, after `collect_run_dirs`, add:

```bash
KNOWN_INVALID_DIFF_FILE="${SCRIPT_DIR}/known-invalid-diffs.tsv"
KNOWN_INVALID_KEYS=()
KNOWN_INVALID_REASONS=()

config_rel_path() {
  local dir="$1"
  local repo="${NKDK_XML_REPO%/}"

  if [ "${dir}" = "${repo}" ]; then
    printf '.'
    return 0
  fi

  printf '%s' "${dir#${repo}/}"
}

load_known_invalid_diffs() {
  local config_rel
  local diff_path
  local reason

  if [ ! -f "${KNOWN_INVALID_DIFF_FILE}" ]; then
    return 0
  fi

  while IFS=$'\t' read -r config_rel diff_path reason; do
    if [ -z "${config_rel:-}" ] || [[ "${config_rel}" == \#* ]]; then
      continue
    fi
    KNOWN_INVALID_KEYS+=("${config_rel}"$'\t'"${diff_path}")
    KNOWN_INVALID_REASONS+=("${reason}")
  done < "${KNOWN_INVALID_DIFF_FILE}"
}

known_invalid_reason() {
  local active_dir="$1"
  local diff_path="$2"
  local key
  local i

  key="$(config_rel_path "${active_dir}")"$'\t'"${diff_path}"
  for ((i = 0; i < ${#KNOWN_INVALID_KEYS[@]}; i++)); do
    if [ "${KNOWN_INVALID_KEYS[$i]}" = "${key}" ]; then
      printf '%s' "${KNOWN_INVALID_REASONS[$i]}"
      return 0
    fi
  done

  return 1
}
```

- [ ] **Step 3: Load the list after environment validation**

After `NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"`, add:

```bash
load_known_invalid_diffs
```

- [ ] **Step 4: Classify collected diffs**

Move the existing `xml_file_abs` function above diff classification, then replace:

```bash
DIFF_COUNT="${#DIFF_FILES[@]}"
```

with:

```bash
ACTIONABLE_DIFF_FILES=()
ACTIONABLE_DIFF_FILE_DIRS=()
SKIPPED_INVALID_DIFF_FILES=()
SKIPPED_INVALID_DIFF_FILE_DIRS=()
SKIPPED_INVALID_DIFF_REASONS=()

for ((i = 0; i < ${#DIFF_FILES[@]}; i++)); do
  diff_file="${DIFF_FILES[$i]}"
  diff_dir="${DIFF_FILE_DIRS[$i]}"
  if reason="$(known_invalid_reason "${diff_dir}" "${diff_file}")"; then
    SKIPPED_INVALID_DIFF_FILES+=("${diff_file}")
    SKIPPED_INVALID_DIFF_FILE_DIRS+=("${diff_dir}")
    SKIPPED_INVALID_DIFF_REASONS+=("${reason}")
  else
    ACTIONABLE_DIFF_FILES+=("${diff_file}")
    ACTIONABLE_DIFF_FILE_DIRS+=("${diff_dir}")
  fi
done

DIFF_FILES=("${ACTIONABLE_DIFF_FILES[@]}")
DIFF_FILE_DIRS=("${ACTIONABLE_DIFF_FILE_DIRS[@]}")
DIFF_COUNT="${#DIFF_FILES[@]}"
SKIPPED_INVALID_DIFF_COUNT="${#SKIPPED_INVALID_DIFF_FILES[@]}"
```

- [ ] **Step 5: Add skipped output**

Before `emit_single_diff`, add:

```bash
emit_skipped_invalid_diffs() {
  local i

  for ((i = 0; i < SKIPPED_INVALID_DIFF_COUNT; i++)); do
    echo ""
    echo "=== SKIPPED_INVALID_DIFF ==="
    echo "ACTIVE_XML_DIR: ${SKIPPED_INVALID_DIFF_FILE_DIRS[$i]}"
    echo "FILE: ${SKIPPED_INVALID_DIFF_FILES[$i]}"
    echo "XML_FILE_ABS: $(xml_file_abs "${SKIPPED_INVALID_DIFF_FILES[$i]}" "${SKIPPED_INVALID_DIFF_FILE_DIRS[$i]}")"
    echo "REASON: ${SKIPPED_INVALID_DIFF_REASONS[$i]}"
  done
}
```

Call it before the no-diff branch:

```bash
emit_skipped_invalid_diffs
```

Replace the no-diff branch with:

```bash
if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  if [ "${SKIPPED_INVALID_DIFF_COUNT}" -gt 0 ]; then
    echo "=== Round-trip actionable diff'ов нет ==="
    echo "Пропущено известных невалидных diff'ов: ${SKIPPED_INVALID_DIFF_COUNT}"
  else
    echo "=== Round-trip чистый: диффов нет ==="
  fi
  echo "Проверено каталогов: ${#RUN_DIRS[@]}"
  exit 0
fi
```

- [ ] **Step 6: Verify shell syntax**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: no output and exit code `0`.

- [ ] **Step 7: Verify the skip list record exists**

Run:

```bash
rg "СпособыОтраженияРасходовПоАмортизацииМСФО" .agents/skills/round-trip-xml/known-invalid-diffs.tsv
```

Expected: one matching TSV line with the `erp` configuration column and the duplicate-column reason.

- [ ] **Step 8: Commit**

```bash
git add .agents/skills/round-trip-xml/round-trip.sh .agents/skills/round-trip-xml/known-invalid-diffs.tsv
git commit -m "fix: :bug: пропустить невалидный round-trip diff"
```

---

### Task 2: Preserve DCS Typed Value `xsi:nil`

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/__fixtures__/inListWithNil.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts`

- [ ] **Step 1: Write failing typed-value import tests**

In `dscMetadataTypedValue/fromXML.test.ts`, add:

```ts
  it("imports xsi:nil as missing value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString: '<value xsi:nil="true"/>',
    })

    expect(result).toBeUndefined()
  })

  it("preserves xsi:nil position inside value array", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xsi:type="dcscor:DesignTimeValue">Документ.А.ПустаяСсылка</value>\n' +
        '<value xsi:nil="true"/>\n' +
        '<value xsi:type="dcscor:DesignTimeValue">Документ.Б.ПустаяСсылка</value>',
    })

    expect(result).toEqual([
      { type: "DesignTimeValue", value: "Документ.А.ПустаяСсылка" },
      undefined,
      { type: "DesignTimeValue", value: "Документ.Б.ПустаяСсылка" },
    ])
  })
```

- [ ] **Step 2: Write failing typed-value export tests**

In `dscMetadataTypedValue/toXML.test.ts`, add:

```ts
  it("exports missing array item as xsi:nil only when reference slot is missing too", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      referenceMetadata: [{ type: "string", value: "x" }, undefined, { type: "string", value: "y" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xsi:type="xs:string">x</value>\n' +
        '<value xsi:nil="true"/>\n' +
        '<value xsi:type="xs:string">y</value>'
    )
  })

  it("does not invent xsi:nil without a reference array slot", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [{ type: "string", value: "x" }, undefined],
      referenceMetadata: [{ type: "string", value: "x" }],
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xs:string">x</value>')
  })
```

- [ ] **Step 3: Add the FilterItem fixture**

Create `filterItem/__fixtures__/inListWithNil.xml`:

```xml
<dcsset:item xsi:type="dcsset:FilterItemComparison">
	<dcsset:left xsi:type="dcscor:Field">Объект.Корректировки.Документ</dcsset:left>
	<dcsset:comparisonType>InList</dcsset:comparisonType>
	<dcsset:right xsi:type="dcscor:DesignTimeValue">Документ.ВыбытиеИнвестиций.ПустаяСсылка</dcsset:right>
	<dcsset:right xsi:type="dcscor:DesignTimeValue">Документ.ПоступлениеИнвестиций.ПустаяСсылка</dcsset:right>
	<dcsset:right xsi:nil="true"/>
</dcsset:item>
```

In `filterItem/__fixtures__/data.ts`, add:

```ts
export const inListWithNilFilterItemComparison = {
  itemType: "FilterItemComparison",
  leftValue: { type: "Field", value: "Объект.Корректировки.Документ" },
  comparisonType: "InList",
  rightValue: [
    { type: "DesignTimeValue", value: "Документ.ВыбытиеИнвестиций.ПустаяСсылка" },
    { type: "DesignTimeValue", value: "Документ.ПоступлениеИнвестиций.ПустаяСсылка" },
    undefined,
  ],
} as const satisfies FilterItemComparison
```

- [ ] **Step 4: Add FilterItem import/export tests**

In `filterItem/fromXML.test.ts`, import `inListWithNilFilterItemComparison` and add:

```ts
  it("imports FilterItemComparison InList with nil right value from XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "inListWithNil.xml",
      xmlRootTag: "dcsset:item",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual([inListWithNilFilterItemComparison])
  })
```

In `filterItem/toXML.test.ts`, import the same fixture and add:

```ts
  it("exports FilterItemComparison InList with nil right value to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: [inListWithNilFilterItemComparison],
      referenceMetadata: [inListWithNilFilterItemComparison],
      xmlRootTag: "dcsset:item",
      path: "inListWithNil.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 5: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue metadata/commonObjects/dataCompositionSystem/filterItem
```

Expected: FAIL on `xsi:nil` import/export because nil values are not supported yet.

- [ ] **Step 6: Update typed-value XML types**

In `dscMetadataTypedValue/types.ts`, add:

```ts
export type DcsMetadataTypedValueNilXML = {
  "_xsi:nil": true | "true"
}
```

Update aliases:

```ts
export type DcsMetadataTypedValueReference = DcsMetadataTypedValue | DcsMetadataTypedValueUndefinedTypeXML
export type DcsMetadataTypedValueReferenceOrNil = DcsMetadataTypedValueReference | undefined
```

Include `DcsMetadataTypedValueNilXML` in `DcsMetadataTypedValueXML`.

Change `DcsMetadataTypedValueTypeFromXML` in `rules.ts` from:

```ts
valueType: DcsMetadataTypedValueXML["_xsi:type"]
```

to:

```ts
valueType: string | undefined
```

This keeps TypeScript valid after `DcsMetadataTypedValueXML` gains a nil variant without `_xsi:type`.

- [ ] **Step 7: Update the property registry type**

Before editing `packages/core/metadata/orchestration/**`, read `.agents/architecture-orchestration.md`.

In `packages/core/metadata/orchestration/property/registry.ts`, update the `DcsMetadataTypedValue` registry item from:

```ts
  DcsMetadataTypedValue: {
    item: DcsMetadataTypedValue | DcsMetadataTypedValue[]
    yaml: DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[]
  }
```

to:

```ts
  DcsMetadataTypedValue: {
    item: DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[]
    yaml: DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[]
  }
```

- [ ] **Step 8: Import nil and preserve array slots**

In `dscMetadataTypedValue/fromXML.ts`, import `DcsMetadataTypedValueNilXML` and add:

```ts
const isNilXML = (xml: DcsMetadataTypedValueXML): xml is DcsMetadataTypedValueNilXML =>
  (xml as Record<string, unknown>)["_xsi:nil"] === true ||
  (xml as Record<string, unknown>)["_xsi:nil"] === "true"
```

At the top of `importSingle`, before `isUndefinedTypeXML`, add:

```ts
  if (isNilXML(xml)) return undefined
```

Replace the array branch with:

```ts
  if (Array.isArray(xml)) {
    const items = xml.map((item) => importSingle(context, rule, item))
    return items.length > 0 ? items : undefined
  }
```

Update return types to allow `(DcsMetadataTypedValueReference | undefined)[]`.

- [ ] **Step 9: Export nil only from reference-backed array positions**

In `dscMetadataTypedValue/toXML.ts`, add:

```ts
type ExportableDcsMetadataTypedValueOrNil = ExportableDcsMetadataTypedValue | undefined

const nilXML = (): DcsMetadataTypedValueXML => ({ "_xsi:nil": "true" } as DcsMetadataTypedValueXML)

const shouldRestoreNilArrayItem = (referenceItems: unknown[], index: number): boolean =>
  index in referenceItems && referenceItems[index] === undefined
```

Replace the array branch with:

```ts
  if (Array.isArray(value)) {
    const referenceItems = Array.isArray(referenceMetadata) ? referenceMetadata : []
    const items = value.flatMap((item, index) => {
      if (item === undefined) {
        return shouldRestoreNilArrayItem(referenceItems, index) ? [nilXML()] : []
      }
      return [exportSingle(context, rule, item)]
    })
    return items.length > 0 ? items : undefined
  }
```

Update wrapper casts so `value` may be `ExportableDcsMetadataTypedValueOrNil[]`.

- [ ] **Step 10: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue metadata/commonObjects/dataCompositionSystem/filterItem
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue packages/core/metadata/commonObjects/dataCompositionSystem/filterItem packages/core/metadata/orchestration/property/registry.ts
git commit -m "fix: :bug: сохранить xsi:nil в DCS typed value"
```

---

### Task 3: Match CommandInterface Reference Items By Full Identity First

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandAttributeReferenceOrder.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandAttributeReferenceOrder.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Add fixture XML**

Create `duplicateCommandAttributeReferenceOrder.xml`:

```xml
<CommandInterface>
	<NavigationPanel>
		<Item>
			<Command>Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue</Command>
			<Type>Auto</Type>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
		</Item>
		<Item>
			<Command>Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue</Command>
			<Type>Added</Type>
			<Attribute>Объект.Ref</Attribute>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
		</Item>
	</NavigationPanel>
</CommandInterface>
```

- [ ] **Step 2: Add fixture model**

Create `duplicateCommandAttributeReferenceOrder.ts`:

```ts
import type { CommandInterface } from "../types"

export const duplicateCommandAttributeReferenceOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      itemType: "CommandInterfaceItem",
      command: "Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Catalog.ОтветственныеЛицаОрганизаций.StandardCommand.OpenByValue",
      type: "Added",
      attribute: "Объект.Ref",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
    },
  ],
  CommandBar: [],
} as const satisfies CommandInterface
```

- [ ] **Step 3: Add import/export tests**

In `fromXML.test.ts`, import the fixture and add:

```ts
  it("import duplicateCommandAttributeReferenceOrder", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "duplicateCommandAttributeReferenceOrder.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(duplicateCommandAttributeReferenceOrder)
  })
```

In `toXML.test.ts`, import the fixture and add:

```ts
  it("export duplicateCommandAttributeReferenceOrder with reference order", () => {
    const expectedResult = readXMLFileAsString("duplicateCommandAttributeReferenceOrder.xml", fixturesDir).trimEnd()
    const referenceXML = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "duplicateCommandAttributeReferenceOrder.xml",
      fixturesDir
    )
    const referenceData = importCommandInterfaceFromXML(
      mockContextFromXML({ forReference: true }),
      mockRule,
      referenceXML.CommandInterface
    )
    const xmlData = exportCommandInterfaceToXML(
      mockContext,
      mockRule,
      duplicateCommandAttributeReferenceOrder,
      referenceData
    )

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 4: Run focused tests and verify export fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/commandInterface -t "duplicateCommandAttributeReferenceOrder"
```

Expected: import PASS, export FAIL because `Attribute` is emitted after `DefaultVisible`.

- [ ] **Step 5: Implement full identity matching**

In `toXML.ts`, replace `findReferenceCommandInterfaceItem` with:

```ts
const commandInterfaceItemIdentityKeys = ["command", "type", "attribute", "index", "commandGroup"] as const

const commandInterfaceItemValueEquals = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const commandInterfaceItemFullIdentityMatches = (
  item: CommandInterfaceItem,
  referenceItem: CommandInterfaceItem
): boolean =>
  commandInterfaceItemIdentityKeys.every((key) =>
    commandInterfaceItemValueEquals(item[key], referenceItem[key])
  )

const commandInterfaceItemCoarseIdentityMatches = (
  item: CommandInterfaceItem,
  referenceItem: CommandInterfaceItem
): boolean =>
  referenceItem.command === item.command &&
  referenceItem.commandGroup === item.commandGroup &&
  referenceItem.index === item.index

const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  return (
    referenceItems.find((referenceItem) => commandInterfaceItemFullIdentityMatches(item, referenceItem)) ??
    referenceItems.find((referenceItem) => commandInterfaceItemCoarseIdentityMatches(item, referenceItem))
  )
}
```

- [ ] **Step 6: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/commonObjects/commandInterface
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface
git commit -m "fix: :bug: уточнить reference match CommandInterface"
```

---

### Task 4: Preserve Raw `0:<uuid>` Color References

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/types.ts`
- Modify: `packages/core/metadata/commonObjects/color/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/color/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/color/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/color/toEnterprise.ts`
- Modify: `packages/core/metadata/commonObjects/color/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/color/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/color/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/color/toEnterprise.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/color-raw-ref.xml`

- [ ] **Step 1: Add raw color XML tests**

In `color/fromXML.test.ts`, add:

```ts
  it("imports raw 0 uuid ref from XML", () => {
    const result = importColorFromXML(
      mockContextFromXML(),
      mockRule,
      "0:615512b6-4378-4fce-86f1-a56725f945da"
    )

    expect(result).toEqual({ rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" })
  })
```

In `color/toXML.test.ts`, add:

```ts
  it("exports raw 0 uuid ref to XML", () => {
    const result = { Color: exportColorToXML(mockContext, mockRule, { rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" }) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual("<Color>0:615512b6-4378-4fce-86f1-a56725f945da</Color>")
  })
```

- [ ] **Step 2: Add conservative non-XML tests**

In `color/toYAML.test.ts`, add:

```ts
  it("rejects raw color ref in YAML export", () => {
    expect(() =>
      exportColorToYAML(mockContext, mockRule, { rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" })
    ).toThrow("Color YAML: rawRef is XML-only")
  })
```

In `color/toEnterprise.test.ts`, add:

```ts
  it("rejects raw color ref in Enterprise export", () => {
    expect(() =>
      exportColorToEnterprise({ value: { rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da" } })
    ).toThrow("Color Enterprise: rawRef is XML-only")
  })
```

- [ ] **Step 3: Add DCS metadata value fixture**

Create `dcsMetadataValue/__fixtures__/color-raw-ref.xml`:

```xml
<dcscor:value xsi:type="v8ui:Color">0:615512b6-4378-4fce-86f1-a56725f945da</dcscor:value>
```

In `dcsMetadataValue/__fixtures__/data.ts`, add:

```ts
export const fixtureColorRawRef: Color = {
  rawRef: "0:615512b6-4378-4fce-86f1-a56725f945da",
}
```

Add this fixture to `dcsMetadataValueFixtures`:

```ts
  {
    id: "colorRawRef",
    title: "Color raw ref",
    rule: { type: "MetadataDcsMetadataValue", valueType: "Color", yaml: "value" },
    value: fixtureColorRawRef,
    yaml: undefined,
    xml: "color-raw-ref.xml",
  },
```

Ensure `dcsMetadataValueFromXMLFixtures` and `dcsMetadataValueXMLFixtures` include this fixture through the existing fixture arrays. If the fixture is not automatically included because `yaml` is `undefined`, add it explicitly only to the XML import/export arrays, not to YAML arrays.

- [ ] **Step 4: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/color metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected: FAIL because `0:` is currently parsed as an unknown prefix and exported without `0:`.

- [ ] **Step 5: Add raw color type and guards**

In `color/types.ts`, replace the `Color` interface with:

```ts
export interface TypedColor {
  type: ColorType
  value: string
}

export type RawColorRef = {
  rawRef: string
}

export type Color = TypedColor | RawColorRef

export function isRawColorRef(color: Color): color is RawColorRef {
  return "rawRef" in color
}

const rawColorRefPattern = /^0(?::[0-9a-fA-F-]+)?$/

export function isRawColorRefValue(value: string): boolean {
  return rawColorRefPattern.test(value)
}
```

- [ ] **Step 6: Import raw color before prefix parsing**

In `color/fromXML.ts`, import `isRawColorRefValue` and add this before `const match = ...`:

```ts
  if (isRawColorRefValue(xml)) {
    return { rawRef: xml }
  }
```

- [ ] **Step 7: Export raw color unchanged**

In `color/toXML.ts`, import `isRawColorRef` and add this after the undefined guard:

```ts
  if (isRawColorRef(color)) return color.rawRef
```

- [ ] **Step 8: Reject raw color outside XML**

In `color/toYAML.ts`, import `isRawColorRef` and add this after the undefined guard:

```ts
  if (isRawColorRef(color)) {
    throw new Error("Color YAML: rawRef is XML-only")
  }
```

In `color/toEnterprise.ts`, import `isRawColorRef` and add this after the undefined guard:

```ts
  if (isRawColorRef(value)) {
    throw new Error("Color Enterprise: rawRef is XML-only")
  }
```

- [ ] **Step 9: Run focused tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/color metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/core/metadata/commonObjects/color packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
git commit -m "fix: :bug: сохранить raw-ссылку цвета"
```

---

### Task 5: Full Verification And Round-Trip Check

**Files:**
- Verify: full repository test suite.
- Verify: ERP round-trip triage.

- [ ] **Step 1: Generate Langium files**

Run from repository root:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`.

- [ ] **Step 2: Run full tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run ERP triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected:

- no import crash on `DataProcessors/СтруктураВладения/Forms/Форма/Ext/Form.xml`;
- the `CommandInterface` attribute-order diff is absent;
- the `v8ui:Color` `0:<uuid>` diff is absent;
- `Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml` appears under `SKIPPED_INVALID_DIFF`, not under `TRIAGE_DIFF`;
- any remaining `TRIAGE_DIFF` entries are new actionable discrepancies outside this plan.

- [ ] **Step 4: Inspect status**

Run:

```bash
git status --short
```

Expected: only intentional generated changes, if any. Do not commit generated churn unless it belongs to the verified change.

- [ ] **Step 5: Commit verification-only generated files if required**

If `pnpm --filter nkdk-language langium:generate` changed tracked generated files, inspect them and commit them with:

```bash
git add <generated-files>
git commit -m "chore: :wrench: обновить generated language files"
```

If there are no generated-file changes, skip this commit.
