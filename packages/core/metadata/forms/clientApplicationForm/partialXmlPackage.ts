import {
  registerPartialXmlPackagePolicy,
  type PartialXmlPackagePolicyRegistration,
} from "../../partialSyncToXml/packagePolicy"

export const childFormPartialXmlPackagePolicy = {
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
} as const satisfies PartialXmlPackagePolicyRegistration

registerPartialXmlPackagePolicy(childFormPartialXmlPackagePolicy)
