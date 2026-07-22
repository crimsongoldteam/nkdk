import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { describeMetadataRuleProjectResources } from "../../project/ruleResources"
import { DynamicListRules } from "../commonObjects/dynamicList/rules"
import type {
  ExportToXMLFunctionNew,
  ExportToYAMLFunctionNew,
  ImportFromXMLFunction,
  ImportFromYAMLFunctionNew,
  ProjectResourcesFunction,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
} from "../../orchestration/property/fn"
import { createEmptyClientApplicationForm } from "./createEmpty"
import {
  copyFormItemExternalFilesFromXML,
  copyFormItemExternalFilesToXML,
  describeFormItemXmlImportRoutes,
} from "./externalItemFiles"
import { copyExistingRawFile } from "./externalRawFiles"
import { importClientApplicationFormFromXML } from "./fromXML"
import { importClientApplicationFormFromYAML } from "./fromYAML"
import { ClientApplicationFormRules } from "./rules"
import { createClientApplicationFormBodyImportSource } from "./xmlImportSources"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"
import { exportClientApplicationFormToXML } from "./toXML"
import { exportClientApplicationFormToYAML } from "./toYAML"
import type {
  ClientApplicationForm,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
  FormMetadataXML,
} from "./types"

const importClientApplicationFormPropertyFromYAML: ImportFromYAMLFunctionNew = (params) => {
  if (params.value == null) return asClientApplicationForm(params.source)

  return importClientApplicationFormFromYAML(
    params.context,
    params.value as ClientApplicationFormYAML,
    asClientApplicationForm(params.source) ?? createEmptyClientApplicationForm()
  )
}

const exportClientApplicationFormPropertyToYAML: ExportToYAMLFunctionNew = (params) => {
  const form = asClientApplicationForm(params.value)
  if (!form) return undefined
  const { yaml, externalFiles } = exportClientApplicationFormToYAML(params.context, form)
  params.context.exportToYAML?.externalFilesCollector?.push(...externalFiles)
  return yaml
}

const importClientApplicationFormPropertyFromXML: ImportFromXMLFunction = (context, _rule, xml) => {
  const formXML = extractFormXML(xml)
  if (!formXML) return undefined

  return importClientApplicationFormFromXML({
    context,
    xml: formXML,
    xmlMetadata: createEmptyFormMetadataXML(),
  })
}

const exportClientApplicationFormPropertyToXML: ExportToXMLFunctionNew = (params) => {
  const form = asClientApplicationForm(params.value)
  if (!form) return undefined

  return {
    Form: exportClientApplicationFormToXML({
      context: params.context,
      form,
      referenceForm: asClientApplicationForm(params.referenceMetadata),
    }),
  }
}

const getDirectFormXmlDir = (params: { baseDir: string; rule: { filePath?: string } }): string =>
  join(params.baseDir, dirname(params.rule.filePath ?? ""))

const syncClientApplicationFormExternalFromXML: SyncExternalFromXMLFunction = async (params) => {
  if (params.rule.filePath === undefined) return

  const formXmlDir = getDirectFormXmlDir({ baseDir: join(params.xmlDir, params.name), rule: params.rule })
  await copyFormItemExternalFilesFromXML({
    formXmlDir,
    formNkdkDir: params.nkdkDir,
  })
  await copyExistingRawFile({
    sourcePath: join(formXmlDir, "Form.bin"),
    targetPath: join(params.nkdkDir, "Form.bin"),
  })
}

const syncClientApplicationFormExternalToXML: SyncExternalToXMLFunction = async (params) => {
  if (params.rule.filePath === undefined) return

  const formXmlDir = getDirectFormXmlDir({ baseDir: params.xmlDir, rule: params.rule })
  await copyFormItemExternalFilesToXML({
    formNkdkDir: params.nkdkDir,
    formXmlDir,
    xmlManifest: params.xmlManifest,
  })
  await copyExistingRawFile({
    sourcePath: join(params.nkdkDir, "Form.bin"),
    targetPath: join(formXmlDir, "Form.bin"),
    xmlManifest: params.xmlManifest,
  })
}

const describeClientApplicationFormProjectResources: ProjectResourcesFunction = () => [
  {
    kind: "yaml",
    role: "resourceOnly",
    projectPattern: "Form.bin",
    required: false,
    repeatable: false,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ClientApplicationForm" },
  },
  {
    kind: "directory",
    role: "resourceOnly",
    projectPattern: "Справка",
    required: false,
    repeatable: false,
    owner: "currentItem",
    compositionImpact: "none",
    source: { kind: "propertyType", type: "ClientApplicationForm" },
  },
  ...describeMetadataRuleProjectResources(ClientApplicationFormRules),
  ...describeMetadataRuleProjectResources(DynamicListRules),
]

registerTypeRule("ClientApplicationForm", "importFromYAML", importClientApplicationFormPropertyFromYAML)
registerTypeRule("ClientApplicationForm", "exportToYAML", exportClientApplicationFormPropertyToYAML)
registerTypeRule("ClientApplicationForm", "importFromXML", importClientApplicationFormPropertyFromXML)
registerTypeRule("ClientApplicationForm", "nestedItemRule", { itemRule: ClientApplicationFormRules })
registerTypeRule("ClientApplicationForm", "resolveNestedImportXMLSources", ({ context, xml }) => [
  createClientApplicationFormBodyImportSource({ context, xml }),
])
registerTypeRule("ClientApplicationForm", "exportToXML", exportClientApplicationFormPropertyToXML)
registerTypeRule("ClientApplicationForm", "exportToJSONSchema", exportClientApplicationFormToJSONSchema)
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", syncClientApplicationFormExternalFromXML)
registerTypeRule("ClientApplicationForm", "syncExternalToXML", syncClientApplicationFormExternalToXML)
registerTypeRule("ClientApplicationForm", "projectResources", describeClientApplicationFormProjectResources)
registerTypeRule("ClientApplicationForm", "xmlImportRoutes", ({ propertyRule }) => {
  const filePath = propertyRule?.filePath
  if (filePath === undefined) return []
  return [
    {
      kind: "assignment",
      xmlPattern: filePath,
      targetPattern: "",
      role: "properties",
      inputRole: "body",
      itemType: "",
      source: { kind: "propertyType", type: "ClientApplicationForm" },
    },
    {
      kind: "externalFile",
      xmlPattern: join(dirname(filePath), "Form.bin").replace(/\\/g, "/"),
      targetPattern: "Form.bin",
      assignmentTargetPattern: "",
      source: { kind: "propertyType", type: "ClientApplicationForm" },
    },
    ...describeFormItemXmlImportRoutes({
      xmlFormDirPattern: dirname(filePath).replace(/\\/g, "/"),
      targetFormDirPattern: "",
      assignmentTargetPattern: "",
    }),
  ]
})

function asClientApplicationForm(value: unknown): ClientApplicationForm | undefined {
  if (!isRecord(value)) return undefined
  if (value.itemType !== "ClientApplicationForm") return undefined
  return value as ClientApplicationForm
}

function extractFormXML(xml: unknown): ClientApplicationFormXML | undefined {
  if (!isRecord(xml)) return undefined
  return (isRecord(xml.Form) ? xml.Form : xml) as ClientApplicationFormXML
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function createEmptyFormMetadataXML(): FormMetadataXML {
  return {
    Form: {
      Properties: {},
    },
  }
}
