import { describe, expect, it } from "vitest"
import { createXmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import { isMetadataTargetUuid } from "../../helpers/mdObjectRefUuid"
import {
  assignMetadataTargetUuidAnnotations,
  importMetadataTargetOccurrencesFromYAML,
  projectMetadataTargetOccurrencesToYAML,
  type MetadataTargetOccurrence,
} from "./metadataTargetOccurrences"

const uuid = "A786340B-1CA9-48EE-8517-6BD389390BCC"
const compositeUuid = `${uuid}.00000000-0000-0000-0000-000000000000`
const constraint = { kind: "object", roots: ["Catalog"] } as const

describe("UUID metadata-ссылок", () => {
  it.each([
    [uuid, true],
    [compositeUuid, true],
    [`1:${uuid}`, true],
    [`2:${uuid}`, false],
    [`1:${compositeUuid}`, false],
    ["1:broken", false],
    ["00000000-0000-0000-0000-000000000000", true],
    [`${compositeUuid}.${uuid}`, false],
    [`{${uuid}}`, false],
    ["Catalog.Товары", false],
  ])("классифицирует %s", (value, expected) => {
    expect(isMetadataTargetUuid(value)).toBe(expected)
  })

  it("оставляет UUID без форматирования и возвращает его расположение", () => {
    let stored = compositeUuid
    const occurrence = valueOccurrence(compositeUuid, ["Значение"], (next) => { stored = next })

    const projected = projectMetadataTargetOccurrencesToYAML({
      value: compositeUuid,
      occurrences: [occurrence],
    })

    expect(projected).toEqual({
      value: compositeUuid,
      uuidOccurrences: [occurrence],
    })
    expect(stored).toBe(compositeUuid)
  })

  it("форматирует обычную смысловую ссылку прежним способом", () => {
    let stored = "Catalog.Товары"
    const occurrence = valueOccurrence(stored, ["Значение"], (next) => { stored = next })

    const projected = projectMetadataTargetOccurrencesToYAML({
      value: stored,
      occurrences: [occurrence],
    })

    expect(projected).toEqual({ value: "Товары", uuidOccurrences: [] })
    expect(stored).toBe("Товары")
  })

  it("назначает точные аннотации значению, элементу списка и ключу", () => {
    const yaml = {
      Значение: uuid,
      Список: [compositeUuid],
      Роли: { [uuid]: "Истина" },
    }
    const annotations = createXmlAnomalyAnnotations()
    const occurrences: MetadataTargetOccurrence[] = [
      valueOccurrence(uuid, ["Значение"]),
      valueOccurrence(compositeUuid, ["Список", 0]),
      {
        location: { kind: "key", path: ["Роли"], key: uuid },
        constraint,
        representation: { kind: "canonical", canonical: uuid },
        setValue: () => undefined,
      },
    ]

    assignMetadataTargetUuidAnnotations({ yaml, annotations, occurrences })

    expect(annotations.at(yaml, "Значение")).toEqual({ kind: "uuid", occurrence: 1, target: "value" })
    expect(annotations.at(yaml.Список, 0)).toEqual({ kind: "uuid", occurrence: 1, target: "value" })
    expect(annotations.keyAt(yaml.Роли, uuid)).toEqual({
      kind: "uuid",
      occurrence: 1,
      target: "key",
      logicalKey: uuid,
    })
  })

  it("принимает UUID только с точной !xml/uuid-аннотацией", () => {
    const parsed = parseMetadataYaml(`Значение: !xml/uuid ${uuid}`)
    const data = parsed.data as { Значение: string }

    expect(importMetadataTargetOccurrencesFromYAML({
      value: data.Значение,
      occurrences: [valueOccurrence(data.Значение, ["Значение"])],
      yaml: data,
      annotations: parsed.annotations,
    })).toBe(uuid)
  })

  it("отклоняет UUID без !xml/uuid", () => {
    expect(() => importMetadataTargetOccurrencesFromYAML({
      value: uuid,
      occurrences: [valueOccurrence(uuid, ["Значение"])],
      yaml: { Значение: uuid },
      annotations: createXmlAnomalyAnnotations(),
    })).toThrow("UUID metadata-ссылки требует !xml/uuid")
  })

  it("отклоняет !xml/uuid на смысловой ссылке", () => {
    const parsed = parseMetadataYaml("Значение: !xml/uuid Товары")
    const data = parsed.data as { Значение: string }

    expect(() => importMetadataTargetOccurrencesFromYAML({
      value: data.Значение,
      occurrences: [valueOccurrence(data.Значение, ["Значение"])],
      yaml: data,
      annotations: parsed.annotations,
    })).toThrow("!xml/uuid допустим только для UUID, UUID.UUID или 1:UUID metadata-ссылки")
  })

  it.each([uuid, compositeUuid, `1:${uuid}`])("сохраняет %s в скаляре, списке и ключе", (text) => {
    const parsed = parseMetadataYaml(`Значение: !xml/uuid ${text}\nСписок:\n  - !xml/uuid ${text}\nРоли:\n  !xml/uuid ${text}: Истина\n`)
    const data = parsed.data as { Значение: string; Список: string[]; Роли: Record<string, string> }
    const values: string[] = []
    const occurrences: MetadataTargetOccurrence[] = [
      valueOccurrence(text, ["Значение"], (next) => values.push(next)),
      valueOccurrence(text, ["Список", 0], (next) => values.push(next)),
      {
        location: { kind: "key", path: ["Роли"], key: Object.keys(data.Роли)[0] },
        constraint,
        representation: { kind: "canonical", canonical: text },
        setValue: (next) => values.push(next),
      },
    ]
    importMetadataTargetOccurrencesFromYAML({ value: data, yaml: data, annotations: parsed.annotations, occurrences })
    expect(values).toEqual([text, text, text])
    expect(() => importMetadataTargetOccurrencesFromYAML({ value: data, yaml: data, occurrences }))
      .toThrow("UUID metadata-ссылки требует !xml/uuid")
  })

  it("оставляет обычную смысловую ссылку на прежнем пути разбора", () => {
    let stored = "Товары"

    const result = importMetadataTargetOccurrencesFromYAML({
      value: stored,
      occurrences: [valueOccurrence(stored, ["Значение"], (next) => { stored = next })],
      yaml: { Значение: stored },
      annotations: createXmlAnomalyAnnotations(),
    })

    expect(result).toBe("Catalog.Товары")
    expect(stored).toBe("Catalog.Товары")
  })
})

function valueOccurrence(
  canonical: string,
  path: readonly (string | number)[],
  setValue: (nextValue: string) => void = () => undefined,
): MetadataTargetOccurrence {
  return {
    location: { kind: "value", path },
    constraint,
    representation: { kind: "canonical", canonical },
    setValue,
  }
}
