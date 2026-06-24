# Metadata Constant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `MetadataConstant` as a fully registered applied metadata object with XML/YAML/sync tests.

**Architecture:** Implement the object through declarative `rules.ts` and existing common property types. Register the item in metadata and property registries, then add typed fixtures and the standard applied-object tests.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, `pnpm`.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`: declarative rules for `<Constant>`.
- Create `packages/core/metadata/appliedObjects/metadataConstant/types.ts`: inferred model/YAML types, XML interface, `registerMetadataItemRule`.
- Create `packages/core/metadata/appliedObjects/metadataConstant/index.ts`: public exports.
- Modify `packages/core/metadata/orchestration/metadataItem/registry.ts`: import and register `MetadataConstant`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: import and register `MetadataConstant`.
- Modify `packages/core/metadata/appliedObjects/index.ts`: import `metadataConstant`.
- Create `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/full.ts`.
- Create `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/minimal.ts`.
- Modify `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/sync/data.ts`.
- Create six tests in `packages/core/metadata/appliedObjects/metadataConstant/`.

## Task 1: Rules, Types, And Registries

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/index.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

- [ ] **Step 1: Create `rules.ts`**

Use the spec at `docs/superpowers/specs/2026-05-13-metadata-constant-design.md`.

The rules must include:

```ts
export const MetadataConstantRules = {
  itemType: "MetadataConstant",
  itemTypePrefix: "Константа",
  xmlDir: "Constants",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Constant",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ConstantManager", category: "Manager" },
        { name: "ConstantValueManager", category: "ValueManager" },
        { name: "ConstantValueKey", category: "ValueKey" },
      ],
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: { type: "string", xmlParents: ["Properties"], required: true },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    type: { yaml: "Тип", type: "TypeDescription", xmlParents: ["Properties"], useAsShortValueYAML: true },
    useStandardCommands: { yaml: "ИспользоватьСтандартныеКоманды", type: "boolean", defaultValueXML: true, implicitValueYAML: true, xmlParents: ["Properties"] },
    defaultForm: { yaml: "ОсновнаяФорма", type: "string", xmlParents: ["Properties"], referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" },
    extendedPresentation: { yaml: "РасширенноеПредставление", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    explanation: { yaml: "Пояснение", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    passwordMode: { yaml: "РежимПароля", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    format: { yaml: "Формат", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    editFormat: { yaml: "ФорматРедактирования", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    toolTip: { yaml: "Подсказка", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    markNegatives: { yaml: "ВыделятьОтрицательные", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    mask: { yaml: "Маска", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    multiLine: { yaml: "МногострочныйРежим", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    extendedEdit: { yaml: "РасширенноеРедактирование", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    minValue: { yaml: "МинимальноеЗначение", type: "MinMaxValue", xmlParents: ["Properties"], typedXML: "xs:string", defaultValueXMLRaw: { "_xsi:nil": true } },
    maxValue: { yaml: "МаксимальноеЗначение", type: "MinMaxValue", xmlParents: ["Properties"], typedXML: "xs:string", defaultValueXMLRaw: { "_xsi:nil": true } },
    fillChecking: { yaml: "ПроверкаЗаполнения", type: "SystemEnumeration", typeSE: "FillChecking", defaultValueXML: "DontCheck", implicitValueYAML: "DontCheck", xmlParents: ["Properties"] },
    choiceFoldersAndItems: { yaml: "ВыборГруппИЭлементов", type: "SystemEnumeration", typeSE: "FoldersAndItemsUse", defaultValueXML: "Items", implicitValueYAML: "Items", xmlParents: ["Properties"] },
    choiceParameterLinks: { yaml: "СвязиПараметровВыбора", type: "ChoiceParameterLinks", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    choiceParameters: { yaml: "ПараметрыВыбора", type: "ChoiceParameters", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    quickChoice: { yaml: "БыстрыйВыбор", type: "SystemEnumeration", typeSE: "UseQuickChoice", defaultValueXML: "Auto", implicitValueYAML: "Auto", xmlParents: ["Properties"] },
    choiceForm: { yaml: "ФормаВыбора", type: "string", xmlParents: ["Properties"], referenceScope: { target: "this", kind: "Form" }, defaultValueXMLRaw: "" },
    linkByType: { yaml: "СвязьПоТипу", type: "TypeLink", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    choiceHistoryOnInput: { yaml: "ИсторияВыбораПриВводе", type: "SystemEnumeration", typeSE: "ChoiceHistoryOnInput", defaultValueXML: "Auto", implicitValueYAML: "Auto", xmlParents: ["Properties"] },
    dataLockControlMode: { yaml: "РежимУправленияБлокировкойДанных", type: "SystemEnumeration", typeSE: "DefaultDataLockControlMode", defaultValueXML: "Managed", implicitValueYAML: "Managed", xmlParents: ["Properties"] },
    dataHistory: { yaml: "ИсторияДанных", type: "SystemEnumeration", typeSE: "DataHistoryUse", defaultValueXML: "DontUse", implicitValueYAML: "DontUse", xmlParents: ["Properties"] },
    updateDataHistoryImmediatelyAfterWrite: { yaml: "ОбновлятьИсториюДанныхСразуПослеЗаписи", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    executeAfterWriteDataHistoryVersionProcessing: { yaml: "ВыполнятьОбработкуПослеЗаписиВерсииИсторииДанных", type: "boolean", defaultValueXML: false, implicitValueYAML: false, xmlParents: ["Properties"] },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", type: "SystemEnumeration", typeSE: "ObjectBelonging", implicitValueYAML: "Native", toYAML: false, fromYAML: false, xmlParents: ["Properties"] },
    extendedConfigurationObject: { yaml: "ОбъектРасширяемойКонфигурации", type: "string", runtimeOnly: true },
    managerModule: { type: "Module", nkdkPath: "МодульМенеджера.bsl", xmlPath: "Ext/ManagerModule.bsl" },
    valueManagerModule: { type: "Module", nkdkPath: "МодульМенеджераЗначения.bsl", xmlPath: "Ext/ValueManagerModule.bsl" },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Create `types.ts`**

Define inferred types and XML interfaces. Import existing common XML types rather than using `any`.

```ts
export type MetadataConstant = MetadataTypeByRule<typeof MetadataConstantRules>
export type MetadataConstantYAML = YAMLTypeByRule<typeof MetadataConstantRules>

export type ConstantInternalInfoParamsXML = [
  { name: string; category: "Manager" },
  { name: string; category: "ValueManager" },
  { name: string; category: "ValueKey" },
]
```

The `MetadataConstantXML` interface must include `MetaDataObject` root attributes like `MetadataSequenceXML` and a `Constant` node with `_uuid`, `InternalInfo`, and `Properties`.

- [ ] **Step 3: Register and export**

At the bottom of `types.ts`:

```ts
registerMetadataItemRule({
  propertyType: "MetadataConstant",
  itemRule: MetadataConstantRules,
})
```

Create `index.ts`:

```ts
export * from "./types"
export * from "./rules"
```

Add `import "./metadataConstant"` to `packages/core/metadata/appliedObjects/index.ts`.

- [ ] **Step 4: Add registry entries**

Add imports and entries to:

- `packages/core/metadata/orchestration/metadataItem/registry.ts`
- `packages/core/metadata/orchestration/property/registry.ts`
- `PropertyRuleTypeKeys`

- [ ] **Step 5: Verify type registration**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: type-check reaches project compilation. If unrelated pre-existing errors appear, report them and continue only after verifying `MetadataConstant` imports are not the cause.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataConstant/rules.ts \
  packages/core/metadata/appliedObjects/metadataConstant/types.ts \
  packages/core/metadata/appliedObjects/metadataConstant/index.ts \
  packages/core/metadata/appliedObjects/index.ts \
  packages/core/metadata/orchestration/metadataItem/registry.ts \
  packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить правила MetadataConstant"
```

## Task 2: Typed Fixtures And YAML Fixture

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/full.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/minimal.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/sync/data.ts`

- [ ] **Step 1: Create model fixtures**

Create `full.ts` and `minimal.ts` using the values from existing XML fixtures. Include `fullYAML` and `minimalYAML` exports.

The full model must include at least:

```ts
export const full: MetadataConstant = {
  itemType: "MetadataConstant",
  name: "КонстантаВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: { type: ["String"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
  useStandardCommands: false,
  defaultForm: "CommonForm.КонстантаВсеСвойства",
  extendedPresentation: { items: { ru: "Расширенное представление" } },
  explanation: { items: { ru: "Пояснение" } },
  passwordMode: true,
  format: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
  editFormat: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
  toolTip: { items: { ru: "Подсказка" } },
  markNegatives: true,
  mask: "Маска",
  multiLine: true,
  extendedEdit: true,
  minValue: 5,
  maxValue: 90,
  fillChecking: "ShowError",
  choiceFoldersAndItems: "Items",
  quickChoice: "Auto",
  choiceHistoryOnInput: "DontUse",
  dataLockControlMode: "Automatic",
  dataHistory: "Use",
  updateDataHistoryImmediatelyAfterWrite: true,
  executeAfterWriteDataHistoryVersionProcessing: true,
}
```

Add `choiceParameterLinks`, `choiceParameters`, and `linkByType` if the existing common-object import produces stable model values. If one of these requires a small fixture correction after running tests, keep the correction local to this task and document it in the commit body.

- [ ] **Step 2: Create YAML fixture**

Update `sync/data.ts` with `readConstantYAML`. It should reflect the non-default full fixture values and remain compact. It must include module-independent properties only; external modules are checked by sync tests.

- [ ] **Step 3: Run focused fixture checks**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataConstant/fromXML.test.ts --runInBand
```

Expected before Task 3 tests exist: command may fail with “No test files found”. That is acceptable for this task.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/full.ts \
  packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/minimal.ts \
  packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/sync/data.ts
git commit -m "test: :white_check_mark: добавить фикстуры MetadataConstant"
```

## Task 3: XML And YAML Unit Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataConstant/fromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/toXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/fromYAML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/toYAML.test.ts`

- [ ] **Step 1: Add XML tests**

Follow `metadataSequence/fromXML.test.ts` and `toXML.test.ts` exactly, replacing names and rules with `MetadataConstant`.

- [ ] **Step 2: Add YAML tests**

Follow `metadataDocumentNumerator/fromYAML.test.ts` and `toYAML.test.ts`, using:

```ts
const rule: PropertyRule = { type: "MetadataConstant", yaml: "Константа" }
```

- [ ] **Step 3: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataConstant/fromXML.test.ts \
  metadata/appliedObjects/metadataConstant/toXML.test.ts \
  metadata/appliedObjects/metadataConstant/fromYAML.test.ts \
  metadata/appliedObjects/metadataConstant/toYAML.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataConstant/fromXML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/toXML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/fromYAML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/toYAML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/full.ts \
  packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/minimal.ts
git commit -m "test: :white_check_mark: покрыть MetadataConstant XML и YAML"
```

## Task 4: Sync Tests And Final Verification

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataConstant/convertFromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataConstant/syncToXML.test.ts`
- Modify if needed: `packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/sync/data.ts`
- Modify if needed: `packages/core/metadata/appliedObjects/metadataConstant/rules.ts`

- [ ] **Step 1: Add `convertFromXML.test.ts`**

Follow `metadataCatalog/convertFromXML.test.ts`, but verify two modules:

```ts
const expectedManagerModule = fs.readFileSync(join(inputDir, "Ext", "ManagerModule.bsl"), "utf-8")
expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(expectedManagerModule)

const expectedValueManagerModule = fs.readFileSync(join(inputDir, "Ext", "ValueManagerModule.bsl"), "utf-8")
expect(fs.readFileSync(join(outputDir, name, "МодульМенеджераЗначения.bsl"), "utf-8")).toBe(expectedValueManagerModule)
```

- [ ] **Step 2: Add `syncToXML.test.ts`**

Follow `metadataCatalog/syncToXML.test.ts` with expected files:

```ts
expectedFiles: [
  "КонстантаВсеСвойства.xml",
  "Ext/ManagerModule.bsl",
  "Ext/ValueManagerModule.bsl",
]
```

- [ ] **Step 3: Run sync tests**

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/appliedObjects/metadataConstant/convertFromXML.test.ts \
  metadata/appliedObjects/metadataConstant/syncToXML.test.ts
```

Expected: both tests pass.

- [ ] **Step 4: Run full verification**

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataConstant/convertFromXML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/syncToXML.test.ts \
  packages/core/metadata/appliedObjects/metadataConstant/__fixtures__/sync/data.ts \
  packages/core/metadata/appliedObjects/metadataConstant/rules.ts
git commit -m "test: :white_check_mark: проверить sync MetadataConstant"
```
