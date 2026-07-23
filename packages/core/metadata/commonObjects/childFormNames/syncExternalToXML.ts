import fs from "fs"
import { dirname, join, posix } from "path"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { DynamicListRules } from "../../forms/commonObjects/dynamicList/rules"
import { syncFormToXML } from "../../forms/clientApplicationForm/syncToXML"
import { ClientApplicationFormRules } from "../../forms/clientApplicationForm/rules"
import type { ExternalMetadataContextItem } from "../../orchestration/externalMetadata/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { describeMetadataRuleProjectResources } from "../../project/ruleResources"
import type { SyncExternalToXMLFunction } from "../../orchestration/property/fn"
import type { MetadataItemRule } from "../../orchestration/property/types"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import { xmlExport } from "../../../xml/export/exporter"
import type { ChildFormNamesPropertyRule } from "./types"

/**
 * Сканирует папку форм объекта (`<nkdkDir>/<folderName>`) и для каждой подпапки
 * с `Форма.yaml` вызывает `syncFormToXML`. Формы обрабатываются последовательно
 * внутри объекта.
 */
export const syncChildFormNamesToXML: SyncExternalToXMLFunction = async (params) => {
  const { context, rule: rawRule, nkdkDir, xmlDir, name, referenceDir, referenceName, xmlManifest } = params
  const rule = rawRule as ChildFormNamesPropertyRule

  const formsDir = join(nkdkDir, rule.folderName)
  const expectedFormNames = params.currentXMLDir === undefined ? [] : normalizeFormNames(params.propertyValue)
  const formReferenceDirs = getFormReferenceDirs({ referenceDir, name, referenceName })
  const formReferenceDir = formReferenceDirs[0]
  if (!fs.existsSync(formsDir)) {
    assertNoMissingFormYAML({ formsDir, expectedFormNames, referenceFormsDirs: formReferenceDirs })
    return
  }

  const formNames =
    params.itemName === undefined
      ? (await fs.promises.readdir(formsDir, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .filter((e) => {
            const yamlPath = join(formsDir, e.name, "Форма.yaml")
            return fs.existsSync(yamlPath)
          })
          .map((e) => e.name)
      : [params.itemName]
  assertNoMissingFormYAML({
    formsDir,
    expectedFormNames,
    actualFormNames: formNames,
    referenceFormsDirs: formReferenceDirs,
  })

  const formOutputDir = name === "" ? xmlDir : join(xmlDir, name)

  for (const formName of formNames) {
    await syncFormToXML({
      context,
      inputDir: nkdkDir,
      formName,
      outputDir: formOutputDir,
      referenceDir: formReferenceDir,
      currentXMLPath: buildChildFormCurrentXMLPath({ xmlDir, currentXMLDir: params.currentXMLDir, name, formName }),
      xmlManifest,
    })
    await copyFormModuleToXML({ nkdkDir, formOutputDir, folderName: rule.folderName, formName, xmlManifest })
    await copyFormHelpToXML({ context, nkdkDir, formOutputDir, folderName: rule.folderName, formName, xmlManifest })
  }
}

export const buildChildFormCurrentXMLPath = (params: {
  xmlDir: string
  currentXMLDir?: string
  name: string
  formName: string
}): string => {
  const currentXMLDir =
    params.currentXMLDir ??
    (params.name === ""
      ? getLastPathSegments(params.xmlDir, 2)
      : posix.join(getLastPathSegment(params.xmlDir), params.name))
  return posix.join(currentXMLDir, "Forms", params.formName, "Ext", "Form.xml")
}

function getFormReferenceDirs(params: { referenceDir?: string; name: string; referenceName?: string }): string[] {
  if (params.referenceDir === undefined) return []
  if (params.name === "") return [join(params.referenceDir, "Forms")]
  return [join(params.referenceDir, params.referenceName ?? params.name, "Forms"), join(params.referenceDir, "Forms")]
}

function normalizeFormNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.length > 0)
}

