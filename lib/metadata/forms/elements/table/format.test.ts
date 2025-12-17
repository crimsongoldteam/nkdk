import { describe, expect, it } from "vitest"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ColumnGroup } from "../columnGroup/types"
import { InputField } from "../inputField/types"
import { FormElementType } from "../types"
import { formatTable } from "./format"
import "./registration"
import { Table } from "./types"

const configurationSettings: ConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatTable", () => {
  it("should format one-column table", () => {
    const mockElement: Table = {
      name: "Таблица",
      id: "1",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Колонка1",
          title: { items: { ru: "Колонка 1" } },
          id: "1",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `| Колонка 1 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
  it("should format two-column table", () => {
    const mockElement: Table = {
      name: "Таблица",
      id: "1",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Колонка1",
          id: "1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Колонка2",
          id: "2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `| Колонка 1 | Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with horizontal group", () => {
    const mockElement: Table = {
      name: "Таблица",
      id: "1",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Horizontal,
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| -Группа 1             ||
| Колонка 1 | Колонка 2  |`

    const result = formatTable(mockElement, {})

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group without title", () => {
    const mockElement: Table = {
      name: "Таблица",
      id: "1",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Vertical,
          showTitle: false,
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| Колонка 1 |
| Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group with title", () => {
    const mockElement: Table = {
      name: "Таблица",
      id: "1",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          id: "1",
          group: SE.ZColumnsGroup.enum.Vertical,
          showTitle: true,
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              id: "1",
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              id: "2",
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| #Группа 1  |
| Колонка 1 |
| Колонка 2 |`

    const result = formatTable(mockElement, configurationSettings)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
