import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { MetadataResourceDeclaration } from "../../resourceTopology/types"
import type { ChildTemplateNamesPropertyRule } from "./types"

registerTypeRule("ChildTemplateNames", "resourceTopology", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildTemplateNamesPropertyRule | undefined)?.folderName ?? "Макеты"
  const source = { kind: "property" as const, description: "ChildTemplateNames" }
  const declarations: MetadataResourceDeclaration[] = [
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/Template.xml`,
      xmlPattern: "Templates/{itemName}.xml",
      direction: "both",
      transferCapabilityId: "ChildTemplateNames",
      compositionImpact: "none",
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
