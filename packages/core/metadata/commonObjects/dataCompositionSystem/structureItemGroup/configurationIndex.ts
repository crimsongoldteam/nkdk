import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexXmlNodeLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { childSegmentUid } from "../../../configurationIndex/logicalAddress"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "../../../context/types"

const TOPOLOGY_SEGMENT = "Топология"

export function collectStructureItemGroupTopology(
  context: ConfigurationContextFromXML,
  xml: unknown
): void {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined) return

  const parents: number[] = []
  collectParentIndexes(xml, -1, parents)
  if (parents.length === 0) return

  collection.collector.setOrder(
    topologyAddress(getConfigurationIndexXmlNodeLogicalAddress(collection)),
    encodeTopology(parents)
  )
}

export function restoreStructureItemGroupTopology(params: {
  context: ConfigurationContextWithExportToXML
  xml: Record<string, unknown>
}): Record<string, unknown> {
  const runtime = params.context.exportToXML.configurationIndex
  if (runtime === undefined) return params.xml

  const nodes = detachStructureItemGroups(params.xml)
  const address = topologyAddress(runtime.xmlNodeLogicalAddress ?? runtime.logicalAddress)
  const parents = decodeTopology(runtime.xmlNode(address)?.order)
  if (parents === undefined || !isValidTopology(parents, nodes.length)) return params.xml

  runtime.collector.setOrder(address, encodeTopology(parents))
  for (let index = 1; index < nodes.length; index += 1) {
    appendChild(nodes[parents[index]!]!, nodes[index]!)
  }
  return nodes[0]!
}

function collectParentIndexes(xml: unknown, parentIndex: number, parents: number[]): void {
  const node = asRecord(xml)
  if (node === undefined || node["_xsi:type"] !== "dcsset:StructureItemGroup") return

  const currentIndex = parents.length
  parents.push(parentIndex)
  for (const child of asArray(node["dcsset:item"])) {
    collectParentIndexes(child, currentIndex, parents)
  }
}

function detachStructureItemGroups(root: Record<string, unknown>): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = []
  const visit = (node: Record<string, unknown>): void => {
    const children = asArray(node["dcsset:item"]).flatMap((value) => {
      const record = asRecord(value)
      return record?.["_xsi:type"] === "dcsset:StructureItemGroup" ? [record] : []
    })
    const detached = { ...node }
    delete detached["dcsset:item"]
    result.push(detached)
    children.forEach(visit)
  }
  visit(root)
  return result
}

function isValidTopology(parents: readonly number[], nodeCount: number): boolean {
  return (
    parents.length === nodeCount &&
    nodeCount > 0 &&
    parents[0] === -1 &&
    parents.every(
      (parent, index) =>
        Number.isSafeInteger(parent) && (index === 0 ? parent === -1 : parent >= 0 && parent < index)
    )
  )
}

function encodeTopology(parents: readonly number[]): string[] {
  return parents.map((parent, index) => `${index}:${parent}`)
}

function decodeTopology(value: readonly string[] | undefined): number[] | undefined {
  if (value === undefined) return undefined
  const result: number[] = []
  for (let index = 0; index < value.length; index += 1) {
    const match = /^(\d+):(-?\d+)$/.exec(value[index]!)
    if (match === null || Number(match[1]) !== index) return undefined
    result.push(Number(match[2]))
  }
  return result
}

function appendChild(parent: Record<string, unknown>, child: Record<string, unknown>): void {
  const existing = parent["dcsset:item"]
  if (existing === undefined) {
    parent["dcsset:item"] = child
  } else if (Array.isArray(existing)) {
    existing.push(child)
  } else {
    parent["dcsset:item"] = [existing, child]
  }
}

function topologyAddress(logicalAddress: string): string {
  return childSegmentUid(logicalAddress, TOPOLOGY_SEGMENT)
}

function asArray(value: unknown): unknown[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
