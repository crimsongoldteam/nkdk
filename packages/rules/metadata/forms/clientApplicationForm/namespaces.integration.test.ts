import { describe, expect, it } from "vitest"
import { createXmlAnomalyAnnotations, parseMetadataYaml, parseXmlDocumentWithSaxes, serializeYAMLDocument, xmlExport } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import "../../../tests/metadataExecutionContext"
import { createDirectRoundTripContexts } from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { metadataRules } from "../../composition/metadataRules"
import { createImportLocalRoundTrip } from "../../importFromXml/localRoundTrip"
import { prepareTestXmlAnomalyAssignment } from "../../xmlAnomalies/testSupport"
import { buildPreparedAssignmentXml } from "../../fullSyncToXml/xmlAnomalyAssignment"
import { prepareClientApplicationFormRootOutput } from "./convertYAMLToXML"
import { importClientApplicationFormFromXMLToYAML } from "./fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import { ClientApplicationFormRules, FormRulesTags } from "./rules"
import type { ClientApplicationFormYAML } from "./types"

describe("пространства имён структурного XML формы", () => {
  it.each([false, true])("сохраняет xmlns в YAML без записи в снимок; dcssch: %s", (present) => {
    const original = readXMLFixtureAsString(import.meta.url, "minimal.xml")
    const source = parseXmlDocumentWithSaxes(present ? original : original.replace(/ xmlns:dcssch="[^"]+"/u, "")).roots[0]!
    Object.defineProperty(source, "compatibilityValue", { get() { throw new Error("Не читать compatibility") } })
    const metadata = parseXmlDocumentWithSaxes(readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml")).roots[0]!
    const contexts = createDirectRoundTripContexts({ logicalAddress: "Форма.Минимальная" })
    const annotations = createXmlAnomalyAnnotations()
    const roundTrip = createImportLocalRoundTrip({
      execution: createRuleRegistrySet(metadataRules).execution,
      context: contexts.exportContext(), annotations, decisions: [],
      prepareRootOutput: params => params.source === source || params.source === metadata
        ? prepareClientApplicationFormRootOutput({ ...params, context: contexts.exportContext() }) : undefined,
      prepareRootRawPathPrefix: ({ tags }) => tags?.includes(FormRulesTags.Form) ? ["@Form"] : undefined,
    })
    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext, formName: "Минимальная", formXML: source, metadataXML: metadata,
      annotations, roundTrip,
    })
    expect(annotations.at(imported.yaml as object, "@Form")?.xml)
      .toEqual(present ? undefined : { "_xmlns:dcssch": null })
    const exportContext = contexts.exportContext()
    const prepared = prepareTestXmlAnomalyAssignment({
      parsed: parseMetadataYaml(serializeYAMLDocument(imported.yaml, annotations).text), rootRule: ClientApplicationFormRules,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: exportContext, yaml: prepared.preparedYamlFile.data as ClientApplicationFormYAML, name: "Минимальная",
    })
    expect(exportContext.exportToXML.configurationIndex?.collector.fragment("Тест.yaml").entities
      .some(entity => entity.logicalAddress.includes("XMLNamespace"))).toBe(false)
    const restored = buildPreparedAssignmentXml({ context: exportContext, document: {
      targetXmlPath: "Ext/Form.xml", xml: { Form: converted.formXML }, deferred: [], rootRule: ClientApplicationFormRules,
      rawBoundaries: prepared.rawBoundaries.filter(boundary => boundary.documentSelector === "Form" || boundary.tag === FormRulesTags.Form),
    } })
    expect(restored.trim()).toBe(xmlExport([source]).trim())
  })
})
