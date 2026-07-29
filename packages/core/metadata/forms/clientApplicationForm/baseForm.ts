import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { childUid } from "../../configurationIndex/logicalAddress"
import type { ConfigurationIndexReader } from "../../configurationIndex/sharedSnapshot"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import { createBaseFormConfigurationIndexReader } from "./baseFormIndex"
import { projectClientApplicationBaseForm } from "./baseFormProjection"

export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex: ConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly formName: string
}): ClientApplicationFormXML {
  const projected = projectClientApplicationBaseForm({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
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
  const converted = convertClientApplicationFormFromYAMLToXML({
    context,
    yaml: projected.yaml,
    dataPathYaml: projected.yaml,
    name: params.formName,
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
