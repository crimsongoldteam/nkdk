import { expect, it } from "vitest"
import { registerCoreMetadata } from "../../register"
import { resolvePartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"

registerCoreMetadata()

it("регистрирует корневые спутники частичного XML-пакета", () => {
  const topology = compileRegisteredMetadataResourceTopology()
  const assignment = topology.assignments.find((candidate) => candidate.projectPattern === "Конфигурация.yaml")!
  const configuration = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Configuration.xml"
  )!
  const clientInterface = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Ext/ClientApplicationInterface.xml"
  )!
  const policy = resolvePartialXmlPackagePolicy(topology).assignments.get(assignment.id)

  expect(policy).toEqual({
    assignmentId: assignment.id,
    loadDocumentIds: [configuration.id],
    structural: {
      includeOwnerAssignment: false,
      includeCurrentMemberSubtree: false,
      stopAtOwner: true,
    },
    companionDocuments: [{ documentId: clientInterface.id, loadTarget: false }],
    companionReferences: [{
      yamlPath: ["ОсновнойЯзык"],
      include: "targetAssignment",
      loadTarget: true,
    }],
  })
})
