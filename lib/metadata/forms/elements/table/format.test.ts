import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { TColumnGroup } from "../columnGroup/types"
import { TInputField } from "../inputField/types"
import { ZElementType } from "../types"
import { formatTable } from "./format"
import "./registration"
import { TTable } from "./types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatTable", () => {
  it("should format one-column table", () => {
    const mockElement: TTable = {
      name: "Таблица",
      id: "1",
      elementType: ZElementType.enum.Table,
      childItems: [
        {
          name: "Колонка1",
          title: { items: { ru: "Колонка 1" } },
          id: "1",
          elementType: ZElementType.enum.InputField,
        } as TInputField,
      ],
    }

    const expectedResult = `| Колонка 1 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
  it("should format two-column table", () => {
    const mockElement: TTable = {
      name: "Таблица",
      id: "1",
      elementType: ZElementType.enum.Table,
      childItems: [
        {
          name: "Колонка1",
          id: "1",
          elementType: ZElementType.enum.InputField,
        } as TInputField,
        {
          name: "Колонка2",
          id: "2",
          elementType: ZElementType.enum.InputField,
        } as TInputField,
      ],
    }

    const expectedResult = `| Колонка 1 | Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with horizontal group", () => {
    const mockElement: TTable = {
      name: "Таблица",
      id: "1",
      elementType: ZElementType.enum.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Horizontal,
          elementType: ZElementType.enum.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
          ],
        } as TColumnGroup,
      ],
    }

    const expectedResult = `| -Группа 1             ||
| Колонка 1 | Колонка 2  |`

    const result = formatTable(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group without title", () => {
    const mockElement: TTable = {
      name: "Таблица",
      id: "1",
      elementType: ZElementType.enum.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Vertical,
          showTitle: false,
          elementType: ZElementType.enum.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
          ],
        } as TColumnGroup,
      ],
    }

    const expectedResult = `| Колонка 1 |
| Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group with title", () => {
    const mockElement: TTable = {
      name: "Таблица",
      id: "1",
      elementType: ZElementType.enum.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Vertical,
          showTitle: true,
          elementType: ZElementType.enum.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: ZElementType.enum.InputField,
            } as TInputField,
          ],
        } as TColumnGroup,
      ],
    }

    const expectedResult = `| #Группа 1  |
| Колонка 1 |
| Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
