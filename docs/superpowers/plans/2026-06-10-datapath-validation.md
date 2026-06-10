# DataPath Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace graph-based `DataPath` validation for YAML forms with a project-wide, map-based validator that resolves form attributes, table columns, owner metadata fields, standard attributes, and selected final type policies.

**Architecture:** A single YAML validation pipeline parses each YAML file once into `ProjectYamlCache`, runs JSON Schema validation from the parsed value, imports models best-effort, and validates form `DataPath` values through `FormDataPathIndex`, lazy `OwnerMetadataCache`, `DataPathResolver`, and rule-driven `allowedKinds` policies. Graph `DATA_PATH` edges are removed from the form validation path.

**Tech Stack:** TypeScript, Vitest, `yaml`, `@sinclair/typebox`, existing `metadata/orchestration` rules, `pnpm test`.

---

All paths below are under `/home/nikita/git/nkdk/.worktrees/datapath-validation`.

Baseline before changes:

- `pnpm install` was required in the worktree and completed successfully outside the sandbox.
- `pnpm test` in the sandbox failed only on `spawnSync node EPERM` in `packages/core` form XML tests.
- `pnpm test` outside the sandbox completed with exit code `0`: `packages/graph` 89 tests, `packages/core` 4287 tests plus 5 skipped, `packages/cli` 72 tests.

## Constraints

- Do not change XML fixtures.
- Keep validation YAML-only; do not add XML round-trip rules.
- Before editing `packages/core/metadata/**`, keep following `.agents/knowledge/metadata/INDEX.md` and `.agents/architecture-orchestration.md`.
- Keep `defaultType` for Enterprise export; do not use it as validation policy.
- Do not export `allowedKinds`, `allowComposite`, or `uniqueNameScopes` into JSON Schema.
- Run focused tests after each layer and full `pnpm test` before finishing.

## Task 1 - Project YAML Cache And File Discovery

- [x] Add `packages/core/metadata/validation/projectSpecs.ts`.
  - Export `ValidationProjectSpec` with:

    ```ts
    export interface ValidationProjectSpec {
      kind: string
      dir: string
      rule: MetadataItemRule
      exportSchema: (params: { context: ConfigurationContext; mode?: JSONSchemaExportMode }) => TSchema
      importModel: (params: { context: ConfigurationContext; parsed: ParsedYaml; name: string }) => MetadataItem | undefined
    }
    ```

  - Include at minimum:
    - `Справочник` -> `MetadataCatalogRules`, `exportMetadataCatalogToJSONSchema`, `importMetadataCatalogFromYAML`
    - `Документ` -> `MetadataDocumentRules`, `exportMetadataDocumentToJSONSchema`, generic `importMetadataItemFromYAML`
    - `Перечисление` -> `MetadataEnumerationRules`, `exportMetadataEnumerationToJSONSchema`, `importMetadataEnumerationFromYAML`
    - `Обработка`, `ЖурналДокументов`, `HTTPСервис`, `РегистрСведений`, `РегистрНакопления`, `ПланОбмена` using existing rules and generic schema/model import where current validation already supports them.
  - Do not import from `metadata/graphImport/*` in this file.

- [x] Add `packages/core/metadata/validation/projectFiles.ts`.
  - Export:

    ```ts
    export interface ValidationProjectFile {
      absolutePath: string
      projectPath: string
      kind: "properties" | "form"
      owner: { dir: string; name: string; spec: ValidationProjectSpec }
      formName?: string
    }

    export function discoverValidationProjectFiles(projectDir: string): ValidationProjectFile[]
    export function resolveValidationProjectFile(projectDir: string, filePath: string): ValidationProjectFile | undefined
    export function assertProjectFileInside(projectDir: string, filePath: string): string
    ```

  - Full discovery includes supported `Свойства.yaml` and `Формы/<Имя>/Форма.yaml`.
  - Unsupported YAML files are not returned by full discovery.
  - `resolveValidationProjectFile` accepts relative or absolute input and returns `undefined` for unsupported project paths inside the root.

- [x] Add `packages/core/metadata/validation/projectYamlCache.ts`.
  - Cache file reads and parsed YAML by absolute path:

    ```ts
    export interface ProjectYamlEntry {
      filePath: string
      text: string
      parsed: ParsedYaml
    }

    export interface ProjectYamlCache {
      get(filePath: string): ProjectYamlEntry | { filePath: string; error: Error }
    }
    ```

  - Use `readFileSync` and `parseMetadataYaml` once per file per validator run.
  - Return read errors as values so callers can produce diagnostics instead of throwing.

