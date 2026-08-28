import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString, markDoubleQuotedScalar } from "./explicitString"
import { markYAMLMappingKeyOrder, yamlMappingKeys } from "./mappingTags"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { cloneYAMLContainer, copyYAMLRuntimeMetadata, copyYAMLRuntimeMetadataDeep } from "./runtimeMetadata"
import { markYAMLScalarTag, yamlScalarTagAt } from "./scalarTags"
import { createXmlAnomalyAnnotations } from "./xmlAnomalyAnnotations"

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

  it("переносит все служебные метаданные соответствующего YAML-поддерева", () => {
    const parsed = parseMetadataYaml([
      "Объект: !xml/raw",
      "  $значение:",
      "    Имя: !xml/name ОсобоеИмя",
      "    Языки: !xml/invalid",
      "      ru: Текст",
      "      en: Text",
      "  $xml: { _name: ОсобоеИмя }",
    ].join("\n"))
    const source = parsed.data as { Объект: { Имя: string; Языки: Record<string, string> } }
    markYAMLMappingKeyOrder(source.Объект.Языки, ["en", "ru"])
    markDoubleQuotedScalar(source.Объект.Языки, "en")
    const target = structuredClone(source)
    const targetAnnotations = createXmlAnomalyAnnotations()

    copyYAMLRuntimeMetadataDeep({
      source,
      target,
      sourceAnnotations: parsed.annotations,
      targetAnnotations,
    })

    expect(targetAnnotations.at(target, "Объект")).toMatchObject({ kind: "raw", target: "value" })
    expect(targetAnnotations.at(target.Объект, "Языки")).toMatchObject({ kind: "invalid", target: "value" })
    expect(yamlScalarTagAt(target.Объект, "Имя")).toBe("xml/name")
    expect(yamlMappingKeys(target.Объект.Языки)).toEqual(["en", "ru"])
    expect(asExplicitYAMLStringIfMarked(target.Объект.Языки, "en", "Text"))
      .toEqual(explicitYAMLString("Text"))
  })

  it("не переносит аннотацию отсутствующего или изменённого значения", () => {
    const parsed = parseMetadataYaml([
      "Сохранить: !xml/invalid same",
      "Изменить: !xml/invalid old",
      "Удалить: !xml/invalid gone",
    ].join("\n"))
    const source = parsed.data as Record<string, string>
    const target = { Сохранить: "same", Изменить: "new" }
    const targetAnnotations = createXmlAnomalyAnnotations()

    copyYAMLRuntimeMetadataDeep({
      source,
      target,
      sourceAnnotations: parsed.annotations,
      targetAnnotations,
    })

    expect(targetAnnotations.at(target, "Сохранить")).toMatchObject({ kind: "invalid" })
    expect(targetAnnotations.at(target, "Изменить")).toBeUndefined()
    expect(targetAnnotations.at(target, "Удалить")).toBeUndefined()
  })
})
