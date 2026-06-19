import fs from "fs"
import { XMLValidator } from "fast-xml-parser"
import { basename, dirname, join, relative } from "path"
import type {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { readFormFromXML } from "~/metadata/forms/clientApplicationForm/convertFromXML"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import type { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
  type MetadataItemRule,
  type ToYAML,
} from "~/metadata/orchestration"
import {
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "~/metadata/orchestration/appliedObject/fileItemChildCollections"
import {
  appendMetadataItemOwner,
  withExportMetadataTargetOwners,
  withExportToXMLItemsTree,
  withImportMetadataTargetOwners,
  type MetadataItemOwnerContextEntry,
} from "~/metadata/orchestration/appliedObject/metadataItemOwnerContext"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { CONFIGURATION_XML_FILE } from "./rootIO"
import { MetadataConfigurationRules } from "./rules"
import { TopLevelMetadataItemRules } from "./topLevelRules"

export interface RoundTripYAMLFastParams {
  inputDir: string
}

export interface RoundTripYAMLFastDiff {
  file: string
  xmlFileAbs: string
  diffText: string
}

export interface RoundTripYAMLFastError {
  file: string
  xmlFileAbs: string
  message: string
}

export interface RoundTripYAMLFastResult {
  checked: number
  diffs: RoundTripYAMLFastDiff[]
  errors: RoundTripYAMLFastError[]
}

type RoundTripEntryBase = {
  file: string
  xmlFileAbs: string
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}

type RoundTripEntry =
  | (RoundTripEntryBase & { kind: "metadata"; rule: MetadataItemRule })
  | (RoundTripEntryBase & {
      kind: "form"
      metadataFile: string
      formXmlFile: string
      formsDir: string
      formName: string
    })

type MetadataXMLRoot = { MetaDataObject: unknown }

type MetadataModelRecord = Record<string, unknown>

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

const makeContextToYAML = (ownerStack: readonly MetadataItemOwnerContextEntry[]): ConfigurationContext =>
  withExportMetadataTargetOwners(
    {
      defaultLanguage: "ru",
      version: "2.20",
      exportToYAML: { toTyped: false },
    },
    ownerStack
  )

const makeContextFromYAML = (ownerStack: readonly MetadataItemOwnerContextEntry[]): ConfigurationContext =>
  withImportMetadataTargetOwners(
    {
      defaultLanguage: "ru",
      version: "2.20",
    },
    ownerStack
  )

const makeContextToXML = (
  parentName: string,
  ownerStack: readonly MetadataItemOwnerContextEntry[]
): ConfigurationContextWithExportToXML =>
  withExportToXMLItemsTree(
    {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {
        itemsTree: [],
        configDumpInfo: new Map(),
        version: "2.20",
        context: {
          forms: [],
          templates: [],
          parentName,
          metadataForNumbering: [],
        },
      },
    },
    ownerStack
  )

const formatUnknownError = (err: unknown): string => {
  if (err instanceof Error) return err.stack ?? err.message
  return String(err)
}

const normalizeXMLForCompare = (text: string): string => text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trimEnd()

const normalizeFinalNewline = (text: string): string => (text.endsWith("\n") ? text : `${text}\n`)

const toPosixPath = (path: string): string => path.replace(/\\/g, "/")

function createUnifiedDiff(params: { file: string; original: string; generated: string }): string {
  const original = normalizeFinalNewline(params.original).split("\n")
  const generated = normalizeFinalNewline(params.generated).split("\n")
  let start = 0
  while (start < original.length && start < generated.length && original[start] === generated[start]) start += 1

  let originalEnd = original.length - 1
  let generatedEnd = generated.length - 1
  while (originalEnd >= start && generatedEnd >= start && original[originalEnd] === generated[generatedEnd]) {
    originalEnd -= 1
    generatedEnd -= 1
  }

  const contextStart = Math.max(0, start - 3)
  const contextOriginalEnd = Math.min(original.length - 1, originalEnd + 3)
  const contextGeneratedEnd = Math.min(generated.length - 1, generatedEnd + 3)
  const originalCount = contextOriginalEnd - contextStart + 1
  const generatedCount = contextGeneratedEnd - contextStart + 1
  const lines = [
    `--- ${params.file}`,
    `+++ ${params.file}.fast`,
    `@@ -${contextStart + 1},${originalCount} +${contextStart + 1},${generatedCount} @@`,
  ]

  for (let i = contextStart; i <= Math.max(contextOriginalEnd, contextGeneratedEnd); i += 1) {
    const originalLine = i <= contextOriginalEnd ? original[i] : undefined
    const generatedLine = i <= contextGeneratedEnd ? generated[i] : undefined
    if (originalLine === generatedLine && originalLine !== undefined) {
      lines.push(` ${originalLine}`)
    } else {
      if (originalLine !== undefined) lines.push(`-${originalLine}`)
      if (generatedLine !== undefined) lines.push(`+${generatedLine}`)
    }
  }

  return lines.join("\n")
}

const importMetadataYAMLText = <Rule extends MetadataItemRule>(yamlText: string): ToYAML<Rule["itemType"]> | undefined =>
  importFromYAML<ToYAML<Rule["itemType"]> | undefined>(yamlText)

const createDiffIfChanged = (params: {
  file: string
  xmlFileAbs: string
  generatedXml: string
}): RoundTripYAMLFastDiff | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const originalComparable = normalizeXMLForCompare(originalXml)
  const generatedComparable = normalizeXMLForCompare(params.generatedXml)
  if (originalComparable === generatedComparable) return undefined

  return {
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    diffText: createUnifiedDiff({
      file: params.file,
      original: originalComparable,
      generated: generatedComparable,
    }),
  }
}

const roundTripOne = <Rule extends MetadataItemRule>(params: {
  inputDir: string
  file: string
  xmlFileAbs: string
  rule: Rule
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}): RoundTripYAMLFastDiff | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const validationResult = XMLValidator.validate(originalXml)
  if (validationResult !== true) {
    throw new Error(`Failed to parse XML: ${validationResult.err.msg}`)
  }
  const parsed = importContentFromXML<MetadataXMLRoot>(originalXml)
  const model = importMetadataItemFromXML({
    context: makeContextFromXML(false),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })
  const referenceModel = importMetadataItemFromXML({
    context: makeContextFromXML(true),
    xml: parsed.MetaDataObject,
    rule: params.rule,
  })

  const yamlObject = exportMetadataItemToYAML({
    context: makeContextToYAML(params.ownerStack),
    data: model,
    rule: params.rule,
  })
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = importMetadataYAMLText<typeof params.rule>(yamlText)
  const modelFromYAML = importMetadataItemFromYAML({
    context: makeContextFromYAML(params.ownerStack),
    yaml: yamlObjectFromText,
    rule: params.rule,
    name: params.itemName,
    source: referenceModel,
  })
  const xmlObject = exportMetadataItemToXML({
    context: makeContextToXML(params.parentName, params.ownerStack),
    data: modelFromYAML,
    referenceData: referenceModel,
    rule: params.rule,
  })
  const generatedXml = xmlObject === undefined ? "" : xmlExport(xmlObject)

  return createDiffIfChanged({
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    generatedXml,
  })
}