- [x] Tests:
  - Add `packages/core/metadata/validation/projectFiles.test.ts` for full discovery, single file resolution, outside-project rejection, and unsupported file behavior.
  - Add `packages/core/metadata/validation/projectYamlCache.test.ts` using `vi.spyOn(fs, "readFileSync")` to prove repeated reads hit the cache.

- [x] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/projectFiles.test.ts metadata/validation/projectYamlCache.test.ts
  ```

Expected result: new tests pass.

Commit:

```bash
git add packages/core/metadata/validation/projectSpecs.ts packages/core/metadata/validation/projectFiles.ts packages/core/metadata/validation/projectYamlCache.ts packages/core/metadata/validation/projectFiles.test.ts packages/core/metadata/validation/projectYamlCache.test.ts
git commit -m "feat: :sparkles: добавить кэш YAML для валидации проекта"
```

## Task 2 - Reuse Parsed YAML In Schema Validation

- [x] Update `packages/core/metadata/validation/validateFile.ts`.
  - Keep current public `validateFile({ filePath, text, schema })`.
  - Add `validateParsedFile({ filePath, parsed, schema })`.
  - Move syntax and TypeBox logic into `validateParsedFile`.
  - `validateFile` becomes a thin wrapper around `parseMetadataYaml(text)` plus `validateParsedFile`.

- [x] Update `packages/core/metadata/validation/projectFileSchema.ts`.
  - Replace hardcoded `metadataSchemaNameByDir` lookup with `projectSpecs.ts`.
  - Keep current exported functions and error messages.
  - Use `spec.exportSchema({ context, mode })` for `Свойства.yaml`.
  - Keep form schema as `ClientApplicationForm`.

- [x] Update `packages/core/metadata/validation/schemaRegistry.ts` and `schemaCache.ts` only where needed to keep existing schema command tests passing.
  - Do not register validation-only fields in JSON Schema.
  - Keep existing named schema behavior for `schema` CLI.

- [x] Tests:
  - Extend `packages/core/metadata/validation/validateFile.test.ts` with a `validateParsedFile` case proving no second parse is needed.
  - Keep `packages/core/metadata/validation/projectFileSchema.test.ts` passing.

- [x] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/validateFile.test.ts metadata/validation/projectFileSchema.test.ts
  pnpm --filter @nakidka/cli test -- commands/schema.test.ts
  ```

Expected result: existing schema behavior remains unchanged.

Commit:

```bash
git add packages/core/metadata/validation/validateFile.ts packages/core/metadata/validation/projectFileSchema.ts packages/core/metadata/validation/schemaRegistry.ts packages/core/metadata/validation/schemaCache.ts packages/core/metadata/validation/validateFile.test.ts packages/core/metadata/validation/projectFileSchema.test.ts packages/cli/src/commands/schema.test.ts
git commit -m "refactor: :recycle: переиспользовать распарсенный YAML в валидации"
```

## Task 3 - Rule-Driven Unique Name Scopes

- [x] Extend `packages/core/metadata/orchestration/property/types.ts`.
  - Add:

    ```ts
    export interface UniqueNameScope {
      collections: readonly string[]
      message?: string
    }
    ```

  - Add `uniqueNameScopes?: readonly UniqueNameScope[]` to `MetadataItemRule`.

- [x] Add `packages/core/metadata/validation/uniqueNameScopes.ts`.
  - Export:

    ```ts
    export function validateUniqueNameScopes(params: {
      filePath: string
      parsed: ParsedYaml
      model: MetadataItem
      rule: MetadataItemRule
    }): Diagnostic[]
    ```

  - For every scope, read `model[collection]` arrays.
  - Compare only non-empty `item.name` values.
  - Comparison is case-sensitive.
  - Report the second duplicate with source `"structure"` and severity `"error"`.
  - Resolve coordinates through YAML keys using the rule collection `yaml` name and item name.

- [x] Add `uniqueNameScopes` to rules needed by `DataPathResolver`.
  - `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataDocument/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataReport/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataExchangePlan/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataTask/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts`: `attributes`, `tabularSections`.
  - `packages/core/metadata/appliedObjects/metadataInformationRegister/rules.ts`: `attributes`, `dimensions`, `resources`.
  - `packages/core/metadata/appliedObjects/metadataAccumulationRegister/rules.ts`: `attributes`, `dimensions`, `resources`.
  - `packages/core/metadata/appliedObjects/metadataAccountingRegister/rules.ts`: `attributes`, `dimensions`, `resources`.
  - `packages/core/metadata/appliedObjects/metadataCalculationRegister/rules.ts`: `attributes`, `dimensions`, `resources`.

