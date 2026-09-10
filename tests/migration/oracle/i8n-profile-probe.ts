import { writeFileSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { it, expect } from "vitest"
import { createConfigurationLanguages, parseXmlDocumentWithSaxes, parseMetadataYaml, compileValidationSchema, validateParsedFileWithIssues, evaluateParsedXmlAnomalyBoundaries } from "../../../packages/runtime/index"
import type { I8nTextPropertyRule } from "../../../packages/rules/metadata/commonObjects/i8nText/types"
import { createDirectRoundTripContexts, testMetadataItemYamlRoundTrip, withDirectMetadataExecution, type DirectRoundTripContexts } from "../../../packages/rules/tests/directConversion"

import { metadataRules } from "../../../packages/rules/metadata/composition/metadataRules"
import { createMetadataExecutionRegistrySets } from "../../../packages/rules/metadata/composition/metadataExecutionContext"
import { createRegisteredMetadataRuleValidator } from "../../../packages/rules/metadata/validation/metadataRuleValidator"
import { prepareTestXmlAnomalyAssignment } from "../../../packages/rules/metadata/xmlAnomalies/testSupport"
import { createRuleSchemaRuntime, type MetadataItemRule } from "../../../packages/runtime/rule-kit"

it("records complete I8n round-trip profiles for migration research", () => {
  const item = (language: string, content: string) => `<v8:item><v8:lang>${language}</v8:lang><v8:content>${content}</v8:content></v8:item>`
  const samples = [
    { id: "missing", body: "" },
    { id: "empty-container", body: "<Title/>" },
    { id: "empty-primary", body: `<Title>${item("ru", "")}</Title>` },
    { id: "primary-text", body: `<Title>${item("ru", "Текст")}</Title>` },
    { id: "foreign-only", body: `<Title>${item("en", "Text")}</Title>` },
    { id: "equal-name", body: `<Title>${item("ru", "Test name")}</Title>`, name: "TestName" },
    { id: "equal-name-with-foreign", body: `<Title>${item("ru", "Test name")}${item("en", "Text")}</Title>`, name: "TestName" },
    { id: "unknown-language", body: `<Title>${item("de", "Text")}</Title>` },
    { id: "separated-duplicate", body: `<Title>${item("ru", "Первый")}${item("en", "Text")}${item("ru", "Второй")}</Title>` },
    { id: "empty-first-duplicate", body: `<Title>${item("ru", "")}${item("ru", "Второй")}</Title>` },
    { id: "noncanonical-order", body: `<Title>${item("en", "Text")}${item("ru", "Текст")}</Title>` },
    { id: "service-empty-code", body: `<Title>${item("", "Служебный")}${item("ru", "Текст")}</Title>` },
    { id: "service-hash-code", body: `<Title>${item("#", "Служебный")}${item("ru", "Текст")}</Title>` },
    { id: "typed-empty", body: '<Title xsi:type="v8:LocalStringType"/>' },
    { id: "typed-text", body: `<Title xsi:type="v8:LocalStringType">${item("ru", "Текст")}</Title>` },
    { id: "nil", body: '<Title xsi:nil="true"/>' },
  ]
  const validationRules = createMetadataExecutionRegistrySets(metadataRules).rules
  const rows: unknown[] = []
  for (let mask = 0; mask < 16; mask++) {
    const parameters = { preserveEmptyXML: Boolean(mask & 1), excludeIfEqualNameYAML: Boolean(mask & 2), skipEmptyToXML: Boolean(mask & 4), typedXML: Boolean(mask & 8) }
    const property: I8nTextPropertyRule = {
      type: "I8nText", xml: "Title", yaml: "Заголовок",
      ...(parameters.preserveEmptyXML ? { preserveEmptyXML: true } : {}),
      ...(parameters.excludeIfEqualNameYAML ? { excludeIfEqualNameYAML: true } : {}),
      ...(parameters.skipEmptyToXML ? { skipEmptyToXML: true } : {}),
      ...(parameters.typedXML ? { typedXML: true } : {}),
    }
    for (const sample of samples) {
      const sourceXML = `<Root>${sample.body}</Root>`
      const base = createDirectRoundTripContexts()
      const languages = createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] })
      const contexts: DirectRoundTripContexts = { importContext: { ...base.importContext, languages }, exportContext: context => ({ ...base.exportContext(context), languages }) }
      const input = { profile: mask, parameters, case: sample.id, name: sample.name, sourceXML, sourceSha256: createHash("sha256").update(sourceXML).digest("hex") }
      let stage = "round-trip"
      try {
        const rule: MetadataItemRule = { itemType: "MigrationI8nProfile", properties: {
          root: { type: "XMLRoot", container: "Root", isFileRoot: true, xmlOnly: true, rootAttributes: {} }, title: property,
        } }
        const result = testMetadataItemYamlRoundTrip({ sourceXML, name: sample.name, contexts, rule })
        stage = "boundary-validation"
        const parsed = parseMetadataYaml(result.yamlText)
        const prepared = prepareTestXmlAnomalyAssignment({ parsed, rootRule: rule })
        const validationIssues = withDirectMetadataExecution(() => createRegisteredMetadataRuleValidator({ context: contexts.importContext, rules: validationRules }).validateBoundary({
          yaml: prepared.preparedYamlFile.data, annotations: prepared.preparedYamlFile.annotations, rule, yamlPath: [], name: sample.name,
        }))
        const evaluated = withDirectMetadataExecution(() => {
          const runtime = createRuleSchemaRuntime(validationRules, name => new Error(`Unknown schema ${name}`))
          const graph = runtime.exportGraph({ context: contexts.importContext, roots: [{ key: "root", rule, includeNestedChildItems: true }], explicitXMLValues: true, validationPropertyRefs: true })
          const structural = validateParsedFileWithIssues({ filePath: "profile.yaml", parsed, schema: compileValidationSchema(graph.schemas, graph.roots.root!), evaluateXmlAnomalies: false })
          return evaluateParsedXmlAnomalyBoundaries({ filePath: "profile.yaml", parsed, diagnostics: [], issues: [...structural.issues, ...validationIssues.filter(issue => issue.code === "diagnostic.structure")] })
        })
        const source = parseXmlDocumentWithSaxes(sourceXML).roots[0]!
        const restored = parseXmlDocumentWithSaxes(result.result).roots[0]!
        rows.push({ ...input, outcome: source.structuralHash === restored.structuralHash ? "preserved" : "different", yaml: result.yamlText, validationIssues, visibleIssues: evaluated.issues, anomalyBoundaries: evaluated.boundaries, restoredXML: result.result })
      } catch (error) {
        rows.push({ ...input, outcome: "error", errorStage: stage, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  writeFileSync(resolve("../../tests/migration/i8n-full-round-trip-observations.json"), JSON.stringify({ version: 3, baselineCommit: "2af2f299ed8241eac78d4db46b4a8421efe2f8f7", source: [
    "packages/rules/tests/directConversion.ts",
    "packages/rules/metadata/commonObjects/i8nText/fromXMLToYAML.ts",
    "packages/rules/metadata/commonObjects/i8nText/fromXML.ts",
    "packages/rules/metadata/commonObjects/i8nText/fromYAML.ts",
    "packages/rules/metadata/commonObjects/i8nText/toXML.ts",
    "packages/rules/metadata/commonObjects/i8nText/toYAML.ts",
    "packages/rules/metadata/fullSyncToXml/xmlAnomalyAssignment.ts",
    "packages/rules/metadata/validation/metadataRuleValidator.ts",
    "packages/rules/metadata/xmlAnomalies/testSupport.ts",
    "packages/runtime/metadata/validation/validateFile.ts",
    "tests/migration/oracle/i8n-profile-probe.ts",
  ].map(path => ({ path, sha256: createHash("sha256").update(readFileSync(resolve("../..", path))).digest("hex") })), scope: "Read-only TS oracle observations through import proof and final YAML export; not approved Rust expectations. Successful round-trips run registered boundary validation and full root schema validation, including duplicate annotated keys and final annotation acceptance. Raw boundary issues and final visible issues are recorded separately; project-wide validation is not run. No new raw policy is authorized.", rows }, null, 2) + "\n")
  expect(rows).toHaveLength(256)
  expect(rows).toContainEqual(expect.objectContaining({ profile: 0, case: "primary-text", outcome: "preserved", validationIssues: [] }))
})
