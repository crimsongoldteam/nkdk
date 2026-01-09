import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { FormElementType } from "../../../metadataFactory/types"
import { ColumnGroup } from "../columnGroup/types"
import { InputField } from "../inputField/types"
import { exportTableToStructure } from "./exportToStructure"
import { Table } from "./types"

describe("exportTableToStructure", () => {
  it("should format one-column table", () => {
    const mockElement: Table = {
      name: "Таблица",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Колонка1",
          title: { items: { ru: "Колонка 1" } },
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `| Колонка 1 |`

    const result = exportTableToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
  it("should format two-column table", () => {
    const mockElement: Table = {
      name: "Таблица",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Колонка1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Колонка2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    }

    const expectedResult = `| Колонка 1 | Колонка 2 |`

    const result = exportTableToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with horizontal group", () => {
    const mockElement: Table = {
      name: "Таблица",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          group: "Horizontal",
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| -Группа 1             ||
|| Колонка 1 | Колонка 2  |`

    const result = exportTableToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group without title", () => {
    const mockElement: Table = {
      name: "Таблица",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          group: "Vertical",
          showTitle: false,
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| Колонка 1 |
| Колонка 2 |`

    const result = exportTableToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })

  it("should format table with vertical group with title", () => {
    const mockElement: Table = {
      name: "Таблица",
      elementType: FormElementType.Table,
      childItems: [
        {
          name: "Группа1",
          title: { items: { ru: "Группа 1" } },
          group: "Vertical",
          showTitle: true,
          elementType: FormElementType.ColumnGroup,
          childItems: [
            {
              name: "Колонка1",
              title: { items: { ru: "Колонка 1" } },
              elementType: FormElementType.InputField,
            } as InputField,
            {
              name: "Колонка2",
              title: { items: { ru: "Колонка 2" } },
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as ColumnGroup,
      ],
    }

    const expectedResult = `| #Группа 1  |
| Колонка 1 |
| Колонка 2 |`

    const result = exportTableToStructure(mockСontext, mockElement)

    expect(result.strings.join("\n")).toEqual(expectedResult)
  })
})
