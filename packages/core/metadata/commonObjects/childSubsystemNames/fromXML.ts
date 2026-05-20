import fs from "fs"
import { join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import type {
  ChildSubsystemNames,
  ChildSubsystemNamesPropertyRule,
  ChildSubsystemNamesXML,
} from "./types"

export const importChildSubsystemNamesFromXML = (
  value: ChildSubsystemNamesXML | undefined
): ChildSubsystemNames | undefined => {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

registerTypeRule("ChildSubsystemNames", "importFromXML", (_context, _rule, value) =>
  importChildSubsystemNamesFromXML(value as ChildSubsystemNamesXML | undefined)
)

export const syncChildSubsystemNamesFromXML = async (params: {
  context: import("~/metadata/context/types").ConfigurationContextFromXML
  rule: import("~/metadata/orchestration/property/types").PropertyRule
  xmlDir: string
  nkdkDir: string
  name: string
}): Promise<void> => {
  const childNames = await readChildSubsystemNamesFromXML(params.xmlDir, params.name)
  if (!childNames?.length) return

  const childInputDir = join(params.xmlDir, params.name, "Subsystems")
  if (!fs.existsSync(childInputDir)) return

  const { convertAppliedObjectFromXML } = await import("~/metadata/orchestration/appliedObject/convertFromXML")
  const { MetadataSubsystemRules } = await import("~/metadata/appliedObjects/metadataSubsystem/rules")
  const childOutputDir = join(params.nkdkDir, getFolderName(params.rule))

  for (const childName of childNames.filter(isSafeName)) {
    await convertAppliedObjectFromXML({
      rule: MetadataSubsystemRules,
      context: params.context,
      inputDir: childInputDir,
      name: childName,
      outputDir: childOutputDir,
    })
  }
}

registerTypeRule("ChildSubsystemNames", "syncExternalFromXML", syncChildSubsystemNamesFromXML)

const getFolderName = (rule: import("~/metadata/orchestration/property/types").PropertyRule): string =>
  (rule as ChildSubsystemNamesPropertyRule).folderName ?? rule.yaml ?? "Подсистемы"

const isSafeName = (name: string): boolean => name !== "." && name !== ".." && !name.includes("/") && !name.includes("\\")

const readChildSubsystemNamesFromXML = async (xmlDir: string, name: string): Promise<ChildSubsystemNames | undefined> => {
  const xmlPath = join(xmlDir, `${name}.xml`)
  if (!fs.existsSync(xmlPath)) return undefined

  const xmlContent = await fs.promises.readFile(xmlPath, "utf-8")
  const parsed = importContentFromXML<{
    MetaDataObject?: {
      Subsystem?: {
        ChildObjects?: {
          Subsystem?: ChildSubsystemNamesXML
        }
      }
    }
  }>(xmlContent)

  return importChildSubsystemNamesFromXML(parsed.MetaDataObject?.Subsystem?.ChildObjects?.Subsystem)
}
