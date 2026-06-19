import fs from "fs"
import { XMLValidator } from "fast-xml-parser"
import { basename, dirname, join, relative } from "path"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML, type MetadataItemRule } from "~/metadata/orchestration"
import {
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "~/metadata/orchestration/appliedObject/fileItemChildCollections"
import {
  appendMetadataItemOwner,
  type MetadataItemOwnerContextEntry,
} from "~/metadata/orchestration/appliedObject/metadataItemOwnerContext"
import { getTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { describeMetadataRuleResources } from "~/metadata/project/ruleResources"
import { importContentFromXML } from "~/xml/import/importer"
import { CONFIGURATION_XML_FILE } from "./rootIO"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"

type MetadataXMLRoot = { MetaDataObject: unknown }

type MetadataModelRecord = Record<string, unknown>

export type RoundTripXmlEntryBase = {
  file: string
  xmlFileAbs: string
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}

export type RoundTripXmlEntry =
  | (RoundTripXmlEntryBase & { kind: "metadata"; rule: MetadataItemRule })
  | (RoundTripXmlEntryBase & {
      kind: "form"
      metadataFile: string
      formXmlFile: string
      formsDir: string
      formName: string
    })
  | (RoundTripXmlEntryBase & {
      kind: "filePathProperty"
      ownerRule: MetadataItemRule
      propertyName: string
      propertyRule: PropertyRule
    })

type MetadataEntryParams = {
  inputDir: string
  file: string
  xmlFileAbs: string
  rule: MetadataItemRule
  parentName: string
  xmlDirAbs: string
  itemName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}

const makeContextFromXML = (forReference: boolean): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference },
})

const toPosixPath = (path: string): string => path.replace(/\\/g, "/")

