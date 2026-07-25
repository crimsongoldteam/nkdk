import type {
  ConfigurationIdentity,
  ConfigurationIndexData,
  ConfigurationIndexFragment,
  ConfigurationLocalDependency,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"

const FRAGMENT_MAGIC = "NKDKCIF2"
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })
const utf8Encoder = new TextEncoder()

interface EncodedFragmentIdentity {
  logicalAddressStringId: number
  kind: "uuid" | "xmlId" | "xmlName"
  valueStringId: number
}

interface EncodedFragmentXmlNode {
  logicalAddressStringId: number
  orderStringIds?: number[]
  aliasStringIdPairs?: Array<[number, number]>
  presentStringIds?: number[]
}

interface EncodedFragmentXmlValue {
  logicalAddressStringId: number
  extended?: true
  xsiNil?: true
  explicitEmpty?: true
  xsiTypeStringId?: number
  xmlTextStringId?: number
  xmlPrefixStringId?: number
  userSettingsIdStringId?: number
}

type EncodedYamlPathSegment =
  | { kind: "property"; valueStringId: number }
  | { kind: "index"; value: number }

interface EncodedLocalDependencyRulePathSegment {
  propertyKeyStringId: number
  nestedItemTypeStringId?: number
}

interface EncodedLocalDependency {
  sourceProjectPathStringId: number
  yamlPath: EncodedYamlPathSegment[]
  rulePath: EncodedLocalDependencyRulePathSegment[]
  kind: "metadataTarget"
  canonicalStringId: number
}

interface FragmentEnvelope {
  magic: typeof FRAGMENT_MAGIC
  version: 2
  strings: string[]
  fragments: Array<{
    targetProjectPathStringId: number
    identities: EncodedFragmentIdentity[]
    xmlNodes: EncodedFragmentXmlNode[]
    xmlValues: EncodedFragmentXmlValue[]
    localDependencies: EncodedLocalDependency[]
  }>
}

