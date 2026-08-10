import { Type } from "typebox"
import {
  MobileApplicationFunctionalitiesFromYAML,
  MobileApplicationFunctionalitiesToYAML,
  RequiredMobileApplicationPermissionMessagesFromYAML,
  RequiredMobileApplicationPermissionMessagesToYAML,
  type MobileApplicationFunctionalities,
  type MobileApplicationFunctionalitiesYAML,
  type RequiredMobileApplicationPermissionMessages,
  type RequiredMobileApplicationPermissionMessagesYAML,
} from "../../systemEnumerations/mobileApplicationPermissions"
import { literalUnionJSONSchema } from "./literalUnionJSONSchema"
import {
  MobileApplicationPermissionBooleanJSONSchema,
  type MobileApplicationPermissionBooleanXML,
  type MobileApplicationPermissionBooleanYAML,
  exportMobileApplicationPermissionBooleanToYAML,
  importMobileApplicationPermissionBooleanFromXML,
  importMobileApplicationPermissionBooleanFromYAML,
} from "./mobileApplicationPermissionBoolean"
import {
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
} from "./mobileApplicationPermissionsDefaults"
import {
  exportMobileApplicationPermissionDescriptionToXML,
  exportMobileApplicationPermissionDescriptionToYAML,
  importMobileApplicationPermissionDescriptionFromXML,
  importMobileApplicationPermissionDescriptionFromYAML,
  MobileApplicationPermissionDescriptionJSONSchema,
  type MobileApplicationPermissionContext,
  type MobileApplicationPermissionDescription,
  type MobileApplicationPermissionDescriptionXML,
  type MobileApplicationPermissionDescriptionYAML,
} from "./mobileApplicationPermissionDescription"

export interface UsedMobileApplicationFunctionality {
  functionality: MobileApplicationFunctionalities
  use: boolean
}

export interface RequiredMobileApplicationPermissionMessage {
  permission: RequiredMobileApplicationPermissionMessages
  description: MobileApplicationPermissionDescription
}

export interface UsedMobileApplicationFunctionalities {
  functionalities: UsedMobileApplicationFunctionality[]
  permissionMessages: RequiredMobileApplicationPermissionMessage[]
}

export interface UsedMobileApplicationFunctionalityYAML {
  Функциональность: MobileApplicationFunctionalitiesYAML
  Использовать: MobileApplicationPermissionBooleanYAML
}

export interface RequiredMobileApplicationPermissionMessageYAML {
  Разрешение: RequiredMobileApplicationPermissionMessagesYAML
  Описание: MobileApplicationPermissionDescriptionYAML
}

export interface UsedMobileApplicationFunctionalitiesYAML {
  Функциональности?: UsedMobileApplicationFunctionalityYAML[]
  СообщенияРазрешений?: RequiredMobileApplicationPermissionMessageYAML[]
}

interface UsedMobileApplicationFunctionalityXML {
  "app:functionality": MobileApplicationFunctionalities
  "app:use": MobileApplicationPermissionBooleanXML | { "#text"?: MobileApplicationPermissionBooleanXML }
}

interface RequiredMobileApplicationPermissionMessageXML {
  "app:permission": RequiredMobileApplicationPermissionMessages
  "app:description": MobileApplicationPermissionDescriptionXML | ""
}

interface UsedMobileApplicationFunctionalitiesXML {
  "app:functionality"?: UsedMobileApplicationFunctionalityXML | UsedMobileApplicationFunctionalityXML[]
  "app:permissionMessage"?:
    | RequiredMobileApplicationPermissionMessageXML
    | RequiredMobileApplicationPermissionMessageXML[]
}

export {
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
} from "./mobileApplicationPermissionsDefaults"

export const UsedMobileApplicationFunctionalitiesJSONSchema = Type.Object({
  Функциональности: Type.Optional(
    Type.Array(
      Type.Object({
        Функциональность: literalUnionJSONSchema(Object.keys(MobileApplicationFunctionalitiesFromYAML)),
        Использовать: MobileApplicationPermissionBooleanJSONSchema,
      })
    )
  ),
  СообщенияРазрешений: Type.Optional(
    Type.Array(
      Type.Object({
        Разрешение: literalUnionJSONSchema(Object.keys(RequiredMobileApplicationPermissionMessagesFromYAML)),
        Описание: MobileApplicationPermissionDescriptionJSONSchema,
      })
    )
  ),
})

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const cloneCleanDefaultUsedMobileApplicationFunctionalities = (): UsedMobileApplicationFunctionality[] =>
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({ ...item }))

const isCleanDefaultUsedMobileApplicationFunctionalities = (
  data: UsedMobileApplicationFunctionality[]
): boolean =>
  data.length === CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.length &&
  data.every((item, index) => {
    const defaultItem = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES[index]
    return item.functionality === defaultItem.functionality && item.use === defaultItem.use
  })

const isImplicitUsedMobileApplicationFunctionalities = (data: UsedMobileApplicationFunctionalities): boolean =>
  data.permissionMessages.length === 0 && isCleanDefaultUsedMobileApplicationFunctionalities(data.functionalities)

const importFunctionalitiesFromXML = (
  _context: MobileApplicationPermissionContext,
  xml: UsedMobileApplicationFunctionalitiesXML
): UsedMobileApplicationFunctionality[] =>
  normalizeArray(xml["app:functionality"]).map((item) => ({
    functionality: item["app:functionality"],
    use: importMobileApplicationPermissionBooleanFromXML(item["app:use"]) ?? false,
  }))

