import type {
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFragment,
  MergedConfigurationSnapshotFragments,
  OmittedChildren,
} from "./types"

const FRAGMENT_MAGIC = "NKDKCIF3"
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })
const utf8Encoder = new TextEncoder()

interface EncodedFragmentEntity {
  readonly logicalAddressStringId: number
  readonly sourceProjectPathStringId: number
  readonly identities?: EncodedIdentities
  readonly omittedChildren?: EncodedOmittedChildren
  readonly xml?: EncodedXml
}

interface EncodedIdentities {
  readonly uuidStringId?: number
  readonly xmlIdStringId?: number
  readonly xmlNameStringId?: number
}

type EncodedOmittedChildren =
  | { readonly kind: "names"; readonly nameStringIds: readonly number[] }
  | {
      readonly kind: "typedNames"
      readonly items: readonly { readonly xmlNameStringId: number; readonly nameStringId: number }[]
    }

interface EncodedXml {
  readonly extended?: true
  readonly xsiNil?: true
  readonly explicitEmpty?: true
  readonly xsiTypeStringId?: number
  readonly xmlTextStringId?: number
  readonly xmlPrefixStringId?: number
}

interface FragmentEnvelope {
  readonly magic: "NKDKCIF3"
  readonly version: 3
  readonly strings: readonly string[]
  readonly fragments: readonly {
    readonly targetProjectPathStringId: number
    readonly entities: readonly EncodedFragmentEntity[]
  }[]
}

export function encodeConfigurationIndexFragments(
  fragments: readonly ConfigurationSnapshotFragment[]
): ArrayBuffer {
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
    version: 3,
    strings,
    fragments: fragments.map((fragment) => ({
      targetProjectPathStringId: stringId(fragment.targetProjectPath),
      entities: fragment.entities.map((entity) => encodeEntity(entity, stringId)),
    })),
  }
  const bytes = utf8Encoder.encode(JSON.stringify(envelope))
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

export function decodeConfigurationIndexFragments(buffer: ArrayBuffer): ConfigurationSnapshotFragment[] {
  try {
    const envelope = decodeEnvelope(buffer)
    return envelope.fragments.map((fragment) => decodeFragment(fragment, envelope.strings))
  } catch (caught) {
    throw new Error(`Некорректный буфер фрагментов индекса конфигурации: ${errorMessage(caught)}`)
  }
}

export function mergeConfigurationIndexFragments(
  workerBuffers: readonly ArrayBuffer[]
): MergedConfigurationSnapshotFragments {
  const entities = new Map<string, ConfigurationSnapshotEntity>()
  for (const fragment of workerBuffers.flatMap(decodeConfigurationIndexFragments)) {
    for (const entity of fragment.entities) {
      const previous = entities.get(entity.logicalAddress)
      entities.set(entity.logicalAddress, previous === undefined ? copyEntity(entity) : mergeEntity(previous, entity))
    }
  }

  const mergedEntities = [...entities.values()].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
  return {
    sourceProjectPaths: [...new Set(mergedEntities.map((entity) => entity.sourceProjectPath))].sort(compareUtf8),
    entities: mergedEntities,
  }
}

function encodeEntity(
  entity: ConfigurationSnapshotEntity,
  stringId: (value: string) => number
): EncodedFragmentEntity {
  return {
    logicalAddressStringId: stringId(entity.logicalAddress),
    sourceProjectPathStringId: stringId(entity.sourceProjectPath),
    ...(entity.identities === undefined
      ? {}
      : {
          identities: {
            ...(entity.identities.uuid === undefined ? {} : { uuidStringId: stringId(entity.identities.uuid) }),
            ...(entity.identities.xmlId === undefined ? {} : { xmlIdStringId: stringId(entity.identities.xmlId) }),
            ...(entity.identities.xmlName === undefined ? {} : { xmlNameStringId: stringId(entity.identities.xmlName) }),
          },
        }),
    ...(entity.omittedChildren === undefined
      ? {}
      : {
          omittedChildren:
            entity.omittedChildren.kind === "names"
              ? { kind: "names", nameStringIds: entity.omittedChildren.names.map(stringId) }
              : {
                  kind: "typedNames",
                  items: entity.omittedChildren.items.map((item) => ({
                    xmlNameStringId: stringId(item.xmlName),
                    nameStringId: stringId(item.name),
                  })),
                },
        }),
    ...(entity.xml === undefined
      ? {}
      : {
          xml: {
            ...(entity.xml.extended === undefined ? {} : { extended: entity.xml.extended }),
            ...(entity.xml.xsiNil === undefined ? {} : { xsiNil: entity.xml.xsiNil }),
            ...(entity.xml.explicitEmpty === undefined ? {} : { explicitEmpty: entity.xml.explicitEmpty }),
            ...(entity.xml.xsiType === undefined ? {} : { xsiTypeStringId: stringId(entity.xml.xsiType) }),
            ...(entity.xml.xmlText === undefined ? {} : { xmlTextStringId: stringId(entity.xml.xmlText) }),
            ...(entity.xml.xmlPrefix === undefined ? {} : { xmlPrefixStringId: stringId(entity.xml.xmlPrefix) }),
          },
        }),
  }
}

