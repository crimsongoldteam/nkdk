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
import type { YAMLToXMLExternalWrite, YAMLToXMLProfile } from "@nkdk/runtime/rule-kit"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { FormRulesTags } from "./rules"
import type { DeferredValuePath } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "../../ruleRuntime"
import { classifyTableSource } from "./tableSourceProfile"
import {
  materializeImplicitFormDataPaths,
  prepareFormDataPathContextFromYAML,
  type FormDataPathContext,
} from "./formDataPathContext"
import { assignFormXmlIds } from "./formXmlIdAssignment"

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
  const resolveDataPath = params.context.importFromYAML?.resolveDataPath
  const metadataContext = {
    ...params.context,
    importFromYAML: {
      ...params.context.importFromYAML,
      ...(formDataPathContext.effectiveMainAttribute === undefined
        ? {}
        : { effectiveMainAttribute: formDataPathContext.effectiveMainAttribute }),
      formDataPathIndex,
      ownerMetadataCache,
      resolveTableSourceProfile: (dataPath: unknown, elementName?: string) =>
        classifyTableSource({
          dataPath:
            dataPath ?? (
              elementName === undefined
                ? undefined
                : formDataPathContext.elementsByName.get(elementName)?.currentConfigurationValue
            ),
          index: formDataPathIndex,
          ...(resolveDataPath === undefined
            ? {}
            : { resolve: (value: string) => resolveDataPath({ value, index: formDataPathIndex, ownerCache: ownerMetadataCache }) }),
        }),
    },
  }
  const formContext = createFormBodyContext(metadataContext)
  const converted = convertPropertiesFromYAMLToXML({
    context: metadataContext,
    yaml: materializedYaml,
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
    ...FORM_NAMESPACES,
    _version: "2.20",
    ...formProperties,
    ...(params.baseFormXML === undefined ? {} : { BaseForm: params.baseFormXML }),
  } as ClientApplicationFormXML
  assignFormXmlIds(formXML, params.referenceFormXML)

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