function assertNoMissingFormYAML(params: {
  formsDir: string
  expectedFormNames: string[]
  actualFormNames?: string[]
  referenceFormsDirs?: string[]
}): void {
  const actualFormNames = new Set(params.actualFormNames ?? [])
  for (const formName of params.expectedFormNames) {
    if (actualFormNames.has(formName)) continue
    if (params.referenceFormsDirs?.some((referenceFormsDir) => hasReferenceForm(referenceFormsDir, formName))) continue
    const yamlPath = join(params.formsDir, formName, "Форма.yaml")
    throw new Error(`Форма "${formName}" указана в свойствах объекта, но файл не найден: ${yamlPath}`)
  }
}

function hasReferenceForm(referenceFormsDir: string, formName: string): boolean {
  return (
    fs.existsSync(join(referenceFormsDir, `${formName}.xml`)) ||
    fs.existsSync(join(referenceFormsDir, formName, "Ext", "Form.xml"))
  )
}

const getLastPathSegment = (value: string): string => {
  const segments = value.split(/[\\/]+/).filter((segment) => segment.length > 0)
  return segments.length > 0 ? segments[segments.length - 1] : value
}

const getLastPathSegments = (value: string, count: number): string => {
  const segments = value.split(/[\\/]+/).filter((segment) => segment.length > 0)
  return segments.slice(-count).join("/")
}

async function copyFormModuleToXML(params: {
  nkdkDir: string
  formOutputDir: string
  folderName: string
  formName: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { nkdkDir, formOutputDir, folderName, formName, xmlManifest } = params
  const srcPath = join(nkdkDir, folderName, formName, "Модуль.bsl")
  if (!fs.existsSync(srcPath)) return

  const dstPath = join(formOutputDir, "Forms", formName, "Ext", "Form", "Module.bsl")
  await fs.promises.mkdir(dirname(dstPath), { recursive: true })
  await fs.promises.copyFile(srcPath, dstPath)
  xmlManifest?.addFile(dstPath)
}

async function copyFormHelpToXML(params: {
  context: ConfigurationContextWithExportToXML
  nkdkDir: string
  formOutputDir: string
  folderName: string
  formName: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  const { nkdkDir, formOutputDir, folderName, formName, xmlManifest } = params
  const srcDir = join(nkdkDir, folderName, formName, "Справка")
  if (!fs.existsSync(srcDir)) return

  const htmlFiles = (await fs.promises.readdir(srcDir)).filter((file) => file.endsWith(".html"))
  if (htmlFiles.length === 0) return

  const helpXmlPath = join(formOutputDir, "Forms", formName, "Ext", "Help.xml")
  await fs.promises.mkdir(dirname(helpXmlPath), { recursive: true })
  const langs = htmlFiles.map((file) => file.replace(/\.html$/, ""))
  const helpXmlObj = {
    Help: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/extrnprops",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",
      Page: langs.length === 1 ? langs[0] : langs,
    },
  }
  await fs.promises.writeFile(helpXmlPath, xmlExport(helpXmlObj), "utf-8")
  xmlManifest?.addFile(helpXmlPath)
  const formItem: ExternalMetadataContextItem = {
    itemType: "ClientApplicationForm" as never,
    name: formName,
    path: `ClientApplicationForm.${formName}`,
    externalMetadata: { segment: "Form", placement: "ownedEntry" },
  }
  const itemsTree = [...params.context.exportToXML.itemsTree, formItem]
  params.context.exportToXML.externalMetadataCollector?.recordDerived({ itemsTree, segment: "Help" })

  for (const file of htmlFiles) {
    const dstPath = join(formOutputDir, "Forms", formName, "Ext", "Help", file)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(join(srcDir, file), dstPath)
    xmlManifest?.addFile(dstPath)
  }
}

registerTypeRule("ChildFormNames", "syncExternalToXML", syncChildFormNamesToXML)
registerTypeRule("ChildFormNames", "xmlSyncWriter", syncChildFormNamesToXML)
registerTypeRule("ChildFormNames", "projectResources", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildFormNamesPropertyRule | undefined)?.folderName ?? "Формы"
  return [
    {
      kind: "yaml",
      role: "fileItem",
      projectPattern: `${folderName}/{itemName}/Форма.yaml`,
      required: true,
      repeatable: true,
      owner: "currentItem",
      compositionImpact: "none",
      source: { kind: "propertyType", type: "ChildFormNames" },
      itemType: ClientApplicationFormRules.itemType,
    },
    {
      kind: "yaml",
      role: "resourceOnly",
      projectPattern: `${folderName}/{itemName}/Модуль.bsl`,
      required: false,
      repeatable: true,
      owner: "currentItem",
      compositionImpact: "none",
      source: { kind: "propertyType", type: "ChildFormNames" },
    },
    ...describeFormInnerProjectResources(folderName),
  ]
})
registerTypeRule("ChildFormNames", "xmlSyncRoutes", ({ propertyRule }) => {
  const folderName = (propertyRule as ChildFormNamesPropertyRule | undefined)?.folderName ?? "Формы"
  return [
    {
      kind: "fileItem",
      yamlPattern: `${folderName}/{itemName}/Форма.yaml`,
      xmlPathPattern: "Forms/{itemName}.xml",
      writerType: "propertyType",
      source: { kind: "propertyType", type: "ChildFormNames" },
      dumpInfoNamePatterns: ["{dumpRoot}.{ownerName}.Form.{itemName}", "{dumpRoot}.{ownerName}.Form.{itemName}.Form"],
    },
    {
      kind: "externalFile",
      yamlPattern: `${folderName}/{itemName}/Модуль.bsl`,
      xmlPathPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
      writerType: "propertyType",
      source: { kind: "propertyType", type: "ChildFormNames" },
      dumpInfoNamePatterns: ["{dumpRoot}.{ownerName}.Form.{itemName}", "{dumpRoot}.{ownerName}.Form.{itemName}.Form"],
    },
  ]
})
registerTypeRule("ChildFormNames", "fileChildNamesDescriptor", ({ propertyRule }) => {
  const rule = propertyRule as ChildFormNamesPropertyRule
  return {
    folderName: rule.folderName,
    xmlFolderName: "Forms",
    xmlItemName: rule.xml,
    useOwnerDirectoryForExternalSync: true,
    preserveReferenceXmlFolder: true,
    expectedNames: ({ rule: ownerRule, yaml, propertyValue }) => [
      ...normalizeFormNames(propertyValue),
      ...collectMetadataTargetFormNames({ rule: ownerRule, yaml }),
    ],
  }
})

