import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { MetadataResourceDeclaration } from "../../resourceTopology/core/types"
import type { ChildTemplateNamesPropertyRule } from "./types"

export const metadataPropertyRule000 = definePropertyTypeRule("ChildTemplateNames", "resourceTopology", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildTemplateNamesPropertyRule | undefined)?.folderName ?? "Макеты"
  const source = { kind: "property" as const, description: "ChildTemplateNames" }
  const fileBackedTarget = {
    kind: "member" as const,
    memberKind: "Template" as const,
    itemNameParameter: "itemName",
    itemProjectPattern: `${folderName}/{itemName}`,
    owner: "assignment" as const,
  }
  const declarations: MetadataResourceDeclaration[] = [
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/Template.xml`,
      xmlPattern: "Templates/{itemName}.xml",
      direction: "both",
      transferCapabilityId: "ChildTemplateNames",
      compositionImpact: "none",
      fileBackedTarget,
      source,
    },
    ...(["txt", "bin"] as const).map(
      (extension): MetadataResourceDeclaration => ({
        kind: "externalFile",
        assignmentProjectPattern: "",
        projectPattern: `${folderName}/{itemName}/Template.${extension}`,
        xmlPattern: `Templates/{itemName}/Ext/Template.${extension}`,
        direction: "both",
        transferCapabilityId: "ChildTemplateNames",
        compositionImpact: "none",
        fileBackedTarget,
        source,
      })
    ),
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/{relativePath...}`,
      xmlPattern: "Templates/{itemName}/{relativePath...}",
      direction: "both",
      transferCapabilityId: "ChildTemplateNames",
      fallback: true,
      compositionImpact: "none",
      fileBackedTarget,
      source,
    },
  ]
  return declarations
})

export const metadataPropertyRule001 = definePropertyTypeRule("ChildTemplateNames", "fileChildNamesDescriptor", ({ propertyRule }) => {
  const rule = propertyRule as ChildTemplateNamesPropertyRule
  return {
    folderName: rule.folderName,
    xmlFolderName: "Templates",
    xmlItemName: rule.xml,
    useOwnerDirectoryForExternalSync: true,
    preserveReferenceXmlFolder: true,
    expectedNames: ({ propertyValue }) =>
      Array.isArray(propertyValue) ? propertyValue.filter((item): item is string => typeof item === "string") : [],
  }
})
