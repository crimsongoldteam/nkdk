import { ChildItems, ChildItemsEnterprise } from "~/metadata/forms/elements/childItems/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export interface ChildItemsFixture {
  name: string
  element?: ChildItems
  structure?: string[]
  xmlPath?: string
}

export const childItemsFixturesTable: ChildItemsFixture[] = [
  // Undefined
  { name: "undefined", element: undefined, structure: undefined },

  // Single
  {
    name: "single",
    element: [{ name: "Input1", id: "1", elementType: FormElementType.InputField }],
    structure: ["{Input1}: "],
    xmlPath: "/childItems/single.xml",
  },

  // Different types
  {
    name: "different types",
    element: [
      { name: "Input1", id: "1", elementType: FormElementType.InputField },
      { name: "Button2", id: "2", elementType: FormElementType.Button },
      { name: "Input3", id: "3", elementType: FormElementType.InputField },
    ],
    structure: ["{Input1}: ", "<{Button2}>", "{Input3}: "],
    xmlPath: "/childItems/different.xml",
  },
]

export const singleChildItemsEnterprise: ChildItemsEnterprise = {
  Input1: {},
}

export const differentTypesChildItemsEnterprise: ChildItemsEnterprise = {
  Input1: {},
  Button2: {},
  Input3: {},
}
