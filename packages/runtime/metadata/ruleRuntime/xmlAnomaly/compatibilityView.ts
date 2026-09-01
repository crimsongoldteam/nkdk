import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
} from "../../../xml/import/document"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditSession,
} from "./importAudit"

type XmlCompatibilityNode = XmlElementNode | XmlProcessingInstructionNode

interface XmlCompatibilitySource {
  readonly node: XmlElementNode
  readonly audit: XmlImportAuditSession
  readonly boundary: XmlImportAuditBoundary
}

const sourcesByCompatibilityValue = new WeakMap<object, XmlCompatibilitySource>()

export function xmlImportNodeForCompatibilityValue(value: unknown): XmlElementNode | undefined {
  return value !== null && typeof value === "object"
    ? sourcesByCompatibilityValue.get(value)?.node
    : undefined
}

export function claimCanonicalXmlImportAttribute(params: {
  readonly value: unknown
  readonly name: string
  readonly expectedValue: string
}): void {
  if (params.value === null || typeof params.value !== "object") return
  const source = sourcesByCompatibilityValue.get(params.value)
  if (source === undefined) return
  const attribute = source.node.attributes.find(
    ({ name, value }) => name === params.name && value === params.expectedValue,
  )
  if (attribute !== undefined) source.audit.claim(attribute, source.boundary)
}

export function xmlImportCompatibilityValue(params: {
  readonly node: XmlElementNode | XmlAttributeNode
  readonly audit?: XmlImportAuditSession
  readonly boundary: XmlImportAuditBoundary
}): unknown {
  if (!("type" in params.node)) {
    params.audit?.claim(params.node, params.boundary)
    return params.node.value
  }
  if (params.audit === undefined) return params.node.compatibilityValue
  return createCompatibilityConsumption(params.audit, params.boundary).element(params.node)
}

export function xmlImportCompatibilityValues(params: {
  readonly nodes: readonly XmlElementNode[]
  readonly audit?: XmlImportAuditSession
  readonly boundary: XmlImportAuditBoundary
}): readonly unknown[] {
  const values = params.nodes.map(({ compatibilityValue }) => compatibilityValue)
  if (params.audit === undefined) return values
  return createCompatibilityConsumption(params.audit, params.boundary).elements(
    params.nodes,
    values,
  )
}

export function xmlImportCompatibilityContainer(params: {
  readonly node: XmlElementNode
  readonly audit?: XmlImportAuditSession
  readonly boundary: XmlImportAuditBoundary
}): unknown {
  const value = params.node.compatibilityValue
  if (params.audit === undefined || value === null || typeof value !== "object") return value
  return createCompatibilityConsumption(params.audit, params.boundary).container(params.node, value)
}

