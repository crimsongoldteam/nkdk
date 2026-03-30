import type { StructureItemGroup } from "../types"

export const fixtureDynamicListStructureItemGroup = {
  itemType: "StructureItemGroup",
  groupItems: [
    {
      itemType: "GroupItemField",
      field: "Наименование",
    },
  ],
  item: [
    {
      itemType: "StructureItemGroup",
      groupItems: [
        {
          use: false,
          itemType: "GroupItemAuto",
        },
      ],
      item: [
        {
          itemType: "StructureItemGroup",
          groupItems: [
            {
              itemType: "GroupItemField",
              field: "ПометкаУдаления",
              use: false,
            },
          ],
        },
      ],
    },
  ],
} as const satisfies StructureItemGroup

export const fixtureDynamicListStructureItemGroupYAML = ["Наименование", "([Авто])", "(ПометкаУдаления)"]
