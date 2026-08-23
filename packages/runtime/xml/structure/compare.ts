import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
} from "../import/document"

export function compareXmlStructures(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[]
): readonly string[] {
  const differences: string[] = []
  compareElementLists(expected, actual, "", differences)
  return [...new Set(differences)]
}

function compareElementLists(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[],
  parentPath: string,
  differences: string[]
): void {
  if (
    expected.length === actual.length &&
    expected.every((node, index) => node.structuralHash === actual[index]?.structuralHash)
  ) return
  if (sameElementOrder(expected, actual) === false && sameElementMultiset(expected, actual)) {
    differences.push(`${parentPath}/#order`)
  }
  compareAddressedLists(expected, actual, elementKey, (left, right) => {
    compareElement(left, right, differences)
  }, differences)
}

function compareElement(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: string[]
): void {
  if (expected.structuralHash === actual.structuralHash) return
  if (expected.name !== actual.name) {
    differences.push(expected.path, actual.path)
    return
  }

  compareAttributes(expected, actual, differences)
  compareContent(expected, actual, differences)
}

function compareAttributes(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: string[]
): void {
  if (
    expected.attributes.map(attributeKey).join("\u0000") !==
      actual.attributes.map(attributeKey).join("\u0000") &&
    sameKeyMultiset(expected.attributes, actual.attributes, attributeKey)
  ) {
    differences.push(`${expected.path}/#attributes/#order`)
  }
  compareAddressedLists(
    expected.attributes,
    actual.attributes,
    attributeKey,
    (left, right) => {
      if (left.value !== right.value) differences.push(left.path)
    },
    differences
  )
}

function compareContent(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: string[]
): void {
  const expectedOrdered = expected.content.filter(isOrderedContent)
  const actualOrdered = actual.content.filter(isOrderedContent)
  if (
    expectedOrdered.map(contentKey).join("\u0000") !==
      actualOrdered.map(contentKey).join("\u0000") &&
    sameKeyMultiset(expectedOrdered, actualOrdered, contentKey)
  ) {
    differences.push(`${expected.path}/#order`)
  }

  compareAddressedLists(
    expected.content,
    actual.content,
    contentKey,
    (left, right) => compareContentNode(left, right, differences),
    differences
  )
}

function compareContentNode(
  expected: XmlContentNode,
  actual: XmlContentNode,
  differences: string[]
): void {
  if (expected.type !== actual.type) {
    differences.push(expected.path, actual.path)
    return
  }
  if (expected.type === "element" && actual.type === "element") {
    compareElement(expected, actual, differences)
    return
  }
  if (expected.type === "text" && actual.type === "text") {
    if (expected.value !== actual.value) differences.push(expected.path)
    return
  }
  if (expected.type === "processingInstruction" && actual.type === "processingInstruction") {
    compareProcessingInstruction(expected, actual, differences)
  }
}

function compareProcessingInstruction(
  expected: XmlProcessingInstructionNode,
  actual: XmlProcessingInstructionNode,
  differences: string[]
): void {
  if (expected.target !== actual.target || expected.body !== actual.body) {
    differences.push(expected.path)
    return
  }
  compareAddressedLists(
    expected.attributes,
    actual.attributes,
    attributeKey,
    (left, right) => {
      if (left.value !== right.value) differences.push(left.path)
    },
    differences
  )
}

function compareAddressedLists<T extends { readonly path: string }>(
  expected: readonly T[],
  actual: readonly T[],
  key: (value: T) => string,
  compareMatch: (expected: T, actual: T) => void,
  differences: string[]
): void {
  const actualByKey = new Map(actual.map((value) => [key(value), value] as const))
  const expectedKeys = new Set<string>()
  for (const expectedValue of expected) {
    const expectedKey = key(expectedValue)
    expectedKeys.add(expectedKey)
    const actualValue = actualByKey.get(expectedKey)
    if (actualValue === undefined) differences.push(expectedValue.path)
    else compareMatch(expectedValue, actualValue)
  }
  for (const actualValue of actual) {
    if (!expectedKeys.has(key(actualValue))) differences.push(actualValue.path)
  }
}

function sameElementOrder(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[]
): boolean {
  return expected.map(elementKey).join("\u0000") === actual.map(elementKey).join("\u0000")
}

function sameElementMultiset(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[]
): boolean {
  return sameKeyMultiset(expected, actual, elementKey)
}

function sameKeyMultiset<T>(
  expected: readonly T[],
  actual: readonly T[],
  key: (value: T) => string
): boolean {
  if (expected.length !== actual.length) return false
  const expectedKeys = expected.map(key).toSorted()
  const actualKeys = actual.map(key).toSorted()
  return expectedKeys.every((value, index) => value === actualKeys[index])
}

function elementKey(node: XmlElementNode): string {
  return `${node.name}[${node.occurrence}]`
}

function attributeKey(node: XmlAttributeNode): string {
  return `${node.name}[${node.occurrence}]`
}

function contentKey(node: XmlContentNode): string {
  switch (node.type) {
    case "element":
      return `element:${node.name}[${node.occurrence}]`
    case "text":
      return `text:[${node.occurrence}]`
    case "processingInstruction":
      return `processingInstruction:${node.target}[${node.occurrence}]`
  }
}

function isOrderedContent(
  node: XmlContentNode
): node is XmlElementNode | XmlProcessingInstructionNode {
  return node.type !== "text"
}
