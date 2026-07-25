import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import type { MetadataResourceDeclaration } from "../../resourceTopology/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ChildFormNamesPropertyRule } from "./types"

registerTypeRule("ChildFormNames", "resourceTopology", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildFormNamesPropertyRule | undefined)?.folderName ?? "Формы"
  const assignmentProjectPattern = `${folderName}/{itemName}/Форма.yaml`
  const source = { kind: "property" as const, description: "ChildFormNames" }
  const declarations: MetadataResourceDeclaration[] = [
    {
      kind: "content",
      projectPattern: assignmentProjectPattern,
      role: "fileItem",
      required: true,
      repeatable: true,
      compositionImpact: "none",
      itemRule: ClientApplicationFormRules,
      logicalAddressSegment: "Форма",
      source,
    },
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: "Forms/{itemName}.xml",
      role: "metadata",
      required: true,
      read: { inputRole: "metadata" },
      prepareCapabilityId: "ChildFormNames",
      source,
    },
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: "Forms/{itemName}/Ext/Form.xml",
      role: "body",
      required: true,
      read: { inputRole: "body" },
      prepareCapabilityId: "ChildFormNames",
      source,
    },
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/Модуль.bsl`,
      xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
      direction: "both",
      transferCapabilityId: "ChildFormNames",
      compositionImpact: "none",
      source,
    },
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern: "Forms/{itemName}/Ext/Help.xml",
      role: "property",
      required: false,
      read: { inputRole: "property" },
      prepareCapabilityId: "ChildFormNames",
      source,
    },
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/Справка/{relativePath...}`,
      xmlPattern: "Forms/{itemName}/Ext/Help/{relativePath...}",
      direction: "both",
      transferCapabilityId: "ChildFormNames",
      selection: {
        manifestPattern: "Forms/{itemName}/Ext/Help.xml",
        listPath: ["Help", "Page"],
        candidateParameter: "relativePath",
        candidateSuffix: ".html",
        alwaysIncludePrefixes: ["_files/"],
      },
      compositionImpact: "none",
      source,
    },
    {
      kind: "externalFile",
      assignmentProjectPattern: "",
      projectPattern: `${folderName}/{itemName}/{relativePath...}`,
      xmlPattern: "Forms/{itemName}/Ext/{relativePath...}",
      direction: "both",
      transferCapabilityId: "ChildFormNames",
      fallback: true,
      compositionImpact: "none",
      source,
    },
  ]
  return declarations
})
