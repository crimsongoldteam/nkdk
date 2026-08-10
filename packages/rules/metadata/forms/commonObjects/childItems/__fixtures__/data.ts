import { ChildItem, FormChildItemsPartialYAML } from "../types"

export interface ChildItemsFixture {
  name: string
  element?: ChildItem[]
  structure?: string[]
  xmlPath?: string
  typedYAML?: FormChildItemsPartialYAML
  partialYAML?: FormChildItemsPartialYAML
}

export const childItemsFixturesTable: ChildItemsFixture[] = [
  // Undefined
  { name: "undefined", element: undefined, structure: undefined },

  // Single
  {
    name: "single",
    element: [{ name: "Input1", itemType: "InputField" }],
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
      { name: "Input1", itemType: "InputField" },
      { name: "Label2", itemType: "LabelField" },
      { name: "Input3", itemType: "InputField" },
    ],
    structure: ["{Input1}: ", "{Label1}", "{Input3}: "],
    xmlPath: "/childItems/different.xml",
  },
]

export const singleChildItemsYAML: FormChildItemsPartialYAML = {
  Input1: {},
}

export const differentTypesChildItemsYAML: FormChildItemsPartialYAML = {
  Input1: {},
  Label2: {},
  Input3: {},
}
