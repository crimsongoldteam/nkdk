import type {
  ConfigurationIdentity,
  ConfigurationIndexFragment,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "../types"

export interface ConfigurationIndexCollector {
  setUuid(address: string, value: string): void
  setXmlId(address: string, value: string): void
  setXmlName(address: string, value: string): void
  setOrder(address: string, keys: readonly string[]): void
  setAlias(address: string, propertyKey: string, sourceXmlKey: string): void
  setPresent(address: string, propertyKey: string): void
  setXsiNil(address: string): void
  setExplicitEmpty(address: string): void
  setXsiType(address: string, value: string): void
  setXmlText(address: string, value: string): void
  setXmlPrefix(address: string, value: string): void
  setUserSettingsId(address: string, value: string): void
  fragment(targetProjectPath: string): ConfigurationIndexFragment
}

class InMemoryConfigurationIndexCollector implements ConfigurationIndexCollector {
  private readonly identities: ConfigurationIdentity[] = []
  private readonly identityKeys = new Set<string>()
  private readonly xmlNodes = new Map<string, MutableXmlNode>()
  private readonly xmlValues = new Map<string, ConfigurationXmlValue>()

  setUuid(address: string, value: string): void {
    this.setIdentity(address, "uuid", value)
  }

  setXmlId(address: string, value: string): void {
    this.setIdentity(address, "xmlId", value)
  }

  setXmlName(address: string, value: string): void {
    this.setIdentity(address, "xmlName", value)
  }

  setOrder(address: string, keys: readonly string[]): void {
    this.node(address).order = [...keys]
  }

  setAlias(address: string, propertyKey: string, sourceXmlKey: string): void {
    const node = this.node(address)
    node.aliases = { ...node.aliases, [propertyKey]: sourceXmlKey }
  }

  setPresent(address: string, propertyKey: string): void {
    const node = this.node(address)
    if (!node.present?.includes(propertyKey)) node.present = [...(node.present ?? []), propertyKey]
  }

  setXsiNil(address: string): void {
    this.value(address).xsiNil = true
  }

  setExplicitEmpty(address: string): void {
    this.value(address).explicitEmpty = true
  }

  setXsiType(address: string, value: string): void {
    this.value(address).xsiType = value
  }

  setXmlText(address: string, value: string): void {
    this.value(address).xmlText = value
  }

  setXmlPrefix(address: string, value: string): void {
    this.value(address).xmlPrefix = value
  }

  setUserSettingsId(address: string, value: string): void {
    this.value(address).userSettingsId = value
  }

  fragment(targetProjectPath: string): ConfigurationIndexFragment {
    return {
      targetProjectPath,
      identities: [...this.identities].sort(compareIdentities),
      xmlNodes: [...this.xmlNodes.values()].map(copyNode).sort(compareByAddress),
      xmlValues: [...this.xmlValues.values()].map((value) => ({ ...value })).sort(compareByAddress),
    }
  }

  private setIdentity(address: string, kind: ConfigurationIdentity["kind"], value: string): void {
    const key = `${address}\0${kind}`
    if (this.identityKeys.has(key)) return
    this.identityKeys.add(key)
    this.identities.push({ logicalAddress: address, kind, value })
  }

  private node(address: string): MutableXmlNode {
    const existing = this.xmlNodes.get(address)
    if (existing !== undefined) return existing
    const node: MutableXmlNode = { logicalAddress: address }
    this.xmlNodes.set(address, node)
    return node
  }

  private value(address: string): ConfigurationXmlValue {
    const existing = this.xmlValues.get(address)
    if (existing !== undefined) return existing
    const value: ConfigurationXmlValue = { logicalAddress: address }
    this.xmlValues.set(address, value)
    return value
  }
}

type MutableXmlNode = {
  logicalAddress: string
  order?: string[]
  aliases?: Record<string, string>
  present?: string[]
}

export function createConfigurationIndexCollector(): ConfigurationIndexCollector {
  return new InMemoryConfigurationIndexCollector()
}

function copyNode(node: MutableXmlNode): ConfigurationXmlNode {
  return {
    logicalAddress: node.logicalAddress,
    ...(node.order === undefined ? {} : { order: [...node.order] }),
    ...(node.aliases === undefined ? {} : { aliases: { ...node.aliases } }),
    ...(node.present === undefined ? {} : { present: [...node.present] }),
  }
}

function compareIdentities(left: ConfigurationIdentity, right: ConfigurationIdentity): number {
  return compareUtf8(left.logicalAddress, right.logicalAddress) || identityKind(left.kind) - identityKind(right.kind)
}

function compareByAddress(left: { logicalAddress: string }, right: { logicalAddress: string }): number {
  return compareUtf8(left.logicalAddress, right.logicalAddress)
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}

function identityKind(kind: ConfigurationIdentity["kind"]): number {
  return kind === "uuid" ? 1 : kind === "xmlId" ? 2 : 3
}
