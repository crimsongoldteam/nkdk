import { ChildItems } from "~/metadata/forms/elements/childItems/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export interface ChildItemsExportFixture {
  name: string
  element?: ChildItems
  structure?: string[]
  xmlPath?: string
}

export const childItemsExportFixturesTable: ChildItemsExportFixture[] = [
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
