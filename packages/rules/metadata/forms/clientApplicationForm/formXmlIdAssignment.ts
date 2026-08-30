import { formXmlIdReservation, type FormXmlIdReservation } from "@nkdk/runtime"

interface Candidate {
  readonly node: Record<string, unknown>
  readonly reference: Record<string, unknown> | undefined
  readonly reservation: FormXmlIdReservation
  readonly scope: object
  id?: string
}

export function assignFormXmlIds(generated: unknown, reference?: unknown): void {
  const candidates: Candidate[] = []
  collectCandidates(generated, reference, candidates, rootScope(generated))

  const occupied = new Map<object, Map<string, Candidate>>()
  for (const candidate of candidates) {
    const snapshotId = candidate.reservation.runtime?.identity("xmlId")
    const referenceId = stringId(candidate.reference?._id)
    candidate.id = candidate.reservation.specialId ?? snapshotId ?? referenceId
    if (candidate.id !== undefined) reserve(candidate, occupied)
  }

  const nextByScope = new Map<object, number>()
  for (const candidate of candidates) {
    if (candidate.id === undefined) {
      let next = nextByScope.get(candidate.scope) ?? 1
      const used = occupied.get(candidate.scope)
      while (used?.has(String(next)) === true) next++
      candidate.id = String(next)
      nextByScope.set(candidate.scope, next + 1)
      reserve(candidate, occupied)
    }
    candidate.node._id = candidate.id
    const runtime = candidate.reservation.runtime
    if (runtime !== undefined) runtime.collector.setIdentity(runtime.logicalAddress, "xmlId", candidate.id)
  }
}

function collectCandidates(generated: unknown, reference: unknown, result: Candidate[], scope: object): void {
  if (Array.isArray(generated)) {
    const references = Array.isArray(reference) ? reference : []
    for (const [index, item] of generated.entries()) {
      collectCandidates(item, findReferenceNode(item, references) ?? references[index], result, generated)
    }
    return
  }
  if (!isRecord(generated)) return
  const referenceRecord = isRecord(reference) ? reference : undefined
  const reservation = formXmlIdReservation(generated)
  if (reservation !== undefined) result.push({ node: generated, reference: referenceRecord, reservation, scope })
  const childScope = reservation === undefined ? scope : generated
  for (const [key, child] of Object.entries(generated)) {
    collectCandidates(child, referenceRecord?.[key], result, childScope)
  }
}

function findReferenceNode(value: unknown, references: unknown[]): unknown {
  const name = nestedName(value)
  if (name === undefined) return undefined
  return references.find((item) => nestedName(item) === name)
}

function nestedName(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  if (typeof value._name === "string") return value._name
  const nested = Object.values(value).filter(isRecord)
  return nested.length === 1 && typeof nested[0]?._name === "string" ? nested[0]._name : undefined
}

function reserve(
  candidate: Candidate,
  occupied: Map<object, Map<string, Candidate>>,
): void {
  const id = candidate.id
  if (id === undefined) return
  if (!isXmlId(id)) throw new Error(`Некорректный ID формы: ${id}`)
  const byId = occupied.get(candidate.scope) ?? new Map<string, Candidate>()
  const previous = byId.get(id)
  if (previous !== undefined && previous !== candidate) {
    throw new Error(`Повторный ID ${id} в XML-контейнере (${candidate.reservation.space})`)
  }
  byId.set(id, candidate)
  occupied.set(candidate.scope, byId)
}

function rootScope(value: unknown): object {
  return value !== null && typeof value === "object" ? value : {}
}

function stringId(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function isXmlId(value: string): boolean {
  return /^(?:0|[1-9]\d*|-[1-9]\d*)$/.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
