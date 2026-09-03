import { isXmlElementNode, type XmlAddressedNode, type XmlElementNode } from "../../../xml/import/document"
import type { XmlStructureDifference } from "../../../xml/structure/compare"
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
      for (const { property, path } of writes.values()) {
        const binding = bindings.get(property.propertyKey)
        if (binding === undefined) throw new Error(`Не передана исходная XML-граница свойства ${property.propertyKey}`)
        const value = readPath(preparedBody, path)
        if (!binding.presentInXML) {
          if (findAnyChildReceipt(value, params.childReceipt) !== undefined) continue
          if (isRecord(value) && value._id === "") {
            deletePath(preparedBody, path)
            continue
          }
          const generated = value ?? (isComputedXmlOnlyProperty(property.propertyRule)
            ? writes.get(`${property.propertyKey}\u0000${path.join("\u0000")}`)?.value
            : undefined)
          if (generated !== undefined) {
            params.annotateAbsent?.({ name: path.at(-1)!, path, value: generated, property })
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
          writePath(preparedBody, path, receipt)
          continue
        }
        const retained = findFinishedSource(value, binding.node.id, params.childReceipt)
        if (retained !== undefined) {
          writePath(preparedBody, path, retained)
          continue
        }
        const child = params.childReceipt(value)
        const receipt = child ?? complete(binding.node, path.at(-1)!, value, property)
        if (receipt.name !== path.at(-1)) {
          params.annotate?.({
            source: binding.node,
            differences: [{ kind: "presence", path: binding.node.path, ownerPath: binding.node.path }],
            property,
          })
          writePath(preparedBody, path, receipt)
          continue
        }
        writePath(preparedBody, path, receipt)
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

function findAnyChildReceipt(
  value: unknown,
  childReceipt: (value: unknown) => LocalXmlChild | undefined,
): LocalXmlChild | undefined {
  const receipt = childReceipt(value)
  if (receipt !== undefined) return receipt
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findAnyChildReceipt(entry, childReceipt)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (!isRecord(value)) return undefined
  for (const entry of Object.values(value)) {
    const found = findAnyChildReceipt(entry, childReceipt)
    if (found !== undefined) return found
  }
  return undefined
}


function findFinishedSource(
  value: unknown,
  sourceId: number,
  childReceipt: (value: unknown) => LocalXmlChild | undefined,
): LocalXmlChild | undefined {
  const receipt = childReceipt(value)
  if (receipt?.sourceId === sourceId) return receipt
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFinishedSource(entry, sourceId, childReceipt)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (value === null || typeof value !== "object") return undefined
  for (const entry of Object.values(value)) {
    const found = findFinishedSource(entry, sourceId, childReceipt)
    if (found !== undefined) return found
  }
  return undefined
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

function writePath(root: Record<string, unknown>, path: readonly string[], value: unknown): void {
  const owner = path.slice(0, -1).reduce<unknown>((current, segment) => isRecord(current) ? current[segment] : undefined, root)
  if (!isRecord(owner)) throw new Error(`Не найден владелец XML-пути ${path.join("/")}`)
  owner[path.at(-1)!] = value
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

function isComputedXmlOnlyProperty(rule: LocalBodyProperty["propertyRule"]): boolean {
  return rule.fromXML === false && rule.toYAML === false && rule.fromYAML === false
    && rule.evaluateWhenYAMLMissing === true
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
