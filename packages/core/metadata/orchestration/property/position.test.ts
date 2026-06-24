import { isMap, isSeq } from "yaml"
import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { computeSeqItemPosition, computeValuePosition } from "./position"

describe("YAML source positions", () => {
  it("computeValuePosition возвращает offset, line и column значения свойства", () => {
    const parsed = parseMetadataYaml(`
Тип: Справочник.Контрагенты
`)
    const yamlMap = parsed.doc.contents

    expect(isMap(yamlMap)).toBe(true)
    if (!isMap(yamlMap)) return

    const position = computeValuePosition(yamlMap, "Тип", parsed.lineCounter)

    expect(position).toEqual({
      offset: 6,
      line: 2,
      column: 6,
    })
  })

  it("computeSeqItemPosition возвращает координаты конкретного элемента массива", () => {
    const parsed = parseMetadataYaml(`
ВводПоСтроке:
  - Справочник.A.Реквизит.П1
  - Справочник.B.Реквизит.П2
`)
    const yamlMap = parsed.doc.contents

    expect(isMap(yamlMap)).toBe(true)
    if (!isMap(yamlMap)) return

    const pair = yamlMap.items.find((item) => item && "key" in item)
    const seq = pair && "value" in pair ? pair.value : undefined

    expect(isSeq(seq)).toBe(true)
    if (!isSeq(seq)) return

    expect(computeSeqItemPosition(seq, 0, parsed.lineCounter)).toEqual({
      offset: 19,
      line: 3,
      column: 5,
    })
    expect(computeSeqItemPosition(seq, 1, parsed.lineCounter)).toEqual({
      offset: 48,
      line: 4,
      column: 5,
    })
  })
})
