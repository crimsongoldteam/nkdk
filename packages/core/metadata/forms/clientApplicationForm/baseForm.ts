import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"

export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly formName: string
}): ClientApplicationFormXML {
  const context = withDiscardedConfigurationIndexWrites(params.context)
  const converted = convertClientApplicationFormFromYAMLToXML({
    context,
    yaml: params.baseYaml,
    dataPathYaml: params.extensionYaml,
    name: params.formName,
  }).formXML
  const result = Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
  result._version ??= "2.20"
  return result
}

function withDiscardedConfigurationIndexWrites(
  context: ConfigurationContextWithExportToXML
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  const configurationIndex = createConfigurationIndexExportRuntime({
    source: runtime.source,
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
    },
  }
}
