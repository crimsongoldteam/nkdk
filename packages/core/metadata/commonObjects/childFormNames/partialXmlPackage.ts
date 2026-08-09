import { registerPartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"

registerPartialXmlPackagePolicy({
  assignment: {
    assignmentPattern: "{ownerPath...}/Формы/{itemName}/Форма.yaml",
    loadDocumentRoles: ["metadata"],
    structural: {
      includeOwnerAssignment: true,
      includeCurrentMemberSubtree: true,
      stopAtOwner: true,
    },
  },
  externalFiles: [{
    projectPattern: "{ownerPath...}/Формы/{itemName}/{relativePath...}",
    loadTarget: true,
  }],
})