- [ ] Integrate `validateUniqueNameScopes` into the project validation pipeline from Task 9 and into `OwnerMetadataCache` from Task 6.
  - If a duplicate exists in an owner used by `DataPath`, the resolver must stop that owner transition as ambiguous.
  - Deferred by the explicit Task 3 boundary on 2026-06-10: do not change the common project validation pipeline, CLI, or DataPath resolver in this step.

- [x] Tests:
  - Add `packages/core/metadata/validation/uniqueNameScopes.test.ts`.
  - Cover catalog duplicate between `Реквизиты` and `ТабличныеЧасти`.
  - Cover register duplicate between `Реквизиты`, `Измерения`, and `Ресурсы`.
  - Cover case-sensitive names `Имя` and `имя` as distinct.
  - Cover diagnostic position on the second duplicate.

- [x] Run:

  ```bash
  pnpm --dir packages/core exec vitest run --no-isolate --sequence.shuffle metadata/validation/uniqueNameScopes.test.ts
  ```

Expected result: duplicates are reported through rules, not through DataPath-specific code.

Commit:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/validation/uniqueNameScopes.ts packages/core/metadata/validation/uniqueNameScopes.test.ts packages/core/metadata/appliedObjects
git commit -m "feat: :sparkles: добавить области уникальности имен в rules"
```

## Task 4 - DataPath Domain Model And YAML Locations

- [x] Add `packages/core/metadata/validation/dataPath/types.ts`.
  - Define internal kinds:

    ```ts
    export type DataPathAllowedKind = "boolean" | "dateTime" | "Picture" | "tableSource"

    export type DataPathValueKind =
      | "unknown"
      | "any"
      | "boolean"
      | "dateTime"
      | "Picture"
      | "scalar"
      | "object"
      | "tableSource"
      | "dynamicList"
      | "platformSource"
      | "unsupportedIntermediate"

    export interface DataPathTypeInfo {
      kinds: readonly DataPathValueKind[]
      nextTypes: readonly OwnerTypeRef[]
      table?: DataPathTableInfo
      sourceText?: string
    }
    ```

  - `OwnerTypeRef` supports at least `Справочник`, `СправочникОбъект`, `Документ`, `ДокументОбъект`, `РегистрСведений`, `РегистрНакопления`, `РегистрБухгалтерии`, `РегистрРасчета`, and chart/data processor/report object names already present in rules.
  - `DataPathTableInfo` distinguishes `ValueTable`, `ValueTree`, `DynamicList`, and applied object tabular sections.

- [x] Add `packages/core/metadata/validation/dataPath/typeDescription.ts`.
  - Convert existing `TypeDescription` to `DataPathTypeInfo`.
  - Map:
    - `boolean` -> `boolean`
    - `dateTime` -> `dateTime`
    - `Picture` -> `Picture`
    - `ValueTable`, `ValueTree` -> `tableSource`
    - `DynamicList` or form attribute with `dynamicList` settings -> `dynamicList` plus `tableSource`
    - reference/object metadata types -> `object` with one `OwnerTypeRef`
    - missing `type`/`typeId` -> `unknown`
    - unsupported arbitrary/special types -> `unsupportedIntermediate` for continuation, valid terminal when no policy is present.
  - Do not infer validation policy from `defaultType`.

- [x] Add `packages/core/metadata/validation/yamlLocations.ts`.
  - Export:

    ```ts
    export type YamlPath = readonly (string | number)[]
    export function diagnosticAtYamlPath(params: {
      filePath: string
      parsed: ParsedYaml
      path: YamlPath
      severity: DiagnosticSeverity
      source: DiagnosticSource
      message: string
    }): Diagnostic
    ```

  - Traverse `yaml` AST with `isMap`, `isSeq`, and node ranges.
  - If no node is found, use `line: 1`, `col: 1`.

- [x] Tests:
  - Add `packages/core/metadata/validation/dataPath/typeDescription.test.ts`.
  - Add `packages/core/metadata/validation/yamlLocations.test.ts`.
  - Cover primitive, composite, reference, `ValueTable`, `ValueTree`, `DynamicList`, missing type, and unsupported intermediate cases.

- [x] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/dataPath/typeDescription.test.ts metadata/validation/yamlLocations.test.ts
  ```