export function encodeConfigurationIndexFragments(fragments: readonly ConfigurationIndexFragment[]): ArrayBuffer {
  const strings: string[] = []
  const stringIds = new Map<string, number>()
  const stringId = (value: string): number => {
    if (typeof value !== "string") throw new Error("Строка фрагмента должна быть строкой")
    const existing = stringIds.get(value)
    if (existing !== undefined) return existing
    const id = strings.length
    strings.push(value)
    stringIds.set(value, id)
    return id
  }

  const envelope: FragmentEnvelope = {
    magic: FRAGMENT_MAGIC,
    version: 2,
    strings,
    fragments: fragments.map((fragment) => ({
      targetProjectPathStringId: stringId(fragment.targetProjectPath),
      identities: fragment.identities.map((identity) => ({
        logicalAddressStringId: stringId(identity.logicalAddress),
        kind: identity.kind,
        valueStringId: stringId(identity.value),
      })),
      xmlNodes: fragment.xmlNodes.map((node) => ({
        logicalAddressStringId: stringId(node.logicalAddress),
        ...(node.order === undefined ? {} : { orderStringIds: node.order.map(stringId) }),
        ...(node.aliases === undefined
          ? {}
          : {
              aliasStringIdPairs: Object.entries(node.aliases).map(([key, value]) => [stringId(key), stringId(value)]),
            }),
        ...(node.present === undefined ? {} : { presentStringIds: node.present.map(stringId) }),
      })),
      xmlValues: fragment.xmlValues.map((value) => ({
        logicalAddressStringId: stringId(value.logicalAddress),
        ...(value.extended === undefined ? {} : { extended: value.extended }),
        ...(value.xsiNil === undefined ? {} : { xsiNil: value.xsiNil }),
        ...(value.explicitEmpty === undefined ? {} : { explicitEmpty: value.explicitEmpty }),
        ...(value.xsiType === undefined ? {} : { xsiTypeStringId: stringId(value.xsiType) }),
        ...(value.xmlText === undefined ? {} : { xmlTextStringId: stringId(value.xmlText) }),
        ...(value.xmlPrefix === undefined ? {} : { xmlPrefixStringId: stringId(value.xmlPrefix) }),
        ...(value.userSettingsId === undefined ? {} : { userSettingsIdStringId: stringId(value.userSettingsId) }),
      })),
      localDependencies: (fragment.localDependencies ?? []).map((dependency) =>
        encodeLocalDependency(dependency, stringId)
      ),
    })),
  }
  const bytes = utf8Encoder.encode(JSON.stringify(envelope))
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

export function decodeConfigurationIndexFragments(buffer: ArrayBuffer): ConfigurationIndexFragment[] {
  try {
    const envelope = decodeEnvelope(buffer)
    return envelope.fragments.map((fragment) => decodeFragment(fragment, envelope.strings))
  } catch (caught) {
    throw new Error(`Некорректный буфер фрагментов индекса конфигурации: ${errorMessage(caught)}`)
  }
}

export function mergeConfigurationIndexFragments(
  workerBuffers: readonly ArrayBuffer[]
): Pick<ConfigurationIndexData, "identities" | "xmlNodes" | "xmlValues"> & {
  localDependencies: ConfigurationLocalDependency[]
} {
  const fragments = workerBuffers.flatMap(decodeConfigurationIndexFragments)
  const identities = fragments.flatMap((fragment) => fragment.identities)
  const xmlNodes = fragments.flatMap((fragment) => fragment.xmlNodes)
  const xmlValues = fragments.flatMap((fragment) => fragment.xmlValues)
  const localDependencies = mergeLocalDependencies(
    fragments.flatMap((fragment) => fragment.localDependencies ?? [])
  )
  assertUniqueIdentityKeys(identities)
  assertUniqueAddresses("XML_NODES", xmlNodes)
  assertUniqueAddresses("XML_VALUES", xmlValues)
  return { identities, xmlNodes, xmlValues, localDependencies }
}

function decodeEnvelope(buffer: ArrayBuffer): FragmentEnvelope {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("ожидался ArrayBuffer")
  const parsed: unknown = JSON.parse(fatalUtf8Decoder.decode(new Uint8Array(buffer)))
  if (!isRecord(parsed)) throw new Error("конверт должен быть объектом")
  assertExactKeys(parsed, ["magic", "version", "strings", "fragments"], "конверт")
  if (parsed.magic !== FRAGMENT_MAGIC) throw new Error("неверный magic")
  if (parsed.version !== 2) throw new Error("неподдерживаемая версия")
  if (!isStringArray(parsed.strings)) {
    throw new Error("некорректный пул строк")
  }
  if (!Array.isArray(parsed.fragments)) throw new Error("некорректные фрагменты")
  const strings = parsed.strings

  return {
    magic: FRAGMENT_MAGIC,
    version: 2,
    strings,
    fragments: parsed.fragments.map((fragment) => decodeEncodedFragment(fragment, strings)),
  }
}

function decodeEncodedFragment(value: unknown, strings: readonly string[]): FragmentEnvelope["fragments"][number] {
  if (!isRecord(value)) throw new Error("фрагмент должен быть объектом")
  assertExactKeys(
    value,
    ["targetProjectPathStringId", "identities", "xmlNodes", "xmlValues", "localDependencies"],
    "фрагмент"
  )
  const targetProjectPathStringId = stringId(value.targetProjectPathStringId, strings)
  validateTargetProjectPath(strings[targetProjectPathStringId]!)
  if (
    !Array.isArray(value.identities) ||
    !Array.isArray(value.xmlNodes) ||
    !Array.isArray(value.xmlValues) ||
    !Array.isArray(value.localDependencies)
  ) {
    throw new Error("записи фрагмента должны быть массивами")
  }
  return {
    targetProjectPathStringId,
    identities: value.identities.map((identity) => decodeEncodedIdentity(identity, strings)),
    xmlNodes: value.xmlNodes.map((node) => decodeEncodedXmlNode(node, strings)),
    xmlValues: value.xmlValues.map((xmlValue) => decodeEncodedXmlValue(xmlValue, strings)),
    localDependencies: value.localDependencies.map((dependency) =>
      decodeEncodedLocalDependency(dependency, strings)
    ),
  }
}

function decodeEncodedIdentity(value: unknown, strings: readonly string[]): EncodedFragmentIdentity {
  if (!isRecord(value)) throw new Error("запись IDENTITIES должна быть объектом")
  assertExactKeys(value, ["logicalAddressStringId", "kind", "valueStringId"], "запись IDENTITIES")
  if (value.kind !== "uuid" && value.kind !== "xmlId" && value.kind !== "xmlName") {
    throw new Error("некорректный kind в IDENTITIES")
  }
  return {
    logicalAddressStringId: stringId(value.logicalAddressStringId, strings),
    kind: value.kind,
    valueStringId: stringId(value.valueStringId, strings),
  }
}

function decodeEncodedXmlNode(value: unknown, strings: readonly string[]): EncodedFragmentXmlNode {
  if (!isRecord(value)) throw new Error("запись XML_NODES должна быть объектом")
  assertExactKeys(
    value,
    ["logicalAddressStringId", "orderStringIds", "aliasStringIdPairs", "presentStringIds"],
    "запись XML_NODES"
  )
  return {
    logicalAddressStringId: stringId(value.logicalAddressStringId, strings),
    ...(value.orderStringIds === undefined ? {} : { orderStringIds: stringIds(value.orderStringIds, strings) }),
    ...(value.aliasStringIdPairs === undefined
      ? {}
      : { aliasStringIdPairs: stringIdPairs(value.aliasStringIdPairs, strings) }),
    ...(value.presentStringIds === undefined ? {} : { presentStringIds: stringIds(value.presentStringIds, strings) }),
  }
}

function decodeEncodedXmlValue(value: unknown, strings: readonly string[]): EncodedFragmentXmlValue {
  if (!isRecord(value)) throw new Error("запись XML_VALUES должна быть объектом")
  assertExactKeys(
    value,
    [
      "logicalAddressStringId",
      "extended",
      "xsiNil",
      "explicitEmpty",
      "xsiTypeStringId",
      "xmlTextStringId",
      "xmlPrefixStringId",
      "userSettingsIdStringId",
    ],
    "запись XML_VALUES"
  )
  if (value.extended !== undefined && value.extended !== true) throw new Error("некорректный extended")
  if (value.xsiNil !== undefined && value.xsiNil !== true) throw new Error("некорректный xsiNil")
  if (value.explicitEmpty !== undefined && value.explicitEmpty !== true) throw new Error("некорректный explicitEmpty")
  return {
    logicalAddressStringId: stringId(value.logicalAddressStringId, strings),
    ...(value.extended === undefined ? {} : { extended: true }),
    ...(value.xsiNil === undefined ? {} : { xsiNil: true }),
    ...(value.explicitEmpty === undefined ? {} : { explicitEmpty: true }),
    ...(value.xsiTypeStringId === undefined ? {} : { xsiTypeStringId: stringId(value.xsiTypeStringId, strings) }),
    ...(value.xmlTextStringId === undefined ? {} : { xmlTextStringId: stringId(value.xmlTextStringId, strings) }),
    ...(value.xmlPrefixStringId === undefined ? {} : { xmlPrefixStringId: stringId(value.xmlPrefixStringId, strings) }),
    ...(value.userSettingsIdStringId === undefined
      ? {}
      : { userSettingsIdStringId: stringId(value.userSettingsIdStringId, strings) }),
  }
}

function decodeFragment(
  fragment: FragmentEnvelope["fragments"][number],
  strings: readonly string[]
): ConfigurationIndexFragment {
  return {
    targetProjectPath: strings[fragment.targetProjectPathStringId]!,
    identities: fragment.identities.map((identity) => ({
      logicalAddress: strings[identity.logicalAddressStringId]!,
      kind: identity.kind,
      value: strings[identity.valueStringId]!,
    })),
    xmlNodes: fragment.xmlNodes.map((node) => ({
      logicalAddress: strings[node.logicalAddressStringId]!,
      ...(node.orderStringIds === undefined ? {} : { order: node.orderStringIds.map((id) => strings[id]!) }),
      ...(node.aliasStringIdPairs === undefined
        ? {}
        : {
            aliases: Object.fromEntries(
              node.aliasStringIdPairs.map(([key, value]) => [strings[key]!, strings[value]!])
            ),
          }),
      ...(node.presentStringIds === undefined ? {} : { present: node.presentStringIds.map((id) => strings[id]!) }),
    })),
    xmlValues: fragment.xmlValues.map((value) => ({
      logicalAddress: strings[value.logicalAddressStringId]!,
      ...(value.extended === undefined ? {} : { extended: true }),
      ...(value.xsiNil === undefined ? {} : { xsiNil: true }),
      ...(value.explicitEmpty === undefined ? {} : { explicitEmpty: true }),
      ...(value.xsiTypeStringId === undefined ? {} : { xsiType: strings[value.xsiTypeStringId]! }),
      ...(value.xmlTextStringId === undefined ? {} : { xmlText: strings[value.xmlTextStringId]! }),
      ...(value.xmlPrefixStringId === undefined ? {} : { xmlPrefix: strings[value.xmlPrefixStringId]! }),
      ...(value.userSettingsIdStringId === undefined ? {} : { userSettingsId: strings[value.userSettingsIdStringId]! }),
    })),
    ...(fragment.localDependencies.length === 0
      ? {}
      : {
          localDependencies: fragment.localDependencies.map((dependency) =>
            decodeLocalDependency(dependency, strings)
          ),
        }),
  }
}

function encodeLocalDependency(
  dependency: ConfigurationLocalDependency,
  stringId: (value: string) => number
): EncodedLocalDependency {
  validateTargetProjectPath(dependency.sourceProjectPath)
  if (dependency.kind !== "metadataTarget") throw new Error("Некорректный kind local dependency")
  if (dependency.canonical.length === 0) throw new Error("Пустой canonical local dependency")
  return {
    sourceProjectPathStringId: stringId(dependency.sourceProjectPath),
    yamlPath: dependency.yamlPath.map((segment) => {
      if (typeof segment === "string" && segment.length > 0) {
        return { kind: "property", valueStringId: stringId(segment) }
      }
      if (typeof segment === "number" && Number.isSafeInteger(segment) && segment >= 0) {
        return { kind: "index", value: segment }
      }
      throw new Error("Некорректный yamlPath local dependency")
    }),
    rulePath: dependency.rulePath.map((segment) => {
      if (typeof segment.propertyKey !== "string" || segment.propertyKey.length === 0) {
        throw new Error("Некорректный propertyKey local dependency")
      }
      if (
        segment.nestedItemType !== undefined &&
        (typeof segment.nestedItemType !== "string" || segment.nestedItemType.length === 0)
      ) {
        throw new Error("Некорректный nestedItemType local dependency")
      }
      return {
        propertyKeyStringId: stringId(segment.propertyKey),
        ...(segment.nestedItemType === undefined
          ? {}
          : { nestedItemTypeStringId: stringId(segment.nestedItemType) }),
      }
    }),
    kind: "metadataTarget",
    canonicalStringId: stringId(dependency.canonical),
  }
}

function decodeEncodedLocalDependency(
  value: unknown,
  strings: readonly string[]
): EncodedLocalDependency {
  if (!isRecord(value)) throw new Error("local dependency должна быть объектом")
  assertExactKeys(
    value,
    ["sourceProjectPathStringId", "yamlPath", "rulePath", "kind", "canonicalStringId"],
    "local dependency"
  )
  const sourceProjectPathStringId = stringId(value.sourceProjectPathStringId, strings)
  validateTargetProjectPath(strings[sourceProjectPathStringId]!)
  if (!Array.isArray(value.yamlPath)) throw new Error("Некорректный yamlPath local dependency")
  if (!Array.isArray(value.rulePath)) throw new Error("Некорректный rulePath local dependency")
  if (value.kind !== "metadataTarget") throw new Error("Некорректный kind local dependency")
  return {
    sourceProjectPathStringId,
    yamlPath: value.yamlPath.map((segment) => decodeEncodedYamlPathSegment(segment, strings)),
    rulePath: value.rulePath.map((segment) => decodeEncodedRulePathSegment(segment, strings)),
    kind: "metadataTarget",
    canonicalStringId: stringId(value.canonicalStringId, strings),
  }
}

function decodeEncodedYamlPathSegment(value: unknown, strings: readonly string[]): EncodedYamlPathSegment {
  if (!isRecord(value)) throw new Error("Сегмент yamlPath local dependency должен быть объектом")
  if (value.kind === "property") {
    assertExactKeys(value, ["kind", "valueStringId"], "сегмент property yamlPath")
    return { kind: "property", valueStringId: stringId(value.valueStringId, strings) }
  }
  if (value.kind === "index") {
    assertExactKeys(value, ["kind", "value"], "сегмент index yamlPath")
    if (typeof value.value !== "number" || !Number.isSafeInteger(value.value) || value.value < 0) {
      throw new Error("Некорректный индекс yamlPath local dependency")
    }
    return { kind: "index", value: value.value }
  }
  throw new Error("Некорректный kind сегмента yamlPath local dependency")
}

function decodeEncodedRulePathSegment(
  value: unknown,
  strings: readonly string[]
): EncodedLocalDependencyRulePathSegment {
  if (!isRecord(value)) throw new Error("Сегмент rulePath local dependency должен быть объектом")
  assertExactKeys(
    value,
    ["propertyKeyStringId", "nestedItemTypeStringId"],
    "сегмент rulePath local dependency"
  )
  return {
    propertyKeyStringId: stringId(value.propertyKeyStringId, strings),
    ...(value.nestedItemTypeStringId === undefined
      ? {}
      : { nestedItemTypeStringId: stringId(value.nestedItemTypeStringId, strings) }),
  }
}

function decodeLocalDependency(
  dependency: EncodedLocalDependency,
  strings: readonly string[]
): ConfigurationLocalDependency {
  return {
    sourceProjectPath: strings[dependency.sourceProjectPathStringId]!,
    yamlPath: dependency.yamlPath.map((segment) =>
      segment.kind === "property" ? strings[segment.valueStringId]! : segment.value
    ),
    rulePath: dependency.rulePath.map((segment) => ({
      propertyKey: strings[segment.propertyKeyStringId]!,
      ...(segment.nestedItemTypeStringId === undefined
        ? {}
        : { nestedItemType: strings[segment.nestedItemTypeStringId]! }),
    })),
    kind: "metadataTarget",
    canonical: strings[dependency.canonicalStringId]!,
  }
}

function mergeLocalDependencies(
  dependencies: readonly ConfigurationLocalDependency[]
): ConfigurationLocalDependency[] {
  const unique = new Map<string, ConfigurationLocalDependency>()
  for (const dependency of dependencies) {
    unique.set(localDependencyKey(dependency), dependency)
  }
  return [...unique.entries()]
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([, dependency]) => dependency)
}

