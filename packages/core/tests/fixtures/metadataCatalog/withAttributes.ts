import { MetadataCatalog } from "~/metadata/appliedObjects/metadataCatalog/types"

export const withAttributesCatalog: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  attributes: [
    {
      name: "РеквизитОбъекта",
      synonym: { items: { ru: "Реквизит объекта" } },
      type: {
        type: ["string"],
      },
    },
  ],
}

export const withCommands: MetadataCatalog = {
  name: "Контрагенты",
  synonym: { items: { ru: "Контрагенты" } },
  commands: [
    {
      group: "ActionsPanelCreate",
      name: "Команда1",
      synonym: {
        items: {
          ru: "Команда 1",
        },
      },
    },
    {
      name: "Команда2",
      synonym: {
        items: {
          ru: "Команда 2",
        },
      },
    } as any,
  ],
}
