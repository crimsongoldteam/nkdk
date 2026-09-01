import type { ConfigurationContextWithExportToXML, XmlAnomalyAnnotations } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { childUid } from "@nkdk/runtime"
import type { LocalConfigurationIndexReader } from "@nkdk/runtime"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./types"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { ClientApplicationFormRules } from "./rules"
import type { FormXmlIdAssignmentSession } from "./formXmlIdAssignment"

export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex?: LocalConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionYaml?: ClientApplicationFormYAML
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly referenceFormXML?: ClientApplicationFormXML
  readonly formName: string
  readonly rule?: MetadataItemRule
  readonly xmlIdSession?: FormXmlIdAssignmentSession
}): ClientApplicationFormXML {
  if (params.extensionYaml === undefined) {
    return buildSavedClientApplicationBaseForm(params)
  }
  if (params.baseIndex === undefined) {
    throw new Error("Для построения проекции BaseForm не передан индекс основной конфигурации")
  }
  return buildProjectedClientApplicationBaseForm({
    ...params,
    baseIndex: params.baseIndex,
    extensionYaml: params.extensionYaml,
    baseAnnotations: params.baseAnnotations,
    extensionAnnotations: params.extensionAnnotations,
  })
}

function buildProjectedClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex: LocalConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionYaml: ClientApplicationFormYAML
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly referenceFormXML?: ClientApplicationFormXML
  readonly formName: string
  readonly rule?: MetadataItemRule
  readonly xmlIdSession?: FormXmlIdAssignmentSession
}): ClientApplicationFormXML {
  const rule = params.rule ?? ClientApplicationFormRules
  const projected = projectClientApplicationBaseForm({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
    baseAnnotations: params.baseAnnotations,
    extensionAnnotations: params.extensionAnnotations,
    rule,
  })
  const runtime = params.context.exportToXML.configurationIndex
  const projectedSource =
    runtime === undefined
      ? undefined
      : createBaseFormConfigurationIndexReader({
          base: params.baseIndex,
          extension: runtime.source,
          formLogicalAddress: runtime.logicalAddress,
          extensionIdentityAddresses: extensionIdentityAddresses({
            formAddress: runtime.logicalAddress,
            projected,
          }),
        })
  const context = withDiscardedConfigurationIndexWrites(
    params.context,
    projectedSource
  )
  const converted = convertClientApplicationFormYAMLToXMLCore({
    context,
    yaml: projected.yaml,
    annotations: projected.annotations,
    dataPathYaml: projected.yaml,
    currentConfigurationFormYaml:
      params.currentConfigurationFormYaml ?? params.baseYaml,
    name: params.formName,
    referenceFormXML: params.referenceFormXML,
    rule,
    xmlIdSession: params.xmlIdSession,
  }).formXML
  return Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
}

function buildSavedClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseYaml: ClientApplicationFormYAML
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly referenceFormXML?: ClientApplicationFormXML
  readonly formName: string
  readonly rule?: MetadataItemRule
  readonly xmlIdSession?: FormXmlIdAssignmentSession
}): ClientApplicationFormXML {
  const converted = convertClientApplicationFormYAMLToXMLCore({
    context: params.context,
    yaml: params.baseYaml,
    annotations: params.baseAnnotations,
    dataPathYaml: params.baseYaml,
    ...(params.currentConfigurationFormYaml === undefined
      ? {}
      : { currentConfigurationFormYaml: params.currentConfigurationFormYaml }),
    name: params.formName,
    referenceFormXML: params.referenceFormXML,
    rule: params.rule ?? ClientApplicationFormRules,
    xmlIdSession: params.xmlIdSession,
  }).formXML
  return Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
}

function withDiscardedConfigurationIndexWrites(
  context: ConfigurationContextWithExportToXML,
  source: LocalConfigurationIndexReader | undefined
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  const configurationIndex = createConfigurationIndexExportRuntime({
    source: source ?? runtime.source,
    collector: createConfigurationIndexCollector(),
    targetProjectPath: runtime.targetProjectPath,
    logicalAddress: runtime.logicalAddress,
    operationSeed: runtime.operationSeed,
    ...(runtime.xmlNodeLogicalAddress === undefined
      ? {}
      : { xmlNodeLogicalAddress: runtime.xmlNodeLogicalAddress }),
    ...(runtime.formElementRootLogicalAddress === undefined
      ? {}
      : { formElementRootLogicalAddress: runtime.formElementRootLogicalAddress }),
    ...(runtime.childCollectionUidSegment === undefined
      ? {}
      : { childCollectionUidSegment: runtime.childCollectionUidSegment }),
    ...(runtime.yamlPathAddressing === undefined
      ? {}
      : { yamlPathAddressing: runtime.yamlPathAddressing }),
  })
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex,
      requireExistingConfigurationIdentities: true,
      xmlDefaultVariantByLogicalAddress: {
        ...context.exportToXML.xmlDefaultVariantByLogicalAddress,
        [runtime.logicalAddress]: "indexed",
      },
    },
  }
}

function extensionIdentityAddresses(params: {
  readonly formAddress: string
  readonly projected: ReturnType<typeof projectClientApplicationBaseForm>
}): ReadonlySet<string> {
  return new Set([
    ...[...params.projected.explicitComponents.attributes].map((name) =>
      childUid(params.formAddress, "Атрибут", name)
    ),
    ...[...params.projected.explicitComponents.commands].map((name) =>
      childUid(params.formAddress, "Команда", name)
    ),
    ...[...params.projected.explicitComponents.parameters].map((name) =>
      childUid(params.formAddress, "Параметр", name)
    ),
  ])
}
