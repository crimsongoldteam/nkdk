import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString, markDoubleQuotedScalar } from "./explicitString"
import { markYAMLMappingKeyOrder, yamlMappingKeys } from "./mappingTags"
import { cloneYAMLContainer, copyYAMLRuntimeMetadata } from "./runtimeMetadata"
import { markYAMLScalarTag, yamlScalarTagAt } from "./scalarTags"

describe("YAML runtime metadata", () => {
  it("клонирует объект со всеми служебными метаданными", () => {
    const marker = Symbol("marker")
    const source = { Первое: "001", Второе: true }
    Object.defineProperty(source, marker, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: "claim-1",
    })
    Object.defineProperty(source, "скрытое", { enumerable: false, value: "не переносить" })
    markYAMLScalarTag(source, "Второе", "проверять")
    markYAMLMappingKeyOrder(source, ["Второе", "Первое"])
    markDoubleQuotedScalar(source, "Первое")

    const clone = cloneYAMLContainer(source)

    expect(clone).not.toBe(source)
    expect(clone).toEqual(source)
    expect(Object.getOwnPropertyDescriptor(clone, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
    expect(Object.hasOwn(clone, "скрытое")).toBe(false)
    expect(yamlScalarTagAt(clone, "Второе")).toBe("проверять")
    expect(yamlMappingKeys(clone)).toEqual(["Второе", "Первое"])
    expect(asExplicitYAMLStringIfMarked(clone, "Первое", clone.Первое)).toEqual(
      explicitYAMLString("001"),
    )
  })

  it("клонирует массив и его метаданные", () => {
    const marker = Symbol("array-marker")
    const source = ["001", 2]
    Object.defineProperty(source, marker, { configurable: true, value: "claim-2" })
    markYAMLScalarTag(source, 1, "изменять")
    markDoubleQuotedScalar(source, 0)

    const clone = cloneYAMLContainer(source)

    expect(clone).toEqual(source)
    expect(Object.getOwnPropertyDescriptor(clone, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
    expect(yamlScalarTagAt(clone, 1)).toBe("изменять")
    expect(asExplicitYAMLStringIfMarked(clone, 0, clone[0])).toEqual(explicitYAMLString("001"))
  })

  it("разрешает совпадающую символьную метку и восстанавливает её дескриптор", () => {
    const marker = Symbol("marker")
    const source = {}
    const target = { [marker]: "claim-1" }
    Object.defineProperty(source, marker, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: "claim-1",
    })

    copyYAMLRuntimeMetadata(source, target)

    expect(Object.getOwnPropertyDescriptor(target, marker)).toEqual(
      Object.getOwnPropertyDescriptor(source, marker),
    )
  })

  it("отклоняет несовместимую символьную метку", () => {
    const marker = Symbol("marker")
    const source = { [marker]: "claim-1" }
    const target = { [marker]: "claim-2" }

    expect(() => copyYAMLRuntimeMetadata(source, target)).toThrow(
      "Несовместимая служебная Symbol-метка YAML: Symbol(marker)",
    )
  })
})
