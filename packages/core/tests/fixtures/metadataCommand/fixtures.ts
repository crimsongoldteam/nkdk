import {
  MetadataCommand,
  MetadataCommandEnterprise,
  MetadataCommands,
  MetadataCommandsEnterprise,
} from "~/metadata/appliedObjects/metadataCommand/types"

export const commandWithParameterUseModeEnterprise: MetadataCommandEnterprise = {
  Синоним: "Какая-то команда",
  Группа: "ПанельНавигацииВажное",
  РежимИспользованияПараметра: "Одиночный",
}

export const commandWithParameterUseMode: MetadataCommand = {
  name: "ТестоваяКоманда",
  synonym: { items: { ru: "Какая-то команда" } },
  group: "NavigationPanelImportant",
}

export const commandWithUserGroupEnterprise: MetadataCommandEnterprise = {
  Синоним: "Какая-то команда",
  Группа: "ГруппаКоманд.Печать",
}

export const commandWithUserGroup: MetadataCommand = {
  name: "ТестоваяКоманда",
  synonym: { items: { ru: "Какая-то команда" } },
  group: "CommandGroup.Печать",
}

export const commandWithoutSynonymEnterprise: MetadataCommandEnterprise = {
  РежимИспользованияПараметра: "Множественный",
  Группа: "ПанельНавигацииВажное",
}

export const commandWithoutSynonym: MetadataCommand = {
  name: "ТестоваяКоманда",
  parameterUseMode: "Multiple",
  group: "NavigationPanelImportant",
}

export const twoCommandsEnterprise: MetadataCommandsEnterprise = {
  ТестоваяКоманда1: {
    Синоним: "Какая-то команда 1",
    Группа: "ПанельНавигацииВажное",
  },
  ТестоваяКоманда2: {
    Синоним: "Какая-то команда 2",
    Группа: "ПанельНавигацииВажное",
  },
}

export const twoCommands: MetadataCommands = [
  {
    name: "ТестоваяКоманда1",
    synonym: { items: { ru: "Какая-то команда 1" } },
    group: "NavigationPanelImportant",
  },
  {
    name: "ТестоваяКоманда2",
    synonym: { items: { ru: "Какая-то команда 2" } },
    group: "NavigationPanelImportant",
  },
]
