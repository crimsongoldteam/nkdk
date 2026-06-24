import { MetadataCommands } from "~/metadata/appliedObjects/metadataCommand/types"

// Corresponds to __fixtures__/full.xml (non-default values only, after import stripping)
export const fullMetadataCommandsFromXML: MetadataCommands = [
  {
    itemType: "MetadataCommand",
    name: "ПолнаяКоманда",
    synonym: { items: { ru: "Синоним" } },
    comment: "Комментарий",
    group: "FormNavigationPanelImportant",
    commandParameterType: { type: ["CatalogRef.СправочникПолный"] },
    modifiesData: true,
    representation: "PictureAndText",
    toolTip: { items: { ru: "Подсказка" } },
    picture: { type: "StandardPicture", ref: "Print", loadTransparent: true },
    shortcut: "S",
    onMainServerUnavalableBehavior: "MakeDisable",
  },
  {
    itemType: "MetadataCommand",
    name: "ПоУмолчанию",
    synonym: { items: { ru: "По умолчанию" } },
    group: "NavigationPanelOrdinary",
  },
]

// Corresponds to __fixtures__/minimal.xml (non-default values only, after import stripping)
export const minimalMetadataCommandsFromXML: MetadataCommands = [
  {
    itemType: "MetadataCommand",
    name: "ПоУмолчанию",
    synonym: { items: { ru: "По умолчанию" } },
    group: "NavigationPanelOrdinary",
  },
]
