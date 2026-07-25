import type { MetadataItemRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataResourceDeclaration } from "../../resourceTopology/types"
import type { ChildTemplateNamesPropertyRule } from "./types"

const externalTemplateRule: MetadataItemRule = {
  itemType: "ExternalTemplate",
  properties: {},
}

registerTypeRule("ChildTemplateNames", "resourceTopology", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildTemplateNamesPropertyRule | undefined)?.folderName ?? "Макеты"
  const source = { kind: "property" as const, description: "ChildTemplateNames" }
  const declarations: MetadataResourceDeclaration[] = [
    {
      kind: "content",
      projectPattern: `${folderName}/{itemName}/Template.xml`,
      role: "fileItem",
      required: true,
      repeatable: true,
      compositionImpact: "none",
      itemRule: externalTemplateRule,
      logicalAddressSegment: "Макет",
      source,
    },
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: "Templates/{itemName}.xml",
      role: "body",
      required: true,
      prepareCapabilityId: "ChildTemplateNames",
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
      source,
    },
  ]
  return declarations
})
