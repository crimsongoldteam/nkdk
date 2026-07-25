import { childUid } from "../../configurationIndex/logicalAddress"
import "../../commonObjects"
import {
  withConfigurationIndexExportFormElementRootLogicalAddress,
  withConfigurationIndexExportXmlNodeLogicalAddress,
} from "../../configurationIndex/referenceView"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { getUUID } from "../../helpers/uuid"
import { recordCurrentExternalMetadataUuid } from "../../orchestration/externalMetadata/record"
import { convertPropertiesFromYAMLToXML } from "../../orchestration/property/fromYAMLToXML"
import type { YAMLToXMLExternalWrite, YAMLToXMLProfile } from "../../orchestration/property/fromYAMLToXMLTypes"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { FormRulesTags } from "./types"
import { createFormDataPathIndexFromYAML } from "../../validation/dataPath/formYamlIndex"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { DeferredValuePath } from "../../orchestration/property/deferredObjectValues"

export interface ConvertClientApplicationFormFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: ClientApplicationFormYAML
  readonly name: string
  readonly referenceFormXML?: ClientApplicationFormXML
  readonly referenceMetadataXML?: FormMetadataXML
  readonly profile?: YAMLToXMLProfile
}

export interface DirectClientApplicationFormXMLResult {
  readonly formXML: ClientApplicationFormXML
  readonly metadataXML: FormMetadataXML
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
  readonly deferredByDocument: ReadonlyMap<"metadata" | "form", readonly DeferredValuePath[]>
}

export function convertClientApplicationFormFromYAMLToXML(
  params: ConvertClientApplicationFormFromYAMLToXMLParams
): DirectClientApplicationFormXMLResult {
  const metadataContext = {
    ...params.context,
    importFromYAML: {
      ...params.context.importFromYAML,
      formDataPathIndex: createFormDataPathIndexFromYAML(params.yaml),
    },
  }
  const formContext = createFormBodyContext(metadataContext)
  const converted = convertPropertiesFromYAMLToXML({
    context: metadataContext,
    yaml: params.yaml,
    rule: ClientApplicationFormRules,
    name: params.name,
    outputs: [
      { key: "metadata", tags: [FormRulesTags.Metadata], referenceXML: params.referenceMetadataXML },
      { key: "form", tags: [FormRulesTags.Form], referenceXML: params.referenceFormXML, context: formContext },
    ],
    profile: params.profile,
    rulePath: [ClientApplicationFormRules.itemType],
  })

  const formProperties = converted.outputs.get("form") ?? {}
  const metadataProperties = converted.outputs.get("metadata") ?? {}
  const uuid =
    readMetadataUUID(metadataProperties) ?? params.referenceMetadataXML?.Form?._uuid ?? getUUID(params.context)
  recordCurrentExternalMetadataUuid({ context: params.context, uuid })

  const formXML = {
    ...FORM_NAMESPACES,
    _version: "2.20",
    ...formProperties,
  } as ClientApplicationFormXML
  assignGeneratedIds(formXML, params.referenceFormXML)

  const generatedForm = asRecord(metadataProperties.Form) ?? {}
  const metadataXML = {
    ...METADATA_NAMESPACES,
    _version: "2.20",
    ...metadataProperties,
    Form: { ...generatedForm, _uuid: uuid },
  } as FormMetadataXML

  return {
    formXML,
    metadataXML,
    externalWrites: converted.externalWrites,
    deferredByDocument: new Map([
      ["metadata", converted.deferredByOutput.get("metadata") ?? []],
      ["form", converted.deferredByOutput.get("form") ?? []],
    ]),
  }
}

function createFormBodyContext(context: ConfigurationContextWithExportToXML): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  return withConfigurationIndexExportXmlNodeLogicalAddress(
    withConfigurationIndexExportFormElementRootLogicalAddress(context, runtime.logicalAddress),
    childUid(runtime.logicalAddress, "ЧастьФормы", "Содержимое")
  )
}

function assignGeneratedIds(generated: unknown, reference: unknown): void {
  const occupied = new Set<string>()
  collectIds(reference, occupied)
  let next = 1

  const visit = (value: unknown, referenceValue: unknown): void => {
    if (Array.isArray(value)) {
      const references = Array.isArray(referenceValue) ? referenceValue : []
      value.forEach((item, index) => visit(item, findReferenceNode(item, references) ?? references[index]))
      return
    }
    if (!isRecord(value)) return
    const referenceRecord = isRecord(referenceValue) ? referenceValue : undefined
    if (Object.prototype.hasOwnProperty.call(value, "_id")) {
      const referenceId = typeof referenceRecord?._id === "string" ? referenceRecord._id : undefined
      if (referenceId !== undefined) value._id = referenceId
      else if (typeof value._id !== "string" || value._id.length === 0) {
        while (occupied.has(String(next))) next++
        value._id = String(next++)
      }
      if (typeof value._id === "string") occupied.add(value._id)
    }
    for (const [key, child] of Object.entries(value)) visit(child, referenceRecord?.[key])
  }

  visit(generated, reference)
}

function findReferenceNode(value: unknown, references: unknown[]): unknown {
  if (!isRecord(value) || typeof value._name !== "string") return undefined
  return references.find((item) => isRecord(item) && item._name === value._name)
}

function collectIds(value: unknown, result: Set<string>): void {
  if (Array.isArray(value)) return value.forEach((item) => collectIds(item, result))
  if (!isRecord(value)) return
  if (typeof value._id === "string" && value._id.length > 0) result.add(value._id)
  Object.values(value).forEach((item) => collectIds(item, result))
}

function readMetadataUUID(metadata: Record<string, unknown>): string | undefined {
  const form = asRecord(metadata.Form)
  return typeof form?._uuid === "string" ? form._uuid : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

const FORM_NAMESPACES = {
  _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
  "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
  "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
  "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
  "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
} as const

const METADATA_NAMESPACES = {
  _xmlns: "http://v8.1c.ru/8.3/MDClasses",
  "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "_xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
  "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
  "_xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
  "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
} as const

registerTypeRule("ClientApplicationForm", "yamlToXMLNestedRule", {
  kind: "externalFile",
  convert: ({ context, yaml, name, referenceXML }) => ({
    Form: convertClientApplicationFormFromYAMLToXML({
      context,
      yaml: yaml as ClientApplicationFormYAML,
      name,
      referenceFormXML: referenceXML?.Form as ClientApplicationFormXML | undefined,
    }).formXML,
  }),
})
