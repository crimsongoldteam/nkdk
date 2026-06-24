import fs from "fs"
import { join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"
import type {
  ChildSubsystemNames,
  ChildSubsystemNamesPropertyRule,
  ChildSubsystemNamesXML,
} from "./types"

export const exportChildSubsystemNamesToXML = (
  value: ChildSubsystemNames | undefined
): ChildSubsystemNamesXML | undefined => {
  if (!value || value.length === 0) return undefined
  return value.length === 1 ? value[0] : value
}

registerTypeRule("ChildSubsystemNames", "exportToXML", (_context, _rule, value) =>
  exportChildSubsystemNamesToXML(value as ChildSubsystemNames | undefined)
)

export const syncChildSubsystemNamesToXML = async (params: {
  context: import("~/metadata/context/types").ConfigurationContextWithExportToXML
  rule: import("~/metadata/orchestration/property/types").PropertyRule
  nkdkDir: string
  xmlDir: string
  name: string
  referenceDir?: string
  referenceName?: string
  propertyValue?: unknown
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const childNames = normalizeChildNames(params.propertyValue).filter(isSafeName)
  if (!childNames.length) return

  const { syncAppliedObjectToXML } = await import("~/metadata/orchestration/appliedObject/syncToXML")
  const { MetadataSubsystemRules } = await import("~/metadata/appliedObjects/metadataSubsystem/rules")
  const nestedSubsystemRules = {
    ...MetadataSubsystemRules,
    externalMetadata: { segment: "Subsystem", placement: "ownedEntry" as const },
  }

  const folderName = getFolderName(params.rule)
  const childInputDir = join(params.nkdkDir, folderName)
  if (!fs.existsSync(childInputDir)) return

  const parentReferenceName = params.referenceName ?? params.name
  const childXmlDir = childSubsystemDir(params.xmlDir, params.name)
  const childReferenceDir = params.referenceDir ? childSubsystemDir(params.referenceDir, parentReferenceName) : undefined

  for (const childName of childNames) {
    await syncAppliedObjectToXML({
      rule: nestedSubsystemRules,
      context: params.context,
      inputDir: childInputDir,
      name: childName,
      outputDir: childXmlDir,
      referenceDir: childReferenceDir,
      referenceName: childName,
      externalOutputDir: join(childXmlDir, childName),
      externalReferenceDir: childReferenceDir ? join(childReferenceDir, childName) : undefined,
      xmlManifest: params.xmlManifest,
    })
  }
}

registerTypeRule("ChildSubsystemNames", "syncExternalToXML", syncChildSubsystemNamesToXML)

const getFolderName = (rule: import("~/metadata/orchestration/property/types").PropertyRule): string =>
  (rule as ChildSubsystemNamesPropertyRule).folderName ?? rule.yaml ?? "Подсистемы"

const isSafeName = (name: string): boolean => name !== "." && name !== ".." && !name.includes("/") && !name.includes("\\")

const childSubsystemDir = (xmlDir: string, name: string): string =>
  xmlDir.endsWith(`/${name}`) || xmlDir.endsWith(`\\${name}`) ? join(xmlDir, "Subsystems") : join(xmlDir, name, "Subsystems")

const normalizeChildNames = (value: unknown): ChildSubsystemNames => {
  if (typeof value === "string") return [value]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}