Expected result: type categorization is independent of graph and JSON Schema.

Commit:

```bash
git add packages/core/metadata/validation/dataPath packages/core/metadata/validation/yamlLocations.ts packages/core/metadata/validation/yamlLocations.test.ts
git commit -m "feat: :sparkles: описать типы DataPath для валидатора"
```

## Task 5 - FormDataPathIndex

- [ ] Add `packages/core/metadata/validation/dataPath/formIndex.ts`.
  - Export:

    ```ts
    export interface FormDataPathIndex {
      roots: Map<string, FormDataPathSource>
      duplicateDiagnostics: Diagnostic[]
      getRoot(name: string): FormDataPathSource | undefined
    }

    export function buildFormDataPathIndex(params: {
      filePath: string
      parsed: ParsedYaml
      form: ClientApplicationForm
    }): FormDataPathIndex
    ```

  - Index form attributes by exact `name`.
  - Index `ValueTable` and `ValueTree` columns from `attribute.columns`.
  - If a table/tree attribute has no `columns`, allow the table root but reject `<root>.<column>`.
  - Treat `attribute.dynamicList` as a `DynamicList` table source.
  - Collect duplicate root names in one search area as diagnostics.

- [ ] Platform source warnings.
  - Add a narrow first-version list inside `formIndex.ts`, built from observed YAML cases in `/home/nikita/git/round-trip` and current fixtures:

    ```ts
    const knownPlatformFormSources = [
      "КомпоновщикНастроекКомпоновкиДанных.Settings",
      "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
      "КомпоновщикНастроекКомпоновкиДанных.Settings.Use",
    ] as const
    ```

  - Match exact source and prefixes with continuation.
  - Return a `platformSource` result that leads to warning, not error.

- [ ] Tests:
  - Add `packages/core/metadata/validation/dataPath/formIndex.test.ts`.
  - Cover normal attributes, `ValueTable` columns, `ValueTree` columns, missing columns, `DynamicList`, duplicate roots, and known platform source detection.

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/dataPath/formIndex.test.ts
  ```

Expected result: local form lookup is a `Map` and has no graph dependency.

Commit:

```bash
git add packages/core/metadata/validation/dataPath/formIndex.ts packages/core/metadata/validation/dataPath/formIndex.test.ts
git commit -m "feat: :sparkles: построить индекс DataPath формы"
```

## Task 6 - OwnerMetadataCache And Object Field Extraction

- [ ] Add `packages/core/metadata/validation/dataPath/ownerCache.ts`.
  - Export:

    ```ts
    export interface OwnerMetadataCache {
      get(ref: OwnerTypeRef): OwnerMetadataResult
    }

    export type OwnerMetadataResult =
      | { status: "ok"; owner: OwnerMetadata }
      | { status: "not-found"; diagnostics: Diagnostic[] }
      | { status: "import-error"; diagnostics: Diagnostic[] }
      | { status: "ambiguous"; diagnostics: Diagnostic[] }
    ```

  - Use `ProjectYamlCache` for reads.
  - Resolve owner files by `<dir>/<name>/Свойства.yaml` through `projectSpecs.ts`.
  - Use `spec.importModel({ context, parsed, name })`.
  - Add schema diagnostics through `validateParsedFile` but do not block model import when import succeeds.
  - Add `validateUniqueNameScopes`; if it finds duplicate data names, return `ambiguous` for resolver transitions.
  - Cache all statuses by canonical owner key.

- [ ] Add `packages/core/metadata/validation/dataPath/objectFields.ts`.
  - Export:

    ```ts
    export interface ObjectFieldIndex {
      fields: Map<string, ObjectField>
      diagnostics: Diagnostic[]
    }

    export function buildObjectFieldIndex(owner: OwnerMetadata): ObjectFieldIndex
    ```

  - Use `owner.rule.properties` and model collections.
  - Treat data field collections by rule property key:
    - `attributes`
    - `tabularSections`
    - `dimensions`
    - `resources`
  - Include standard attributes from `StandardAttributeDescriptionsPropertyRule.standartAttributeNames`; apply `standartAttributeNamesXML` only if model-dependent names are needed for the imported model.
  - Use YAML names for standard attributes, for example `Ссылка`, `Наименование`, `Код`, `Дата`, `Номер`, `НомерСтроки`.
  - Reject platform names `Ref`, `Description`, `Number`, `Date` in ordinary YAML paths with a DataPath diagnostic.
  - For tabular sections, build table columns from tabular section `attributes` plus standard row attributes from `MetadataTabularSectionRules.properties.standardAttributes`.

- [ ] Tests:
  - Add `packages/core/metadata/validation/dataPath/ownerCache.test.ts`.
  - Add `packages/core/metadata/validation/dataPath/objectFields.test.ts`.
  - Cover lazy read caching, owner not found, owner import error, schema errors with successful import, catalog fields, document standard attributes, register dimensions/resources/attributes, tabular section columns, `Ссылка.Ссылка.Номер`, and platform name rejection.

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/dataPath/ownerCache.test.ts metadata/validation/dataPath/objectFields.test.ts
  ```

