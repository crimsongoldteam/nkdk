import fs from "fs"
import { XMLValidator } from "fast-xml-parser"
import { join } from "path"
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
  withExportMetadataTargetOwners,
  withExportToXMLItemsTree,
  withImportMetadataTargetOwners,
  type MetadataItemOwnerContextEntry,
} from "~/metadata/orchestration/appliedObject/metadataItemOwnerContext"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { importPropertyFromYAML } from "~/metadata/orchestration/property/fromYAML"
import { metadataTargetOwnerFromRule } from "~/metadata/orchestration/property/metadataTargetString"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import { exportPropertyToYAML } from "~/metadata/orchestration/property/toYAML"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { listRoundTripXmlEntries, type RoundTripXmlEntry } from "./roundTripXmlDiscovery"

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

type MetadataEntry = Extract<RoundTripXmlEntry, { kind: "metadata" }>
type FormEntry = Extract<RoundTripXmlEntry, { kind: "form" }>
type FilePathPropertyEntry = Extract<RoundTripXmlEntry, { kind: "filePathProperty" }>

type MetadataXMLRoot = { MetaDataObject: unknown }

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

const normalizeXMLForCompare = (text: string): string =>
  text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

const normalizeFinalNewline = (text: string): string => (text.endsWith("\n") ? text : `${text}\n`)

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

const importMetadataYAMLText = <Rule extends MetadataItemRule>(
  yamlText: string
): ToYAML<Rule["itemType"]> | undefined => importFromYAML<ToYAML<Rule["itemType"]> | undefined>(yamlText)

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

const roundTripOne = <Rule extends MetadataItemRule>(
  params: MetadataEntry & {
    inputDir: string
    rule: Rule
  }
): RoundTripYAMLFastDiff | undefined => {
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

const roundTripFormOne = (
  params: FormEntry & {
    inputDir: string
  }
): RoundTripYAMLFastDiff[] => {
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

const importFilePathPropertyFromXML = (params: {
  entry: FilePathPropertyEntry
  xml: string
  forReference: boolean
}): unknown => {
  const parsed = importContentFromXML<Record<string, unknown>>(params.xml, { preserveXsiNil: true })
  return importPropertyFromXML({
    context: makeContextFromXML(params.forReference),
    rule: params.entry.propertyRule,
    value: parsed,
    name: params.entry.propertyName,
    ownerXmlName: params.entry.itemName,
  })
}

const roundTripFilePathPropertyOne = (params: FilePathPropertyEntry): RoundTripYAMLFastDiff | undefined => {
  const originalXml = fs.readFileSync(params.xmlFileAbs, "utf-8")
  const validationResult = XMLValidator.validate(originalXml)
  if (validationResult !== true) {
    throw new Error(`Failed to parse XML: ${validationResult.err.msg}`)
  }

  const model = importFilePathPropertyFromXML({ entry: params, xml: originalXml, forReference: false })
  const referenceModel = importFilePathPropertyFromXML({ entry: params, xml: originalXml, forReference: true })

  const contextToYAML = makeContextToYAML(params.ownerStack)
  const owner = metadataTargetOwnerFromRule({
    itemRule: params.ownerRule,
    name: params.itemName,
    context: contextToYAML,
  })
  const yamlObject = exportPropertyToYAML({
    context: contextToYAML,
    rule: params.propertyRule,
    value: model,
    name: params.itemName,
    owner,
  })
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = importFromYAML<Record<string, unknown> | undefined>(yamlText)

  const contextFromYAML = makeContextFromYAML(params.ownerStack)
  const modelFromYAML = importPropertyFromYAML({
    context: contextFromYAML,
    rule: params.propertyRule,
    value: params.propertyRule.yaml === undefined ? undefined : yamlObjectFromText?.[params.propertyRule.yaml],
    yaml: yamlObjectFromText,
    sourceValue: referenceModel,
    name: params.itemName,
    owner: metadataTargetOwnerFromRule({
      itemRule: params.ownerRule,
      name: params.itemName,
      context: contextFromYAML,
    }),
  })

  const xmlObject = exportPropertyToXML({
    context: makeContextToXML(params.parentName, params.ownerStack),
    rule: params.propertyRule,
    value: modelFromYAML,
    referenceMetadata: referenceModel,
    metadataItem: { itemType: params.ownerRule.itemType, name: params.itemName },
  }) as Record<string, unknown> | undefined
  const generatedXml = xmlObject === undefined ? "" : xmlExport(xmlObject)

  return createDiffIfChanged({
    file: params.file,
    xmlFileAbs: params.xmlFileAbs,
    generatedXml,
  })
}

export const roundTripYAMLFast = async (params: RoundTripYAMLFastParams): Promise<RoundTripYAMLFastResult> => {
  const result: RoundTripYAMLFastResult = {
    checked: 0,
    diffs: [],
    errors: [],
  }
  if (!fs.existsSync(params.inputDir)) return result

  for (const entry of listRoundTripXmlEntries(params.inputDir)) {
    result.checked += 1
    try {
      const diffs =
        entry.kind === "metadata"
          ? [roundTripOne({ inputDir: params.inputDir, ...entry })].filter(
              (diff): diff is RoundTripYAMLFastDiff => diff !== undefined
            )
          : entry.kind === "form"
            ? roundTripFormOne({ inputDir: params.inputDir, ...entry })
            : [roundTripFilePathPropertyOne(entry)].filter((diff): diff is RoundTripYAMLFastDiff => diff !== undefined)
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
