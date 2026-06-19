# Round-Trip YAML Fast Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach `roundTripYAMLFast` to check form XML files through the same form-reading path used by `nkdk import`.

**Architecture:** Keep the existing top-level metadata fast cycle. Add form-specific fast entries that are discovered from the same `Forms/*.xml` metadata files used by `ChildFormNames` import, read with `readFormFromXML`, serialized through `ClientApplicationForm` YAML, and compared as `Forms/<name>.xml` plus `Forms/<name>/Ext/Form.xml`.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser`, existing metadata orchestration, `ClientApplicationForm` form converters.

---

### Task 1: Add Failing Fast Form Diff Test

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts`

- [ ] **Step 1: Add fixture helpers for an object with one form**

Add helpers near existing `makeXmlProject` helpers:

```ts
const catalogWithFormXml = (name: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Catalog uuid="11111111-1111-1111-1111-111111111111">
		<Properties>
			<Name>${name}</Name>
			<Synonym/>
			<Comment/>
			<UseStandardCommands>true</UseStandardCommands>
			<DefaultPresentation>AsDescription</DefaultPresentation>
			<EditType>InDialog</EditType>
			<QuickChoice>false</QuickChoice>
			<ChoiceMode>BothWays</ChoiceMode>
			<CodeLength>9</CodeLength>
			<DescriptionLength>25</DescriptionLength>
			<CodeType>String</CodeType>
			<CodeAllowedLength>Variable</CodeAllowedLength>
			<CheckUnique>true</CheckUnique>
			<Autonumbering>true</Autonumbering>
			<DefaultListForm>Catalog.${name}.Form.ФормаСписка</DefaultListForm>
			<Characteristics/>
		</Properties>
		<ChildObjects>
			<Form>ФормаСписка</Form>
		</ChildObjects>
		<InternalInfo/>
	</Catalog>
</MetaDataObject>`