Expected result: object traversal reads external YAML only through the cache and stops on ambiguous owner fields.

Commit:

```bash
git add packages/core/metadata/validation/dataPath/ownerCache.ts packages/core/metadata/validation/dataPath/objectFields.ts packages/core/metadata/validation/dataPath/ownerCache.test.ts packages/core/metadata/validation/dataPath/objectFields.test.ts
git commit -m "feat: :sparkles: добавить ленивое чтение владельцев DataPath"
```

## Task 7 - DataPathResolver

- [ ] Add `packages/core/metadata/validation/dataPath/resolver.ts`.
  - Export:

    ```ts
    export interface ResolveDataPathParams {
      filePath: string
      parsed: ParsedYaml
      yamlPath: YamlPath
      value: string
      index: FormDataPathIndex
      ownerCache: OwnerMetadataCache
      tableContext?: TableContext
    }

    export type ResolveDataPathResult =
      | { status: "ok"; target: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
      | { status: "warning"; target?: ResolvedDataPathTarget; diagnostics: Diagnostic[] }
      | { status: "error"; diagnostics: Diagnostic[] }
    ```

  - Split by `.` and keep exact segment text.
  - Empty or whitespace-only value returns `ok` with no target and no diagnostics.
  - If value matches `Items.*.CurrentData.*`, return one warning and skip deeper resolution.
  - First segment must exist in `FormDataPathIndex`.
  - Unknown first segment is an error; do not fall back to owner name or service name `Объект`.
  - For every intermediate segment:
    - composite `nextTypes.length > 1` is error;
    - missing/unknown/any type is error;
    - unsupported intermediate type is error;
    - scalar terminal with remaining segments is error.
  - For object transitions, use `OwnerMetadataCache`.
  - For `DynamicList.<field>`, return warning because dynamic list columns are deferred.
  - For platform sources, return warning and skip tail.
  - For table context, require child path to start with `${table.dataPath}.`.

- [ ] Error message style.
  - Use short Russian messages.
  - Include the `DataPath` value and key segment in the message:

    ```text
    ПутьКДанным "Объект.Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип
    ```

  - Use `source: "cross-file"` when an owner file is missing or cannot be imported.
  - Use `source: "structure"` for local model/rules conflicts.

