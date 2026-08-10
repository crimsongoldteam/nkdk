import { registerPartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"

registerPartialXmlPackagePolicy({
  assignment: {
    assignmentPattern: "Конфигурация.yaml",
    loadDocumentRoles: ["metadata"],
    structural: {
      includeOwnerAssignment: false,
      includeCurrentMemberSubtree: false,
      stopAtOwner: true,
    },
    companionDocuments: [{
      xmlPattern: "Ext/ClientApplicationInterface.xml",
      loadTarget: false,
    }],
    companionReferences: [{
      yamlPath: ["ОсновнойЯзык"],
      include: "targetAssignment",
      loadTarget: true,
    }],
  },
  externalFiles: [{ projectPattern: "{relativePath...}", loadTarget: true }],
})