const formMetadataXml = (name: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<Form uuid="22222222-2222-2222-2222-222222222222">
		<Properties>
			<Name>${name}</Name>
			<Synonym/>
			<Comment/>
			<FormType>Managed</FormType>
		</Properties>
	</Form>
</MetaDataObject>`

const formBodyWithEqualComparisonXml = (): string => `<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="1"/>
	<Attributes>
		<Attribute name="Список" id="2">
			<Type>
				<v8:Type xmlns:v8="http://v8.1c.ru/8.1/data/core">cfg:DynamicList</v8:Type>
			</Type>
			<ListSettings>
				<dcsset:filter>
					<dcsset:item xsi:type="dcsset:FilterItemComparison">
						<dcsset:left xsi:type="dcscor:Field">Список.Порядок</dcsset:left>
						<dcsset:comparisonType>Equal</dcsset:comparisonType>
						<dcsset:right xsi:type="dcsset:Order"/>
					</dcsset:item>
				</dcsset:filter>
			</ListSettings>
		</Attribute>
	</Attributes>
</Form>`

const makeCatalogFormXmlProject = (): string => {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-round-trip-yaml-fast-form-"))
  const catalogName = "СправочникФорма"
  const formName = "ФормаСписка"
  fs.mkdirSync(join(dir, "Catalogs", catalogName, "Forms", formName, "Ext"), { recursive: true })
  fs.writeFileSync(join(dir, "Catalogs", `${catalogName}.xml`), catalogWithFormXml(catalogName), "utf-8")
  fs.writeFileSync(join(dir, "Catalogs", catalogName, "Forms", `${formName}.xml`), formMetadataXml(formName), "utf-8")
  fs.writeFileSync(join(dir, "Catalogs", catalogName, "Forms", formName, "Ext", "Form.xml"), formBodyWithEqualComparisonXml(), "utf-8")
  return dir
}
```

- [ ] **Step 2: Add the failing test**

Add this test in `describe("roundTripYAMLFast", ...)`:

```ts
it("checks managed form body XML discovered through import form files", async () => {
  const xmlDir = makeCatalogFormXmlProject()
  try {
    const result = await roundTripYAMLFast({ inputDir: xmlDir })

    expect(result.errors).toEqual([])
    expect(result.diffs.some((diff) => diff.file === "Catalogs/СправочникФорма/Forms/ФормаСписка/Ext/Form.xml")).toBe(true)
    expect(result.diffs.map((diff) => diff.file)).not.toContain("Catalogs/СправочникФорма/Forms/ФормаСписка.xml")
  } finally {
    fs.rmSync(xmlDir, { recursive: true, force: true })
  }
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: the new test fails because no form diff is reported.

### Task 2: Add Form Fast Entries

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts`

- [ ] **Step 1: Import form helpers**

Add imports:

```ts
import { readFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
```

- [ ] **Step 2: Add a form diff helper**

Add below `roundTripOne`:

```ts
const roundTripFormOne = (params: {
  inputDir: string
  file: string
  metadataFile: string
  formXmlFile: string
  formsDir: string
  formName: string
  parentName: string
}): RoundTripYAMLFastDiff[] => {
  const form = readFormFromXML({
    context: makeContextFromXML(false),
    inputDir: params.formsDir,
    formName: params.formName,
  })
  const referenceForm = readFormFromXML({
    context: makeContextFromXML(true),
    inputDir: params.formsDir,
    formName: params.formName,
  })

  const { yaml: yamlObject } = exportClientApplicationFormToYAML(makeContextToYAML(), form)
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = importMetadataYAMLText<typeof ClientApplicationFormRules>(yamlText)
  const formFromYAML = importClientApplicationFormFromYAML(makeContextFromYAML(), yamlObjectFromText as never, referenceForm)
  const contextToXML = makeContextToXML(params.parentName)

  const generatedMetadataXml = xmlExport({
    MetaDataObject: exportFormMetadataToXML({
      context: contextToXML,
      form: formFromYAML,
      referenceForm,
      name: params.formName,
    }),
  })
  const generatedFormXml = xmlExport({
    Form: exportClientApplicationFormToXML({
      context: contextToXML,
      form: formFromYAML,
      referenceForm,
    }),
  })

  return [
    createDiffIfChanged({ file: params.metadataFile, xmlFileAbs: join(params.inputDir, params.metadataFile), generatedXml: generatedMetadataXml }),
    createDiffIfChanged({ file: params.formXmlFile, xmlFileAbs: join(params.inputDir, params.formXmlFile), generatedXml: generatedFormXml }),
  ].filter((diff): diff is RoundTripYAMLFastDiff => diff !== undefined)
}
```

- [ ] **Step 3: Extract compare helper**

Replace the compare tail of `roundTripOne` with:

```ts
return createDiffIfChanged({
  file: params.file,
  xmlFileAbs: params.xmlFileAbs,
  generatedXml,
})
```

Add helper:

```ts
const createDiffIfChanged = (params: {
  file: string
  xmlFileAbs: string
  generatedXml: string
}): RoundTripYAMLFastDiff | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const originalComparable = normalizeXMLForCompare(originalXml)
  const generatedComparable = normalizeXMLForCompare(params.generatedXml)
  if (originalComparable === generatedComparable) return undefined

  return {
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    diffText: createUnifiedDiff({
      file: params.file,
      original: originalComparable,
      generated: generatedComparable,
    }),
  }
}
```

- [ ] **Step 4: Add discovered form entries**

Introduce a second entry type:

```ts
type RoundTripEntry =
  | { kind: "metadata"; file: string; xmlFileAbs: string; rule: MetadataItemRule; parentName: string }
  | { kind: "form"; file: string; metadataFile: string; formXmlFile: string; formsDir: string; formName: string; parentName: string }
```

Update `listRoundTripEntries` to return `RoundTripEntry[]`. After each top-level object XML entry, scan only the import-owned form metadata files:

```ts
const objectDir = join(dir, basename(entry.name, ".xml"))
const formsDir = join(objectDir, "Forms")
if (fs.existsSync(formsDir)) {
  for (const formEntry of fs.readdirSync(formsDir, { withFileTypes: true })) {
    if (!formEntry.isFile() || !formEntry.name.toLowerCase().endsWith(".xml")) continue
    const formName = basename(formEntry.name, ".xml")
    const formXmlFileAbs = join(formsDir, formName, "Ext", "Form.xml")
    if (!fs.existsSync(formXmlFileAbs)) continue
    entries.push({
      kind: "form",
      file: toPosixPath(relative(inputDir, formXmlFileAbs)),
      metadataFile: toPosixPath(relative(inputDir, join(formsDir, formEntry.name))),
      formXmlFile: toPosixPath(relative(inputDir, formXmlFileAbs)),
      formsDir,
      formName,
      parentName: basename(entry.name, ".xml"),
    })
  }
}
```

- [ ] **Step 5: Dispatch form entries**

In `roundTripYAMLFast`, replace the loop body with kind dispatch:

```ts
const diffs =
  entry.kind === "metadata"
    ? [roundTripOne({ inputDir: params.inputDir, ...entry })].filter((diff): diff is RoundTripYAMLFastDiff => diff !== undefined)
    : roundTripFormOne({ inputDir: params.inputDir, ...entry })
result.diffs.push(...diffs)
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: all tests in `roundTripYAMLFast.test.ts` pass.

### Task 3: Update Skill Wording

**Files:**
- Modify: `.agents/skills/round-trip-yaml-fast/SKILL.md`

- [ ] **Step 1: Replace outdated limitation**

Change:

```md
Не используй для проверки внешних файлов, форм, модулей, шаблонов и полного sync-поведения.
```

to:

```md
Проверяет XML-файлы верхнего уровня и формы, найденные штатным import-путём. Не используй для проверки модулей, шаблонов, бинарных файлов, справки и полного sync-поведения.
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts
```

Expected: pass.

### Task 4: Final Verification

**Files:**
- Read: `git diff`

- [ ] **Step 1: Run focused core tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
```

Expected: pass.

- [ ] **Step 2: Inspect diff**

Run:

```bash
git diff -- packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.ts packages/core/metadata/appliedObjects/configuration/roundTripYAMLFast.test.ts .agents/skills/round-trip-yaml-fast/SKILL.md
```

Expected: only planned fast-cycle and skill-doc changes are present.
