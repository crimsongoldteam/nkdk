import type { TSchema } from "typebox"
import type { MetadataItemType, ToMetadata } from "../ruleRuntime/metadataItem/registry"
import type { ExternalMetadataCollector, ExternalMetadataItemRule } from "../ruleRuntime/externalMetadata/types"
import type { MetadataTargetOwner } from "../ruleRuntime/metadataTarget/types"
import type { PropertyRuleType } from "../ruleRuntime/property/registry"

export type ContextElementToXML = {
  name: string
  itemType: MetadataItemType
  path: string
  externalMetadata?: ExternalMetadataItemRule
}

export interface ConfigurationLanguages {
  readonly default: string
  readonly registered: readonly string[]
  readonly registeredSet: ReadonlySet<string>
  readonly version: string
}

class ImmutableSet<T> implements ReadonlySet<T> {
  readonly #values: Set<T>

  constructor(values: Iterable<T>) {
    this.#values = new Set(values)
    Object.freeze(this)
  }

  get size(): number {
    return this.#values.size
  }

  has(value: T): boolean {
    return this.#values.has(value)
  }

  entries(): SetIterator<[T, T]> {
    return this.#values.entries()
  }

  keys(): SetIterator<T> {
    return this.#values.keys()
  }

  values(): SetIterator<T> {
    return this.#values.values()
  }

