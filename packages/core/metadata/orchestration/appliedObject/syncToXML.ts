import fs from "fs"
import { join, dirname } from "path"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML, importMetadataItemFromXML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import { externalFileEnvelopes } from "~/metadata/commonObjects/predifined/rules"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { importFromYAML } from "~/yaml/import"

const PROPERTIES_YAML = "Свойства.yaml"

export const syncAppliedObjectToXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  inputDir: string
  name: string
  outputDir: string
  referenceDir?: string
}): Promise<void> => {
  const { rule, context, inputDir, name, outputDir } = params
  const referenceDir = params.referenceDir ?? outputDir

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

  const referenceXmlPath = join(referenceDir, `${name}.xml`)
  const referenceModel = readReferenceModel({ context: contextFromXML, xmlPath: referenceXmlPath, rule })

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
  await fs.promises.writeFile(join(outputDir, `${name}.xml`), xmlExport(xmlObj), "utf-8")

  // Записываем внешние файлы для свойств с filePath
  for (const [key, propRule] of Object.entries(rule.properties)) {
    if (propRule.filePath === undefined) continue
    const envelope = externalFileEnvelopes[propRule.type]
    if (!envelope) continue

    const modelValue = (model as Record<string, unknown>)[key]
    if (modelValue === undefined) continue

    const typeExportFn = getTypeRule(propRule.type as Parameters<typeof getTypeRule>[0], "exportToXML")
    if (!typeExportFn) continue

    const containerContent = typeExportFn(contextWithForms, propRule as PropertyRule, modelValue) as Record<string, unknown> | undefined
    if (!containerContent) continue

    // Подмешиваем _id из референсного файла по полю Name
    const referenceExtPath = join(referenceDir, propRule.filePath)
    const mergedContent = mergeItemIds(containerContent, referenceExtPath, envelope.container)

    const xmlFileObj = { [envelope.container]: { ...envelope.rootAttributes, ...mergedContent } }
    const extOutputPath = join(outputDir, propRule.filePath)
    await fs.promises.mkdir(dirname(extOutputPath), { recursive: true })
    await fs.promises.writeFile(extOutputPath, xmlExport(xmlFileObj), "utf-8")
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

/**
 * Подмешивает атрибут _id (id в XML) из референсного внешнего файла в элементы контейнера.
 * Сопоставление элементов происходит по полю Name.
 */
function mergeItemIds(
  containerContent: Record<string, unknown>,
  referenceXmlPath: string,
  containerTag: string
): Record<string, unknown> {
  if (!fs.existsSync(referenceXmlPath)) return containerContent

  const refXml = fs.readFileSync(referenceXmlPath, "utf-8")
  const refParsed = importContentFromXML<Record<string, any>>(refXml)
  const refContainer = refParsed[containerTag] as Record<string, any>
  const rawRefItems = refContainer?.Item
  if (!rawRefItems) return containerContent

  const refItems: Array<Record<string, any>> = Array.isArray(rawRefItems) ? rawRefItems : [rawRefItems]
  const idByName = new Map<string, string>()
  for (const refItem of refItems) {
    if (refItem._id && refItem.Name) idByName.set(String(refItem.Name), String(refItem._id))
  }

  const rawItems = containerContent.Item
  if (!rawItems) return containerContent

  const items: Array<Record<string, any>> = Array.isArray(rawItems)
    ? (rawItems as Array<Record<string, any>>)
    : [rawItems as Record<string, any>]

  const mergedItems = items.map((item) => {
    const id = idByName.get(String(item.Name))
    if (id === undefined) return item
    // _id должен быть первым ключом (атрибут id="..." стоит перед дочерними тегами)
    return { _id: id, ...item }
  })

  return { ...containerContent, Item: mergedItems.length === 1 ? mergedItems[0] : mergedItems }
}