- [ ] Tests:
  - Add `packages/core/metadata/validation/dataPath/resolver.test.ts`.
  - Cover:
    - valid form attribute
    - valid `ValueTable` column
    - missing first segment
    - strict case mismatch
    - intermediate composite type
    - intermediate unknown type
    - unsupported intermediate type
    - owner attribute resolution
    - tabular section column resolution
    - child table prefix requirement
    - `DynamicList.<field>` warning
    - known platform source warning
    - `Items.*.CurrentData.*` warning
    - `Ref` instead of `Ссылка` error

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/dataPath/resolver.test.ts
  ```

Expected result: all path traversal logic is in the resolver, not in graph code.

Commit:

```bash
git add packages/core/metadata/validation/dataPath/resolver.ts packages/core/metadata/validation/dataPath/resolver.test.ts
git commit -m "feat: :sparkles: реализовать резолвер DataPath без графа"
```

## Task 8 - Rule Policies And Form Traversal

- [ ] Extend `DataPathPropertyRule` in `packages/core/metadata/orchestration/property/types.ts`.
  - Replace required `defaultType: string` with:

    ```ts
    defaultType?: string
    allowedKinds?: readonly DataPathAllowedKind[]
    allowComposite?: boolean
    ```

  - Keep compile compatibility for existing rules by allowing optional `defaultType`.

- [ ] Update agreed rules:
  - `packages/core/metadata/forms/elements/table/rules.ts`
    - `dataPath`: `allowedKinds: ["tableSource"]`, `allowComposite: false`
    - `rowPictureDataPath`: `allowedKinds: ["Picture"]`, `allowComposite: false`
  - `packages/core/metadata/forms/elements/checkBoxField/rules.ts`
    - `dataPath`: `allowedKinds: ["boolean"]`, `allowComposite: false`
  - `packages/core/metadata/forms/elements/pictureField/rules.ts`
    - `dataPath`: `allowedKinds: ["Picture"]`, `allowComposite: false`
  - `packages/core/metadata/forms/elements/calendarField/rules.ts`
    - `dataPath`: `allowedKinds: ["dateTime"]`, `allowComposite: false`
  - Do not add policies to `InputField`, `LabelField`, `TableInputField`, `TableLabelField`, `ColumnGroup.headerDataPath`, or multiple value DataPath fields.

- [ ] Add `packages/core/metadata/validation/dataPath/policies.ts`.
  - Export:

    ```ts
    export function validateResolvedDataPathPolicy(params: {
      filePath: string
      parsed: ParsedYaml
      yamlPath: YamlPath
      value: string
      rule: DataPathPropertyRule
      target: ResolvedDataPathTarget | undefined
    }): Diagnostic[]
    ```

  - If `allowedKinds` is absent, allow composite terminal types and unknown terminal type.
  - If `allowedKinds` is present:
    - default `allowComposite` to `false`;
    - missing terminal type is error;
    - composite terminal type is error when `allowComposite` is false;
    - at least one terminal kind must match `allowedKinds`;
    - `platformSource` warning from resolver suppresses `tableSource` error for this first version.

- [ ] Add `packages/core/metadata/validation/dataPath/formTraversal.ts`.
  - Collect every `DataPath` property from `ClientApplicationFormRules` and element rules.
  - Traverse `childItems` recursively using `getElementRule`.
  - Preserve table context for children of `Table`.
  - Compute YAML paths for:
    - form properties
    - `Элементы.<Имя>.<YAMLKey>`
    - nested table children `Элементы.<Table>.Элементы.<Child>.<YAMLKey>`
  - Return occurrences with `PropertyRule`, value, YAML path, element type, and table context.

- [ ] Replace `packages/core/metadata/validation/validateForm.ts`.
  - New signature:

    ```ts
    export interface ValidateFormParams {
      projectDir: string
      formDir: string
      formName: string
      owner: { dir: string; name: string }
      cache: ProjectYamlCache
      context?: ConfigurationContext
      ownerCache?: OwnerMetadataCache
    }
    ```

  - Read `Форма.yaml` through `ProjectYamlCache`.
  - If syntax errors exist, return syntax diagnostics and skip import.
  - Try `importClientApplicationFormFromYAML`; catch exceptions and return one import diagnostic.
  - Build `FormDataPathIndex`.
  - Resolve all collected occurrences and apply policies.
  - Append owner diagnostics from lazy resolution.
  - Keep no-argument legacy test behavior only by changing tests; do not keep the old local-only API.

- [ ] Tests:
  - Replace `packages/core/metadata/validation/validateForm.test.ts` with focused fixtures built under temp YAML projects.
  - Cover every case listed in `docs/superpowers/specs/2026-06-10-datapath-validation-design.md` testing section.
  - Do not modify XML fixtures.

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/validateForm.test.ts metadata/validation/dataPath
  ```

Expected result: `validateForm` validates all DataPath occurrences in one form with owner-aware resolution.