const importMetadataModelForDiscovery = (params: {
  xmlFileAbs: string
  rule: MetadataItemRule
}): MetadataModelRecord | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const validationResult = XMLValidator.validate(originalXml)
  if (validationResult !== true) return undefined
  const parsed = importContentFromXML<MetadataXMLRoot>(originalXml)
  const model = importMetadataItemFromXML({
    context: makeContextFromXML(true),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
  if (!model || typeof model !== "object") return undefined
  return model as MetadataModelRecord
}

const addFormEntries = (params: {
  entries: RoundTripXmlEntry[]
  inputDir: string
  ownerDirAbs: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}): void => {
  const formsDir = join(params.ownerDirAbs, "Forms")
  if (!fs.existsSync(formsDir)) return

  for (const formEntry of fs.readdirSync(formsDir, { withFileTypes: true })) {
    if (!formEntry.isFile() || !formEntry.name.toLowerCase().endsWith(".xml")) continue
    const formName = basename(formEntry.name, ".xml")
    const metadataFileAbs = join(formsDir, formEntry.name)
    const formXmlFileAbs = join(formsDir, formName, "Ext", "Form.xml")
    if (!fs.existsSync(formXmlFileAbs)) continue

    params.entries.push({
      kind: "form",
      file: toPosixPath(relative(params.inputDir, formXmlFileAbs)),
      xmlFileAbs: formXmlFileAbs,
      itemName: params.parentName,
      metadataFile: toPosixPath(relative(params.inputDir, metadataFileAbs)),
      formXmlFile: toPosixPath(relative(params.inputDir, formXmlFileAbs)),
      formsDir,
      formName,
      parentName: params.parentName,
      ownerStack: params.ownerStack,
    })
  }
}

const addFilePathPropertyEntries = (params: {
  entries: RoundTripXmlEntry[]
  inputDir: string
  xmlDirAbs: string
  rule: MetadataItemRule
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}): void => {
  for (const resource of describeMetadataRuleResources(params.rule)) {
    if (resource.kind !== "xml" || resource.role !== "externalXml") continue
    if (resource.xmlPathKind === "dynamic") continue

    const propertyRule = params.rule.properties[resource.propertyName]
    if (propertyRule === undefined) continue
    if (!getTypeRule(propertyRule.type, "importFromXML") || !getTypeRule(propertyRule.type, "exportToXML")) continue

    const filePath = resource.xmlPathKind === "static" ? resource.xmlPath : resource.filePath
    const rootExtFilePath = join(params.xmlDirAbs, filePath)
    const objectExtFilePath = join(params.xmlDirAbs, params.itemName, filePath)
    const xmlFileAbs = fs.existsSync(rootExtFilePath) ? rootExtFilePath : objectExtFilePath
    if (!fs.existsSync(xmlFileAbs)) continue

    params.entries.push({
      kind: "filePathProperty",
      file: toPosixPath(relative(params.inputDir, xmlFileAbs)),
      xmlFileAbs,
      itemName: params.itemName,
      parentName: params.parentName,
      ownerStack: params.ownerStack,
      ownerRule: params.rule,
      propertyName: resource.propertyName,
      propertyRule: propertyRule as PropertyRule,
    })
  }
}

const addMetadataEntryWithChildren = (params: MetadataEntryParams & { entries: RoundTripXmlEntry[] }): void => {
  params.entries.push({
    kind: "metadata",
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    rule: params.rule,
    itemName: params.itemName,
    parentName: params.parentName,
    ownerStack: params.ownerStack,
  })

  const childOwnerStack = appendMetadataItemOwner(params.ownerStack, params.rule.itemType, params.itemName)

  addFilePathPropertyEntries({
    entries: params.entries,
    inputDir: params.inputDir,
    xmlDirAbs: params.xmlDirAbs,
    rule: params.rule,
    itemName: params.itemName,
    parentName: params.parentName,
    ownerStack: childOwnerStack,
  })

  addFormEntries({
    entries: params.entries,
    inputDir: params.inputDir,
    ownerDirAbs: join(params.xmlDirAbs, params.itemName),
    parentName: params.itemName,
    ownerStack: childOwnerStack,
  })

  const model = importMetadataModelForDiscovery({ xmlFileAbs: params.xmlFileAbs, rule: params.rule })
  if (model === undefined) return

  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const childItems = normalizeFileItemCollectionItems(model[childCollection.propertyKey])
    for (const childItem of childItems) {
      const childDir = resolveChildCollectionDir(childCollection.xmlDir, childItem.name, params.itemName)
      const childXmlBaseAbs = join(params.xmlDirAbs, params.itemName, childDir)
      const childXmlFileAbs = `${childXmlBaseAbs}.xml`
      if (!fs.existsSync(childXmlFileAbs)) continue

      addMetadataEntryWithChildren({
        entries: params.entries,
        inputDir: params.inputDir,
        file: toPosixPath(relative(params.inputDir, childXmlFileAbs)),
        xmlFileAbs: childXmlFileAbs,
        rule: childCollection.fileItemRule,
        parentName: params.itemName,
        xmlDirAbs: dirname(childXmlBaseAbs),
        itemName: childItem.name,
        ownerStack: childOwnerStack,
      })
    }
  }
}

export const listRoundTripXmlEntries = (inputDir: string): RoundTripXmlEntry[] => {
  const entries: RoundTripXmlEntry[] = []
  const configurationPath = join(inputDir, CONFIGURATION_XML_FILE)
  if (fs.existsSync(configurationPath)) {
    entries.push({
      kind: "metadata",
      file: CONFIGURATION_XML_FILE,
      xmlFileAbs: configurationPath,
      rule: MetadataConfigurationRules,
      itemName: "",
      parentName: "",
      ownerStack: [],
    })
  }

  addFilePathPropertyEntries({
    entries,
    inputDir,
    xmlDirAbs: inputDir,
    rule: MetadataConfigurationRules,
    itemName: "",
    parentName: "",
    ownerStack: [],
  })

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    const dir = join(inputDir, rule.xmlDir)
    if (!fs.existsSync(dir)) continue

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xml")) continue
      const xmlFileAbs = join(dir, entry.name)
      const itemName = basename(entry.name, ".xml")

      addMetadataEntryWithChildren({
        entries,
        inputDir,
        file: toPosixPath(relative(inputDir, xmlFileAbs)),
        xmlFileAbs,
        rule,
        parentName: itemName,
        xmlDirAbs: dir,
        itemName,
        ownerStack: [],
      })
    }
  }

  return entries
}
