# ERP Round Trip YAML Import Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make full `round-trip-yaml --all-configs` pass the current import blockers in `erp`, `small`, and `trade`.

**Architecture:** Keep XML-specific opaque form bodies outside the semantic form model: managed forms still parse `Ext/Form.xml`, ordinary forms import metadata YAML plus optional `Form.bin`. Extend existing focused value converters for raw `Color`, DCS typed-value nil array positions, and `MetadataValue` `StandardPeriod` without changing XML fixtures.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, `round-trip-yaml` diagnostic skill.

---

## File Structure

- Modify `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`: detect form body kind from `Forms/<name>.xml`, import metadata-only ordinary forms, and copy ordinary `Ext/Form.bin` to `Формы/<name>/Form.bin`.
- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`: export metadata XML for ordinary forms and copy optional `Form.bin` back without creating `Ext/Form.xml`.
- Modify `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`: add import tests for ordinary `Form.bin` and metadata-only ordinary forms.
- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`: add sync tests for ordinary `Form.bin`, metadata-only ordinary forms, and strict managed form body handling.
- Modify `packages/core/metadata/commonObjects/color/types.ts`: allow raw color refs in JSON schema/YAML type.
- Modify `packages/core/metadata/commonObjects/color/toYAML.ts`: export raw refs as strings.
- Modify `packages/core/metadata/commonObjects/color/fromYAML.ts`: import raw ref strings as `{ rawRef }`.
- Modify `packages/core/metadata/commonObjects/color/toYAML.test.ts`: replace the raw-ref rejection test with export coverage.
- Modify `packages/core/metadata/commonObjects/color/fromYAML.test.ts`: add raw-ref import coverage.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`: allow `{}` in DCS typed-value YAML arrays.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.ts`: export array `undefined` items as `{}`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`: import `{}` inside arrays as `undefined`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`: update nil array expectation.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`: add `{}` array import coverage.
- Create `packages/core/metadata/commonObjects/standardPeriod/types.ts`: shared model/XML/YAML types and schema for `StandardPeriod`.
- Create `packages/core/metadata/commonObjects/standardPeriod/fromXML.ts`: XML to model conversion.
- Create `packages/core/metadata/commonObjects/standardPeriod/toXML.ts`: model to XML conversion.
- Create `packages/core/metadata/commonObjects/standardPeriod/fromYAML.ts`: YAML to model conversion.
- Create `packages/core/metadata/commonObjects/standardPeriod/toYAML.ts`: model to YAML conversion.
- Create `packages/core/metadata/commonObjects/standardPeriod/index.ts`: side-effect import module.
- Create `packages/core/metadata/commonObjects/standardPeriod/sync.test.ts`: focused conversion tests.
- Modify `packages/core/metadata/commonObjects/index.ts`: register `standardPeriod`.
- Modify `packages/core/metadata/commonObjects/metadataValue/types.ts`: add `standardPeriod` to `MetadataValue`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`: dispatch `v8:StandardPeriod`.
- Modify `packages/core/metadata/commonObjects/metadataValue/toXML.ts`: export `standardPeriod`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`: detect StandardPeriod objects before form-choice objects.
- Modify `packages/core/metadata/commonObjects/metadataValue/toYAML.ts`: export `standardPeriod`.
- Modify `packages/core/metadata/commonObjects/metadataValue/__fixtures__/data.ts`: add StandardPeriod fixtures.

## Required Reading

- [ ] **Step 1: Read metadata source-of-truth rules**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
```

Expected: document says existing XML fixtures are the source of truth, and opaque external XML files from `Ext/*` must be copied through external sync instead of parsed into model properties.

- [ ] **Step 2: Read YAML contract**

Run:

```bash
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: document confirms Russian YAML keys, system enumeration YAML mappings, and existing YAML defaults rules.

- [ ] **Step 3: Read round-trip cycle rules**

Run:

```bash
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: document confirms XML barrier comes before YAML behavior and existing XML fixtures must not be modified.

- [ ] **Step 4: Regenerate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`. If pnpm reports no matching project in the current worktree, record that output and continue.

## Task 1: Ordinary Forms With Optional Body

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`

- [ ] **Step 1: Add import tests for ordinary forms**

Add these tests inside `describe("import from XML string", () => { ... })` in `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`:

```ts
  it("imports ordinary form metadata and copies Form.bin without Form.xml", async () => {
    const ordinaryFormName = "ОбычнаяФорма"
    const input = join(outputDir, "ordinary-input")
    const formExtDir = join(input, ordinaryFormName, "Ext")
    fs.mkdirSync(formExtDir, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ed103b94-8ed1-443a-a7ea-5a2eb7fc6fbc">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Обычная форма</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <FormType>Ordinary</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${ordinaryFormName}.xml`), metadataXML)
    fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([0, 1, 2, 255]))

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: ordinaryFormName,
      outputDir,
    })

    const formDir = join(outputDir, "Формы", ordinaryFormName)
    const yaml = fs.readFileSync(join(formDir, "Форма.yaml"), "utf-8")
    expect(yaml).toContain("Синоним: Обычная форма")
    expect(yaml).toContain("ТипФормы: Обычная")
    expect([...fs.readFileSync(join(formDir, "Form.bin"))]).toEqual([0, 1, 2, 255])
  })

  it("imports metadata-only ordinary form without creating Form.bin", async () => {
    const ordinaryFormName = "ОбычнаяБезТела"
    const input = join(outputDir, "ordinary-metadata-only-input")
    fs.mkdirSync(input, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ff77d419-36ca-4447-95fe-9f60443c2455">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym>
        <v8:item>
          <v8:lang>ru</v8:lang>
          <v8:content>Обычная без тела</v8:content>
        </v8:item>
      </Synonym>
      <Comment/>
      <FormType>Ordinary</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${ordinaryFormName}.xml`), metadataXML)

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: ordinaryFormName,
      outputDir,
    })

    const formDir = join(outputDir, "Формы", ordinaryFormName)
    const yaml = fs.readFileSync(join(formDir, "Форма.yaml"), "utf-8")
    expect(yaml).toContain("Синоним: Обычная без тела")
    expect(yaml).toContain("ТипФормы: Обычная")
    expect(fs.existsSync(join(formDir, "Form.bin"))).toBe(false)
  })

  it("keeps managed form without Form.xml as an input error", async () => {
    const managedFormName = "УправляемаяБезТела"
    const input = join(outputDir, "managed-without-body-input")
    fs.mkdirSync(input, { recursive: true })

    const metadataXML = `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties>
      <Name>${managedFormName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Managed</FormType>
    </Properties>
  </Form>
</MetaDataObject>`

    fs.writeFileSync(join(input, `${managedFormName}.xml`), metadataXML)

    await expect(
      convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: input,
        formName: managedFormName,
        outputDir,
      })
    ).rejects.toThrow("Form.xml")
  })
```

- [ ] **Step 2: Run import tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts -t "ordinary form"
```

Expected before implementation: FAIL because `convertFormFromXML` tries to read `Ext/Form.xml` for ordinary forms.

- [ ] **Step 3: Add ordinary body detection in `convertFromXML.ts`**

In `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`, replace `convertFormFromXML`, `readFormFromXML`, and `parseFormFromXML` with this shape. Keep the existing `join` path import:

```ts
import { join } from "path"
```

Add these helper types and functions near `ReadFormFromXMLResult`:

```ts
type FormBodyKind = "managed" | "ordinaryBinary" | "ordinaryMetadataOnly"

type ParsedFormMetadata = {
  xmlMetadata: FormMetadataXML
  metadataXML: string
}

const getFormTypeFromMetadata = (metadata: FormMetadataXML): string | undefined => metadata.Form?.Properties?.FormType

const isOrdinaryFormMetadata = (metadata: FormMetadataXML): boolean => getFormTypeFromMetadata(metadata) === "Ordinary"

const readParsedFormMetadata = async (params: { inputDir: string; formName: string }): Promise<ParsedFormMetadata> => {
  const metadataPath = join(params.inputDir, `${params.formName}.xml`)
  const metadataXML = await fs.promises.readFile(metadataPath, "utf-8")
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)
  return { metadataXML, xmlMetadata: parsedMetadata.MetaDataObject }
}

const readParsedFormMetadataSync = (params: { inputDir: string; formName: string }): ParsedFormMetadata => {
  const metadataPath = join(params.inputDir, `${params.formName}.xml`)
  const metadataXML = fs.readFileSync(metadataPath, "utf-8")
  const parsedMetadata = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(metadataXML)
  return { metadataXML, xmlMetadata: parsedMetadata.MetaDataObject }
}

const detectFormBodyKind = (params: { inputDir: string; formName: string; xmlMetadata: FormMetadataXML }): FormBodyKind => {
  const formExtDir = join(params.inputDir, params.formName, "Ext")
  const formXmlPath = join(formExtDir, "Form.xml")
  const formBinPath = join(formExtDir, "Form.bin")

  if (fs.existsSync(formXmlPath)) return "managed"
  if (!isOrdinaryFormMetadata(params.xmlMetadata)) {
    throw new Error(`Managed form body is missing: ${formXmlPath}`)
  }
  if (fs.existsSync(formBinPath)) return "ordinaryBinary"
  return "ordinaryMetadataOnly"
}
```

Then implement metadata-only parsing:

```ts
function parseFormMetadataOnlyFromXML(params: {
  context: ConfigurationContextFromXML
  xmlMetadata: FormMetadataXML
}): ClientApplicationForm {
  const metadataProperties = importPropertiesFromXML({
    context: params.context,
    xml: params.xmlMetadata,
    rule: ClientApplicationFormRules,
    tags: [FormRulesTags.Metadata],
  })

  return {
    itemType: ClientApplicationFormRules.itemType,
    ...metadataProperties,
    childItems: [],
    commands: [],
  }
}
```

Add the missing imports for this helper:

```ts
import { importPropertiesFromXML } from "~/metadata/orchestration"
import { ClientApplicationFormRules } from "./rules"
import { FormRulesTags } from "./types"
```

Rewrite `convertFormFromXML` so ordinary forms use metadata-only parsing and optional `Form.bin` copy:

```ts
export const convertFormFromXML = async (params: {
  context: ConfigurationContextFromXML
  inputDir: string
  formName: string
  outputDir: string
}): Promise<void> => {
  const { context, inputDir, formName, outputDir } = params

  const { metadataXML, xmlMetadata } = await readParsedFormMetadata({ inputDir, formName })
  const bodyKind = detectFormBodyKind({ inputDir, formName, xmlMetadata })

  const form =
    bodyKind === "managed"
      ? parseFormFromXML({
          context,
          formXML: await fs.promises.readFile(join(inputDir, formName, "Ext", "Form.xml"), "utf-8"),
          metadataXML,
        })
      : parseFormMetadataOnlyFromXML({ context, xmlMetadata })

  const { yaml, externalFiles } = await convertFormToYAML({ context, form })

  await writeFormToYAML({ formYAML: yaml, externalFiles, formName, outputDir })

  const formNkdkDir = join(outputDir, "Формы", formName)
  if (bodyKind === "managed") {
    await copyFormItemExternalFilesFromXML({
      formXmlDir: join(inputDir, formName, "Ext"),
      formNkdkDir,
    })
  }
  if (bodyKind === "ordinaryBinary") {
    await fs.promises.mkdir(formNkdkDir, { recursive: true })
    await fs.promises.copyFile(join(inputDir, formName, "Ext", "Form.bin"), join(formNkdkDir, "Form.bin"))
  }
}
```

Rewrite `readFormFromXML` similarly:

```ts
export function readFormFromXML(params: {
  context: ConfigurationContextFromXML
  inputDir: string
  formName: string
}): ClientApplicationForm {
  const { context, inputDir, formName } = params
  const { metadataXML, xmlMetadata } = readParsedFormMetadataSync({ inputDir, formName })
  const bodyKind = detectFormBodyKind({ inputDir, formName, xmlMetadata })

  if (bodyKind !== "managed") {
    return parseFormMetadataOnlyFromXML({ context, xmlMetadata })
  }

  const formXML = fs.readFileSync(join(inputDir, formName, "Ext", "Form.xml"), "utf-8")
  return parseFormFromXML({ context, formXML, metadataXML })
}
```

- [ ] **Step 4: Run import tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add sync tests for ordinary forms**

Add these tests inside `describe("sync ClientApplicationForm to XML", () => { ... })` in `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`:

```ts
  it("syncs ordinary Form.bin back to XML without creating Form.xml", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-ordinary-form-bin-"))
    const xmlInputDir = join(tmpRoot, "xml")
    const yamlDir = join(tmpRoot, "yaml")
    const ordinaryFormName = "ОбычнаяФорма"

    try {
      const formExtDir = join(xmlInputDir, ordinaryFormName, "Ext")
      fs.mkdirSync(formExtDir, { recursive: true })
      fs.writeFileSync(
        join(xmlInputDir, `${ordinaryFormName}.xml`),
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ed103b94-8ed1-443a-a7ea-5a2eb7fc6fbc">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Ordinary</FormType>
    </Properties>
  </Form>
</MetaDataObject>`
      )
      fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([7, 8, 9]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir: yamlDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        referenceDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir,
      })

      expect(fs.existsSync(join(outputDir, "Forms", ordinaryFormName, "Ext", "Form.xml"))).toBe(false)
      expect([...fs.readFileSync(join(outputDir, "Forms", ordinaryFormName, "Ext", "Form.bin"))]).toEqual([7, 8, 9])
      expect(fs.existsSync(join(outputDir, "Forms", `${ordinaryFormName}.xml`))).toBe(true)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("syncs metadata-only ordinary form without creating Ext", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-ordinary-form-metadata-only-"))
    const xmlInputDir = join(tmpRoot, "xml")
    const yamlDir = join(tmpRoot, "yaml")
    const ordinaryFormName = "ОбычнаяБезТела"

    try {
      fs.mkdirSync(xmlInputDir, { recursive: true })
      fs.writeFileSync(
        join(xmlInputDir, `${ordinaryFormName}.xml`),
        `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="ff77d419-36ca-4447-95fe-9f60443c2455">
    <Properties>
      <Name>${ordinaryFormName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Ordinary</FormType>
    </Properties>
  </Form>
</MetaDataObject>`
      )

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir: yamlDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlDir,
        referenceDir: xmlInputDir,
        formName: ordinaryFormName,
        outputDir,
      })

      expect(fs.existsSync(join(outputDir, "Forms", `${ordinaryFormName}.xml`))).toBe(true)
      expect(fs.existsSync(join(outputDir, "Forms", ordinaryFormName, "Ext"))).toBe(false)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 6: Run sync tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts -t "ordinary"
```

Expected before implementation: FAIL because `syncFormToXML` always writes `Ext/Form.xml`.

- [ ] **Step 7: Implement ordinary sync path in `syncToXML.ts`**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, add helpers:

```ts
const isOrdinaryForm = (form: { formType?: string }): boolean => form.formType === "Ordinary"

const copyOrdinaryFormBinToXML = async (params: {
  formDir: string
  outputDir: string
  formName: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const src = join(params.formDir, "Form.bin")
  if (!fs.existsSync(src)) return

  const dst = join(params.outputDir, "Forms", params.formName, "Ext", "Form.bin")
  await fs.promises.mkdir(join(dst, ".."), { recursive: true })
  await fs.promises.copyFile(src, dst)
  params.xmlManifest?.addFile(dst)
}
```

In `syncFormToXML`, after `const form = importClientApplicationFormFromYAML(...)`, branch before reading reference form XML:

```ts
  if (isOrdinaryForm(form)) {
    const contextFromXML: ConfigurationContextFromXML = {
      fromXML: { forReference: true },
      defaultLanguage: context.defaultLanguage,
      version: "2.20",
    }
    const referenceForm = readFormFromXML({
      context: contextFromXML,
      inputDir: referenceDir,
      formName,
    })
    const metadataXML = exportFormMetadataToXML({
      context: contextWithFormDir,
      form,
      referenceForm,
      name: formName,
    })

    await writeOrdinaryFormMetadataToXML({
      metadataXML,
      formName,
      outputDir,
      xmlManifest: params.xmlManifest,
    })
    await copyOrdinaryFormBinToXML({
      formDir,
      outputDir,
      formName,
      xmlManifest: params.xmlManifest,
    })
    return
  }
```

Add writer:

```ts
const writeOrdinaryFormMetadataToXML = async (params: {
  metadataXML: FormMetadataXML
  formName: string
  outputDir: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const formsOutDir = join(params.outputDir, "Forms")
  const formMetadataPath = join(formsOutDir, `${params.formName}.xml`)
  await fs.promises.mkdir(formsOutDir, { recursive: true })
  await fs.promises.writeFile(formMetadataPath, xmlExport({ MetaDataObject: params.metadataXML }), "utf-8")
  params.xmlManifest?.addFile(formMetadataPath)
}
```

- [ ] **Step 8: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
git commit -m "fix: :bug: сохранить ordinary form body"
```

Expected: commit succeeds.

## Task 2: Raw Color YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/color/types.ts`
- Modify: `packages/core/metadata/commonObjects/color/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/color/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/color/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/color/fromYAML.test.ts`

- [ ] **Step 1: Replace raw color YAML rejection test**

In `packages/core/metadata/commonObjects/color/toYAML.test.ts`, replace the test that expects `"Color YAML: rawRef is XML-only"` with:

```ts
  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("exports raw XML color ref %s to YAML", (rawRef) => {
    const result = exportColorToYAML(mockContext, mockRule, { rawRef })

    expect(result).toBe(rawRef)
  })
```

- [ ] **Step 2: Add raw color YAML import test**

In `packages/core/metadata/commonObjects/color/fromYAML.test.ts`, add:

```ts
  it.each(["0", "0:615512b6-4378-4fce-86f1-a56725f945da"])("imports raw XML color ref %s from YAML", (rawRef) => {
    const result = importColorFromYAML(mockContext, mockRule, rawRef as any)

    expect(result).toEqual({ rawRef })
  })
```

- [ ] **Step 3: Run color YAML tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/color/toYAML.test.ts packages/core/metadata/commonObjects/color/fromYAML.test.ts
```

Expected before implementation: FAIL because raw color refs are rejected on export and imported as absolute colors.

- [ ] **Step 4: Extend color YAML type/schema**

In `packages/core/metadata/commonObjects/color/types.ts`, replace `ColorJSONSchema` with:

```ts
export const RawColorRefJSONSchema = Type.String({ pattern: "^0(?::[0-9a-fA-F-]+)?$" })
export const ColorJSONSchema = Type.Union([...webColors, AbsoluteColorJSONSchema, RawColorRefJSONSchema])
```

- [ ] **Step 5: Export raw color refs to YAML**

In `packages/core/metadata/commonObjects/color/toYAML.ts`, replace:

```ts
  if (isRawColorRef(color)) throw new Error("Color YAML: rawRef is XML-only")
```

with:

```ts
  if (isRawColorRef(color)) return color.rawRef
```

- [ ] **Step 6: Import raw color refs from YAML**

In `packages/core/metadata/commonObjects/color/fromYAML.ts`, update the import from `types`:

```ts
import { Color, ColorYAML, isRawColorRefValue } from "./types"
```

Add this check immediately after `if (!data) return undefined`:

```ts
  if (isRawColorRefValue(data)) return { rawRef: data }
```

- [ ] **Step 7: Run color tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/color/fromXML.test.ts packages/core/metadata/commonObjects/color/toXML.test.ts packages/core/metadata/commonObjects/color/fromYAML.test.ts packages/core/metadata/commonObjects/color/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/color/types.ts packages/core/metadata/commonObjects/color/toYAML.ts packages/core/metadata/commonObjects/color/fromYAML.ts packages/core/metadata/commonObjects/color/toYAML.test.ts packages/core/metadata/commonObjects/color/fromYAML.test.ts
git commit -m "fix: :bug: сохранить raw Color в YAML"
```

Expected: commit succeeds.

## Task 3: DCS Typed Value Nil Array Item

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`

- [ ] **Step 1: Update export test for nil array item**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`, replace `it("rejects xsi:nil array item as XML-only", ...)` with:

```ts
  it("exports xsi:nil array item as empty object", () => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: [{ type: "string", value: "x" }, undefined],
      })
    ).toEqual({ value: ["'x'", {}] })
  })
```

- [ ] **Step 2: Add import test for empty object array item**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`, add:

```ts
  it("imports empty object array item as xsi:nil position", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: ["'x'", {}],
      })
    ).toEqual([{ type: "string", value: "x" }, undefined])
  })
```

- [ ] **Step 3: Run DCS typed-value YAML tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts
```

Expected before implementation: FAIL because export throws on `undefined`, and import cannot classify `{}`.

- [ ] **Step 4: Allow empty object in YAML type**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`, add an empty-object schema:

```ts
export const DcsMetadataTypedValueNilYAMLJSONSchema = Type.Object({}, { additionalProperties: false })
```

Then include it in `DcsMetadataTypedValueJSONSchema`:

```ts
export const DcsMetadataTypedValueJSONSchema = Type.Union([
  Type.Literal("Порядок"),
  Type.Literal("СписокЗначений"),
  Type.String(),
  Type.Number(),
  BooleanJSONSchema,
  StandartBeginningDateJSONSchema,
  DcsMetadataTypedValueNilYAMLJSONSchema,
])
```

- [ ] **Step 5: Export nil array items as empty objects**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.ts`, delete `const NIL_XML_ONLY_ERROR = ...` and replace the array branch with:

```ts
  if (Array.isArray(value)) {
    return value.map((item) => (item === undefined ? {} : exportSingle(context, rule, item)))
  }
```

- [ ] **Step 6: Import empty object array items as undefined**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`, add:

```ts
const isNilYAML = (value: DcsMetadataTypedValueYAML): boolean =>
  typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0
```

Then replace the array branch with:

```ts
  if (Array.isArray(value)) {
    const sourceItems = Array.isArray(sourceValue) ? sourceValue : []
    return value.map((item, index) => (isNilYAML(item) ? undefined : importSingle(context, rule, item, sourceItems[index])))
  }
```

Also update the return type to allow `undefined` array items:

```ts
): DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined => {
```

And update `importDcsMetadataTypedValueFromYAMLForRule` return type similarly:

```ts
): DcsMetadataTypedValue | (DcsMetadataTypedValue | undefined)[] | undefined =>
```

- [ ] **Step 7: Run DCS typed-value tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts
git commit -m "fix: :bug: сохранить nil DCS typed value в YAML"
```

Expected: commit succeeds.

## Task 4: StandardPeriod Value Type

**Files:**
- Create: `packages/core/metadata/commonObjects/standardPeriod/types.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/toXML.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/index.ts`
- Create: `packages/core/metadata/commonObjects/standardPeriod/sync.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/__fixtures__/data.ts`

- [ ] **Step 1: Create StandardPeriod focused tests**

Create `packages/core/metadata/commonObjects/standardPeriod/sync.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { importStandardPeriodFromXML } from "./fromXML"
import { importStandardPeriodFromYAML } from "./fromYAML"
import { exportStandardPeriodToXML } from "./toXML"
import { exportStandardPeriodToYAML } from "./toYAML"

describe("StandardPeriod", () => {
  it("round-trips custom period through YAML", () => {
    const model = {
      variant: "Custom",
      startDate: "0001-01-01T00:00:00",
      endDate: "0001-01-01T00:00:00",
    } as const

    const yaml = exportStandardPeriodToYAML(model)
    expect(yaml).toEqual({
      Вариант: "ПроизвольныйПериод",
      ДатаНачала: "01.01.0001 00:00:00",
      ДатаОкончания: "01.01.0001 00:00:00",
    })
    expect(importStandardPeriodFromYAML(mockContext, undefined, yaml)).toEqual(model)
  })

  it("round-trips period variant without dates through XML", () => {
    const xml = {
      "_xsi:type": "v8:StandardPeriod",
      "v8:variant": { "_xsi:type": "v8:StandardPeriodVariant", "#text": "Today" },
    } as const

    const model = importStandardPeriodFromXML(xml)
    expect(model).toEqual({ variant: "Today" })
    expect(exportStandardPeriodToXML(model)).toEqual(xml)
  })
})
```

- [ ] **Step 2: Run StandardPeriod focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/standardPeriod/sync.test.ts
```

Expected before implementation: FAIL because module files do not exist.

- [ ] **Step 3: Create StandardPeriod types**

Create `packages/core/metadata/commonObjects/standardPeriod/types.ts`:

```ts
import { Static, Type } from "@sinclair/typebox"
import {
  StandardPeriodVariantFromYAML,
  type StandardPeriodVariant,
} from "~/metadata/systemEnumerations/types"

export interface StandardPeriod {
  variant: StandardPeriodVariant
  startDate?: string
  endDate?: string
}

const standardPeriodVariants = Object.keys(StandardPeriodVariantFromYAML).map((key) => Type.Literal(key))

const russianDateTimePattern =
  "^(0[1-9]|[12][0-9]|3[01])\\.(0[1-9]|1[0-2])\\.[0-9]{4} ([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$"

export const StandardPeriodJSONSchema = Type.Object({
  Вариант: Type.Union(standardPeriodVariants),
  ДатаНачала: Type.Optional(Type.String({ pattern: russianDateTimePattern })),
  ДатаОкончания: Type.Optional(Type.String({ pattern: russianDateTimePattern })),
})

export type StandardPeriodYAML = Static<typeof StandardPeriodJSONSchema>

export interface StandardPeriodXML {
  "_xsi:type"?: "v8:StandardPeriod"
  "v8:variant": {
    "_xsi:type"?: "v8:StandardPeriodVariant"
    "#text"?: StandardPeriodVariant
  }
  "v8:startDate"?: string
  "v8:endDate"?: string
}
```

- [ ] **Step 4: Create StandardPeriod XML converters**

Create `packages/core/metadata/commonObjects/standardPeriod/fromXML.ts`:

```ts
import type { StandardPeriod, StandardPeriodXML } from "./types"

export const importStandardPeriodFromXML = (xml: StandardPeriodXML | undefined): StandardPeriod | undefined => {
  if (!xml) return undefined

  const variant = xml["v8:variant"]?.["#text"]
  if (!variant) return undefined

  return {
    variant,
    ...(xml["v8:startDate"] !== undefined ? { startDate: xml["v8:startDate"] } : {}),
    ...(xml["v8:endDate"] !== undefined ? { endDate: xml["v8:endDate"] } : {}),
  }
}
```

Create `packages/core/metadata/commonObjects/standardPeriod/toXML.ts`:

```ts
import type { StandardPeriod, StandardPeriodXML } from "./types"

export const exportStandardPeriodToXML = (value: StandardPeriod | undefined): StandardPeriodXML | undefined => {
  if (!value) return undefined

  return {
    "_xsi:type": "v8:StandardPeriod",
    "v8:variant": {
      "_xsi:type": "v8:StandardPeriodVariant",
      "#text": value.variant,
    },
    ...(value.startDate !== undefined ? { "v8:startDate": value.startDate } : {}),
    ...(value.endDate !== undefined ? { "v8:endDate": value.endDate } : {}),
  }
}
```

- [ ] **Step 5: Create StandardPeriod YAML converters**

Create `packages/core/metadata/commonObjects/standardPeriod/toYAML.ts`:

```ts
import { format } from "date-fns"
import { StandardPeriodVariantToYAML } from "~/metadata/systemEnumerations/types"
import type { StandardPeriod, StandardPeriodYAML } from "./types"

const formatISODateTimeToRussian = (value: string): string => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return value
  return format(date, "dd.MM.yyyy HH:mm:ss")
}

export const exportStandardPeriodToYAML = (value: StandardPeriod | undefined): StandardPeriodYAML | undefined => {
  if (!value) return undefined

  return {
    Вариант: StandardPeriodVariantToYAML[value.variant],
    ...(value.startDate !== undefined ? { ДатаНачала: formatISODateTimeToRussian(value.startDate) } : {}),
    ...(value.endDate !== undefined ? { ДатаОкончания: formatISODateTimeToRussian(value.endDate) } : {}),
  }
}
```

Create `packages/core/metadata/commonObjects/standardPeriod/fromYAML.ts`:

```ts
import { format, parse } from "date-fns"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/fromYAML"
import type { StandardPeriodVariant } from "~/metadata/systemEnumerations/types"
import type { StandardPeriod, StandardPeriodYAML } from "./types"

const parseRussianDateTimeToISO = (value: string): string => {
  try {
    const parsed = parse(value, "dd.MM.yyyy HH:mm:ss", new Date())
    if (isNaN(parsed.getTime())) return value
    return format(parsed, "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return value
  }
}

export const importStandardPeriodFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: StandardPeriodYAML | undefined
): StandardPeriod | undefined => {
  if (!yaml) return undefined

  const variant = importSystemEnumerationFromYAML<StandardPeriodVariant>({
    context,
    rule: { type: "SystemEnumeration", typeSE: "StandardPeriodVariant" },
    value: yaml.Вариант,
  })
  if (!variant) return undefined

  return {
    variant,
    ...(yaml.ДатаНачала !== undefined ? { startDate: parseRussianDateTimeToISO(yaml.ДатаНачала) } : {}),
    ...(yaml.ДатаОкончания !== undefined ? { endDate: parseRussianDateTimeToISO(yaml.ДатаОкончания) } : {}),
  }
}
```

Create `packages/core/metadata/commonObjects/standardPeriod/index.ts`:

```ts
export * from "./types"
export * from "./fromXML"
export * from "./fromYAML"
export * from "./toXML"
export * from "./toYAML"
```

- [ ] **Step 6: Run focused StandardPeriod tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/standardPeriod/sync.test.ts
```

Expected: PASS.

- [ ] **Step 7: Add MetadataValue StandardPeriod fixture**

In `packages/core/metadata/commonObjects/metadataValue/__fixtures__/data.ts`, add this fixture before the `valueList` fixture:

```ts
  {
    name: "standardPeriod",
    rule: { type: "MetadataValue", valueType: ["standardPeriod"] },
    internal: {
      type: "standardPeriod",
      value: {
        variant: "Custom",
        startDate: "0001-01-01T00:00:00",
        endDate: "0001-01-01T00:00:00",
      },
    },
    YAML: {
      Вариант: "ПроизвольныйПериод",
      ДатаНачала: "01.01.0001 00:00:00",
      ДатаОкончания: "01.01.0001 00:00:00",
    },
    XML: `<Value xsi:type="v8:StandardPeriod">
	<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
	<v8:startDate>0001-01-01T00:00:00</v8:startDate>
	<v8:endDate>0001-01-01T00:00:00</v8:endDate>
</Value>`,
  },
```

- [ ] **Step 8: Run MetadataValue tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts
```

Expected before MetadataValue integration: FAIL because `standardPeriod` is not part of `MetadataValue`.

- [ ] **Step 9: Integrate StandardPeriod into MetadataValue types**

In `packages/core/metadata/commonObjects/metadataValue/types.ts`, import StandardPeriod:

```ts
import { StandardPeriod, StandardPeriodJSONSchema, StandardPeriodXML, StandardPeriodYAML } from "../standardPeriod/types"
```

Add to `MetadataValueTypeToXML`:

```ts
  standardPeriod: "v8:StandardPeriod",
```

Add to `MetadataValueTypeToXMLTypes`:

```ts
  ["standardPeriod", StandardPeriod],
```

Add interface:

```ts
export interface MetadataStandardPeriodValue {
  type: "standardPeriod"
  value: StandardPeriod
}
```

Update `MetadataTypedValue` union:

```ts
  MetadataTypedPrimitiveValue | MetadataFixedArrayValue | MetadataFormChoiceListValue | MetadataValueListValue | MetadataStandardPeriodValue,
```

Update XML union:

```ts
  | StandardPeriodXML
```

Update YAML schema union:

```ts
    StandardPeriodJSONSchema,
```

Update `MetadataValueYAML` if needed by adding:

```ts
export type MetadataStandardPeriodValueYAML = StandardPeriodYAML
```

- [ ] **Step 10: Integrate StandardPeriod into MetadataValue converters**

In `metadataValue/fromXML.ts`, import:

```ts
import { importStandardPeriodFromXML } from "../standardPeriod/fromXML"
import type { StandardPeriodXML } from "../standardPeriod/types"
```

Add before the primitive check:

```ts
  if (resultedType === "standardPeriod") {
    const value = importStandardPeriodFromXML(data as StandardPeriodXML)
    return value === undefined ? undefined : { type: "standardPeriod", value }
  }
```

In `metadataValue/toXML.ts`, import:

```ts
import { exportStandardPeriodToXML } from "../standardPeriod/toXML"
```

Add before the primitive check:

```ts
  if (value.type === "standardPeriod") {
    return exportStandardPeriodToXML(value.value)
  }
```

In `metadataValue/fromYAML.ts`, import:

```ts
import { importStandardPeriodFromYAML } from "../standardPeriod/fromYAML"
```

Add before the form-choice object branch:

```ts
  if (typeof data === "object" && !Array.isArray(data) && "Вариант" in data) {
    const value = importStandardPeriodFromYAML(context, undefined, data as any)
    if (value !== undefined) {
      const result = { type: "standardPeriod", value } as MetadataTypedValue
      assertValueType(ruleTyped?.valueType, result.type, "fromYAML")
      return result
    }
  }
```

In `metadataValue/toYAML.ts`, import:

```ts
import { exportStandardPeriodToYAML } from "../standardPeriod/toYAML"
```

Add before the primitive check:

```ts
  if (data.type === "standardPeriod") return exportStandardPeriodToYAML(data.value as any)
```

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./standardPeriod"
```

- [ ] **Step 11: Run MetadataValue tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/standardPeriod/sync.test.ts
```

Expected: PASS.

- [ ] **Step 12: Commit Task 4**

Run:

```bash
git add packages/core/metadata/commonObjects/standardPeriod packages/core/metadata/commonObjects/index.ts packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/fromXML.ts packages/core/metadata/commonObjects/metadataValue/toXML.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/toYAML.ts packages/core/metadata/commonObjects/metadataValue/__fixtures__/data.ts
git commit -m "feat: :sparkles: поддержать StandardPeriod в MetadataValue"
```

Expected: commit succeeds.

## Task 5: Import-Blocker Verification

**Files:**
- No source files expected.
- Uses: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Check `erp` import blockers**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 5
```

Expected: command no longer stops at import with these errors:

```text
ENOENT ... Ext/Form.xml
Color YAML: rawRef is XML-only
DcsMetadataTypedValue YAML: xsi:nil is XML-only
```

Diffs may remain; this task verifies import blockers, not all round-trip diffs.

- [ ] **Step 2: Check `small` import blockers**

Run:

```bash
pnpm -s --dir /Users/nikita/git/nakidka-core/packages/cli exec tsx src/cli.ts import /Users/nikita/git/round-trip-source/small /private/tmp/round-trip-yaml-import-small-check
```

Expected: command no longer reports:

```text
MetadataEnumeration "ТипыНалогообложенияНДС": ENOENT ... Ext/Form.xml
MetadataCommonForm "ВыборПериодаМП": MetadataValue: не распознан тип: v8:StandardPeriod
```

- [ ] **Step 3: Check `trade` import blockers**

Run:

```bash
pnpm -s --dir /Users/nikita/git/nakidka-core/packages/cli exec tsx src/cli.ts import /Users/nikita/git/round-trip-source/trade /private/tmp/round-trip-yaml-import-trade-check
```

Expected: command no longer reports:

```text
MetadataDocumentJournal "ЧекиККМ": DcsMetadataTypedValue YAML: xsi:nil is XML-only
```

- [ ] **Step 4: Run focused package tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated -- packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts packages/core/metadata/commonObjects/color/fromYAML.test.ts packages/core/metadata/commonObjects/color/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts packages/core/metadata/commonObjects/metadataValue/toXML.test.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/toYAML.test.ts packages/core/metadata/commonObjects/standardPeriod/sync.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 6: Commit verification note if source changed after prior commits**

Run:

```bash
git status --short
```

Expected: no source changes. If only the plan/spec files are uncommitted, leave them for the documentation commit chosen by the user.

## Self-Review

- Spec coverage: ordinary `Form.bin`, metadata-only ordinary form, raw `Color`, DCS typed-value nil array items, and `MetadataValue StandardPeriod` each have a dedicated task.
- Placeholder scan: no forbidden placeholder instructions remain.
- Type consistency: the plan uses `standardPeriod` as the internal `MetadataValue` type key, `StandardPeriod` as the shared model, and YAML keys `Вариант`, `ДатаНачала`, `ДатаОкончания` consistently.
