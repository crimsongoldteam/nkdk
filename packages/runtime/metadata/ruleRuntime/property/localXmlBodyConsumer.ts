import { isXmlElementNode, type XmlAddressedNode, type XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
import { XML_ORDERED_CHILDREN } from "../../../xml/export/exporter"
import { RETAINED_LOCAL_XML_OUTPUT, type CompiledXMLProofConsumer } from "./compiledRuleExecution"
import type { XMLItemEnvelope, XMLItemOutputPreparation } from "./fromYAMLToXMLTypes"
import type { LocalXmlChild, LocalXmlProof } from "../xmlAnomaly/localProof"
import { completeLocalXmlFragment } from "../xmlAnomaly/localFragment"

type LocalBodyProperty = Parameters<CompiledXMLProofConsumer["write"]>[0]["property"]

/** Потребитель тела одного выхода; внешняя XMLRoot-оболочка принадлежит владельцу. */
export function createLocalXmlBodyConsumer(params: {
  readonly key: string
  readonly source: XmlElementNode
  readonly proof: LocalXmlProof
  readonly childReceipt: (value: unknown) => LocalXmlChild | undefined
  readonly scalarReceipt: (value: unknown) => import("../xmlAnomaly/localProof").LocalXmlScalar | undefined
  readonly itemPreparation?: XMLItemOutputPreparation
  readonly xmlEnvelope?: XMLItemEnvelope
  readonly annotate?: (boundary: Parameters<NonNullable<Parameters<typeof completeLocalXmlFragment>[0]["annotate"]>>[0] & {
    readonly property?: LocalBodyProperty
  }) => void
  readonly annotateScalar?: (boundary: {
    readonly source: XmlAddressedNode & { readonly value: string }
    readonly owner?: XmlElementNode
    readonly difference: XmlStructureDifference
    readonly property: LocalBodyProperty
  }) => void
  readonly annotateAbsent?: (boundary: {
    readonly name: string
    readonly path: readonly string[]
    readonly value: unknown
    readonly property: LocalBodyProperty
    readonly semanticOmitted: boolean
  }) => void
}): CompiledXMLProofConsumer {
  const bindings = new Map<string, Parameters<NonNullable<CompiledXMLProofConsumer["bind"]>>[0]>()
  const writes = new Map<string, Parameters<CompiledXMLProofConsumer["write"]>[0]>()
  const complete = (source: XmlElementNode, name: string, value: unknown, property?: LocalBodyProperty) => completeLocalXmlFragment({
    source, name, value, proof: params.proof, childReceipt: params.childReceipt,
    scalarReceipt: params.scalarReceipt,
    annotate: params.annotate === undefined ? undefined : boundary => params.annotate!({ ...boundary, property }),
  })
  return {
    bind(input) {
      if (input.presentInXML || !bindings.get(input.propertyKey)?.presentInXML) bindings.set(input.propertyKey, input)
    },
    write(event) {
      const { outputKey, property, path } = event
      if (outputKey !== params.key) throw new Error(`XML-выход ${outputKey} не принадлежит текущему телу ${params.key}`)
      const name = path.at(-1)
      if (name === undefined) {
        throw new Error(`Не подготовлена скалярная XML-граница: ${path.join("/")}`)
      }
      const binding = bindings.get(property.propertyKey)
      if (binding === undefined) throw new Error(`Не передана исходная XML-граница свойства ${property.propertyKey}`)
      writes.set(`${property.propertyKey}\u0000${path.join("\u0000")}`, event)
      return RETAINED_LOCAL_XML_OUTPUT
    },
    complete() {},
    finish(output) {
      const finalized = output.outputs.get(params.key)
      if (finalized === undefined) throw new Error(`Не подготовлено тело XML-выхода ${params.key}`)
      const envelopedBody = unwrapEnvelope(finalized, params.xmlEnvelope)
      const wrapped = params.itemPreparation?.wrap === undefined ? undefined : unwrapPreparedItem(envelopedBody)
      const preparedBody = wrapped?.body ?? envelopedBody
      // Сначала закрываем самые глубокие границы. Родительский контейнер затем
      // получает их компактные подтверждения и не обходит тот же XML повторно.
      const orderedWrites = [...writes.values()].sort((left, right) => right.path.length - left.path.length)
      const elementUseCount = new Map<number, number>()
      for (const { property } of orderedWrites) {
        const node = bindings.get(property.propertyKey)?.node
        if (isXmlElementNode(node)) elementUseCount.set(node.id, (elementUseCount.get(node.id) ?? 0) + 1)
      }
      const completedElements = new Set<number>()
      const containerReceipts = collectContainerReceipts(orderedWrites, bindings)
      for (const binding of bindings.values()) {
        if (!binding.structurallyClaimed || !isXmlElementNode(binding.node)) continue
        const path = binding.xmlPath ?? [binding.node.name]
        const nodes = binding.nodes?.length === 0 || binding.nodes === undefined
          ? [binding.node]
          : binding.nodes
        const receipts = nodes.map((node) => {
          completedElements.add(node.id)
          return params.proof.completed(node) ?? params.proof.accept(node)
        })
        writePathCreating(
          preparedBody,
          path,
          Array.isArray(readPath(preparedBody, path)) ? receipts : receipts[0],
        )
      }
      for (const { property, path, value: generatedValue, childReceipts: suppliedChildReceipts } of orderedWrites) {
        const binding = bindings.get(property.propertyKey)
        if (binding === undefined) throw new Error(`Не передана исходная XML-граница свойства ${property.propertyKey}`)
        const childReceipts = isXmlElementNode(binding.node)
          ? containerReceipts.get(binding.node.id) ?? suppliedChildReceipts ?? []
          : suppliedChildReceipts ?? []
        if (isXmlElementNode(binding.node) && completedElements.has(binding.node.id)) continue
        const retainedValue = readPath(preparedBody, path)
        const value = retainedValue === undefined ? generatedValue : retainedValue
        if (!binding.presentInXML) {
          if (childReceipts.length !== 0) continue
          if (isRecord(value) && value._id === "") {
            deletePath(preparedBody, path)
            continue
          }
          const generated = value
          if (generated !== undefined) {
            params.annotateAbsent?.({
              name: path.at(-1)!, path, value: generated, property,
              semanticOmitted: binding.semanticOmitted === true,
            })
            if (params.annotateAbsent === undefined) {
              params.annotate?.({
                source: params.source,
                differences: [{
                  kind: "presence",
                  path: generatedPath(params.source.path, path),
                  ownerPath: params.source.path,
                }],
                property,
              })
            }
            deletePath(preparedBody, path)
          }
          continue
        }
        if (!isXmlElementNode(binding.node)) {
          if (binding.node === undefined || !("value" in binding.node)) {
            throw new Error(`Не передан скалярный XML-узел свойства ${property.propertyKey}`)
          }
          const scalarSource = binding.node
          const receipt = params.proof.checkValue(scalarSource, String(value), params.annotateScalar === undefined
            ? undefined : difference => params.annotateScalar!({
              source: scalarSource, owner: binding.owner, difference, property,
            }))
          writePathCreating(preparedBody, path, receipt)
          continue
        }
        if (
          binding.nodes !== undefined
          && Array.isArray(value)
          && childReceipts.length === 0
        ) {
          const receipts = binding.nodes.map((node, index) => {
            completedElements.add(node.id)
            return complete(node, path.at(-1)!, value[index], property)
          })
          if (value.length > binding.nodes.length) {
            const ownerPath = binding.owner?.path
              ?? binding.node.path.slice(0, binding.node.path.lastIndexOf("/"))
            params.annotate?.({
              source: binding.node,
              differences: value.slice(binding.nodes.length).map((_, index) => ({
                kind: "presence" as const,
                path: `${ownerPath}/${path.at(-1)}[${binding.nodes!.length + index + 1}]`,
                ownerPath,
              })),
              property,
            })
          }
          writePathCreating(preparedBody, path, receipts)
          continue
        }
        const sourceNode = binding.node
        if (
          childReceipts.length !== 0
          && sourceNode.name === path.at(-1)
          && childReceipts.every(receipt => sourceNode.content.some(
            child => child.type === "element" && child.id === receipt.sourceId,
          ))
        ) {
          mergeContainerChildReceipts({
            root: preparedBody,
            path,
            source: sourceNode,
            receipts: childReceipts,
            generatedValue,
          })
          continue
        }
        const child = params.childReceipt(value)
        const direct = childReceipts.find(receipt => receipt.sourceId === sourceNode.id)
        const retained = child?.sourceId === sourceNode.id
          ? child
          : direct
        if (retained !== undefined) {
          writePathCreating(preparedBody, path, Array.isArray(value) && childReceipts.length !== 0
            ? childReceipts
            : retained)
          continue
        }
        const receipt = child ?? complete(
          binding.node,
          path.at(-1)!,
          value,
          elementUseCount.get(binding.node.id) === 1 ? property : undefined,
        )
        completedElements.add(binding.node.id)
        if (receipt.name !== path.at(-1)) {
          params.annotate?.({
            source: binding.node,
            differences: [{ kind: "presence", path: binding.node.path, ownerPath: binding.node.path }],
            property,
          })
          writePathCreating(preparedBody, path, receipt)
          continue
        }
        writePathCreating(preparedBody, path, receipt)
      }
      const receipt = complete(
        params.source,
        wrapped?.name ?? params.source.name,
        preparedBody,
      )
      bindings.clear()
      return new Map([[params.key, receipt]])
    },
  }
}

function collectContainerReceipts(
  writes: readonly Parameters<CompiledXMLProofConsumer["write"]>[0][],
  bindings: ReadonlyMap<string, Parameters<NonNullable<CompiledXMLProofConsumer["bind"]>>[0]>,
): ReadonlyMap<number, readonly LocalXmlChild[]> {
  const result = new Map<number, LocalXmlChild[]>()
  const seen = new Map<number, Set<number>>()
  for (const { property, childReceipts = [] } of writes) {
    const node = bindings.get(property.propertyKey)?.node
    if (!isXmlElementNode(node)) continue
    const directChildIds = new Set(node.content.filter(isXmlElementNode).map(child => child.id))
    const direct = childReceipts.filter(
      (receipt): receipt is LocalXmlChild & { readonly sourceId: number } =>
        receipt.sourceId !== undefined && directChildIds.has(receipt.sourceId),
    )
    if (direct.length === 0) continue
    const receipts = result.get(node.id) ?? []
    const sourceIds = seen.get(node.id) ?? new Set<number>()
    for (const receipt of direct) {
      if (sourceIds.has(receipt.sourceId)) continue
      sourceIds.add(receipt.sourceId)
      receipts.push(receipt)
    }
    result.set(node.id, receipts)
    seen.set(node.id, sourceIds)
  }
  return result
}

function unwrapEnvelope(value: Record<string, unknown>, envelope: XMLItemEnvelope | undefined): Record<string, unknown> {
  let current: unknown = value
  for (const segment of envelope?.path ?? []) current = isRecord(current) ? current[segment] : undefined
  if (!isRecord(current)) throw new Error("XML-оболочка выхода не содержит mapping item")
  return current
}

function readPath(root: Record<string, unknown>, path: readonly string[]): unknown {
  let current: unknown = root
  for (const segment of path) current = isRecord(current) ? current[segment] : undefined
  return current
}

function writePathCreating(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let owner = root
  for (const segment of path.slice(0, -1)) {
    const existing = owner[segment]
    if (isRecord(existing)) owner = existing
    else {
      const created: Record<string, unknown> = {}
      owner[segment] = created
      owner = created
    }
  }
  owner[path.at(-1)!] = value
}

function mergeContainerChildReceipts(params: {
  readonly root: Record<string, unknown>
  readonly path: readonly string[]
  readonly source: XmlElementNode
  readonly receipts: readonly LocalXmlChild[]
  readonly generatedValue: unknown
}): void {
  const receiptBySource = new Map(params.receipts.map(receipt => [receipt.sourceId, receipt]))
  const grouped = new Map<string, LocalXmlChild[]>()
  for (const child of params.source.content) {
    if (child.type !== "element") continue
    const receipt = receiptBySource.get(child.id)
    if (receipt === undefined) continue
    const values = grouped.get(child.name) ?? []
    values.push(receipt)
    grouped.set(child.name, values)
  }
  const existing = readPath(params.root, params.path)
  const current = isRecord(existing) ? existing : {}
  const generated = isRecord(params.generatedValue) ? params.generatedValue : {}
  const merged: Record<string, unknown> = {}
  for (const child of params.source.content) {
    if (child.type !== "element" || Object.prototype.hasOwnProperty.call(merged, child.name)) continue
    const receipts = grouped.get(child.name)
    if (receipts !== undefined) {
      merged[child.name] = Array.isArray(generated[child.name]) || receipts.length > 1
        ? receipts
        : receipts[0]
    } else if (Object.prototype.hasOwnProperty.call(current, child.name)) {
      merged[child.name] = current[child.name]
    }
  }
  for (const [key, value] of Object.entries(current)) {
    if (!Object.prototype.hasOwnProperty.call(merged, key)) merged[key] = value
  }
  const occurrences = new Map<string, number>()
  const orderedChildren = params.source.content.flatMap((child) => {
    if (child.type !== "element") return []
    const occurrence = occurrences.get(child.name) ?? 0
    occurrences.set(child.name, occurrence + 1)
    const receipt = receiptBySource.get(child.id)
    if (receipt !== undefined) return [{ key: child.name, value: receipt }]
    const retained = current[child.name]
    const value = Array.isArray(retained) ? retained[occurrence] : retained
    return value === undefined ? [] : [{ key: child.name, value }]
  })
  ;(merged as Record<PropertyKey, unknown>)[XML_ORDERED_CHILDREN] = orderedChildren
  writePathCreating(params.root, params.path, merged)
}

function deletePath(root: Record<string, unknown>, path: readonly string[]): void {
  const owner = path.slice(0, -1).reduce<unknown>((current, segment) => isRecord(current) ? current[segment] : undefined, root)
  if (isRecord(owner)) delete owner[path.at(-1)!]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function generatedPath(root: string, path: readonly string[]): string {
  return `${root}/${path.map((segment) => `${segment}[1]`).join("/")}`
}

function unwrapPreparedItem(value: Record<string, unknown>): {
  readonly name: string
  readonly body: Record<string, unknown>
} | undefined {
  const entries = Object.entries(value).filter(([key]) => !key.startsWith("_"))
  if (entries.length !== 1) throw new Error("XML-оболочка item должна содержать ровно один элемент")
  const [name, body] = entries[0]!
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new Error(`XML-оболочка item ${name} должна содержать объект`)
  }
  return { name, body: body as Record<string, unknown> }
}
