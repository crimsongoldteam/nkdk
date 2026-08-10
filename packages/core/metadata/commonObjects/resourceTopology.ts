import { posix } from "path"
import type {
  ExternalPicturePropertyRule,
} from "./externalPicture/types"
import type { ExternalFilePropertyRule } from "./externalFile/types"
import type { HelpPropertyRule, ModulePropertyRule, PropertyRule, TemplatePropertyRule } from "../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { MetadataResourceDeclaration, MetadataResourceSource } from "../resourceTopology/core/types"
import { registerMetadataExternalTransferCapability } from "../resourceTopology/adapters/capabilities"

const source = (description: string): MetadataResourceSource => ({
  kind: "property",
  description,
})

const identityTransfer = (params: { sourcePath: string; targetPath: string }) => params
for (const id of [
  "Module",
  "Template",
  "Help",
  "ExternalFile",
  "ExternalPicture",
  "WSDefinitionSchemas",
  "Recalculations",
  "ChildFormNames",
  "ChildTemplateNames",
] as const) {
  registerMetadataExternalTransferCapability({ id, projectToXml: identityTransfer })
}

const pathPattern = (
  value: string | ((params: { name: string; parentName?: string }) => string)
): string =>
  typeof value === "string"
    ? value
    : value({ name: "{currentName}", parentName: "{parentName}" })

const external = (params: {
  description: string
  projectPattern: string
  xmlPattern: string
  transferCapabilityId: string
  fallback?: boolean
  dumpInfoNamePatterns?: readonly string[]
}): MetadataResourceDeclaration => ({
  kind: "externalFile",
  assignmentProjectPattern: "",
  projectPattern: params.projectPattern,
  xmlPattern: params.xmlPattern,
  direction: "both",
  transferCapabilityId: params.transferCapabilityId,
  ...(params.fallback === undefined ? {} : { fallback: params.fallback }),
  ...(params.dumpInfoNamePatterns === undefined ? {} : { dumpInfoNamePatterns: params.dumpInfoNamePatterns }),
  compositionImpact: "none",
  source: source(params.description),
})

const describeModuleResources = ({ propertyRule }: { propertyRule?: PropertyRule }): readonly MetadataResourceDeclaration[] => {
  const rule = propertyRule as ModulePropertyRule | TemplatePropertyRule
  const projectPattern = pathPattern(rule.nkdkPath)
  const xmlPattern = pathPattern(rule.xmlPath)
  const result: MetadataResourceDeclaration[] = [
    external({
      description: rule.type,
      projectPattern,
      xmlPattern,
      transferCapabilityId: rule.type,
      dumpInfoNamePatterns:
        rule.externalMetadata?.segment === undefined
          ? undefined
          : ["{dumpRoot}.{ownerName}", `{dumpRoot}.{ownerName}.${rule.externalMetadata.segment}`],
    }),
  ]

  if (projectPattern.toLowerCase().endsWith(".bsl") && xmlPattern.toLowerCase().endsWith(".bsl")) {
    result.push(
      external({
        description: rule.type,
        projectPattern: projectPattern.replace(/\.bsl$/i, ".bin"),
        xmlPattern: xmlPattern.replace(/\.bsl$/i, ".bin"),
        transferCapabilityId: rule.type,
      })
    )
  }

  if (rule.type === "Template" && projectPattern.toLowerCase().endsWith(".xml") && xmlPattern.toLowerCase().endsWith(".xml")) {
    const projectBase = projectPattern.replace(/\.xml$/i, "")
    const xmlBase = xmlPattern.replace(/\.xml$/i, "")
    for (const extension of [".bin", ".txt"]) {
      result.push(
        external({
          description: rule.type,
          projectPattern: `${projectBase}${extension}`,
          xmlPattern: `${xmlBase}${extension}`,
          transferCapabilityId: rule.type,
        })
      )
    }
    result.push(
      external({
        description: rule.type,
        projectPattern: `${projectBase}/{relativePath...}`,
        xmlPattern: `${xmlBase}/{relativePath...}`,
        transferCapabilityId: rule.type,
        fallback: true,
      })
    )
  }
  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("Module", "resourceTopology", describeModuleResources)
export const metadataPropertyRule001 = definePropertyTypeRule("Template", "resourceTopology", describeModuleResources)

export const metadataPropertyRule002 = definePropertyTypeRule("Help", "resourceTopology", ({ propertyRule }) => {
  const rule = propertyRule as HelpPropertyRule
  const rawXmlPath = rule.xmlPath ?? rule.filePath
  const xmlPattern = pathPattern(rawXmlPath)
  return [
    {
      kind: "xmlDocument",
      assignmentProjectPattern: "",
      xmlPattern,
      role: "property",
      required: false,
      read: { inputRole: "property" },
      prepareCapabilityId: "Help",
      source: source("Help"),
    },
    {
      ...external({
        description: "Help",
        projectPattern: `${rule.nkdkDir}/{relativePath...}`,
        xmlPattern: `${xmlPattern.replace(/\.xml$/i, "")}/{relativePath...}`,
        transferCapabilityId: "Help",
      }),
      selection: {
        manifestPattern: xmlPattern,
        listPath: ["Help", "Page"],
        candidateParameter: "relativePath",
        candidateSuffix: ".html",
        alwaysIncludePrefixes: ["_files/"],
      },
    },
  ]
})

export const metadataPropertyRule003 = definePropertyTypeRule("ExternalFile", "resourceTopology", ({ propertyRule }) => {
  const rule = propertyRule as ExternalFilePropertyRule
  return [
    external({
      description: "ExternalFile",
      projectPattern: rule.nkdkPath,
      xmlPattern: rule.xmlPath,
      transferCapabilityId: "ExternalFile",
    }),
  ]
})

export const metadataPropertyRule004 = definePropertyTypeRule("ExternalPicture", "resourceTopology", ({ propertyRule }) => {
  const rule = propertyRule as ExternalPicturePropertyRule
  return [
    external({
      description: "ExternalPicture",
      projectPattern: `${rule.nkdkDir}/${posix.basename(rule.xmlPath)}`,
      xmlPattern: rule.xmlPath,
      transferCapabilityId: "ExternalPicture",
    }),
    {
      ...external({
        description: "ExternalPicture",
        projectPattern: `${rule.nkdkDir}/{relativePath...}`,
        xmlPattern: `${rule.payloadXmlDir}/{relativePath...}`,
        transferCapabilityId: "ExternalPicture",
      }),
      fallback: true,
    },
  ]
})

export const metadataPropertyRule005 = definePropertyTypeRule("WSDefinitionSchemas", "resourceTopology", () => [
  external({
    description: "WSDefinitionSchemas",
    projectPattern: "XSD/{itemName}.xsd",
    xmlPattern: "Ext/{itemName}.xsd",
    transferCapabilityId: "WSDefinitionSchemas",
  }),
])

export const metadataPropertyRule006 = definePropertyTypeRule("Recalculations", "resourceTopology", () => [
  external({
    description: "Recalculations",
    projectPattern: "Перерасчеты/{itemName}/Свойства.xml",
    xmlPattern: "Recalculations/{itemName}.xml",
    transferCapabilityId: "Recalculations",
  }),
])
