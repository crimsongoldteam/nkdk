import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { describe, expect, it, vi } from "vitest"
import { createPackedXmlAssignmentStore } from "./packedXmlAssignment"

describe("PackedXmlAssignmentStore", () => {
  it("сохраняет полный XmlDocument и общую identity compatibilityValue", () => {
    const source = parseXmlDocumentWithSaxes([
      '<?instruction mode="test"?>',
      '<Root xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" id="7">',
      "<Empty/>",
      '<Child xsi:nil="true"/>',
      "<Child>текст</Child>",
      "</Root>",
    ].join(""), { preserveXsiNil: true })
    const store = createPackedXmlAssignmentStore()

    store.put("a", [{
      input: { role: "metadata", sourcePath: "/a.xml" },
      document: source,
    }])
    const restored = store.take("a")[0]!.document

    expect(restored).toEqual(source)
    expect(restored).not.toBe(source)
    expect(restored.roots[0]!.structuralHash).toBeTypeOf("bigint")
    expect(restored.roots[0]!.compatibilityValue).toBe(restored.compatibility.Root)
    expect(restored.roots[0]!.compatibilityValue).not.toBe(source.compatibility.Root)
    expect(restored.content[0]).toMatchObject({ type: "processingInstruction" })
    expect(store.stats()).toEqual({ assignments: 0, bytes: 0 })
  })

  it("не позволяет заменить задание и удаляет повреждённый buffer до unpack", () => {
    const unpack = vi.fn(() => {
      throw new Error("corrupt payload")
    })
    const store = createPackedXmlAssignmentStore({
      codec: {
        pack: () => Uint8Array.from([1, 2, 3]),
        unpack,
      },
    })
    const input = [{
      input: { role: "metadata" as const, sourcePath: "/a.xml" },
      document: parseXmlDocumentWithSaxes("<Root/>"),
    }]

    store.put("a", input)
    expect(() => store.put("a", input)).toThrow(/already packed.*a/u)
    expect(store.stats()).toEqual({ assignments: 1, bytes: 3 })
    expect(() => store.take("a")).toThrow(/corrupt payload/u)
    expect(unpack).toHaveBeenCalledOnce()
    expect(store.stats()).toEqual({ assignments: 0, bytes: 0 })
  })

  it("отвергает неизвестное задание и очищает все buffers", () => {
    const store = createPackedXmlAssignmentStore()
    const input = [{
      input: { role: "body" as const, sourcePath: "/body.xml" },
      document: parseXmlDocumentWithSaxes("<Root/>"),
    }]

    expect(() => store.take("missing")).toThrow(/not packed.*missing/u)
    store.put("a", input)
    store.put("b", input)
    expect(store.stats().assignments).toBe(2)
    store.release("a")
    expect(store.stats().assignments).toBe(1)
    store.clear()
    expect(store.stats()).toEqual({ assignments: 0, bytes: 0 })
  })

  it("профилирует pack, unpack и удерживаемый объём", () => {
    const measure = vi.fn((_step, _substep, _params, fn: () => unknown) => fn())
    const checkpoint = vi.fn()
    const store = createPackedXmlAssignmentStore({
      profiler: { measure, checkpoint } as never,
    })
    store.put("a", [{
      input: { role: "property", sourcePath: "/p.xml" },
      document: parseXmlDocumentWithSaxes("<Root><Value>1</Value></Root>"),
    }])
    store.take("a")

    expect(measure.mock.calls.map((call) => call[1])).toEqual(["MessagePack pack", "MessagePack unpack"])
    expect(checkpoint.mock.calls.map((call) => call[1])).toEqual([
      "Удерживаемый packed XML",
      "Удерживаемый packed XML",
    ])
  })
})
