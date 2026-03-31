import type { StructureItemGroup } from "../types"

export const fixtureDynamicListStructureItemGroup = {
  itemType: "StructureItemGroup",
  groupItems: [
    {
      itemType: "GroupItemField",
      field: "Наименование",
    },
  ] as unknown as StructureItemGroup["groupItems"],
  item: [
    {
      itemType: "StructureItemGroup",
      groupItems: [
        {
          use: false,
          itemType: "GroupItemAuto",
        },
      ] as unknown as StructureItemGroup["groupItems"],
      item: [
        {
          itemType: "StructureItemGroup",
          groupItems: [
            {
              itemType: "GroupItemField",
              field: "ПометкаУдаления",
              use: false,
            },
          ] as unknown as StructureItemGroup["groupItems"],
        },
      ],
    },
  ] as unknown as StructureItemGroup["item"],
} as const satisfies StructureItemGroup

export const fixtureDynamicListStructureItemGroupFromXML = {
  itemType: "StructureItemGroup",
  groupItems: [
    {
      itemType: "GroupItemField",
      field: "Наименование",
    },
  ],
  item: {
    itemType: "StructureItemGroup",
    groupItems: [
      {
        itemType: "GroupItemAuto",
      },
    ],
    item: {
      itemType: "StructureItemGroup",
      groupItems: [
        {
          itemType: "GroupItemField",
          field: "ПометкаУдаления",
          use: false,
        },
      ],
    },
  },
} as const

export const fixtureDynamicListStructureItemGroupYAML = ["Наименование", "([Авто])", "(ПометкаУдаления)"]
