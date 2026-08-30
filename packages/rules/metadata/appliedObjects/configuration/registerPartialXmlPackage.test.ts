import { expect, it } from "vitest"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { resolvePartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"


it("регистрирует корневые спутники частичного XML-пакета", () => {
  const topology = createRuleRegistrySet(metadataRules).resourceTopology.get()
  const assignment = topology.assignments.find((candidate) => candidate.projectPattern === "Конфигурация.yaml")!
  const configuration = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Configuration.xml"
  )!
  const clientInterface = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Ext/ClientApplicationInterface.xml"
  )!
  const commandInterface = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Ext/CommandInterface.xml"
  )!
  const homePageWorkArea = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Ext/HomePageWorkArea.xml"
  )!
  const mainSectionCommandInterface = assignment.xmlDocuments.find(
    (document) => document.xmlPattern === "Ext/MainSectionCommandInterface.xml"
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
    companionDocuments: [
      { documentId: clientInterface.id, loadTarget: true },
      { documentId: commandInterface.id, loadTarget: true },
      { documentId: homePageWorkArea.id, loadTarget: true },
      { documentId: mainSectionCommandInterface.id, loadTarget: true },
    ],
    companionReferences: [{
      yamlPath: ["ОсновнойЯзык"],
      include: "targetAssignment",
      loadTarget: true,
      required: false,
    }],
    yamlCompanionInputIds: [],
  })
})
