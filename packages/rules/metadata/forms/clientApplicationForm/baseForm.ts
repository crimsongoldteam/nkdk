import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { childUid } from "@nkdk/runtime"
import type { ConfigurationIndexReader } from "@nkdk/runtime"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./types"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { ClientApplicationFormRules } from "./rules"

export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex?: ConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml?: ClientApplicationFormYAML
  readonly formName: string
  readonly rule?: MetadataItemRule
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
  })
}

function buildProjectedClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex: ConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly formName: string
  readonly rule?: MetadataItemRule
}): ClientApplicationFormXML {
  const rule = params.rule ?? ClientApplicationFormRules
  const projected = projectClientApplicationBaseForm({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
    rule,
  })
  const runtime = params.context.exportToXML.configurationIndex
  const projectedSource =
    runtime === undefined
      ? undefined
      : createBaseFormConfigurationIndexReader({
          base: params.baseIndex,
          extension: runtime.source,
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
    dataPathYaml: projected.yaml,
    name: params.formName,
    rule,
  }).formXML
  return Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
}

function buildSavedClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseYaml: ClientApplicationFormYAML
  readonly formName: string
  readonly rule?: MetadataItemRule
}): ClientApplicationFormXML {
  const converted = convertClientApplicationFormYAMLToXMLCore({
    context: params.context,
    yaml: params.baseYaml,
    dataPathYaml: params.baseYaml,
    name: params.formName,
    rule: params.rule ?? ClientApplicationFormRules,
  }).formXML
  return Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
}

function withDiscardedConfigurationIndexWrites(
  context: ConfigurationContextWithExportToXML,
  source: ConfigurationIndexReader | undefined
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  const configurationIndex = createConfigurationIndexExportRuntime({
    source: source ?? runtime.source,
    collector: createConfigurationIndexCollector(),
    targetProjectPath: runtime.targetProjectPath,
    logicalAddress: runtime.logicalAddress,
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
