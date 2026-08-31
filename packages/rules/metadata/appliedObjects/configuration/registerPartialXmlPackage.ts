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
    companionDocuments: [
      {
        xmlPattern: "Ext/ClientApplicationInterface.xml",
        loadTarget: true,
      },
      {
        xmlPattern: "Ext/CommandInterface.xml",
        loadTarget: true,
      },
      {
        xmlPattern: "Ext/HomePageWorkArea.xml",
        loadTarget: true,
      },
      {
        xmlPattern: "Ext/MainSectionCommandInterface.xml",
        loadTarget: true,
      },
    ],
    companionReferences: [{
      yamlPath: ["ОсновнойЯзык"],
      include: "targetAssignment",
      loadTarget: true,
      required: false,
    }],
  },
  externalFiles: [{ projectPattern: "{relativePath...}", loadTarget: true }],
})
