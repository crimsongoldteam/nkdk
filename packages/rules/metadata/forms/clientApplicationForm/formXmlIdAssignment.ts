import { formXmlIdReservation, type FormXmlIdReservation, type FormXmlIdSpace } from "@nkdk/runtime"

interface Candidate {
  readonly node: Record<string, unknown>
  readonly reference: Record<string, unknown> | undefined
  readonly reservation: FormXmlIdReservation
  id?: string
}

export function assignFormXmlIds(generated: unknown, reference?: unknown): void {
  const candidates: Candidate[] = []
  collectCandidates(generated, reference, candidates)

  const occupied = new Map<FormXmlIdSpace, Map<string, Candidate>>()
  for (const candidate of candidates) {
    const snapshotId = candidate.reservation.runtime?.identity("xmlId")
    const referenceId = stringId(candidate.reference?._id)
    candidate.id = snapshotId ?? referenceId ?? candidate.reservation.specialId
    if (candidate.id !== undefined) reserve(candidate, occupied)
  }

  const nextBySpace = new Map<FormXmlIdSpace, number>()
  for (const candidate of candidates) {
    if (candidate.id === undefined) {
      let next = nextBySpace.get(candidate.reservation.space) ?? 1
      const used = occupied.get(candidate.reservation.space)
      while (used?.has(String(next)) === true) next++
      candidate.id = String(next)
      nextBySpace.set(candidate.reservation.space, next + 1)
      reserve(candidate, occupied)
    }
    candidate.node._id = candidate.id
    const runtime = candidate.reservation.runtime
    if (runtime !== undefined) runtime.collector.setIdentity(runtime.logicalAddress, "xmlId", candidate.id)
  }
}

function collectCandidates(generated: unknown, reference: unknown, result: Candidate[]): void {
  if (Array.isArray(generated)) {
    const references = Array.isArray(reference) ? reference : []
    for (const [index, item] of generated.entries()) {
      collectCandidates(item, findReferenceNode(item, references) ?? references[index], result)
    }
    return
  }
  if (!isRecord(generated)) return
  const referenceRecord = isRecord(reference) ? reference : undefined
  const reservation = formXmlIdReservation(generated)
  if (reservation !== undefined) result.push({ node: generated, reference: referenceRecord, reservation })
  for (const [key, child] of Object.entries(generated)) {
    collectCandidates(child, referenceRecord?.[key], result)
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
  occupied: Map<FormXmlIdSpace, Map<string, Candidate>>,
): void {
  const id = candidate.id
  if (id === undefined) return
  if (isNegativeId(id)) {
    if (candidate.reservation.specialId !== id) throw new Error(`Отрицательный ID ${id} не объявлен правилом`)
    return
  }
  if (!isNonNegativeId(id)) throw new Error(`Некорректный ID формы: ${id}`)
  const byId = occupied.get(candidate.reservation.space) ?? new Map<string, Candidate>()
  const previous = byId.get(id)
  if (previous !== undefined && previous !== candidate) {
    throw new Error(`Повторный ID ${id} в пространстве ${candidate.reservation.space}`)
  }
  byId.set(id, candidate)
  occupied.set(candidate.reservation.space, byId)
}

function stringId(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function isNonNegativeId(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value)
}

function isNegativeId(value: string): boolean {
  return /^-[1-9]\d*$/.test(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
