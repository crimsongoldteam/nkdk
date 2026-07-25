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
  setExcludedEqualName(address: string): void
  setXsiType(address: string, value: string): void
  setXmlText(address: string, value: string): void
  setXmlPrefix(address: string, value: string): void
  setUserSettingsId(address: string, value: string): void
  fragment(targetProjectPath: string): ConfigurationIndexFragment
}

class InMemoryConfigurationIndexCollector implements ConfigurationIndexCollector {
  private readonly identities: ConfigurationIdentity[] = []
  private readonly identityValues = new Map<string, string>()
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
    const node = this.node(address)
    if (node.order !== undefined) {
      assertEqualValues(address, "order", node.order, keys, equalStringArrays)
      return
    }
    node.order = [...keys]
  }

  setAlias(address: string, propertyKey: string, sourceXmlKey: string): void {
    const node = this.node(address)
    const previous = node.aliases?.[propertyKey]
    if (previous !== undefined) {
      assertEqualValues(address, `alias ${propertyKey}`, previous, sourceXmlKey)
      return
    }
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

  setExcludedEqualName(address: string): void {
    this.value(address).excludedEqualName = true
  }

  setXsiType(address: string, value: string): void {
    this.setXmlValue(address, "xsiType", value)
  }

  setXmlText(address: string, value: string): void {
    this.setXmlValue(address, "xmlText", value)
  }

  setXmlPrefix(address: string, value: string): void {
    this.setXmlValue(address, "xmlPrefix", value)
  }

  setUserSettingsId(address: string, value: string): void {
    this.setXmlValue(address, "userSettingsId", value)
  }

  fragment(targetProjectPath: string): ConfigurationIndexFragment {
    return {
      targetProjectPath,
      identities: [...this.identities],
      xmlNodes: [...this.xmlNodes.values()].map(copyNode),
      xmlValues: [...this.xmlValues.values()].map((value) => ({ ...value })),
    }
  }

  private setIdentity(address: string, kind: ConfigurationIdentity["kind"], value: string): void {
    if (value.length === 0) return

    const key = `${address}\0${kind}`
    const previous = this.identityValues.get(key)
    if (previous !== undefined) {
      assertEqualValues(address, kind, previous, value)
      return
    }
    this.identityValues.set(key, value)
    this.identities.push({ logicalAddress: address, kind, value })
  }

  private setXmlValue(
    address: string,
    field: "xsiType" | "xmlText" | "xmlPrefix" | "userSettingsId",
    value: string
  ): void {
    const xmlValue = this.value(address)
    const previous = xmlValue[field]
    if (previous !== undefined) {
      assertEqualValues(address, field, previous, value)
      return
    }
    xmlValue[field] = value
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
