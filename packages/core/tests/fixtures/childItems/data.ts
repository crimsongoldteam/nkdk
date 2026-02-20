import { AllChildItems, AllChildItemsPartialYAML } from "~/metadata/forms/collections/childItems/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"

export interface ChildItemsFixture {
  name: string
  element?: AllChildItems
  structure?: string[]
  xmlPath?: string
  typedYAML?: AllChildItemsPartialYAML
  partialYAML?: AllChildItemsPartialYAML
}

export const childItemsFixturesTable: ChildItemsFixture[] = [
  // Undefined
  { name: "undefined", element: undefined, structure: undefined },

  // Single
  {
    name: "single",
    element: [{ name: "Input1", itemType: CollectionFormElementType.InputField }],
    structure: ["{Input1}: "],
    xmlPath: "/childItems/single.xml",
    typedYAML: {
      Input1: {},
    },
    partialYAML: {
      Input1: {},
    },
  },

  // Different types
  {
    name: "different types",
    element: [
      { name: "Input1", itemType: CollectionFormElementType.InputField },
      { name: "Label2", itemType: CollectionFormElementType.LabelField },
      { name: "Input3", itemType: CollectionFormElementType.InputField },
    ],
    structure: ["{Input1}: ", "{Label1}", "{Input3}: "],
    xmlPath: "/childItems/different.xml",
  },
]

export const singleChildItemsYAML: AllChildItemsPartialYAML = {
  Input1: {},
}

export const differentTypesChildItemsYAML: AllChildItemsPartialYAML = {
  Input1: {},
  Label2: {},
  Input3: {},
}
