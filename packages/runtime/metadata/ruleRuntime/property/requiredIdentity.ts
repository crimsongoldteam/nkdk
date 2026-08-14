import type { ConfigurationContextWithExportToXML } from "../../context/types"

type RequiredConfigurationIdentityKind = "uuid" | "xmlId" | "xmlName"

export function assertRequiredConfigurationIdentity(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly kind: RequiredConfigurationIdentityKind | undefined
}): void {
  // XML-id формы может быть восстановлен из целевого XML или назначен после
  // построения всей формы, когда известны ID остальных элементов.
  if (params.kind === "xmlId") return
  if (params.kind === "xmlName") return
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