Commit:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/checkBoxField/rules.ts packages/core/metadata/forms/elements/pictureField/rules.ts packages/core/metadata/forms/elements/calendarField/rules.ts packages/core/metadata/validation/validateForm.ts packages/core/metadata/validation/validateForm.test.ts packages/core/metadata/validation/dataPath
git commit -m "feat: :sparkles: проверять DataPath формы по rules"
```

## Task 9 - Project Validator And CLI Command

- [ ] Add `packages/core/metadata/validation/validateProject.ts`.
  - Export:

    ```ts
    export interface ValidateProjectParams {
      projectDir: string
      filePath?: string
      context?: ConfigurationContext
    }

    export interface ValidateProjectResult {
      diagnostics: Diagnostic[]
    }

    export function validateProject(params: ValidateProjectParams): ValidateProjectResult
    ```

  - Validate `<yaml-dir>` existence and directory shape in CLI, not core.
  - Build one `ProjectYamlCache`.
  - Build one `OwnerMetadataCache`.
  - Without `filePath`, discover every supported project file:
    - schema validate every supported `Свойства.yaml` and `Форма.yaml`;
    - run `validateUniqueNameScopes` for imported properties models;
    - run `validateForm` for every form.
  - With `filePath`:
    - unsupported file inside project becomes a thrown `ProjectFileSchemaError`;
    - `Форма.yaml` runs schema plus all DataPath in that form;
    - `Свойства.yaml` runs only schema and `uniqueNameScopes`.
  - Best effort: schema errors do not stop form import or owner import when model import still succeeds.
  - Sort diagnostics by `filePath`, `line`, `col`, `severity`, `message`.

- [ ] Export from `packages/core/index.ts`:
  - `validateProject`
  - `validateParsedFile`
  - `validateForm`
  - project validation types

- [ ] Add `packages/cli/src/commands/validate.ts`.
  - Implement:

    ```ts
    export interface ValidateCommandOptions { file?: string }
    export async function validateYamlProject(yamlDir: string, options?: ValidateCommandOptions): Promise<void>
    export function formatDiagnostics(diagnostics: Diagnostic[], projectDir: string): string
    ```

  - Validate invalid command usage:
    - `<yaml-dir>` missing, not found, or not directory -> write to `stderr`, `process.exitCode = 2`.
    - `--file` outside project -> `stderr`, exit code `2`.
    - unsupported `--file` -> `stderr`, exit code `2`.
  - Valid run writes diagnostics and `summary: N error, M warning` to `stdout`.
  - If any diagnostic has severity `error`, set `process.exitCode = 1`.
  - Warnings alone keep exit code `0`.

- [ ] Update `packages/cli/src/cli.ts`.
  - Add:

    ```ts
    program
      .command("validate")
      .description("Проверить YAML-проект")
      .argument("<yaml-dir>", "путь к каталогу YAML-проекта")
      .option("--file <path>", "проверить один YAML-файл проекта")
      .action((yamlDir: string, opts: ValidateCommandOptions) => {
        run(() => validateYamlProject(yamlDir, opts))
      })
    ```

  - Adjust `run` so command-level exit code `2` is not overwritten to `1`.

- [ ] Tests:
  - Add `packages/core/metadata/validation/validateProject.test.ts`.
  - Add `packages/cli/src/commands/validate.test.ts`.
  - Cover full project, single form, single properties file, unsupported file, outside file, errors plus warnings, warnings only, and output format.

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/validation/validateProject.test.ts
  pnpm --filter @nakidka/cli test -- commands/validate.test.ts
  ```

Expected result: `nkdk validate <yaml-dir>` and `nkdk validate <yaml-dir> --file <path>` work with stable text output.

Commit:

```bash
git add packages/core/index.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts packages/cli/src/cli.ts packages/cli/src/commands/validate.ts packages/cli/src/commands/validate.test.ts
git commit -m "feat: :sparkles: добавить CLI validate для YAML-проекта"
```

## Task 10 - Remove Graph-Based DataPath Support

- [ ] Delete graph-only DataPath files:
  - `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.ts`
  - `packages/core/metadata/forms/commonObjects/dataPath/graphOps.ts`
  - `packages/core/metadata/forms/commonObjects/dataPath/graphFromModel.test.ts`
  - `packages/core/metadata/forms/commonObjects/dataPath/graphOps.test.ts`

- [ ] Update imports:
  - Remove `import "../commonObjects/dataPath/graphFromModel"` from `packages/core/metadata/forms/elements/index.ts`.
  - Remove any DataPath graph import from `packages/core/metadata/forms/commonObjects/index.ts` if present after edits.
  - Keep `packages/core/metadata/forms/commonObjects/dataPath/toEnterprise.ts`.

- [ ] Remove form-local `DATA_PATH` handling.
  - Edit `packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts`.
  - Remove `DATA_PATH`/`DATA_PATH_DEPENDS_ON` special path resolution only if no remaining non-DataPath code uses it.
  - Keep generic graph support for command names, associated tables, type descriptions, and other existing graph features.

- [ ] Update or delete tests that assert `DATA_PATH` edges.
  - `packages/core/metadata/orchestration/buildGraphFromModel.test.ts`
  - `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`
  - Keep tests for non-DataPath graph behavior.

