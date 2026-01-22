import {
  AllChildItems,
  AllChildItemsPartialEnterprise,
  AllChildItemsPartialEnterprise,
} from "~/metadata/forms/collections/childItems/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export interface ChildItemsFixture {
  name: string
  element?: AllChildItems
  structure?: string[]
  xmlPath?: string
  typedEnterprise?: AllChildItemsPartialEnterprise
  partialEnterprise?: AllChildItemsPartialEnterprise
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
    typedEnterprise: {
      Input1: {},
    },
    partialEnterprise: {
      Input1: {},
    },
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

export const singleChildItemsEnterprise: AllChildItemsPartialEnterprise = {
  Input1: {},
}

export const differentTypesChildItemsEnterprise: AllChildItemsPartialEnterprise = {
  Input1: {},
  Label2: {},
  Input3: {},
}
