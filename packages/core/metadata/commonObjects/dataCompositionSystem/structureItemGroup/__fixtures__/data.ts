import type { StructureItemGroup } from "../types"

export const fullStructureItemGroup = {
  itemType: "StructureItemGroup",
  groupItems: [
    {
      itemType: "GroupItemField",
      field: "Наименование",
      groupType: "Items",
      periodAdditionType: "None",
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
              groupType: "Items",
              periodAdditionType: "None",
            },
          ],
        },
      ],
    },
  ],
} as const satisfies StructureItemGroup

// export const fullStructureItemGroupYAML = ["Наименование", "([Авто])", "ПометкаУдаления"]
//  as const satisfies StructureItemGroupDynamicListYAML