function decodeEnvelope(buffer: ArrayBuffer): FragmentEnvelope {
  if (!(buffer instanceof ArrayBuffer)) throw new Error("ожидался ArrayBuffer")
  const parsed: unknown = JSON.parse(fatalUtf8Decoder.decode(new Uint8Array(buffer)))
  if (!isRecord(parsed)) throw new Error("конверт должен быть объектом")
  assertExactKeys(parsed, ["magic", "version", "strings", "fragments"], "конверт")
  if (parsed.magic !== FRAGMENT_MAGIC) throw new Error("неверный magic")
  if (parsed.version !== 3) throw new Error("неподдерживаемая версия")
  const strings = parsed.strings
  if (!isStringArray(strings)) throw new Error("некорректный пул строк")
  if (!Array.isArray(parsed.fragments)) throw new Error("некорректные фрагменты")

  return {
    magic: FRAGMENT_MAGIC,
    version: 3,
    strings,
    fragments: parsed.fragments.map((fragment) => decodeEncodedFragment(fragment, strings)),
  }
}

function decodeEncodedFragment(value: unknown, strings: readonly string[]): FragmentEnvelope["fragments"][number] {
  if (!isRecord(value)) throw new Error("фрагмент должен быть объектом")
  assertExactKeys(value, ["targetProjectPathStringId", "entities"], "фрагмент")
  const targetProjectPathStringId = stringId(value.targetProjectPathStringId, strings)
  validateTargetProjectPath(strings[targetProjectPathStringId]!)
  if (!Array.isArray(value.entities)) throw new Error("entities фрагмента должны быть массивом")

  return {
    targetProjectPathStringId,
    entities: value.entities.map((entity) => decodeEncodedEntity(entity, strings)),
  }
}

function decodeEncodedEntity(value: unknown, strings: readonly string[]): EncodedFragmentEntity {
  if (!isRecord(value)) throw new Error("entity должна быть объектом")
  assertExactKeys(
    value,
    ["logicalAddressStringId", "sourceProjectPathStringId", "identities", "omittedChildren", "xml"],
    "entity"
  )
  const entity: EncodedFragmentEntity = {
    logicalAddressStringId: stringId(value.logicalAddressStringId, strings),
    sourceProjectPathStringId: stringId(value.sourceProjectPathStringId, strings),
    ...(value.identities === undefined ? {} : { identities: decodeEncodedIdentities(value.identities, strings) }),
    ...(value.omittedChildren === undefined
      ? {}
      : { omittedChildren: decodeEncodedOmittedChildren(value.omittedChildren, strings) }),
    ...(value.xml === undefined ? {} : { xml: decodeEncodedXml(value.xml, strings) }),
  }
  if (entity.identities === undefined && entity.omittedChildren === undefined && entity.xml === undefined) {
    throw new Error("пустая entity")
  }
  return entity
}

function decodeEncodedIdentities(value: unknown, strings: readonly string[]): EncodedIdentities {
  if (!isRecord(value)) throw new Error("identities должна быть объектом")
  assertExactKeys(value, ["uuidStringId", "xmlIdStringId", "xmlNameStringId"], "identities")
  const identities = {
    ...(value.uuidStringId === undefined ? {} : { uuidStringId: stringId(value.uuidStringId, strings) }),
    ...(value.xmlIdStringId === undefined ? {} : { xmlIdStringId: stringId(value.xmlIdStringId, strings) }),
    ...(value.xmlNameStringId === undefined ? {} : { xmlNameStringId: stringId(value.xmlNameStringId, strings) }),
  }
  if (Object.keys(identities).length === 0) throw new Error("пустая identities")
  if (identities.uuidStringId !== undefined) {
    const uuid = strings[identities.uuidStringId]!
    if (uuid.length === 0) throw new Error("Пустой uuid")
    if (!isUuid(uuid)) throw new Error("Некорректный UUID")
  }
  if (identities.xmlIdStringId !== undefined && strings[identities.xmlIdStringId]!.length === 0) {
    throw new Error("Пустой xmlId")
  }
  return identities
}