const roundTripFormOne = (params: {
  inputDir: string
  metadataFile: string
  formXmlFile: string
  formsDir: string
  formName: string
  itemName: string
  parentName: string
  ownerStack: readonly MetadataItemOwnerContextEntry[]
}): RoundTripYAMLFastDiff[] => {
  const form = readFormFromXML({
    context: makeContextFromXML(false),
    inputDir: params.formsDir,
    formName: params.formName,
  })
  const referenceForm = readFormFromXML({
    context: makeContextFromXML(true),
    inputDir: params.formsDir,
    formName: params.formName,
  })

  const { yaml: yamlObject } = exportClientApplicationFormToYAML(makeContextToYAML(params.ownerStack), form)
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = importFromYAML<ClientApplicationFormYAML | undefined>(yamlText)
  const formFromYAML = importClientApplicationFormFromYAML(
    makeContextFromYAML(params.ownerStack),
    (yamlObjectFromText ?? {}) as ClientApplicationFormYAML,
    referenceForm
  )
  const contextToXML = makeContextToXML(params.parentName, params.ownerStack)

  const generatedFormXml = xmlExport({
    Form: exportClientApplicationFormToXML({
      context: contextToXML,
      form: formFromYAML,
      referenceForm,
    }),
  })
  const generatedMetadataXml = xmlExport({
    MetaDataObject: exportFormMetadataToXML({
      context: contextToXML,
      form: formFromYAML,
      referenceForm,
      name: params.formName,
    }),
  })

  return [
    createDiffIfChanged({
      file: params.metadataFile,
      xmlFileAbs: join(params.inputDir, params.metadataFile),
      generatedXml: generatedMetadataXml,
    }),
    createDiffIfChanged({
      file: params.formXmlFile,
      xmlFileAbs: join(params.inputDir, params.formXmlFile),
      generatedXml: generatedFormXml,
    }),
  ].filter((diff): diff is RoundTripYAMLFastDiff => diff !== undefined)
}

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
  entries: RoundTripEntry[]
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

const addMetadataEntryWithChildren = (params: MetadataEntryParams & { entries: RoundTripEntry[] }): void => {
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

const listRoundTripEntries = (inputDir: string): RoundTripEntry[] => {
  const entries: RoundTripEntry[] = []
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

export const roundTripYAMLFast = async (params: RoundTripYAMLFastParams): Promise<RoundTripYAMLFastResult> => {
  const result: RoundTripYAMLFastResult = {
    checked: 0,
    diffs: [],
    errors: [],
  }
  if (!fs.existsSync(params.inputDir)) return result

  for (const entry of listRoundTripEntries(params.inputDir)) {
    result.checked += 1
    try {
      const diffs =
        entry.kind === "metadata"
          ? [roundTripOne({ inputDir: params.inputDir, ...entry })].filter(
              (diff): diff is RoundTripYAMLFastDiff => diff !== undefined
            )
          : roundTripFormOne({ inputDir: params.inputDir, ...entry })
      result.diffs.push(...diffs)
    } catch (err) {
      result.errors.push({
        file: entry.file,
        xmlFileAbs: entry.xmlFileAbs,
        message: formatUnknownError(err),
      })
    }
  }

  return result
}
