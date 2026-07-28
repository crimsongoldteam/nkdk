import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { ConfigurationIdentity } from "../../configurationIndex/types"

export function assertRequiredConfigurationIdentity(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly kind: ConfigurationIdentity["kind"] | undefined
}): void {
  if (
    params.kind === undefined ||
    params.context.exportToXML.requireExistingConfigurationIdentities !== true
  ) {
    return
  }
  const runtime = params.context.exportToXML.configurationIndex
  if (
    runtime !== undefined &&
    runtime.identity(params.kind) === undefined
  ) {
    throw new Error(
      `Не найден обязательный ${params.kind}: ${runtime.logicalAddress}`
    )
  }
}
