import fs from "fs"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import { importFromYAML } from "../../../yaml/import"
import { mockContextToXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"

describe("convertClientApplicationFormFromYAMLToXML", () => {
  it("формирует описание и содержимое формы прямо из YAML", () => {
    const yamlPath = fileURLToPath(new URL("__fixtures__/sync/yaml/Формы/ФормаЭлемента/Форма.yaml", import.meta.url))
    const yaml = importFromYAML<ClientApplicationFormYAML>(fs.readFileSync(yamlPath, "utf8"))
    const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "fullMetadata.xml"
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаЭлемента",
      referenceFormXML: referenceFormXML.Form,
      referenceMetadataXML: referenceMetadataXML.MetaDataObject,
    })

    expect(result.metadataXML.Form.Properties).toBeDefined()
    expect(result.formXML.ChildItems).toBeDefined()
    expect(result.formXML.ChildItems?.[0]?.InputField?.ContextMenu).toBeDefined()
    expect(result.formXML.ChildItems?.[0]?.InputField?.ExtendedTooltip).toBeDefined()
  })

  it("формирует дополнительные колонки реквизита без модели", () => {
    const yaml = importFromYAML<ClientApplicationFormYAML>(
      [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Строка",
        "    ДополнительныеКолонки:",
        "      Список.Способы:",
        "        Реквизит1:",
        "          Тип: Строка",
      ].join("\n")
    )

    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "ФормаСписка",
    })

    expect(result.formXML.Attributes?.Attribute).toEqual([
      expect.objectContaining({
        _name: "Объект",
        Columns: {
          AdditionalColumns: [
            {
              _table: "Список.Способы",
              Column: [expect.objectContaining({ _name: "Реквизит1" })],
            },
          ],
        },
      }),
    ])
  })

  it("сохраняет пустой контейнер реквизитов из reference XML", () => {
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: {} as ClientApplicationFormYAML,
      name: "Форма",
      referenceFormXML: { Attributes: undefined } as ClientApplicationFormXML,
    })

    expect(result.formXML.Attributes).toEqual({})
  })
})
