import type { GraphPrimitive } from "../types"

export enum BulkPropertyType {
  Null = 0,
  Bool = 1,
  Double = 2,
  String = 3,
  Long = 4,
  Array = 5,
}

export type BulkScalar = Exclude<GraphPrimitive, null>
export type BulkValue = BulkScalar | BulkScalar[]
export type BulkProperties = Record<string, BulkValue>

const nulString = (value: string): Buffer => Buffer.from(`${value}\0`, "utf8")

const uint32 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(4)
  buffer.writeUInt32LE(value, 0)
  return buffer
}

const int64 = (value: bigint): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeBigInt64LE(value, 0)
  return buffer
}

const double64 = (value: number): Buffer => {
  const buffer = Buffer.allocUnsafe(8)
  buffer.writeDoubleLE(value, 0)
  return buffer
}

const typeByte = (type: BulkPropertyType): Buffer => Buffer.from([type])

const assertFiniteNumber = (value: number): void => {
  if (!Number.isFinite(value)) throw new Error(`Cannot encode non-finite bulk number: ${value}`)
}

const arrayElementKind = (values: readonly BulkScalar[]): string => {
  const kinds = new Set(values.map((value) => typeof value))
  if (kinds.size !== 1) throw new Error("GRAPH.BULK arrays must contain values of one primitive type")
  return [...kinds][0]!
}

export const normalizeBulkProperties = (
  props: Record<string, GraphPrimitive | GraphPrimitive[]>,
): BulkProperties => {
  const result: BulkProperties = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === null) continue
    if (Array.isArray(value)) {
      const values = value.filter((item): item is BulkScalar => item !== null)
      if (values.length === 0) continue
      arrayElementKind(values)
      result[key] = values
      continue
    }
    result[key] = value
  }
  return result
}

export const encodeBulkValue = (value: BulkValue): Buffer => {
  if (Array.isArray(value)) {
    const parts = [typeByte(BulkPropertyType.Array), int64(BigInt(value.length))]
    for (const item of value) {
      parts.push(encodeBulkValue(item))
    }
    return Buffer.concat(parts)
  }

  if (typeof value === "boolean") {
    return Buffer.concat([typeByte(BulkPropertyType.Bool), Buffer.from([value ? 1 : 0])])
  }

  if (typeof value === "number") {
    assertFiniteNumber(value)
    if (Number.isSafeInteger(value)) {
      return Buffer.concat([typeByte(BulkPropertyType.Long), int64(BigInt(value))])
    }
    return Buffer.concat([typeByte(BulkPropertyType.Double), double64(value)])
  }

  return Buffer.concat([typeByte(BulkPropertyType.String), nulString(value)])
}

export const encodeBulkHeader = (name: string, propertyNames: readonly string[]): Buffer =>
  Buffer.concat([
    nulString(name),
    uint32(propertyNames.length),
    ...propertyNames.map(nulString),
  ])