function collectMetadataTargetFormNames(params: { rule: MetadataItemRule; yaml: Record<string, unknown> }): string[] {
  const result = new Set<string>()
  for (const propertyRule of Object.values(params.rule.properties)) {
    if (propertyRule.type === "ChildFormNames") continue

    const target =
      propertyRule.metadataTarget ??
      (propertyRule.referenceScope?.target === "this" && propertyRule.referenceScope.kind === "Form"
        ? { kind: "member" as const, memberKinds: ["Form" as const] }
        : undefined)
    if (target === undefined) continue

    const value = typeof propertyRule.yaml === "string" ? params.yaml[propertyRule.yaml] : undefined
    if (typeof value !== "string") continue

    const parts = value.split(".")
    const formIndex = parts.lastIndexOf("Form")
    if (formIndex >= 0 && parts[formIndex + 1]) result.add(parts[formIndex + 1])
  }
  return [...result]
}

function describeFormInnerProjectResources(folderName: string) {
  const formRoot = `${folderName}/{itemName}`
  return [
    {
      kind: "directory" as const,
      role: "resourceOnly" as const,
      projectPattern: "Справка",
      required: false,
      repeatable: false,
      owner: "currentItem" as const,
      compositionImpact: "none" as const,
      source: { kind: "propertyType" as const, type: "ChildFormNames" as const },
    },
    ...describeMetadataRuleProjectResources(ClientApplicationFormRules),
    ...describeMetadataRuleProjectResources(DynamicListRules),
  ]
    .filter((resource) => resource.role === "resourceOnly")
    .map((resource) => ({
      ...resource,
      projectPattern: `${formRoot}/${resource.projectPattern}`,
      repeatable: true,
    }))
}
