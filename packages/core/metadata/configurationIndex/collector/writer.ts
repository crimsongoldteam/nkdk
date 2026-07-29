import type {
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFragment,
  OmittedChildren,
} from "../types"

type IdentityKind = "uuid" | "xmlId" | "xmlName"
type XmlFlag = "extended" | "xsiNil" | "explicitEmpty"
type XmlValue = "xsiType" | "xmlText" | "xmlPrefix"

export interface ConfigurationIndexCollector {
  setIdentity(address: string, kind: IdentityKind, value: string): void
  setOmittedChildren(address: string, value: OmittedChildren): void
  setXmlFlag(address: string, field: XmlFlag): void
  setXmlValue(address: string, field: XmlValue, value: string): void
  fragment(targetProjectPath: string): ConfigurationSnapshotFragment
}

interface MutableEntity {
  logicalAddress: string
  identities?: { uuid?: string; xmlId?: string; xmlName?: string }
  omittedChildren?: OmittedChildren
  xml?: MutableXml
}

interface MutableXml {
  extended?: true
  xsiNil?: true
  explicitEmpty?: true
  xsiType?: string
  xmlText?: string
  xmlPrefix?: string
}

class InMemoryConfigurationIndexCollector implements ConfigurationIndexCollector {
  private readonly entities = new Map<string, MutableEntity>()

  setIdentity(address: string, kind: IdentityKind, value: string): void {
    if (kind === "uuid") assertUuid(value)
    if (kind === "xmlId" && value.length === 0) throw new Error("Пустой xmlId")

    const entity = this.entity(address)
    const identities = (entity.identities ??= {})
    const previous = identities[kind]
    if (previous !== undefined || Object.hasOwn(identities, kind)) {
      assertEqualValues(address, kind, previous, value)
      return
    }
    identities[kind] = value
  }

  setOmittedChildren(address: string, value: OmittedChildren): void {
    assertOmittedChildren(value)
    const entity = this.entity(address)
    if (entity.omittedChildren !== undefined) {
      assertEqualValues(address, "omittedChildren", entity.omittedChildren, value, equalOmittedChildren)
      return
    }
    entity.omittedChildren = copyOmittedChildren(value)
  }

  setXmlFlag(address: string, field: XmlFlag): void {
    const xml = (this.entity(address).xml ??= {})
    xml[field] = true
  }

  setXmlValue(address: string, field: XmlValue, value: string): void {
    const xml = (this.entity(address).xml ??= {})
    const previous = xml[field]
    if (previous !== undefined || Object.hasOwn(xml, field)) {
      assertEqualValues(address, field, previous, value)
      return
    }
    xml[field] = value
  }

  fragment(targetProjectPath: string): ConfigurationSnapshotFragment {
    const entities = [...this.entities.values()]
      .flatMap((entity) => {
        const normalized = normalizeEntity(entity, targetProjectPath)
        return normalized === undefined ? [] : [normalized]
      })
      .sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))

    return { targetProjectPath, entities }
  }

  private entity(logicalAddress: string): MutableEntity {
    const existing = this.entities.get(logicalAddress)
    if (existing !== undefined) return existing
    const entity: MutableEntity = { logicalAddress }
    this.entities.set(logicalAddress, entity)
    return entity
  }
}

export function createConfigurationIndexCollector(): ConfigurationIndexCollector {
  return new InMemoryConfigurationIndexCollector()
}

export function createDiscardingConfigurationIndexCollector(): ConfigurationIndexCollector {
  const discard = (): void => undefined
  return {
    setIdentity: discard,
    setOmittedChildren: discard,
    setXmlFlag: discard,
    setXmlValue: discard,
    fragment(targetProjectPath) {
      return { targetProjectPath, entities: [] }
    },
  }
}

function normalizeEntity(entity: MutableEntity, sourceProjectPath: string): ConfigurationSnapshotEntity | undefined {
  const identities = entity.identities
  const xml = entity.xml
  if (identities === undefined && entity.omittedChildren === undefined && xml === undefined) return undefined

  return {
    logicalAddress: entity.logicalAddress,
    sourceProjectPath,
    ...(identities === undefined ? {} : { identities: { ...identities } }),
    ...(entity.omittedChildren === undefined ? {} : { omittedChildren: copyOmittedChildren(entity.omittedChildren) }),
    ...(xml === undefined ? {} : { xml: { ...xml } }),
  }
}

function assertUuid(value: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) {
    throw new Error("Некорректный UUID")
  }
}

function assertOmittedChildren(value: OmittedChildren): void {
  const size = value.kind === "names" ? value.names.length : value.items.length
  if (size === 0) throw new Error("Пустой список omittedChildren")
}

function copyOmittedChildren(value: OmittedChildren): OmittedChildren {
  return value.kind === "names"
    ? { kind: "names", names: [...value.names] }
    : { kind: "typedNames", items: value.items.map((item) => ({ ...item })) }
}

function equalOmittedChildren(left: OmittedChildren, right: OmittedChildren): boolean {
  if (left.kind !== right.kind) return false
  if (left.kind === "names" && right.kind === "names") {
    return equalStringArrays(left.names, right.names)
  }
  if (left.kind === "typedNames" && right.kind === "typedNames") {
    return left.items.length === right.items.length && left.items.every(
      (item, index) => item.xmlName === right.items[index]?.xmlName && item.name === right.items[index]?.name
    )
  }
  return false
}

function assertEqualValues<T>(
  address: string,
  field: string,
  previous: T,
  next: T,
  equals: (left: T, right: T) => boolean = Object.is
): void {
  if (!equals(previous, next)) {
    throw new Error(
      `Конфликт logicalAddress ${address}: несовпадающие значения ${field} ${JSON.stringify(previous)} и ${JSON.stringify(next)}`
    )
  }
}

function equalStringArrays(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function compareUtf8(left: string, right: string): number {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  const length = Math.min(leftBytes.length, rightBytes.length)
  for (let index = 0; index < length; index++) {
    const difference = leftBytes[index]! - rightBytes[index]!
    if (difference !== 0) return difference
  }
  return leftBytes.length - rightBytes.length
}
