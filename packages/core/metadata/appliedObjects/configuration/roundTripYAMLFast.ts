import fs from "fs"
import { XMLValidator } from "fast-xml-parser"
import { basename, join, relative } from "path"
import type {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
  type MetadataItemRule,
  type ToYAML,
} from "~/metadata/orchestration"
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

type MetadataXMLRoot = { MetaDataObject: unknown }

const makeContextFromXML = (forReference: boolean): ConfigurationContextFromXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  fromXML: { forReference },
})

const makeContextToYAML = (): ConfigurationContext => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToYAML: { toTyped: false },
})

const makeContextFromYAML = (): ConfigurationContext => ({
  defaultLanguage: "ru",
  version: "2.20",
})

const makeContextToXML = (parentName: string): ConfigurationContextWithExportToXML => ({
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
})

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

const roundTripOne = <Rule extends MetadataItemRule>(params: {
  inputDir: string
  file: string
  xmlFileAbs: string
  rule: Rule
  parentName: string
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
    context: makeContextToYAML(),
    data: model,
    rule: params.rule,
  })
  const yamlText = yamlObject === undefined ? "" : exportToYAML(yamlObject)
  const yamlObjectFromText = importMetadataYAMLText<typeof params.rule>(yamlText)
  const modelFromYAML = importMetadataItemFromYAML({
    context: makeContextFromYAML(),
    yaml: yamlObjectFromText,
    rule: params.rule,
    name: params.parentName,
    source: referenceModel,
  })
  const xmlObject = exportMetadataItemToXML({
    context: makeContextToXML(params.parentName),
    data: modelFromYAML,
    referenceData: referenceModel,
    rule: params.rule,
  })
  const generatedXml = xmlObject === undefined ? "" : xmlExport(xmlObject)

  const originalComparable = normalizeXMLForCompare(originalXml)
  const generatedComparable = normalizeXMLForCompare(generatedXml)
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

const listRoundTripEntries = (inputDir: string): Array<{
  file: string
  xmlFileAbs: string
  rule: MetadataItemRule
  parentName: string
}> => {
  const entries: Array<{ file: string; xmlFileAbs: string; rule: MetadataItemRule; parentName: string }> = []
  const configurationPath = join(inputDir, CONFIGURATION_XML_FILE)
  if (fs.existsSync(configurationPath)) {
    entries.push({
      file: CONFIGURATION_XML_FILE,
      xmlFileAbs: configurationPath,
      rule: MetadataConfigurationRules,
      parentName: "",
    })
  }

  for (const rule of TopLevelMetadataItemRules) {
    if (rule.xmlDir === undefined) continue
    const dir = join(inputDir, rule.xmlDir)
    if (!fs.existsSync(dir)) continue
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xml")) continue
      const xmlFileAbs = join(dir, entry.name)
      entries.push({
        file: toPosixPath(relative(inputDir, xmlFileAbs)),
        xmlFileAbs,
        rule,
        parentName: basename(entry.name, ".xml"),
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
      const diff = roundTripOne({ inputDir: params.inputDir, ...entry })
      if (diff !== undefined) result.diffs.push(diff)
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