- [ ] Search:

  ```bash
  rg -n "DATA_PATH|DATA_PATH_DEPENDS_ON|dataPath/graphFromModel|dataPath/graphOps" packages/core
  ```

Expected result: no production references remain; only changelog/spec/plan text may mention removed names.

- [ ] Run:

  ```bash
  pnpm --filter @nakidka/core test -- metadata/forms/commonObjects/dataPath metadata/orchestration/buildGraphFromModel.test.ts metadata/orchestration/importMetadataFileWithGraph.test.ts
  ```

Expected result: graph tests pass after removing DataPath edge assertions.

Commit:

```bash
git add packages/core/metadata/forms/commonObjects/dataPath packages/core/metadata/forms/elements/index.ts packages/core/metadata/forms/commonObjects/index.ts packages/core/metadata/orchestration/buildGraph/internal/applyGraphOps.ts packages/core/metadata/orchestration/buildGraphFromModel.test.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts
git add -u
git commit -m "refactor: :recycle: удалить графовую поддержку DataPath"
```

## Task 11 - AI Skill And Final Verification

- [ ] Add `skills/config-validate-yaml/SKILL.md`.
  - Use English, because the skill is for AI workers.
  - The skill file must contain sections named `# config-validate-yaml`, `## Inputs`, `## Commands`, `## Exit Codes`, and `## Output`.
  - Document these preferred commands:

    ```bash
    nkdk validate "<yaml-dir>"
    nkdk validate "<yaml-dir>" --file "<path>"
    ```

  - Document these workspace fallback commands:

    ```bash
    pnpm --filter @nakidka/cli dev validate "<yaml-dir>"
    pnpm --filter @nakidka/cli dev validate "<yaml-dir>" --file "<path>"
    ```

  - Document exit codes:
    - `0`: no errors; warnings may exist.
    - `1`: validation found project errors.
    - `2`: command usage is invalid.
  - Document output parsing:

    ```text
    <file>:<line>:<col> <error|warning>: <message>
    summary: <N> error, <M> warning
    ```

  - Do not add user-facing marketing text.

- [ ] Add skill to any local skill index only if this repository already has such an index for project skills. Do not create a new registry format.

- [ ] Run focused validation through CLI on a temporary project fixture from tests:

  ```bash
  pnpm --filter @nakidka/cli dev validate packages/core/metadata/validation/__fixtures__/project-with-form
  ```

Expected result: stable diagnostic lines plus `summary`.

- [ ] Run complete verification:

  ```bash
  pnpm test
  ```

Expected result: all packages pass. If sandbox blocks `spawnSync node`, rerun outside sandbox with escalation and record that reason in the final handoff.

Commit:

```bash
git add skills/config-validate-yaml/SKILL.md
git commit -m "docs: :memo: добавить скилл проверки YAML-проекта"
```

## Final Self-Review Checklist

- [ ] Compare implementation against `docs/superpowers/specs/2026-06-10-datapath-validation-design.md`.
- [ ] Confirm no XML fixtures changed:

  ```bash
  git diff --name-only -- '*.xml'
  ```

  Expected result: empty output.

- [ ] Confirm graph-based DataPath references are gone:

  ```bash
  rg -n "DATA_PATH|DATA_PATH_DEPENDS_ON|dataPath/graphFromModel|dataPath/graphOps" packages/core
  ```

  Expected result: no production TypeScript references.

- [ ] Confirm validation policies are not exported to JSON Schema:

  ```bash
  pnpm --filter @nakidka/cli dev schema Table --json-schema
  ```

  Expected result: output does not contain `allowedKinds`, `allowComposite`, or `uniqueNameScopes`.

- [ ] Confirm CLI invalid usage exits with `2` and diagnostics exits with `1`:

  ```bash
  pnpm --filter @nakidka/cli dev validate /path/that/does/not/exist
  ```

  Expected result: error in `stderr`, exit code `2`.

- [ ] Run placeholder scan for this plan:

  ```bash
  rg -n "TB""D|TO""DO|implement la""ter|fill in deta""ils|appro""priate|abo""ve|sim""ilar|\\?\\?" docs/superpowers/plans/2026-06-10-datapath-validation.md
  ```

  Expected result: no matches.

- [ ] Run final tests:

  ```bash
  pnpm test
  ```

  Expected result: all tests pass.
