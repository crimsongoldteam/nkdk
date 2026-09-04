import { childUid } from "@nkdk/runtime"
import "../../commonObjects"
import {
  withConfigurationIndexExportFormElementRootLogicalAddress,
  withConfigurationIndexExportXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { getUUID } from "../../helpers/uuid"
import { recordCurrentExternalMetadataUuid } from "../../ruleRuntime/externalMetadata/record"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime/property/fromYAMLToXML"
import type { XMLItemOutputPreparation, YAMLToXMLExternalWrite, YAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { FormRulesTags } from "./rules"
import type { DeferredValuePath } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "../../ruleRuntime"
import { copyXmlAnomalyAnnotationsDeep, type XmlAnomalyAnnotations } from "@nkdk/runtime"
import { classifyTableSource } from "./tableSourceProfile"
import {
  materializeImplicitFormDataPaths,
  prepareFormDataPathContextFromYAML,
  type FormDataPathContext,
} from "./formDataPathContext"
import { assignFormXmlIds, type FormXmlIdAssignmentSession } from "./formXmlIdAssignment"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import { formatDataPathStandardMembersWithIndex } from "../../commonObjects/metadataPath/dataPathStandardMembers"
import { clientApplicationFormNamespaces } from "./namespaces"

const emptyOwnerMetadataCache = {
  listRefs: () => [],
  get: () => ({ status: "not-found" as const, diagnostics: [] }),
}

export interface ConvertClientApplicationFormFromYAMLToXMLParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly yaml: ClientApplicationFormYAML
  readonly name: string
  readonly referenceFormXML?: ClientApplicationFormXML
  readonly referenceMetadataXML?: FormMetadataXML
  readonly baseFormXML?: ClientApplicationFormXML
  readonly dataPathYaml?: ClientApplicationFormYAML
  readonly profile?: YAMLToXMLProfile
  readonly rule?: MetadataItemRule
  readonly formDataPathContext?: FormDataPathContext
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly savedBaseFormYaml?: ClientApplicationFormYAML
  readonly annotations?: XmlAnomalyAnnotations
  readonly xmlIdSession?: FormXmlIdAssignmentSession
}

export interface DirectClientApplicationFormXMLResult {
  readonly formXML: ClientApplicationFormXML
  readonly metadataXML: FormMetadataXML
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
  readonly deferredByDocument: ReadonlyMap<"metadata" | "form", readonly DeferredValuePath[]>
}

export function convertClientApplicationFormYAMLToXMLCore(
  params: ConvertClientApplicationFormFromYAMLToXMLParams
): DirectClientApplicationFormXMLResult {
  const rule = params.rule ?? ClientApplicationFormRules
  const ownerMetadataCache =
    params.context.importFromYAML?.ownerMetadataCache ??
    params.context.exportToYAML?.ownerMetadataCache ??
    emptyOwnerMetadataCache
  const formDataPathContext =
    params.formDataPathContext ??
    prepareFormDataPathContextFromYAML({
      yaml: params.dataPathYaml ?? params.yaml,
      ...(params.currentConfigurationFormYaml === undefined
        ? {}
        : { currentConfigurationFormYaml: params.currentConfigurationFormYaml }),
      ...(params.savedBaseFormYaml === undefined
        ? {}
        : { savedBaseFormYaml: params.savedBaseFormYaml }),
      ownerCache: ownerMetadataCache,
      rule,
    })
  const formDataPathIndex = formDataPathContext.index
  const materializedYaml = materializeImplicitFormDataPaths(params.yaml, formDataPathContext)
  copyXmlAnomalyAnnotationsDeep(params.annotations, params.yaml, materializedYaml)
  const resolveDataPath = params.context.importFromYAML?.resolveDataPath
  const resolveTableSourceProfile = createTableSourceClassifier({
    formDataPathIndex,
    ownerMetadataCache,
    resolveDataPath,
  })
  const metadataContext = {
    ...params.context,
    importFromYAML: {
      ...params.context.importFromYAML,
      ...(formDataPathContext.effectiveMainAttribute === undefined
        ? {}
        : { effectiveMainAttribute: formDataPathContext.effectiveMainAttribute }),
      formDataPathIndex,
      ownerMetadataCache,
      resolveTableSourceProfile: (dataPath: unknown, elementName?: string) => resolveTableSourceProfile(
        dataPath ?? (elementName === undefined
          ? undefined
          : formDataPathContext.elementsByName.get(elementName)?.currentConfigurationValue),
      ),
    },
  }
  const formContext = createFormBodyContext(metadataContext)
  const converted = convertPropertiesFromYAMLToXML({
    context: metadataContext,
    yaml: materializedYaml,
    annotations: params.annotations,
    rule,
    name: params.name,
    outputs: [
      { key: "metadata", tags: [FormRulesTags.Metadata], referenceXML: params.referenceMetadataXML },
      { key: "form", tags: [FormRulesTags.Form], referenceXML: params.referenceFormXML, context: formContext },
    ],
    profile: params.profile,
    rulePath: [rule.itemType],
  })

  const formProperties = converted.outputs.get("form") ?? {}
  const metadataProperties = converted.outputs.get("metadata") ?? {}
  const uuid =
    readMetadataUUID(metadataProperties) ?? params.referenceMetadataXML?.Form?._uuid ?? getUUID(params.context)
  recordCurrentExternalMetadataUuid({ context: params.context, uuid })

  const formXML = {
    ...clientApplicationFormNamespaces(params.context),
    _version: "2.20",
    ...formProperties,
    ...(params.baseFormXML === undefined ? {} : { BaseForm: params.baseFormXML }),
  } as ClientApplicationFormXML
  assignFormXmlIds(formXML, params.referenceFormXML, params.xmlIdSession)

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

/** Готовый индекс первого прохода позволяет вычислять контекст формы до построения YAML. */
export function prepareClientApplicationFormProofContexts(
  context: ConfigurationContextWithExportToXML,
  params?: {
    readonly yaml: ClientApplicationFormYAML
    readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
    readonly savedBaseFormYaml?: ClientApplicationFormYAML
    readonly rule?: MetadataItemRule
  },
): { readonly metadata: ConfigurationContextWithExportToXML; readonly form: ConfigurationContextWithExportToXML } {
  const prepared = params === undefined ? undefined : prepareFormDataPathContextFromYAML({
    yaml: params.yaml,
    ...(params.currentConfigurationFormYaml === undefined
      ? {}
      : { currentConfigurationFormYaml: params.currentConfigurationFormYaml }),
    ...(params.savedBaseFormYaml === undefined ? {} : { savedBaseFormYaml: params.savedBaseFormYaml }),
    ownerCache: context.importFromYAML?.ownerMetadataCache ?? context.exportToYAML?.ownerMetadataCache ?? emptyOwnerMetadataCache,
    rule: params.rule ?? ClientApplicationFormRules,
  })
  const formDataPathIndex = prepared?.index ?? context.importFromYAML?.formDataPathIndex
  const ownerMetadataCache = context.importFromYAML?.ownerMetadataCache ?? context.exportToYAML?.ownerMetadataCache
  if (formDataPathIndex === undefined || ownerMetadataCache === undefined) {
    return { metadata: context, form: createFormBodyContext(context) }
  }
  const resolveDataPath = context.importFromYAML?.resolveDataPath
  const classifyTableSource = createTableSourceClassifier({
    formDataPathIndex,
    ownerMetadataCache,
    resolveDataPath,
  })
  const resolveTableSourceProfile = (dataPath: unknown, elementName?: string) => {
    const input = dataPath ?? (elementName === undefined
      ? undefined
      : prepared?.elementsByName.get(elementName)?.currentConfigurationValue)
    return classifyTableSource(input)
  }
  const metadata: ConfigurationContextWithExportToXML = {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      ...(prepared?.effectiveMainAttribute === undefined
        ? {}
        : { effectiveMainAttribute: prepared.effectiveMainAttribute }),
      formDataPathIndex,
      resolveTableSourceProfile,
    },
  }
  return { metadata, form: createFormBodyContext(metadata) }
}

function createTableSourceClassifier(params: {
  readonly formDataPathIndex: NonNullable<ConfigurationContextWithExportToXML["importFromYAML"]>["formDataPathIndex"]
  readonly ownerMetadataCache: NonNullable<ConfigurationContextWithExportToXML["importFromYAML"]>["ownerMetadataCache"]
  readonly resolveDataPath: NonNullable<ConfigurationContextWithExportToXML["importFromYAML"]>["resolveDataPath"]
}) {
  const { formDataPathIndex: index, ownerMetadataCache: ownerCache, resolveDataPath } = params
  return (dataPath: unknown) => {
    const semanticDataPath = typeof dataPath === "string"
      ? formatDataPathStandardMembersWithIndex({
          value: dataPath,
          direction: "internal-to-yaml",
          index: index!,
          ownerCache: ownerCache!,
        })
      : dataPath
    const resolve = (value: string) => resolveDataPath === undefined
      ? resolveDataPathCore({ value, nameMode: "yaml", index: index!, ownerCache: ownerCache! })
      : resolveDataPath({ value, index: index!, ownerCache: ownerCache! })
    const result = classifyTableSource({
      dataPath: semanticDataPath,
      index: index!,
      resolve,
    })
    return result
  }
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

/** Финальная оболочка двух корней формы для локального proof и обычного экспорта. */
export function prepareClientApplicationFormRootOutput(params: {
  readonly key: string
  readonly context: ConfigurationContextWithExportToXML
  readonly source?: import("@nkdk/runtime").XmlElementNode
}): XMLItemOutputPreparation | undefined {
  if (params.key === "source-0") {
    return {
      attributes: (own) => ({
        ...clientApplicationFormNamespaces(params.context),
        _version: "2.20",
        ...own,
      }),
    }
  }
  if (params.key === "source-1") {
    return {
      attributes: (own) => ({ ...METADATA_NAMESPACES, _version: "2.20", ...own }),
      initialize(body) {
        const form = asRecord("Form" in body ? body.Form : undefined)
        if (form === undefined) return
        if (Object.prototype.hasOwnProperty.call(form, "_uuid")) return
        const sourceForm = params.source?.content.find(
          (entry): entry is import("@nkdk/runtime").XmlElementNode => entry.type === "element" && entry.name === "Form",
        )
        const sourceUuid = sourceForm?.attributes.find(({ name }) => name === "uuid")?.value
        form._uuid = sourceUuid ?? (typeof form._uuid === "string" ? form._uuid : getUUID(params.context))
      },
    }
  }
  return undefined
}
