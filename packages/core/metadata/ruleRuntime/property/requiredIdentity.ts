import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"

type RequiredConfigurationIdentityKind = "uuid" | "xmlId" | "xmlName"

export function assertRequiredConfigurationIdentity(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly kind: RequiredConfigurationIdentityKind | undefined
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
