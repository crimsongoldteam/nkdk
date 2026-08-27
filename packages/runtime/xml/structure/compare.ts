import type {
  XmlAttributeNode,
  XmlContentNode,
  XmlElementNode,
  XmlProcessingInstructionNode,
} from "../import/document"
import {
  encodeXmlRawElement,
  type XmlPatchValue,
  type XmlRawMapping,
  type XmlRawValue,
} from "./rawCodec"

export function createXmlElementPatch(
  expected: XmlElementNode,
  actual: XmlElementNode,
): XmlPatchValue {
  const expectedValue = encodeXmlRawElement(expected, actual.name)
  const actualValue = encodeXmlRawElement(actual)
  const difference = diffXmlRawValue(expectedValue, actualValue)
  const patch: Record<string, XmlPatchValue> = isRawMapping(difference)
    ? { ...difference }
    : difference === undefined
      ? {}
      : { "#text": difference }
  const expectedOrder = xmlContentOrder(expected)
  const actualOrder = xmlContentOrder(actual)
  if (!sameStrings(expectedOrder, actualOrder)) patch["#order"] = expectedOrder
  mergeXmlPatch(patch, nestedElementOrderPatch(expected, actual))
  return patch
}

function nestedElementOrderPatch(
  expected: XmlElementNode,
  actual: XmlElementNode,
): Record<string, XmlPatchValue> {
  const patch: Record<string, XmlPatchValue> = {}
  const expectedByName = elementChildrenByName(expected)
  const actualByName = elementChildrenByName(actual)
  for (const [name, expectedChildren] of expectedByName) {
    const actualChildren = actualByName.get(name)
    if (actualChildren === undefined || actualChildren.length !== expectedChildren.length) continue
    const childPatches = expectedChildren.map((child, index) => {
      const counterpart = actualChildren[index]!
      const nested = nestedElementOrderPatch(child, counterpart)
      const expectedOrder = xmlContentOrder(child)
      if (!sameStrings(expectedOrder, xmlContentOrder(counterpart))) nested["#order"] = expectedOrder
      return nested
    })
    if (childPatches.every((childPatch) => Object.keys(childPatch).length === 0)) continue
    if (childPatches.length === 1) {
      patch[name] = childPatches[0]!
      continue
    }
    // Массив в raw-патче заменяется целиком. Поэтому при изменении порядка
    // хотя бы в одном повторяющемся элементе сохраняем всю исходную группу.
    patch[name] = expectedChildren.map((child) => encodeXmlRawElement(child))
  }
  return patch
}

function elementChildrenByName(element: XmlElementNode): Map<string, XmlElementNode[]> {
  const result = new Map<string, XmlElementNode[]>()
  for (const child of element.content) {
    if (child.type !== "element") continue
    const values = result.get(child.name) ?? []
    values.push(child)
    result.set(child.name, values)
  }
  return result
}

function mergeXmlPatch(
  target: Record<string, XmlPatchValue>,
  source: Record<string, XmlPatchValue>,
): void {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key]
    if (isPatchMapping(current) && isPatchMapping(value)) mergeXmlPatch(current, value)
    else target[key] = value
  }
}

function isPatchMapping(value: XmlPatchValue | undefined): value is Record<string, XmlPatchValue> {
  return value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value)
}

function diffXmlRawValue(
  expected: Exclude<XmlRawValue, null>,
  actual: Exclude<XmlRawValue, null>,
): XmlPatchValue | undefined {
  if (typeof expected === "string" || Array.isArray(expected)) {
    return rawValuesEqual(expected, actual) ? undefined : expected
  }
  if (!isRawMapping(actual)) return expected

  const patch: Record<string, XmlPatchValue> = {}
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key]
    if (actualValue === undefined || actualValue === null) {
      patch[key] = expectedValue
      continue
    }
    if (expectedValue === null) {
      if (actualValue !== null) patch[key] = null
      continue
    }
    const difference = diffXmlRawValue(expectedValue, actualValue)
    if (difference !== undefined) patch[key] = difference
  }
  for (const key of Object.keys(actual)) {
    if (!(key in expected)) patch[key] = null
  }
  return Object.keys(patch).length === 0 ? undefined : patch
}

