import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type {
  ExportToXMLFunctionNew,
  ExportToYAMLFunctionNew,
  ImportFromXMLFunction,
  ImportFromYAMLFunctionNew,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
} from "~/metadata/orchestration/property/fn"
import { createEmptyClientApplicationForm } from "./createEmpty"
import { copyFormItemExternalFilesFromXML, copyFormItemExternalFilesToXML } from "./externalItemFiles"
import { importClientApplicationFormFromXML } from "./fromXML"
import { importClientApplicationFormFromYAML } from "./fromYAML"
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
  return exportClientApplicationFormToYAML(params.context, form).yaml
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

  await copyFormItemExternalFilesFromXML({
    formXmlDir: getDirectFormXmlDir({ baseDir: join(params.xmlDir, params.name), rule: params.rule }),
    formNkdkDir: params.nkdkDir,
  })
}

const syncClientApplicationFormExternalToXML: SyncExternalToXMLFunction = async (params) => {
  if (params.rule.filePath === undefined) return

  await copyFormItemExternalFilesToXML({
    formNkdkDir: params.nkdkDir,
    formXmlDir: getDirectFormXmlDir({ baseDir: params.xmlDir, rule: params.rule }),
    xmlManifest: params.xmlManifest,
  })
}

registerTypeRule("ClientApplicationForm", "importFromYAML", importClientApplicationFormPropertyFromYAML)
registerTypeRule("ClientApplicationForm", "exportToYAML", exportClientApplicationFormPropertyToYAML)
registerTypeRule("ClientApplicationForm", "importFromXML", importClientApplicationFormPropertyFromXML)
registerTypeRule("ClientApplicationForm", "exportToXML", exportClientApplicationFormPropertyToXML)
registerTypeRule("ClientApplicationForm", "syncExternalFromXML", syncClientApplicationFormExternalFromXML)
registerTypeRule("ClientApplicationForm", "syncExternalToXML", syncClientApplicationFormExternalToXML)

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