function createCompatibilityConsumption(
  audit: XmlImportAuditSession,
  boundary: XmlImportAuditBoundary,
): {
  element(node: XmlElementNode): unknown
  elements(nodes: readonly XmlElementNode[], values: unknown[]): readonly unknown[]
  container(node: XmlElementNode, value: object): object
} {
  const proxies = new WeakMap<object, object>()
  const structuralChildrenByNode = new WeakMap<
    XmlElementNode,
    readonly (XmlElementNode | XmlProcessingInstructionNode)[]
  >()
  const structuralChildrenByKey = new WeakMap<
    XmlElementNode,
    ReadonlyMap<string, readonly (XmlElementNode | XmlProcessingInstructionNode)[]>
  >()

  const childrenOf = (
    node: XmlElementNode,
  ): readonly (XmlElementNode | XmlProcessingInstructionNode)[] => {
    const cached = structuralChildrenByNode.get(node)
    if (cached !== undefined) return cached
    const children = structuralChildren(node)
    structuralChildrenByNode.set(node, children)
    return children
  }

  const childrenOfKey = (
    node: XmlElementNode,
    key: string,
  ): readonly (XmlElementNode | XmlProcessingInstructionNode)[] => {
    let index = structuralChildrenByKey.get(node)
    if (index === undefined) {
      const mutable = new Map<string, (XmlElementNode | XmlProcessingInstructionNode)[]>()
      for (const child of childrenOf(node)) {
        const childKey = compatibilityKey(child)
        const entries = mutable.get(childKey) ?? []
        entries.push(child)
        mutable.set(childKey, entries)
      }
      index = mutable
      structuralChildrenByKey.set(node, index)
    }
    return index.get(key) ?? []
  }

  const claim = (node: XmlContentNode | XmlAttributeNode): void => {
    audit.claim(node, boundary)
  }

  const claimShallow = (node: XmlCompatibilityNode): void => {
    claim(node)
  }

  const consumeScalarElement = (node: XmlElementNode): void => {
    for (const content of node.content) {
      if (content.type === "text") claim(content)
    }
  }

  const claimPresence = (node: XmlCompatibilityNode): void => {
    claimShallow(node)
    if (node.type === "element" && node.content.every((content) => content.type === "text")) {
      consumeScalarElement(node)
    }
  }

  const consumeNode = (
    node: XmlCompatibilityNode,
    value: unknown,
  ): unknown => {
    claimShallow(node)
    if (value === null || typeof value !== "object") {
      if (node.type === "element") consumeScalarElement(node)
      return value
    }
    return node.type === "element"
      ? wrapElementValue(node, value)
      : wrapProcessingInstructionValue(node, value)
  }

  const wrapElementValue = (node: XmlElementNode, value: object): object => {
    const cached = proxies.get(value)
    if (cached !== undefined) return cached
    if (Array.isArray(value)) {
      const children = childrenOf(node)
      const wrapped = wrapArray(value, children, (entry, child) => {
        if (entry === null || typeof entry !== "object") return consumeNode(child, entry)
        return wrapObject(entry, (key) =>
          key === compatibilityKey(child)
            ? consumeNode(child, Reflect.get(entry, key))
            : Reflect.get(entry, key),
        )
      })
      sourcesByCompatibilityValue.set(wrapped, { node, audit, boundary })
      return wrapped
    }
    const wrapped = wrapObjectForElement(node, value)
    sourcesByCompatibilityValue.set(wrapped, { node, audit, boundary })
    return wrapped
  }

  const wrapProcessingInstructionValue = (
    node: XmlProcessingInstructionNode,
    value: object,
  ): object => {
    const claimAttribute = (key: PropertyKey): void => {
      if (typeof key !== "string" || !key.startsWith("_")) return
      const attribute = findLastAttribute(node.attributes, key)
      if (attribute !== undefined) claim(attribute)
    }
    return wrapObject(
      value,
      (key) => {
        claimAttribute(key)
        return Reflect.get(value, key)
      },
      claimAttribute,
    )
  }

  const consumeElementProperty = (
    node: XmlElementNode,
    value: object,
    key: PropertyKey,
  ): unknown => {
    if (key === Symbol.for("metadata")) {
      for (const child of childrenOf(node)) claimShallow(child)
      return Reflect.get(value, key)
    }
    if (typeof key !== "string") return Reflect.get(value, key)
    if (key === "#text") {
      for (const content of node.content) {
        if (content.type === "text") claim(content)
      }
      return Reflect.get(value, key)
    }
    if (key.startsWith("_")) {
      const attribute = node.attributes.find(({ name }) => `_${name}` === key)
      if (attribute !== undefined) claim(attribute)
      return Reflect.get(value, key)
    }
    const children = childrenOfKey(node, key)
    const childValue = Reflect.get(value, key)
    if (children.length === 0) return childValue
    if (children.length === 1) return consumeNode(children[0]!, childValue)
    if (!Array.isArray(childValue)) return childValue
    return wrapArray(childValue, children, (entry, child) => consumeNode(child, entry))
  }

  const claimElementProperty = (node: XmlElementNode, key: PropertyKey): void => {
    if (key === Symbol.for("metadata")) {
      for (const child of childrenOf(node)) claimShallow(child)
      return
    }
    if (typeof key !== "string") return
    if (key === "#text") {
      for (const content of node.content) {
        if (content.type === "text") claim(content)
      }
      return
    }
    if (key.startsWith("_")) {
      const attribute = node.attributes.find(({ name }) => `_${name}` === key)
      if (attribute !== undefined) claim(attribute)
      return
    }
    for (const child of childrenOfKey(node, key)) claimPresence(child)
  }

  const wrapObject = (
    value: object,
    consume: (key: PropertyKey) => unknown,
    claimProperty?: (key: PropertyKey) => void,
  ): object => {
    const cached = proxies.get(value)
    if (cached !== undefined) return cached
    const proxy = new Proxy(value, {
      get: (_target, key) => consume(key),
      has(target, key) {
        claimProperty?.(key)
        return Reflect.has(target, key)
      },
      ownKeys(target) {
        const keys = Reflect.ownKeys(target)
        for (const key of keys) claimProperty?.(key)
        return keys
      },
      getOwnPropertyDescriptor(target, key) {
        claimProperty?.(key)
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
    })
    proxies.set(value, proxy)
    return proxy
  }

  const wrapArray = <Node extends XmlCompatibilityNode>(
    value: unknown[],
    nodes: readonly Node[],
    consumeEntry: (value: unknown, node: Node) => unknown,
  ): unknown[] => {
    const cached = proxies.get(value)
    if (cached !== undefined) return cached as unknown[]
    const claimEntries = (): void => {
      for (const node of nodes) claimShallow(node)
    }
    const proxy = new Proxy(value, {
      get(target, key, receiver) {
        if (key === "length") claimEntries()
        const index = arrayIndex(key)
        if (index !== undefined && index < nodes.length) {
          return consumeEntry(Reflect.get(target, key, receiver), nodes[index]!)
        }
        return Reflect.get(target, key, receiver)
      },
      has(target, key) {
        const index = arrayIndex(key)
        if (index !== undefined && index < nodes.length) claimShallow(nodes[index]!)
        return Reflect.has(target, key)
      },
      ownKeys(target) {
        claimEntries()
        return Reflect.ownKeys(target)
      },
      getOwnPropertyDescriptor(target, key) {
        const index = arrayIndex(key)
        if (index !== undefined && index < nodes.length) claimShallow(nodes[index]!)
        return Reflect.getOwnPropertyDescriptor(target, key)
      },
    })
    proxies.set(value, proxy)
    return proxy
  }

  return {
    element(node) {
      return consumeNode(node, node.compatibilityValue)
    },
    elements(nodes, values) {
      for (const node of nodes) claimPresence(node)
      return wrapArray(values, nodes, (entry, node) => consumeNode(node, entry))
    },
    container(node, value) {
      return wrapElementValue(node, value)
    },
  }

  function wrapObjectForElement(node: XmlElementNode, value: object): object {
    return wrapObject(
      value,
      (key) => consumeElementProperty(node, value, key),
      (key) => claimElementProperty(node, key),
    )
  }
}

function structuralChildren(
  node: XmlElementNode,
): Array<XmlElementNode | XmlProcessingInstructionNode> {
  return node.content.filter(
    (child): child is XmlElementNode | XmlProcessingInstructionNode => child.type !== "text",
  )
}

function compatibilityKey(node: XmlElementNode | XmlProcessingInstructionNode): string {
  return node.type === "element" ? node.name : `?${node.target}`
}

function arrayIndex(key: PropertyKey): number | undefined {
  if (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key)) return undefined
  return Number(key)
}

function findLastAttribute(
  attributes: readonly XmlAttributeNode[],
  compatibilityKey: string,
): XmlAttributeNode | undefined {
  for (let index = attributes.length - 1; index >= 0; index -= 1) {
    const attribute = attributes[index]!
    if (`_${attribute.name}` === compatibilityKey) return attribute
  }
  return undefined
}
