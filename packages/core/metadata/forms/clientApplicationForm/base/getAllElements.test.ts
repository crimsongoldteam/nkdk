import { describe, expect, it } from "vitest"
import { CollectionFormElementType, SingleFormElementType } from "~/metadata/metadataFactory"
import { Button } from "../../elements/button/types"
import { ButtonGroup } from "../../elements/buttonGroup/types"
import { Table } from "../../elements/table/types"
import { getAllElements } from "./getAllElements"
import { ClientApplicationForm } from "./types"

describe("getAllElements", () => {
  it("should return all elements", () => {
    const form: ClientApplicationForm = {
      commands: [],
      childItems: [
        {
          name: "Группа",
          itemType: CollectionFormElementType.UsualGroup,
          childItems: [
            {
              name: "ПолеВвода",
              itemType: CollectionFormElementType.InputField,
            },
          ],
        },
      ],
      itemType: "ClientApplicationForm",
    }

    const elements = getAllElements(form)

    expect(elements).toHaveLength(2)
    expect(elements[0]).toMatchObject({
      name: "Группа",
    })
    expect(elements[1]).toMatchObject({
      name: "ПолеВвода",
    })
  })

  it("should return elements from form auto command bar", () => {
    const button: Button = {
      name: "Кнопка1",
      itemType: CollectionFormElementType.Button,
    }
    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [button],
    }

    const form: ClientApplicationForm = {
      commands: [],
      childItems: [],
      autoCommandBar: {
        itemType: SingleFormElementType.AutoCommandBar,
        autofill: false,
        childItems: [buttonGroup],
      },
      itemType: "ClientApplicationForm",
    }

    const expectedElements = [buttonGroup, button]

    const elements = getAllElements(form)

    expect(elements).toEqual(expectedElements)
  })

  it("should return elements from table auto command bar", () => {
    const button: Button = {
      name: "Кнопка1",
      itemType: CollectionFormElementType.Button,
    }
    const buttonGroup: ButtonGroup = {
      name: "ГруппаКнопок1",
      itemType: CollectionFormElementType.ButtonGroup,
      childItems: [button],
    }
    const table: Table = {
      name: "Таблица1",
      itemType: CollectionFormElementType.Table,
      autoCommandBar: {
        itemType: SingleFormElementType.AutoCommandBar,
        autofill: false,
        childItems: [buttonGroup],
      },
      childItems: [],
    }
    const form: ClientApplicationForm = {
      commands: [],
      childItems: [table],
      itemType: "ClientApplicationForm",
    }

    const expectedElements = [table, buttonGroup, button]

    const elements = getAllElements(form)

    expect(elements).toEqual(expectedElements)
  })
})
