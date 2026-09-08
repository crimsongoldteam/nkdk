import { describe, expect, it } from "vitest"
import { asExplicitYAMLStringIfMarked, explicitYAMLString, markDoubleQuotedScalar } from "./explicitString"
import { markYAMLMappingKeyOrder, yamlMappingKeys } from "./mappingTags"
import { parseMetadataYaml } from "./parseMetadataYaml"
import { cloneYAMLContainer, copyYAMLRuntimeMetadata, copyYAMLRuntimeMetadataDeep } from "./runtimeMetadata"
import { markYAMLScalarTag, markYAMLValueTag, yamlScalarTagAt, yamlValueTag } from "./scalarTags"
import { createXmlAnomalyAnnotations } from "./xmlAnomalyAnnotations"

describe("YAML runtime metadata", () => {
  it.each([false, true])("не обходит неизменённый объект при переносе метаданных; таблица: %s", (withAnnotations) => {
    let enumerations = 0
    const shared = new Proxy({ Значение: "001" }, {
      ownKeys(target) { enumerations++; return Reflect.ownKeys(target) },
    })
    markYAMLScalarTag(shared, "Значение", "проверять")
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(shared, "Значение", { kind: "invalid", target: "value", occurrence: 1 })
    const tables = withAnnotations ? { sourceAnnotations: annotations, targetAnnotations: annotations } : {}

    copyYAMLRuntimeMetadata(shared, shared)
    copyYAMLRuntimeMetadataDeep({ source: shared, target: shared, ...tables })
    copyYAMLRuntimeMetadataDeep({ source: { Вложенное: shared }, target: { Вложенное: shared }, ...tables })

    expect(enumerations).toBe(0)
    expect(yamlScalarTagAt(shared, "Значение")).toBe("проверять")
    expect(annotations.at(shared, "Значение")).toEqual({ kind: "invalid", target: "value", occurrence: 1 })
  })

  it("переносит аннотации между разными таблицами для того же объекта", () => {
    const parsed = parseMetadataYaml("Вложенное:\n  Значение: !xml/invalid text")
    const targetAnnotations = createXmlAnomalyAnnotations()
    copyYAMLRuntimeMetadataDeep({
      source: parsed.data, target: parsed.data,
      sourceAnnotations: parsed.annotations, targetAnnotations,
    })
    const value = parsed.data as { Вложенное: { Значение: string } }
    expect(targetAnnotations.at(value.Вложенное, "Значение")).toMatchObject({ kind: "invalid", target: "value" })
  })

  it("переносит аннотации по адресам без перечисления общей таблицы", () => {
    const source = { Вложенное: { Ключ: "text" } }
    const annotations = createXmlAnomalyAnnotations()
    annotations.set(source.Вложенное, "Ключ", { kind: "important", target: "value", occurrence: 1 })
    annotations.setKey(source.Вложенное, "Ключ", { kind: "invalid", target: "key", occurrence: 1 })
    const target = structuredClone(source)
    const targetAnnotations = createXmlAnomalyAnnotations()
    let enumerations = 0
    const entries = annotations.entries.bind(annotations)
    annotations.entries = () => { enumerations++; return entries() }

    copyYAMLRuntimeMetadataDeep({
      source, target, sourceAnnotations: annotations, targetAnnotations,
    })

    expect(targetAnnotations.at(target.Вложенное, "Ключ")).toMatchObject({ kind: "important", target: "value" })
    expect(targetAnnotations.keyAt(target.Вложенное, "Ключ")).toMatchObject({ kind: "invalid", target: "key" })
    expect(enumerations).toBe(0)
  })

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

  it("переносит временную метку самого составного значения", () => {
    const source = { Код: "000000001" }
    markYAMLValueTag(source, "проверять")

    const clone = cloneYAMLContainer(source)

    expect(yamlValueTag(clone)).toBe("проверять")
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

  it("не переносит аннотацию составного значения после сокращения поддерева", () => {
    const parsed = parseMetadataYaml([
      "Объект: !xml/raw",
      "  $значение: { Первое: 1, Второе: 2 }",
      "  $xml: { _mode: full }",
    ].join("\n"))
    const source = parsed.data as { Объект: { Первое: number; Второе: number } }
    const target = { Объект: { Первое: 1 } }
    const targetAnnotations = createXmlAnomalyAnnotations()

    copyYAMLRuntimeMetadataDeep({
      source,
      target,
      sourceAnnotations: parsed.annotations,
      targetAnnotations,
    })

    expect(targetAnnotations.at(target, "Объект")).toBeUndefined()
  })

  it("не сопоставляет элементы изменённого массива по сдвинувшемуся индексу", () => {
    const parsed = parseMetadataYaml([
      "Элементы:",
      "  - Имя: Первый",
      "    Значение: !xml/invalid same",
      "  - Имя: Второй",
      "    Значение: !xml/important same",
    ].join("\n"))
    const source = parsed.data as { Элементы: Array<Record<string, string>> }
    const target = { Элементы: [structuredClone(source.Элементы[1])] }
    const targetAnnotations = createXmlAnomalyAnnotations()

    copyYAMLRuntimeMetadataDeep({
      source,
      target,
      sourceAnnotations: parsed.annotations,
      targetAnnotations,
    })

    expect(targetAnnotations.at(target.Элементы[0], "Значение")).toBeUndefined()

    copyYAMLRuntimeMetadataDeep({
      source: source.Элементы[1],
      target: target.Элементы[0],
      sourceAnnotations: parsed.annotations,
      targetAnnotations,
    })

    expect(targetAnnotations.at(target.Элементы[0], "Значение")).toMatchObject({
      kind: "important",
    })
  })

  it("отклоняет перенос только с одной таблицей XML-аннотаций", () => {
    const parsed = parseMetadataYaml("Значение: !xml/invalid text")
    const target = structuredClone(parsed.data)

    expect(() => copyYAMLRuntimeMetadataDeep({
      source: parsed.data,
      target,
      sourceAnnotations: parsed.annotations,
    })).toThrow("Для переноса XML-аннотаций нужны исходная и целевая таблицы")
  })
})
