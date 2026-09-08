import fs from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import {
  createConfigurationIndexCollector, createConfigurationIndexExportRuntime,
  parseMetadataYaml, parseXmlDocumentWithSaxes, serializeYAMLDocument,
} from "@nkdk/runtime"
import { directPropertyRuleExecution } from "./directConversion"
import { mockContextToXML, mockXmlImportContext } from "./mockContext"
import { testConfigurationIndexReader } from "./configurationIndex"
import { createLayeredOwnerMetadataCacheForTests } from "./layeredOwnerMetadataCache"
import { prepareImportFacts } from "../metadata/importFromXml/prepareFacts"
import { prepareImportYamlFromDocuments } from "../metadata/importFromXml/prepareYaml"
import { prepareImportDependencies } from "../metadata/importFromXml/preparedDependencies"
import { createFormDataPathIndexFromFacts } from "../metadata/importFromXml/formDataPathFacts"
import { collectFormDataPathPreparationFromFacts } from "../metadata/importFromXml/formDataPathPreparation"
import { prepareFormDataPathContext } from "../metadata/forms/clientApplicationForm/formDataPathContext"
import { clientApplicationFormDataPathProjection } from "../metadata/forms/clientApplicationForm/formDataPathProjection"
import { compileRegisteredMetadataResourceTopology } from "../metadata/resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../metadata/resourceTopology/core/projectProjection"
import type { ImportAssignment } from "../metadata/importFromXml/types"
import { prepareFullXmlSyncAssignment } from "../metadata/fullSyncToXml/prepareAssignment"
import { fullXmlSyncTestTopologyFields } from "../metadata/fullSyncToXml/testTopology"
import { buildPreparedAssignmentXml } from "../metadata/fullSyncToXml/xmlAnomalyAssignment"

/** Настоящие два прохода формы, сохранение YAML/ресурсов и обычный экспорт без reference. */
export async function testFormYamlRoundTrip(params: { formXML: string; metadataXML: string; name: string }) {
  const formDir = await fs.mkdtemp(join(tmpdir(), "nkdk-form-round-trip-"))
  try {
    const topology = compileRegisteredMetadataResourceTopology()
    const targetProjectPath = `Справочник/Товары/Формы/${params.name}/Форма.yaml`
    const match = classifyMetadataProjectPath(topology, targetProjectPath)
    if (match?.assignment === undefined) throw new Error("Не найден маршрут формы")
    const assignment: ImportAssignment = {
      id: "form-round-trip", role: "fileItem", itemType: "ClientApplicationForm", itemName: params.name,
      targetProjectPath, logicalAddress: `Справочник.Товары.Форма.${params.name}`,
      topologyAddress: { nodeId: match.assignment.id, values: match.values },
      owner: { itemType: "MetadataCatalog", name: "Товары", logicalAddress: "Справочник.Товары" },
      xmlFiles: [{ role: "metadata", sourcePath: "Metadata.xml" }, { role: "body", sourcePath: "Form.xml" }],
      externalFiles: [],
    }
    const parseInputs = () => assignment.xmlFiles.map(input => ({
      input, document: parseXmlDocumentWithSaxes(input.role === "body" ? params.formXML : params.metadataXML),
    }))
    const context = mockXmlImportContext()
    const facts = await prepareImportFacts({
      assignment, context, inputs: parseInputs(), topology, collector: createConfigurationIndexCollector(),
      execution: directPropertyRuleExecution,
    })
    for (const resource of facts.generatedFiles) {
      const path = join(formDir, resource.relativePath)
      await fs.mkdir(dirname(path), { recursive: true })
      await fs.writeFile(path, resource.content)
    }
    const ownerCache = createLayeredOwnerMetadataCacheForTests({ base: [] })
    const exportContext = mockContextToXML()
    exportContext.importFromYAML = { ...exportContext.importFromYAML, formDir, ownerMetadataCache: ownerCache }
    exportContext.exportToXML = { ...exportContext.exportToXML, configurationIndex: createConfigurationIndexExportRuntime({
      source: testConfigurationIndexReader(facts.configurationFragment.entities),
      collector: createConfigurationIndexCollector(), targetProjectPath,
      logicalAddress: assignment.logicalAddress, operationSeed: new Uint8Array(32),
    }) }
    const index = createFormDataPathIndexFromFacts({
      facts: facts.semanticFacts, localIndexes: facts.localIndexes, projection: clientApplicationFormDataPathProjection,
    })
    const imported = await prepareImportYamlFromDocuments({
      assignment, context, inputs: parseInputs(), topology, collector: createConfigurationIndexCollector(),
      dependencies: prepareImportDependencies(facts.dependencies, {}, directPropertyRuleExecution),
      formProofDataPathContext: prepareFormDataPathContext({
        preparation: collectFormDataPathPreparationFromFacts({ facts: facts.semanticFacts, index }), ownerCache,
      }),
      localRoundTrip: { execution: directPropertyRuleExecution, context: exportContext, decisions: [] },
    })
    const yamlText = serializeYAMLDocument(imported.yaml, imported.annotations).text
    const parsed = parseMetadataYaml(yamlText)
    const prepared = prepareFullXmlSyncAssignment({
      assignment: {
        id: assignment.id, role: "form", itemType: assignment.itemType, itemName: params.name,
        logicalAddress: assignment.logicalAddress, owner: assignment.owner,
        sourceProjectPath: targetProjectPath, sourcePath: join(formDir, "Форма.yaml"), expectedContentHash: 0n,
        ...fullXmlSyncTestTopologyFields(targetProjectPath),
      },
      preparedYamlFile: {
        projectPath: targetProjectPath, filePath: join(formDir, "Форма.yaml"), role: "form",
        owner: { dir: "Справочник", name: "Товары" }, data: parsed.data,
        annotations: parsed.annotations, syntaxDiagnostics: [],
      },
      context: exportContext, index: testConfigurationIndexReader(facts.configurationFragment.entities),
      operationSeed: new Uint8Array(32), topology, composition: { children: () => [] },
    })
    return {
      yamlText,
      documents: new Map(prepared.documents.map(document => [document.targetXmlPath.endsWith("/Form.xml") ? "body" : "metadata", buildPreparedAssignmentXml({
        context: exportContext, document,
      })])),
    }
  } finally {
    await fs.rm(formDir, { recursive: true, force: true })
  }
}
