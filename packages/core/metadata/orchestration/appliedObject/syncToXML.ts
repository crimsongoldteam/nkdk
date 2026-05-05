import fs from "fs"
import { dirname, join } from "path"
import { remapReferenceModel } from "~/metadata/appliedObjects/configuration/migrations/referenceRemap"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import {
  exportMetadataItemToXML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { importFromYAML } from "~/yaml/import"

const PROPERTIES_YAML = "Свойства.yaml"

export const syncAppliedObjectToXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  inputDir: string
  name: string
  outputDir: string
  externalOutputDir?: string
  referenceDir?: string
  externalReferenceDir?: string
  referenceName?: string
  referenceModel?: Record<string, unknown> | null
  referencePathByCurrentPath?: Map<string, string>
  currentObjectPath?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir
  const externalOutputDir = params.externalOutputDir ?? outputDir
  const externalReferenceDir = params.externalReferenceDir ?? referenceDir

  const yamlPath = join(inputDir, name, PROPERTIES_YAML)
  const yamlContent = await fs.promises.readFile(yamlPath, "utf-8")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yamlObj = importFromYAML<any>(yamlContent)
  const rawModel = importMetadataItemFromYAML({ context, yaml: yamlObj, rule, name })

  if (!rawModel) return
  const model = { ...rawModel, name } as typeof rawModel

  const contextFromXML: ConfigurationContextFromXML = {
    fromXML: { forReference: true },
    defaultLanguage: context.defaultLanguage,
    version: "2.20",
  }

  const referenceName = params.referenceName ?? name
  const referenceXmlPath = join(referenceDir, `${referenceName}.xml`)
  const loadedReferenceModel = params.referenceModel === undefined
    ? readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })
    : (params.referenceModel ?? undefined)
  const referenceModel = params.referencePathByCurrentPath?.size && params.currentObjectPath
    ? remapReferenceModel({
        rule,
        currentObjectPath: params.currentObjectPath,
        currentModel: model as Record<string, unknown>,
        referenceModel: loadedReferenceModel as Record<string, unknown> | undefined,
        referencePathByCurrentPath: params.referencePathByCurrentPath,
      })
    : loadedReferenceModel

  const forms = await collectFolderNames(rule, "ChildFormNames", inputDir, name)
  const templates = await collectFolderNames(rule, "ChildTemplateNames", inputDir, name)

  const contextWithForms: ConfigurationContextWithExportToXML = {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      context: {
        ...context.exportToXML.context,
        forms,
        templates,
        parentName: name,
        metadataForNumbering: context.exportToXML.context?.metadataForNumbering ?? [],
      },
    },
  }

  const xmlObj = exportMetadataItemToXML({
    context: contextWithForms,
    data: model,
    referenceData: referenceModel,
    rule,
  })

  if (!xmlObj) return

  await fs.promises.mkdir(outputDir, { recursive: true })
  const outputPath = join(outputDir, `${name}.xml`)
  await fs.promises.writeFile(outputPath, xmlExport(xmlObj), "utf-8")
  params.xmlManifest?.addFile(outputPath)

  // Обработчики внешних файлов на уровне объекта (Help, Module, Template со статическими путями)
  const nkdkDir = join(inputDir, name)
  for (const [, propRule] of Object.entries(rule.properties)) {
    const syncFn = getTypeRule(propRule.type, "syncExternalToXML")
    if (!syncFn) continue
    const syncXmlDir = propRule.type === "ChildFormNames" ? outputDir : externalOutputDir
    const syncReferenceDir = propRule.type === "ChildFormNames" ? referenceDir : externalReferenceDir
    await syncFn({
      context: contextWithForms,
      rule: propRule,
      nkdkDir,
      xmlDir: syncXmlDir,
      name,
      referenceDir: syncReferenceDir,
      referenceName,
      xmlManifest: params.xmlManifest,
    })
  }

  // Обработчики внешних файлов для дочерних коллекций (команды с функциональными путями)
  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = (model as Record<string, unknown>)[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const itemNames: string[] = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>).map((item) => String(item["name"] ?? "")).filter(Boolean)
      : Object.keys(collectionModel)
    for (const itemName of itemNames) {
      for (const [, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        const syncFn = getTypeRule(itemPropRule.type, "syncExternalToXML")
        if (!syncFn) continue
        await syncFn({
          context: contextWithForms,
          rule: itemPropRule,
          nkdkDir,
          xmlDir: externalOutputDir,
          name,
          referenceDir: externalReferenceDir,
          referenceName,
          xmlManifest: params.xmlManifest,
          itemName,
        })
      }
    }
  }

  // Записываем внешние файлы для свойств с filePath. Под капотом exportPropertyToXML
  // диспатчит по rule.type → registerMetadataItemRule, и для типов с маркером
  // XMLRoot+isFileRoot правило само оборачивает результат в { [container]: {...} }.
  // Reference читается из эталонного XML и передаётся в exportPropertyToXML, чтобы
  // (а) сохранить точный порядок полей по эталону, (б) подмешать атрибуты id, помеченные
  // forReferenceOnly. Свойства Help/Module/Template обрабатываются отдельно выше через
  // syncExternalToXML (у них нет exportToXML-обработчика).
  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    if (!getTypeRule(propRule.type, "exportToXML")) continue

    const modelValue = (model as Record<string, unknown>)[key]
    if (modelValue === undefined) continue

    let referenceValue: unknown = undefined
    const referenceExtPath = join(externalReferenceDir, propRule.filePath)
    if (fs.existsSync(referenceExtPath)) {
      const refContent = fs.readFileSync(referenceExtPath, "utf-8")
      const refParsed = importContentFromXML<Record<string, unknown>>(refContent)
      referenceValue = importPropertyFromXML({
        context: contextFromXML,
        rule: propRule as PropertyRule,
        value: refParsed,
        name: key,
      })
    }

    const xmlFileObj = exportPropertyToXML({
      context: contextWithForms,
      rule: propRule as PropertyRule,
      value: modelValue,
      referenceMetadata: referenceValue,
    }) as Record<string, unknown> | undefined
    if (!xmlFileObj) continue

    const extOutputPath = join(externalOutputDir, propRule.filePath)
    await fs.promises.mkdir(dirname(extOutputPath), { recursive: true })
    await fs.promises.writeFile(extOutputPath, xmlExport(xmlFileObj), "utf-8")
    params.xmlManifest?.addFile(extOutputPath)
  }
}

function readReferenceModel<Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  xmlPath: string
  rule: Rule
}) {
  const { context, xmlPath, rule } = params
  if (!fs.existsSync(xmlPath)) return undefined
  const xmlContent = fs.readFileSync(xmlPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  return importMetadataItemFromXML({ context, xml: parsed.MetaDataObject, rule }) ?? undefined
}

const listSubdirNames = async (dir: string): Promise<string[]> => {
  if (!fs.existsSync(dir)) return []
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}

async function collectFolderNames(
  rule: MetadataItemRule,
  propertyType: "ChildFormNames" | "ChildTemplateNames",
  inputDir: string,
  name: string
): Promise<string[]> {
  const prop = Object.values(rule.properties).find((p) => p.type === propertyType)
  if (!prop) return []
  const folderName = (prop as { folderName: string }).folderName
  return listSubdirNames(join(inputDir, name, folderName))
}
