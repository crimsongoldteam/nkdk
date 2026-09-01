import { explicitYAMLString, parseMetadataYaml, serializeYAMLDocument } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { applyImportedIssueDecisions } from "./applyImportedIssueDecisions"

describe("применение решений об XML-аномалиях", () => {
  it("помечает существующее и создаёт отсутствующее значение", () => {
    const parsed = parseMetadataYaml("Флаг: неверно\n")

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [
        { kind: "invalid", target: { kind: "path", path: ["Флаг"] }, issueCodes: ["schema.type"] },
        { kind: "invalid", target: { kind: "missing", path: ["Заголовок"] }, issueCodes: ["rules.required"] },
      ],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe([
      "Флаг: !xml/invalid неверно",
      "Заголовок: !xml/invalid",
    ].join("\n"))
  })

  it("помечает корень YAML для межфайловой диагностики без локального пути", () => {
    const parsed = parseMetadataYaml("Имя: Расширение\n")

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: [] },
        issueCodes: ["diagnostic.cross-file"],
      }],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe([
      "!xml/invalid",
      "Имя: Расширение",
    ].join("\n"))
  })

  it("помещает invalid внутрь raw со смысловым значением", () => {
    const parsed = parseMetadataYaml([
      "Флаг: !xml/raw",
      "  $значение: неверно",
      "  $xml:",
      "    _custom: x",
    ].join("\n"))

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: ["Флаг"] },
        issueCodes: ["schema.type"],
      }],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toContain(
      "$значение: !xml/invalid неверно",
    )
  })

  it("считает решение покрытым raw без смыслового значения", () => {
    const source = [
      "Значение: !xml/raw",
      "  $xml:",
      "    _xsi:type: xr:DesignTimeRef",
    ].join("\n")
    const parsed = parseMetadataYaml(source)

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: ["Значение"] },
        issueCodes: ["diagnostic.structure"],
      }],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe(source)
  })

  it("помечает конкретный элемент массива по числовому пути TypeBox", () => {
    const parsed = parseMetadataYaml([
      "СписокВыбора:",
      "  - неверно",
      "  - верно",
    ].join("\n"))

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: ["СписокВыбора", 0] },
        issueCodes: ["schema.anyOf"],
      }],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe([
      "СписокВыбора:",
      "  - !xml/invalid неверно",
      "  - верно",
    ].join("\n"))
  })

  it("сохраняет явную YAML-строку скаляром при добавлении invalid", () => {
    const data = { Значение: explicitYAMLString("         ") }
    const parsed = parseMetadataYaml(serializeYAMLDocument(data).text)

    applyImportedIssueDecisions({
      data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: ["Значение"] },
        issueCodes: ["rules.fill-value"],
      }],
    })

    expect(serializeYAMLDocument(data, parsed.annotations).text).toBe(
      'Значение: !xml/invalid "         "',
    )
  })

  it("не дублирует invalid на значении уже помеченного ключа", () => {
    const parsed = parseMetadataYaml("Заголовок:\n  !xml/invalid tr: Parametre\n")
    const title = (parsed.data as { Заголовок: Record<string, unknown> }).Заголовок
    const runtimeKey = Object.keys(title)[0]!

    applyImportedIssueDecisions({
      data: parsed.data,
      annotations: parsed.annotations,
      decisions: [{
        kind: "invalid",
        target: { kind: "path", path: ["Заголовок", runtimeKey] },
        issueCodes: ["schema.additional-property"],
      }],
    })

    expect(serializeYAMLDocument(parsed.data, parsed.annotations).text).toBe(
      "Заголовок:\n  !xml/invalid tr: Parametre",
    )
  })
})
