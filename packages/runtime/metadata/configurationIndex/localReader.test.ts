import { describe, expect, it } from "vitest"
import { createLocalConfigurationIndexReader } from "./localReader"

const UUID_A = "00000000-0000-4000-8000-000000000001"

describe("local configuration index reader", () => {
  it("sees only entities from explicitly loaded blocks", () => {
    const reader = createLocalConfigurationIndexReader(new Map([
      ["А.yaml", { entities: [{ logicalAddress: "А", uuid: UUID_A }] }],
    ]))
    expect(reader.entity("А")?.uuid).toBe(UUID_A)
    expect(reader.entity("Б")).toBeUndefined()
    expect([...reader.entities()]).toHaveLength(1)
  })

  it("rejects the same logical address in two loaded blocks", () => {
    expect(() => createLocalConfigurationIndexReader(new Map([
      ["А.yaml", { entities: [{ logicalAddress: "Объект", uuid: UUID_A }] }],
      ["Б.yaml", { entities: [{ logicalAddress: "Объект", xmlId: "1" }] }],
    ]))).toThrow("Объект")
  })
})
