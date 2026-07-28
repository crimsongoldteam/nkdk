import type {
  ConfigurationIdentity,
} from "../../configurationIndex/types"
import type {
  ConfigurationIndexReader,
} from "../../configurationIndex/sharedSnapshot"

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): ConfigurationIndexReader {
  const identitySource = (logicalAddress: string): ConfigurationIndexReader =>
    params.extensionIdentityAddresses.has(logicalAddress)
      ? params.extension
      : params.base

  return {
    snapshot: params.base.snapshot,
    binding: () => params.base.binding(),
    projectFile: (projectPath) => params.base.projectFile(projectPath),
    projectFiles: () => params.base.projectFiles(),
    identity(logicalAddress, kind) {
      const value = identitySource(logicalAddress).identity(
        logicalAddress,
        kind
      )
      if (
        value === undefined &&
        kind === "xmlId" &&
        requiresBaseFormXmlId(logicalAddress)
      ) {
        throw new Error(
          `Не найден обязательный xmlId BaseForm: ${logicalAddress}`
        )
      }
      return value
    },
    identities: () => projectedIdentities(params),
    xmlNodes: () => params.base.xmlNodes(),
    xmlNode: (logicalAddress) => params.base.xmlNode(logicalAddress),
    xmlValue: (logicalAddress) => params.base.xmlValue(logicalAddress),
  }
}

function projectedIdentities(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): readonly ConfigurationIdentity[] {
  return [
    ...params.base
      .identities()
      .filter(
        ({ logicalAddress }) =>
          !params.extensionIdentityAddresses.has(logicalAddress)
      ),
    ...params.extension
      .identities()
      .filter(({ logicalAddress }) =>
        params.extensionIdentityAddresses.has(logicalAddress)
      ),
  ]
}

const requiredBaseFormIdentitySegments = new Set([
  "Элемент",
  "Атрибут",
  "Команда",
  "Параметр",
])
const requiredBaseFormSingletonSegments = new Set([
  "АвтоКоманднаяПанель",
  "КоманднаяПанель",
  "КонтекстноеМеню",
  "РасширеннаяПодсказка",
  "СостояниеПросмотра",
  "СтрокаПоиска",
  "Таблица",
  "УправлениеПоиском",
])

function requiresBaseFormXmlId(logicalAddress: string): boolean {
  const segments = logicalAddress.split(".")
  const directKind = segments.at(-2)
  const singleton = segments.at(-1)
  return (
    (directKind !== undefined &&
      requiredBaseFormIdentitySegments.has(directKind)) ||
    (singleton !== undefined &&
      requiredBaseFormSingletonSegments.has(singleton))
  )
}
