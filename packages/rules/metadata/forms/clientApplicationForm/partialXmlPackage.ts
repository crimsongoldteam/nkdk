import {
  registerPartialXmlPackagePolicy,
  type PartialXmlPackagePolicyRegistration,
} from "../../partialSyncToXml/packagePolicy"

export const childFormPartialXmlPackagePolicy = {
  assignment: {
    assignmentPattern: "{ownerPath...}/Формы/{itemName}/Форма.yaml",
    loadDocumentRoles: ["metadata", "body"],
    structural: {
      includeOwnerAssignment: true,
      includeCurrentMemberSubtree: true,
      stopAtOwner: true,
    },
    yamlCompanionInputs: [{
      projectPattern: "{ownerPath...}/Формы/{itemName}/БазоваяФорма.yaml",
    }],
  },
  externalFiles: [{
    projectPattern: "{ownerPath...}/Формы/{itemName}/{relativePath...}",
    loadTarget: true,
  }],
} as const satisfies PartialXmlPackagePolicyRegistration

export const commonFormPartialXmlPackagePolicy = {
  assignment: {
    assignmentPattern: "ОбщаяФорма/{ownerName}/Свойства.yaml",
    loadDocumentRoles: ["metadata", "body"],
    yamlCompanionInputs: [{
      projectPattern: "ОбщаяФорма/{ownerName}/БазоваяФорма.yaml",
    }],
  },
} as const satisfies PartialXmlPackagePolicyRegistration

registerPartialXmlPackagePolicy(childFormPartialXmlPackagePolicy)
registerPartialXmlPackagePolicy(commonFormPartialXmlPackagePolicy)