const importPermissionMessagesFromXML = (
  context: MobileApplicationPermissionContext,
  xml: UsedMobileApplicationFunctionalitiesXML
): RequiredMobileApplicationPermissionMessage[] =>
  normalizeArray(xml["app:permissionMessage"]).map((item) => ({
    permission: item["app:permission"],
    description: importMobileApplicationPermissionDescriptionFromXML(context, item["app:description"]),
  }))

export const importUsedMobileApplicationFunctionalitiesFromXML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  xml: UsedMobileApplicationFunctionalitiesXML | "" | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return { functionalities: [], permissionMessages: [] }

  const result: UsedMobileApplicationFunctionalities = {
    functionalities: importFunctionalitiesFromXML(context, xml),
    permissionMessages: importPermissionMessagesFromXML(context, xml),
  }

  return isImplicitUsedMobileApplicationFunctionalities(result)
    ? IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    : result
}

export const exportUsedMobileApplicationFunctionalitiesToXML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalitiesXML | "" => {
  const value = data ?? IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
  if (value.functionalities.length === 0 && value.permissionMessages.length === 0) return ""

  const result: UsedMobileApplicationFunctionalitiesXML = {}
  if (value.functionalities.length > 0) {
    result["app:functionality"] = value.functionalities.map((item) => ({
      "app:functionality": item.functionality,
      "app:use": item.use,
    }))
  }
  if (value.permissionMessages.length > 0) {
    result["app:permissionMessage"] = value.permissionMessages.map((item) => ({
      "app:permission": item.permission,
      "app:description": exportMobileApplicationPermissionDescriptionToXML(context, item.description),
    }))
  }
  return result
}

const importFunctionalitiesFromYAML = (
  _context: MobileApplicationPermissionContext,
  yaml: UsedMobileApplicationFunctionalityYAML[]
): UsedMobileApplicationFunctionality[] => {
  const result = cloneCleanDefaultUsedMobileApplicationFunctionalities()
  const byFunctionality = new Map<MobileApplicationFunctionalities, UsedMobileApplicationFunctionality>(
    result.map((item) => [item.functionality, item])
  )

  for (const item of yaml) {
    const functionality = MobileApplicationFunctionalitiesFromYAML[item.Функциональность]
    const use = importMobileApplicationPermissionBooleanFromYAML(item.Использовать)
    const resultItem = byFunctionality.get(functionality)
    if (resultItem !== undefined && use !== undefined) resultItem.use = use
  }
  return result
}

const importPermissionMessagesFromYAML = (
  context: MobileApplicationPermissionContext,
  yaml: RequiredMobileApplicationPermissionMessageYAML[]
): RequiredMobileApplicationPermissionMessage[] =>
  yaml.map((item) => ({
    permission: RequiredMobileApplicationPermissionMessagesFromYAML[item.Разрешение],
    description: importMobileApplicationPermissionDescriptionFromYAML(context, item.Описание),
  }))

export const importUsedMobileApplicationFunctionalitiesFromYAML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  yaml: UsedMobileApplicationFunctionalitiesYAML | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (yaml === undefined) return IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES

  const result: UsedMobileApplicationFunctionalities = {
    functionalities: importFunctionalitiesFromYAML(context, yaml.Функциональности ?? []),
    permissionMessages: importPermissionMessagesFromYAML(context, yaml.СообщенияРазрешений ?? []),
  }
  return isImplicitUsedMobileApplicationFunctionalities(result)
    ? IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES
    : result
}

const exportFunctionalitiesToYAML = (
  _context: MobileApplicationPermissionContext,
  data: UsedMobileApplicationFunctionality[]
): UsedMobileApplicationFunctionalityYAML[] | undefined => {
  const dataByFunctionality = new Map<MobileApplicationFunctionalities, boolean>(
    data.map((item) => [item.functionality, item.use])
  )
  const result = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.flatMap((defaultItem) => {
    const use = dataByFunctionality.get(defaultItem.functionality)
    if (use === undefined || defaultItem.use === use) return []

    return [
      {
        Функциональность: MobileApplicationFunctionalitiesToYAML[defaultItem.functionality],
        Использовать: exportMobileApplicationPermissionBooleanToYAML(use) ?? "Ложь",
      },
    ]
  })
  return result.length === 0 ? undefined : result
}

const exportPermissionMessagesToYAML = (
  context: MobileApplicationPermissionContext,
  data: RequiredMobileApplicationPermissionMessage[]
): RequiredMobileApplicationPermissionMessageYAML[] | undefined =>
  data.length === 0
    ? undefined
    : data.map((item) => ({
        Разрешение: RequiredMobileApplicationPermissionMessagesToYAML[item.permission],
        Описание: exportMobileApplicationPermissionDescriptionToYAML(context, item.description),
      }))

export const exportUsedMobileApplicationFunctionalitiesToYAML = (
  context: MobileApplicationPermissionContext,
  _rule: unknown,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalitiesYAML | undefined => {
  if (data === undefined) return undefined

  const Функциональности = exportFunctionalitiesToYAML(context, data.functionalities)
  const СообщенияРазрешений = exportPermissionMessagesToYAML(context, data.permissionMessages)
  if (Функциональности === undefined && СообщенияРазрешений === undefined) return undefined

  return {
    ...(Функциональности === undefined ? {} : { Функциональности }),
    ...(СообщенияРазрешений === undefined ? {} : { СообщенияРазрешений }),
  }
}

export const exportUsedMobileApplicationFunctionalitiesToJSONSchema = (_params?: unknown) =>
  UsedMobileApplicationFunctionalitiesJSONSchema
