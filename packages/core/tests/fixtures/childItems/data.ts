import { ChildItems, ChildItemsEnterprise } from "~/metadata/forms/collections/childItems/types"
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
    element: [{ name: "Input1", elementType: FormElementType.InputField }],
    structure: ["{Input1}: "],
    xmlPath: "/childItems/single.xml",
  },

  // Different types
  {
    name: "different types",
    element: [
      { name: "Input1", elementType: FormElementType.InputField },
      { name: "Label2", elementType: FormElementType.LabelField },
      { name: "Input3", elementType: FormElementType.InputField },
    ],
    structure: ["{Input1}: ", "{Label1}", "{Input3}: "],
    xmlPath: "/childItems/different.xml",
  },
]

export const singleChildItemsEnterprise: ChildItemsEnterprise = {
  Input1: {},
}

export const differentTypesChildItemsEnterprise: ChildItemsEnterprise = {
  Input1: {},
  Label2: {},
  Input3: {},
}