function rawValuesEqual(left: XmlRawValue, right: XmlRawValue): boolean {
  if (typeof left === "string" || left === null) return left === right
  if (Array.isArray(left)) {
    return Array.isArray(right) && left.length === right.length
      && left.every((value, index) => rawValuesEqual(value, right[index]!))
  }
  return isRawMapping(right)
    && Object.keys(left).length === Object.keys(right).length
    && Object.entries(left).every(([key, value]) => rawValuesEqual(value, right[key]!))
}

function isRawMapping(value: XmlRawValue | undefined): value is XmlRawMapping {
  return value !== undefined && value !== null && typeof value === "object" && !Array.isArray(value)
}

function xmlContentOrder(element: XmlElementNode): string[] {
  return element.content.map((node) =>
    node.type === "text" ? "#text" : node.type === "element" ? node.name : `?${node.target}`,
  )
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function compareXmlStructures(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[]
): readonly string[] {
  return compareXmlStructureDifferences(expected, actual).map(({ path }) => path)
}

export type XmlStructureDifferenceKind = "value" | "presence" | "order"

export interface XmlStructureDifference {
  readonly path: string
  readonly ownerPath: string
  readonly kind: XmlStructureDifferenceKind
}

export function compareXmlStructureDifferences(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[],
): readonly XmlStructureDifference[] {
  const differences: XmlStructureDifference[] = []
  compareElementLists(expected, actual, "", differences)
  return [
    ...new Map(
      differences.map((difference) => [
        `${difference.kind}\u0000${difference.path}`,
        difference,
      ]),
    ).values(),
  ]
}

function compareElementLists(
  expected: readonly XmlElementNode[],
  actual: readonly XmlElementNode[],
  parentPath: string,
  differences: XmlStructureDifference[]
): void {
  if (
    expected.length === actual.length &&
    expected.every((node, index) => {
      const actualNode = actual[index]
      return (
        actualNode !== undefined &&
        node.structuralHash === actualNode.structuralHash &&
        sameElementStructure(node, actualNode)
      )
    })
  ) return
  if (sameElementOrder(expected, actual) === false && sameElementMultiset(expected, actual)) {
    addDifference(differences, `${parentPath}/#order`, parentPath, "order")
  }
  compareAddressedLists(expected, actual, elementKey, (left, right) => {
    compareElement(left, right, differences)
  }, parentPath, differences)
}

function compareElement(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: XmlStructureDifference[]
): void {
  if (
    expected.structuralHash === actual.structuralHash &&
    sameElementStructure(expected, actual)
  ) return
  if (expected.name !== actual.name) {
    addDifference(differences, expected.path, parentXmlPath(expected.path), "presence")
    addDifference(differences, actual.path, parentXmlPath(actual.path), "presence")
    return
  }

  compareAttributes(expected, actual, differences)
  compareContent(expected, actual, differences)
}

function compareAttributes(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: XmlStructureDifference[]
): void {
  if (
    expected.attributes.map(attributeKey).join("\u0000") !==
      actual.attributes.map(attributeKey).join("\u0000") &&
    sameKeyMultiset(expected.attributes, actual.attributes, attributeKey)
  ) {
    addDifference(
      differences,
      `${expected.path}/#attributes/#order`,
      expected.path,
      "order",
    )
  }
  compareAttributeValues(expected.attributes, actual.attributes, expected.path, differences)
}

function compareContent(
  expected: XmlElementNode,
  actual: XmlElementNode,
  differences: XmlStructureDifference[]
): void {
  const expectedOrdered = expected.content.filter(isOrderedContent)
  const actualOrdered = actual.content.filter(isOrderedContent)
  if (
    expectedOrdered.map(contentKey).join("\u0000") !==
      actualOrdered.map(contentKey).join("\u0000") &&
    sameKeyMultiset(expectedOrdered, actualOrdered, contentKey)
  ) {
    addDifference(differences, `${expected.path}/#order`, expected.path, "order")
  }

  compareAddressedLists(
    expected.content,
    actual.content,
    contentKey,
    (left, right) => compareContentNode(left, right, differences),
    expected.path,
    differences
  )
}

function compareContentNode(
  expected: XmlContentNode,
  actual: XmlContentNode,
  differences: XmlStructureDifference[]
): void {
  if (expected.type !== actual.type) {
    addDifference(differences, expected.path, parentXmlPath(expected.path), "presence")
    addDifference(differences, actual.path, parentXmlPath(actual.path), "presence")
    return
  }
  if (expected.type === "element" && actual.type === "element") {
    compareElement(expected, actual, differences)
    return
  }
  if (expected.type === "text" && actual.type === "text") {
    if (expected.value !== actual.value) {
      addDifference(differences, expected.path, parentXmlPath(expected.path), "value")
    }
    return
  }
  if (expected.type === "processingInstruction" && actual.type === "processingInstruction") {
    compareProcessingInstruction(expected, actual, differences)
  }
}

function compareProcessingInstruction(
  expected: XmlProcessingInstructionNode,
  actual: XmlProcessingInstructionNode,
  differences: XmlStructureDifference[]
): void {
  if (expected.target !== actual.target || expected.body !== actual.body) {
    addDifference(differences, expected.path, parentXmlPath(expected.path), "value")
    return
  }
  compareAttributeValues(expected.attributes, actual.attributes, expected.path, differences)
}

function compareAttributeValues(
  expected: readonly XmlAttributeNode[],
  actual: readonly XmlAttributeNode[],
  ownerPath: string,
  differences: XmlStructureDifference[],
): void {
  compareAddressedLists(
    expected,
    actual,
    attributeKey,
    (left, right) => {
      if (left.value !== right.value) {
        addDifference(differences, left.path, ownerPath, "value")
      }
    },
    ownerPath,
    differences,
  )
}

function compareAddressedLists<T extends { readonly path: string }>(
  expected: readonly T[],
  actual: readonly T[],
  key: (value: T) => string,
  compareMatch: (expected: T, actual: T) => void,
  ownerPath: string,
  differences: XmlStructureDifference[]
): void {
  const actualByKey = new Map(actual.map((value) => [key(value), value] as const))
  const expectedKeys = new Set<string>()
  for (const expectedValue of expected) {
    const expectedKey = key(expectedValue)
    expectedKeys.add(expectedKey)
    const actualValue = actualByKey.get(expectedKey)
    if (actualValue === undefined) {
      addDifference(differences, expectedValue.path, ownerPath, "presence")
    }
    else compareMatch(expectedValue, actualValue)
  }
  for (const actualValue of actual) {
    if (!expectedKeys.has(key(actualValue))) {
      addDifference(differences, actualValue.path, ownerPath, "presence")
    }
  }
}

function addDifference(
  differences: XmlStructureDifference[],
  path: string,
  ownerPath: string,
  kind: XmlStructureDifferenceKind,
): void {
  differences.push({ path, ownerPath, kind })
}

function parentXmlPath(path: string): string {
  const separator = path.lastIndexOf("/")
  return separator <= 0 ? "" : path.slice(0, separator)
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

function sameElementStructure(expected: XmlElementNode, actual: XmlElementNode): boolean {
  return (
    expected.name === actual.name &&
    sameAttributeStructure(expected.attributes, actual.attributes) &&
    expected.content.length === actual.content.length &&
    expected.content.every((node, index) => {
      const actualNode = actual.content[index]
      return actualNode !== undefined && sameContentStructure(node, actualNode)
    })
  )
}

function sameAttributeStructure(
  expected: readonly XmlAttributeNode[],
  actual: readonly XmlAttributeNode[]
): boolean {
  return (
    expected.length === actual.length &&
    expected.every((attribute, index) => {
      const actualAttribute = actual[index]
      return (
        actualAttribute !== undefined &&
        attribute.name === actualAttribute.name &&
        attribute.value === actualAttribute.value
      )
    })
  )
}

function sameContentStructure(expected: XmlContentNode, actual: XmlContentNode): boolean {
  if (expected.type !== actual.type) return false
  if (expected.type === "element" && actual.type === "element") {
    return sameElementStructure(expected, actual)
  }
  if (expected.type === "text" && actual.type === "text") {
    return expected.value === actual.value
  }
  if (
    expected.type === "processingInstruction" &&
    actual.type === "processingInstruction"
  ) {
    return (
      expected.target === actual.target &&
      expected.body === actual.body &&
      sameAttributeStructure(expected.attributes, actual.attributes)
    )
  }
  return false
}