function decodeEncodedOmittedChildren(value: unknown, strings: readonly string[]): EncodedOmittedChildren {
  if (!isRecord(value)) throw new Error("omittedChildren должна быть объектом")
  if (value.kind === "names") {
    assertExactKeys(value, ["kind", "nameStringIds"], "omittedChildren names")
    if (!Array.isArray(value.nameStringIds) || value.nameStringIds.length === 0) throw new Error("пустой names")
    return { kind: "names", nameStringIds: value.nameStringIds.map((id) => stringId(id, strings)) }
  }
  if (value.kind === "typedNames") {
    assertExactKeys(value, ["kind", "items"], "omittedChildren typedNames")
    if (!Array.isArray(value.items) || value.items.length === 0) throw new Error("пустой typedNames")
    return {
      kind: "typedNames",
      items: value.items.map((item) => {
        if (!isRecord(item)) throw new Error("элемент typedNames должен быть объектом")
        assertExactKeys(item, ["xmlNameStringId", "nameStringId"], "элемент typedNames")
        return {
          xmlNameStringId: stringId(item.xmlNameStringId, strings),
          nameStringId: stringId(item.nameStringId, strings),
        }
      }),
    }
  }
  throw new Error("неизвестный вариант omittedChildren")
}

function decodeEncodedXml(value: unknown, strings: readonly string[]): EncodedXml {
  if (!isRecord(value)) throw new Error("xml должна быть объектом")
  assertExactKeys(
    value,
    ["extended", "xsiNil", "explicitEmpty", "xsiTypeStringId", "xmlTextStringId", "xmlPrefixStringId"],
    "xml"
  )
  for (const field of ["extended", "xsiNil", "explicitEmpty"] as const) {
    if (value[field] !== undefined && value[field] !== true) throw new Error(`некорректный ${field}`)
  }
  const xml = {
    ...(value.extended === undefined ? {} : { extended: true as const }),
    ...(value.xsiNil === undefined ? {} : { xsiNil: true as const }),
    ...(value.explicitEmpty === undefined ? {} : { explicitEmpty: true as const }),
    ...(value.xsiTypeStringId === undefined ? {} : { xsiTypeStringId: stringId(value.xsiTypeStringId, strings) }),
    ...(value.xmlTextStringId === undefined ? {} : { xmlTextStringId: stringId(value.xmlTextStringId, strings) }),
    ...(value.xmlPrefixStringId === undefined ? {} : { xmlPrefixStringId: stringId(value.xmlPrefixStringId, strings) }),
  }
  if (Object.keys(xml).length === 0) throw new Error("пустая xml")
  return xml
}

function decodeFragment(
  fragment: FragmentEnvelope["fragments"][number],
  strings: readonly string[]
): ConfigurationSnapshotFragment {
  const targetProjectPath = strings[fragment.targetProjectPathStringId]!
  const entities = fragment.entities.map((entity) => {
    const sourceProjectPath = strings[entity.sourceProjectPathStringId]!
    if (sourceProjectPath !== targetProjectPath) throw new Error("entity содержит другой sourceProjectPath")
    return {
      logicalAddress: strings[entity.logicalAddressStringId]!,
      sourceProjectPath,
      ...(entity.identities === undefined
        ? {}
        : {
            identities: {
              ...(entity.identities.uuidStringId === undefined
                ? {}
                : { uuid: strings[entity.identities.uuidStringId]! }),
              ...(entity.identities.xmlIdStringId === undefined
                ? {}
                : { xmlId: strings[entity.identities.xmlIdStringId]! }),
              ...(entity.identities.xmlNameStringId === undefined
                ? {}
                : { xmlName: strings[entity.identities.xmlNameStringId]! }),
            },
          }),
      ...(entity.omittedChildren === undefined
        ? {}
        : {
            omittedChildren:
              entity.omittedChildren.kind === "names"
                ? { kind: "names" as const, names: entity.omittedChildren.nameStringIds.map((id) => strings[id]!) }
                : {
                    kind: "typedNames" as const,
                    items: entity.omittedChildren.items.map((item) => ({
                      xmlName: strings[item.xmlNameStringId]!,
                      name: strings[item.nameStringId]!,
                    })),
                  },
          }),
      ...(entity.xml === undefined
        ? {}
        : {
            xml: {
              ...(entity.xml.extended === undefined ? {} : { extended: true as const }),
              ...(entity.xml.xsiNil === undefined ? {} : { xsiNil: true as const }),
              ...(entity.xml.explicitEmpty === undefined ? {} : { explicitEmpty: true as const }),
              ...(entity.xml.xsiTypeStringId === undefined
                ? {}
                : { xsiType: strings[entity.xml.xsiTypeStringId]! }),
              ...(entity.xml.xmlTextStringId === undefined ? {} : { xmlText: strings[entity.xml.xmlTextStringId]! }),
              ...(entity.xml.xmlPrefixStringId === undefined
                ? {}
                : { xmlPrefix: strings[entity.xml.xmlPrefixStringId]! }),
            },
          }),
    }
  })
  return { targetProjectPath, entities }
}

