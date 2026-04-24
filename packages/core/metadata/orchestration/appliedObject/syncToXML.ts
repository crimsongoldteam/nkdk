import fs from "fs"
import { join, dirname } from "path"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportMetadataItemToXML, importMetadataItemFromXML, importMetadataItemFromYAML } from "~/metadata/orchestration"
import { getTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { HelpPropertyRule, MetadataItemRule, ModulePropertyRule, PropertyRule, TemplatePropertyRule } from "~/metadata/orchestration/property/types"
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

  // Копируем BSL-файлы для свойств типа Module/Template (статические пути на уровне объекта)
  for (const [_key, propRule] of Object.entries(rule.properties)) {
    if (propRule.type !== "Module" && propRule.type !== "Template") continue
    const moduleRule = propRule as ModulePropertyRule | TemplatePropertyRule
    if (typeof moduleRule.nkdkPath === "function" || typeof moduleRule.xmlPath === "function") continue
    const srcPath = join(inputDir, name, moduleRule.nkdkPath)
    if (!fs.existsSync(srcPath)) continue
    const dstPath = join(outputDir, moduleRule.xmlPath)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }

  // Копируем BSL-файлы для дочерних коллекций (команды и т. п.) с функциональными путями
  for (const childCollection of rule.childCollections ?? []) {
    const collectionModel = (model as Record<string, unknown>)[childCollection.propertyKey]
    if (!collectionModel || typeof collectionModel !== "object") continue
    // После XML-импорта коллекция — массив [{name, ...}, ...], после YAML — Record<name, ...>
    const itemNames: string[] = Array.isArray(collectionModel)
      ? (collectionModel as Array<Record<string, unknown>>)
          .map((item) => String(item["name"] ?? ""))
          .filter(Boolean)
      : Object.keys(collectionModel)
    for (const itemName of itemNames) {
      for (const [_k, itemPropRule] of Object.entries(childCollection.itemRule.properties)) {
        if (itemPropRule.type !== "Module" && itemPropRule.type !== "Template") continue
        const moduleRule = itemPropRule as ModulePropertyRule | TemplatePropertyRule
        const nkdkPath = typeof moduleRule.nkdkPath === "function"
          ? moduleRule.nkdkPath({ name: itemName })
          : moduleRule.nkdkPath
        const xmlPath = typeof moduleRule.xmlPath === "function"
          ? moduleRule.xmlPath({ name: itemName })
          : moduleRule.xmlPath
        const srcPath = join(inputDir, name, nkdkPath)
        if (!fs.existsSync(srcPath)) continue
        const dstPath = join(outputDir, xmlPath)
        await fs.promises.mkdir(dirname(dstPath), { recursive: true })
        await fs.promises.copyFile(srcPath, dstPath)
      }
    }
  }

  // Генерируем Help.xml и копируем HTML-файлы для свойств типа Help
  for (const [_key, propRule] of Object.entries(rule.properties)) {
    if (propRule.type !== "Help") continue
    const helpRule = propRule as HelpPropertyRule
    const nkdkHelpDir = join(inputDir, name, helpRule.nkdkDir)
    if (!fs.existsSync(nkdkHelpDir)) continue
    const htmlFiles = await fs.promises.readdir(nkdkHelpDir)
    const langs = htmlFiles.filter((f) => f.endsWith(".html")).map((f) => f.replace(/\.html$/, ""))
    if (langs.length === 0) continue

    const helpXmlObj = {
      Help: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
        "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        _version: "2.20",
        Page: langs.length === 1 ? langs[0] : langs,
      },
    }
    const helpXmlPath = join(outputDir, helpRule.filePath)
    await fs.promises.mkdir(dirname(helpXmlPath), { recursive: true })
    await fs.promises.writeFile(helpXmlPath, xmlExport(helpXmlObj), "utf-8")

    const helpHtmlDir = helpRule.filePath.replace(/\.xml$/, "")
    for (const lang of langs) {
      const srcHtmlPath = join(inputDir, name, helpRule.nkdkDir, `${lang}.html`)
      const dstHtmlPath = join(outputDir, helpHtmlDir, `${lang}.html`)
      await fs.promises.mkdir(dirname(dstHtmlPath), { recursive: true })
      await fs.promises.copyFile(srcHtmlPath, dstHtmlPath)
    }
  }

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
    const mergedContent = mergeItemIds(containerContent, referenceExtPath, envelope.container, envelope.childTag)

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
 * @param childTag — имя тега дочерних элементов (по умолчанию "Item" для Predefined).
 */
function mergeItemIds(
  containerContent: Record<string, unknown>,
  referenceXmlPath: string,
  containerTag: string,
  childTag: string = "Item"
): Record<string, unknown> {
  if (!fs.existsSync(referenceXmlPath)) return containerContent

  const refXml = fs.readFileSync(referenceXmlPath, "utf-8")
  const refParsed = importContentFromXML<Record<string, any>>(refXml)
  const refContainer = refParsed[containerTag] as Record<string, any>
  const rawRefItems = refContainer?.[childTag]
  if (!rawRefItems) return containerContent

  const refItems: Array<Record<string, any>> = Array.isArray(rawRefItems) ? rawRefItems : [rawRefItems]
  const idByName = new Map<string, string>()
  for (const refItem of refItems) {
    if (refItem._id && refItem.Name) idByName.set(String(refItem.Name), String(refItem._id))
  }

  const rawItems = containerContent[childTag]
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

  return { ...containerContent, [childTag]: mergedItems.length === 1 ? mergedItems[0] : mergedItems }
}