  forEach(callback: (value: T, key: T, set: ReadonlySet<T>) => void, thisArg?: unknown): void {
    for (const value of this.#values) callback.call(thisArg, value, value, this)
  }

  union<U>(other: ReadonlySetLike<U>): Set<T | U> {
    return this.#values.union(other)
  }

  intersection<U>(other: ReadonlySetLike<U>): Set<T & U> {
    return this.#values.intersection(other)
  }

  difference<U>(other: ReadonlySetLike<U>): Set<T> {
    return this.#values.difference(other)
  }

  symmetricDifference<U>(other: ReadonlySetLike<U>): Set<T | U> {
    return this.#values.symmetricDifference(other)
  }

  isSubsetOf(other: ReadonlySetLike<unknown>): boolean {
    return this.#values.isSubsetOf(other)
  }

  isSupersetOf(other: ReadonlySetLike<unknown>): boolean {
    return this.#values.isSupersetOf(other)
  }

  isDisjointFrom(other: ReadonlySetLike<unknown>): boolean {
    return this.#values.isDisjointFrom(other)
  }

  [Symbol.iterator](): SetIterator<T> {
    return this.#values[Symbol.iterator]()
  }
}

export function createConfigurationLanguages(params: {
  readonly default: string
  readonly registered: readonly string[]
}): ConfigurationLanguages {
  if (params.default.trim() === "") throw new Error("Код основного языка не должен быть пустым")
  const registered = [...params.registered]
  const values = new Set<string>()
  for (const code of registered) {
    if (code.trim() === "") throw new Error("Код зарегистрированного языка не должен быть пустым")
    if (values.has(code)) throw new Error(`Код языка зарегистрирован повторно: ${code}`)
    values.add(code)
  }
  if (!values.has(params.default)) {
    throw new Error(`Основной язык не зарегистрирован: ${params.default}`)
  }
  const frozenRegistered = Object.freeze(registered)
  return Object.freeze({
    default: params.default,
    registered: frozenRegistered,
    registeredSet: new ImmutableSet(values),
    version: JSON.stringify([params.default, [...registered].sort(compareLanguageCodes)]),
  })
}

/** Восстанавливает вычисляемый индекс языков после передачи контекста через structured clone. */
export function rehydrateConfigurationContext<T extends ConfigurationContext>(context: T): T {
  return {
    ...context,
    languages: createConfigurationLanguages({
      default: context.languages.default,
      registered: context.languages.registered,
    }),
  }
}

function compareLanguageCodes(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

export type JSONSchemaExportMode = "externalRefs" | "inline"

export interface MetadataContextTypeMap {}

type MetadataContextType<Name extends PropertyKey> = Name extends keyof MetadataContextTypeMap
  ? MetadataContextTypeMap[Name]
  : never

type FormElementType = MetadataContextType<"formElementType">
type FormElementXML = MetadataContextType<"formElementXML">

export interface JSONSchemaExportContext {
  mode: JSONSchemaExportMode
  refs: Set<string>
  excludeImplicitValueYAML?: boolean
  includeNestedChildItems?: boolean
  explicitXMLValues?: true
  validationPropertyRefs?: true
  propertySchemaOverrides?: Partial<Record<PropertyRuleType, TSchema>>
  schemaStack?: PropertyRuleType[]
  defineSchema?: (
    name: string,
    exporter: (params: { context: ConfigurationContext }) => TSchema,
  ) => void
  propertyRef?: (params: {
    context: ConfigurationContext
    rule: unknown
  }) => TSchema | undefined
  requiredPolicy?: {
    readonly currentBoundary: "full" | "defer"
    readonly cacheVariant: "full" | "extension-overlay"
  }
}

export type ContextElementToEnterprise =
  | {
      itemType: FormElementType
      dataPath: string
      dataPathEnterprise: string
    }
  | { itemType: FormElementType; dataPath: undefined; dataPathEnterprise: undefined }

export interface ConfigurationContext {
  testMode?: boolean
  languages: ConfigurationLanguages
  version: string
  context?: object
  exportToYAML?: FormExportToYAMLContext
  importFromYAML?: FormimportFromYAMLContext
  exportToXML?: ToXMLConfigurationContext
  exportToJSONSchema?: JSONSchemaExportContext
}

export interface ConfigurationContextFromXML extends ConfigurationContext {
  fromXML: FromXMLConfigurationContext
}

/** Контекст полного XML-import, передаваемый между главным процессом и Piscina worker. */
export interface XmlImportConfigurationContext extends ConfigurationContextFromXML {
  fromXML: XmlImportFromXMLConfigurationContext
}

export type XMLDefaultVariant = "full" | "adopted" | "indexed"
export type XMLImportObjectVariant = Extract<XMLDefaultVariant, "full" | "adopted">

type ToXMLContextElement<Type extends MetadataItemType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToMetadata<Type> | undefined
  xmlElement: FormElementXML
  numberingScope?: unknown
}

export interface ToXMLConfigurationContext {
  /** Запрещает создавать заново идентификаторы, объявленные nested rule обязательными. */
  readonly requireExistingConfigurationIdentities?: true
  readonly componentKind?: string
  readonly adoptedUuids?: Readonly<Record<string, string>>
  readonly typeDescriptionXMLNameByType?: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, XMLDefaultVariant>>
  readonly externalMetadataCollector?: ExternalMetadataCollector
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  context?: {
    forms: string[]
    templates: string[]
    parentName: string
    metadataForNumbering: ToXMLContextElement<
      FormElementType | "FormAttributeColumn" | "FormAttribute" | "FormCommand"
    >[]
    currentXMLPath?: string
    /** Стек текущего ItemXML для ElementId и нумерации _id. */
    propertiesItemXmlStack?: Record<string, unknown>[]
  }
}

export interface FromXMLConfigurationContext {
  forReference: boolean
  /** Абсолютный путь текущего XML-источника для предметных известных аномалий. */
  currentXMLPath?: string
  /** Режим, ограничивающий доступные состояния свойств импортируемого компонента. */
  propertyStateCompatibilityMode?: string
  /** Вариант текущего metadata-item; вложенные значения наследуют его от владельца. */
  currentXMLDefaultVariant?: XMLImportObjectVariant
}

export type XmlImportFromXMLConfigurationContext = FromXMLConfigurationContext & {
  /** Строковый вид компонента; его можно передавать в Piscina без функций правил. */
  componentKind: string
  /** Имя зарегистрированного дополнения метаданных, если оно требуется компоненту. */
  metadataItemAugmenter?: string
}

/** Контекст с обязательным exportToXML для функций экспорта в XML */
export type ConfigurationContextWithExportToXML = ConfigurationContext & {
  exportToXML: ToXMLConfigurationContext
}

export interface ExternalFileEntry {
  relativePath: string
  content: string
}

export interface MetadataTargetOwnerContext {
  itemType: MetadataItemType
  name: string
  owner?: MetadataTargetOwner
}

export type FormDataPathAttributeContext = MetadataContextType<"formDataPathAttribute">
export interface EnterpriseContext {}

export interface FormExportToYAMLContext {
  toTyped: boolean
  /** Вложенный путь видов metadata-item, доступный предметным экспортёрам значений. */
  metadataItemTypes?: readonly string[]
  /** Путь к корню YAML-проекта для чтения владельцев DataPath. */
  projectDir?: string
  /** Имя родительского объекта (например, имя реквизита формы) для externalFile. */
  parent?: { name: string }
  /** Сборник внешних файлов, формируемых при экспорте. */
  externalFilesCollector?: ExternalFileEntry[]
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
}

export interface FormimportFromYAMLContext {
  /** Путь к корню YAML-проекта для чтения владельцев DataPath. */
  projectDir?: string
  /** Путь к каталогу формы для чтения внешних файлов (externalFile). */
  formDir?: string
  /** Имя родительского объекта для externalFile (например, имя реквизита формы). */
  parent?: { name: string }
  /** Стек текущих metadata item владельцев для owner: "this" metadataTarget. */
  metadataTargetOwners?: MetadataTargetOwnerContext[]
  /** Сопоставление текущих и reference-путей для вложенных metadata-коллекций. */
  referenceRemap?: {
    readonly currentPath: string
    readonly referencePathByCurrentPath: ReadonlyMap<string, string>
  }
}