function localDependencyKey(dependency: ConfigurationLocalDependency): string {
  return JSON.stringify({
    sourceProjectPath: dependency.sourceProjectPath,
    yamlPath: dependency.yamlPath,
    rulePath: dependency.rulePath,
    kind: dependency.kind,
    canonical: dependency.canonical,
  })
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function stringId(value: unknown, strings: readonly string[]): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= strings.length) {
    throw new Error("некорректный string ID")
  }
  return value
}

function stringIds(value: unknown, strings: readonly string[]): number[] {
  if (!Array.isArray(value)) throw new Error("ожидался массив string ID")
  return value.map((id) => stringId(id, strings))
}

function stringIdPairs(value: unknown, strings: readonly string[]): Array<[number, number]> {
  if (!Array.isArray(value)) throw new Error("ожидался массив пар string ID")
  return value.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error("ожидалась пара string ID")
    return [stringId(pair[0], strings), stringId(pair[1], strings)]
  })
}

function validateTargetProjectPath(projectPath: string): void {
  const segments = projectPath.split("/")
  if (
    projectPath.length === 0 ||
    projectPath.startsWith("/") ||
    projectPath.endsWith("/") ||
    projectPath.includes("\\") ||
    /^[A-Za-z]:\//.test(projectPath) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
    segments[0] === ".nkdk"
  ) {
    throw new Error(`Недопустимый targetProjectPath: ${projectPath}`)
  }
}

function assertUniqueIdentityKeys(identities: readonly ConfigurationIdentity[]): void {
  const keys = new Set<string>()
  for (const identity of identities) {
    const key = `${identity.logicalAddress}\0${identity.kind}`
    if (keys.has(key)) throw new Error(`Конфликт logicalAddress в IDENTITIES: ${identity.logicalAddress}`)
    keys.add(key)
  }
}

function assertUniqueAddresses(
  recordType: "XML_NODES" | "XML_VALUES",
  records: readonly (ConfigurationXmlNode | ConfigurationXmlValue)[]
): void {
  const addresses = new Set<string>()
  for (const record of records) {
    if (addresses.has(record.logicalAddress)) {
      throw new Error(`Конфликт logicalAddress в ${recordType}: ${record.logicalAddress}`)
    }
    addresses.add(record.logicalAddress)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
}

function assertExactKeys(value: Record<string, unknown>, allowedKeys: readonly string[], name: string): void {
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw new Error(`неизвестное поле в ${name}`)
  }
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
