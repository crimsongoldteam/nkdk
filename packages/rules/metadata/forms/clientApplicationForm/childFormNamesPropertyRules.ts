import type { ChildFormNamesPropertyRule } from "../../commonObjects/childFormNames/types"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { MetadataResourceDeclaration } from "@nkdk/runtime/rule-kit"
import { syncChildFormNamesFromXML } from "./childFormNamesImportAdapter"
import { ClientApplicationFormRules } from "./rules"
import {
  describeFormAssignmentInputResourceDeclarations,
  describeFormExternalResourceDeclarations,
} from "./externalItemFiles"

export const childFormNamesPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("ChildFormNames", "resourceTopology", ({ propertyRule }) => {
      const childFormPropertyRule = propertyRule as
        | ChildFormNamesPropertyRule
        | undefined
      const folderName = childFormPropertyRule?.folderName ?? "Формы"
      const childFormRule =
        childFormPropertyRule?.itemRule ?? ClientApplicationFormRules
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
          projectRole: "form",
          itemRule: childFormRule,
          logicalAddressSegment: "Форма",
          fileBackedTarget: {
            kind: "member",
            memberKind: "Form",
            itemNameParameter: "itemName",
            itemProjectPattern: `${folderName}/{itemName}`,
            owner: "assignmentOwner",
          },
          dumpInfoNamePatterns: [
            "{dumpRoot}.{ownerName}.Form.{itemName}",
            "{dumpRoot}.{ownerName}.Form.{itemName}.Form",
          ],
          source,
        },
        {
          kind: "yamlCompanion",
          assignmentProjectPattern: "",
          projectPattern: `${folderName}/{itemName}/БазоваяФорма.yaml`,
          required: false,
          itemRule: ClientApplicationFormRules,
          projectRole: "form",
          indexContribution: "isolated",
          logicalAddressSegment: "ОсноваФормы",
          source,
        },
        {
          kind: "xmlDocument",
          assignmentProjectPattern: "",
          xmlPattern: "Forms/{itemName}.xml",
          role: "metadata",
          required: true,
          read: { inputRole: "metadata" },
          prepareCapabilityId: "ClientApplicationForm",
          source,
        },
        {
          kind: "xmlDocument",
          assignmentProjectPattern: "",
          xmlPattern: "Forms/{itemName}/Ext/Form.xml",
          role: "body",
          required: false,
          read: { inputRole: "body" },
          prepareCapabilityId: "ClientApplicationForm",
          baseInput: { kind: "sameProjectPath", value: "wholeYaml" },
          source,
        },
        {
          kind: "externalFile",
          assignmentProjectPattern: "",
          projectPattern: `${folderName}/{itemName}/Модуль.bsl`,
          xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
          direction: "both",
          transferCapabilityId: "ChildFormNames",
          dumpInfoNamePatterns: [
            "{dumpRoot}.{ownerName}.Form.{itemName}",
            "{dumpRoot}.{ownerName}.Form.{itemName}.Form",
          ],
          compositionImpact: "none",
          source,
        },
        ...describeFormExternalResourceDeclarations({
          xmlFormDirPattern: "Forms/{itemName}/Ext",
          targetFormDirPattern: `${folderName}/{itemName}`,
        }),
        {
          kind: "xmlDocument",
          assignmentProjectPattern: "",
          xmlPattern: "Forms/{itemName}/Ext/Help.xml",
          role: "property",
          required: false,
          read: { inputRole: "property" },
          prepareCapabilityId: "ClientApplicationFormHelp",
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
        ...describeFormAssignmentInputResourceDeclarations({
          targetFormDirPattern: `${folderName}/{itemName}`,
          source,
        }),
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
    }),
    definePropertyTypeRule("ChildFormNames", "fileChildNamesDescriptor", ({ propertyRule }) => {
      const rule = propertyRule as ChildFormNamesPropertyRule
      return {
        folderName: rule.folderName,
        xmlFolderName: "Forms",
        xmlItemName: rule.xml,
        useOwnerDirectoryForExternalSync: true,
        preserveReferenceXmlFolder: true,
        expectedNames: ({ rule: ownerRule, yaml, propertyValue }) => [
          ...normalizeFormNames(propertyValue),
          ...collectMetadataTargetFormNames({ rule: ownerRule, yaml }),
        ],
      }
    }),
    definePropertyTypeRule(
      "ChildFormNames",
      "syncExternalFromXML",
      syncChildFormNamesFromXML,
    ),
  ]),
})

function normalizeFormNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.length > 0)
}

function collectMetadataTargetFormNames(params: {
  rule: MetadataItemRule
  yaml: Record<string, unknown>
}): string[] {
  const result = new Set<string>()
  for (const propertyRule of Object.values(params.rule.properties)) {
    if (propertyRule.type === "ChildFormNames") continue
    const target =
      propertyRule.metadataTarget ??
      (propertyRule.referenceScope?.target === "this" &&
      propertyRule.referenceScope.kind === "Form"
        ? { kind: "member" as const, memberKinds: ["Form" as const] }
        : undefined)
    if (target === undefined) continue
    const value =
      typeof propertyRule.yaml === "string" ? params.yaml[propertyRule.yaml] : undefined
    if (typeof value !== "string") continue
    const parts = value.split(".")
    const formIndex = parts.lastIndexOf("Form")
    if (formIndex >= 0 && parts[formIndex + 1]) result.add(parts[formIndex + 1])
  }
  return [...result]
}
