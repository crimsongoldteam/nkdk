import { parseMetadataYaml, serializeYAMLDocument } from "@nkdk/runtime"
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
})