function mergeEntity(
  left: ConfigurationSnapshotEntity,
  right: ConfigurationSnapshotEntity
): ConfigurationSnapshotEntity {
  if (left.sourceProjectPath !== right.sourceProjectPath) {
    throw new Error(`Конфликт logicalAddress ${left.logicalAddress}: разные sourceProjectPath`)
  }
  return {
    logicalAddress: left.logicalAddress,
    sourceProjectPath: left.sourceProjectPath,
    ...(left.identities === undefined && right.identities === undefined
      ? {}
      : { identities: mergeRecord(left.logicalAddress, "identities", left.identities, right.identities) }),
    ...(left.omittedChildren === undefined && right.omittedChildren === undefined
      ? {}
      : { omittedChildren: mergeOmittedChildren(left.logicalAddress, left.omittedChildren, right.omittedChildren) }),
    ...(left.xml === undefined && right.xml === undefined
      ? {}
      : { xml: mergeRecord(left.logicalAddress, "xml", left.xml, right.xml) }),
  }
}

function mergeRecord<T extends object>(address: string, group: string, left: T | undefined, right: T | undefined): T {
  if (left === undefined) return { ...right! }
  if (right === undefined) return { ...left }
  for (const [field, value] of Object.entries(right)) {
    const previous = Object.getOwnPropertyDescriptor(left, field)?.value
    if (Object.hasOwn(left, field) && previous !== value) {
      throw new Error(`Конфликт logicalAddress ${address}: несовпадающие ${group}.${field}`)
    }
  }
  return { ...left, ...right }
}

function mergeOmittedChildren(
  address: string,
  left: OmittedChildren | undefined,
  right: OmittedChildren | undefined
): OmittedChildren {
  if (left === undefined) return copyOmittedChildren(right!)
  if (right === undefined) return copyOmittedChildren(left)
  if (!equalOmittedChildren(left, right)) throw new Error(`Конфликт logicalAddress ${address}: omittedChildren`)
  return copyOmittedChildren(left)
}

function copyEntity(entity: ConfigurationSnapshotEntity): ConfigurationSnapshotEntity {
  return {
    ...entity,
    ...(entity.identities === undefined ? {} : { identities: { ...entity.identities } }),
    ...(entity.omittedChildren === undefined ? {} : { omittedChildren: copyOmittedChildren(entity.omittedChildren) }),
    ...(entity.xml === undefined ? {} : { xml: { ...entity.xml } }),
  }
}

function copyOmittedChildren(value: OmittedChildren): OmittedChildren {
  return value.kind === "names"
    ? { kind: "names", names: [...value.names] }
    : { kind: "typedNames", items: value.items.map((item) => ({ ...item })) }
}

function equalOmittedChildren(left: OmittedChildren, right: OmittedChildren): boolean {
  if (left.kind !== right.kind) return false
  if (left.kind === "names" && right.kind === "names") {
    return left.names.length === right.names.length && left.names.every((value, index) => value === right.names[index])
  }
  if (left.kind === "typedNames" && right.kind === "typedNames") {
    return left.items.length === right.items.length && left.items.every(
      (item, index) => item.xmlName === right.items[index]?.xmlName && item.name === right.items[index]?.name
    )
  }
  return false
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], context: string): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new Error(`${context} содержит неизвестное поле ${key}`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function stringId(value: unknown, strings: readonly string[]): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= strings.length) {
    throw new Error("некорректный string ID")
  }
  return value
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

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}
