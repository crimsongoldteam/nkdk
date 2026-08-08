import { Type } from "typebox"
import { importBooleanFromXML } from "../../commonObjects/boolean/fromXML"
import { importBooleanFromYAML } from "../../commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "../../commonObjects/boolean/toYAML"
import { BooleanJSONSchema, type StringboolXML, type StringboolYAML } from "../../commonObjects/boolean/types"
import { I8nTextJSONSchema, type I8nText, type I8nTextXML, type I8nTextYAML } from "../../commonObjects/i8nText/types"
import type { ConfigurationContext } from "../../context/types"
import { type ExportToJSONSchemaFn, registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import {
  MobileApplicationFunctionalitiesFromYAML,
  MobileApplicationFunctionalitiesToYAML,
  RequiredMobileApplicationPermissionMessagesFromYAML,
  RequiredMobileApplicationPermissionMessagesToYAML,
  type MobileApplicationFunctionalities,
  type MobileApplicationFunctionalitiesYAML,
  type RequiredMobileApplicationPermissionMessages,
  type RequiredMobileApplicationPermissionMessagesYAML,
} from "../../systemEnumerations/types"
import { literalUnionJSONSchema } from "./literalUnionJSONSchema"
import {
  exportMobileApplicationPermissionDescriptionToXML,
  exportMobileApplicationPermissionDescriptionToYAML,
  importMobileApplicationPermissionDescriptionFromXML,
  importMobileApplicationPermissionDescriptionFromYAML,
} from "./mobileApplicationPermissionDescription"

export interface UsedMobileApplicationFunctionality {
  functionality: MobileApplicationFunctionalities
  use: boolean
}

export interface RequiredMobileApplicationPermissionMessage {
  permission: RequiredMobileApplicationPermissionMessages
  description: I8nText
}

export interface UsedMobileApplicationFunctionalities {
  functionalities: UsedMobileApplicationFunctionality[]
  permissionMessages: RequiredMobileApplicationPermissionMessage[]
}

export interface UsedMobileApplicationFunctionalityYAML {
  Функциональность: MobileApplicationFunctionalitiesYAML
  Использовать: StringboolYAML
}

export interface RequiredMobileApplicationPermissionMessageYAML {
  Разрешение: RequiredMobileApplicationPermissionMessagesYAML
  Описание: I8nTextYAML
}

export interface UsedMobileApplicationFunctionalitiesYAML {
  Функциональности?: UsedMobileApplicationFunctionalityYAML[]
  СообщенияРазрешений?: RequiredMobileApplicationPermissionMessageYAML[]
}

interface UsedMobileApplicationFunctionalityXML {
  "app:functionality": MobileApplicationFunctionalities
  "app:use": StringboolXML | { "#text"?: StringboolXML }
}

interface RequiredMobileApplicationPermissionMessageXML {
  "app:permission": RequiredMobileApplicationPermissionMessages
  "app:description": I8nTextXML | ""
}

interface UsedMobileApplicationFunctionalitiesXML {
  "app:functionality"?: UsedMobileApplicationFunctionalityXML | UsedMobileApplicationFunctionalityXML[]
  "app:permissionMessage"?:
    | RequiredMobileApplicationPermissionMessageXML
    | RequiredMobileApplicationPermissionMessageXML[]
}

export const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES: UsedMobileApplicationFunctionality[] = [
  { functionality: "Biometrics", use: true },
  { functionality: "Location", use: false },
  { functionality: "BackgroundLocation", use: false },
  { functionality: "BluetoothPrinters", use: false },
  { functionality: "WiFiPrinters", use: false },
  { functionality: "Contacts", use: false },
  { functionality: "Calendars", use: false },
  { functionality: "PushNotifications", use: false },
  { functionality: "LocalNotifications", use: false },
  { functionality: "InAppPurchases", use: false },
  { functionality: "PersonalComputerFileExchange", use: false },
  { functionality: "Ads", use: false },
  { functionality: "NumberDialing", use: false },
  { functionality: "CallProcessing", use: false },
  { functionality: "CallLog", use: false },
  { functionality: "AutoSendSMS", use: false },
  { functionality: "ReceiveSMS", use: false },
  { functionality: "SMSLog", use: false },
  { functionality: "Camera", use: false },
  { functionality: "Microphone", use: false },
  { functionality: "MusicLibrary", use: false },
  { functionality: "PictureAndVideoLibraries", use: false },
  { functionality: "AudioPlaybackAndVibration", use: false },
  { functionality: "BackgroundAudioPlaybackAndVibration", use: false },
  { functionality: "InstallPackages", use: false },
  { functionality: "OSBackup", use: true },
  { functionality: "ApplicationUsageStatistics", use: false },
  { functionality: "BarcodeScanning", use: false },
  { functionality: "BackgroundAudioRecording", use: false },
  { functionality: "AllFilesAccess", use: false },
  { functionality: "Videoconferences", use: false },
  { functionality: "NFC", use: false },
  { functionality: "DocumentScanning", use: false },
  { functionality: "SpeechToText", use: false },
  { functionality: "Geofences", use: false },
  { functionality: "IncomingShareRequests", use: false },
  { functionality: "AllIncomingShareRequestsTypesProcessing", use: false },
  { functionality: "TextToSpeech", use: false },
]

export const IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES: UsedMobileApplicationFunctionalities = {
  functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  permissionMessages: [],
}

export const UsedMobileApplicationFunctionalitiesJSONSchema = Type.Object({
  Функциональности: Type.Optional(
    Type.Array(
      Type.Object({
        Функциональность: literalUnionJSONSchema(Object.keys(MobileApplicationFunctionalitiesFromYAML)),
        Использовать: BooleanJSONSchema,
      })
    )
  ),
  СообщенияРазрешений: Type.Optional(
    Type.Array(
      Type.Object({
        Разрешение: literalUnionJSONSchema(Object.keys(RequiredMobileApplicationPermissionMessagesFromYAML)),
        Описание: I8nTextJSONSchema,
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
  context: ConfigurationContext,
  xml: UsedMobileApplicationFunctionalitiesXML
): UsedMobileApplicationFunctionality[] =>
  normalizeArray(xml["app:functionality"]).map((item) => ({
    functionality: item["app:functionality"],
    use: importBooleanFromXML(context, undefined, item["app:use"]) ?? false,
  }))

const importPermissionMessagesFromXML = (
  context: ConfigurationContext,
  xml: UsedMobileApplicationFunctionalitiesXML
): RequiredMobileApplicationPermissionMessage[] =>
  normalizeArray(xml["app:permissionMessage"]).map((item) => ({
    permission: item["app:permission"],
    description: importMobileApplicationPermissionDescriptionFromXML(context, item["app:description"]),
  }))

export const importUsedMobileApplicationFunctionalitiesFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
  context: ConfigurationContext,
  yaml: UsedMobileApplicationFunctionalityYAML[]
): UsedMobileApplicationFunctionality[] => {
  const result = cloneCleanDefaultUsedMobileApplicationFunctionalities()
  const byFunctionality = new Map<MobileApplicationFunctionalities, UsedMobileApplicationFunctionality>(
    result.map((item) => [item.functionality, item])
  )

  for (const item of yaml) {
    const functionality = MobileApplicationFunctionalitiesFromYAML[item.Функциональность]
    const use = importBooleanFromYAML(context, undefined, item.Использовать)
    const resultItem = byFunctionality.get(functionality)
    if (resultItem !== undefined && use !== undefined) resultItem.use = use
  }
  return result
}

const importPermissionMessagesFromYAML = (
  context: ConfigurationContext,
  yaml: RequiredMobileApplicationPermissionMessageYAML[]
): RequiredMobileApplicationPermissionMessage[] =>
  yaml.map((item) => ({
    permission: RequiredMobileApplicationPermissionMessagesFromYAML[item.Разрешение],
    description: importMobileApplicationPermissionDescriptionFromYAML(context, item.Описание),
  }))

export const importUsedMobileApplicationFunctionalitiesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
  context: ConfigurationContext,
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
        Использовать: exportBooleanToYAML(context, undefined, use) ?? "Ложь",
      },
    ]
  })
  return result.length === 0 ? undefined : result
}

const exportPermissionMessagesToYAML = (
  context: ConfigurationContext,
  data: RequiredMobileApplicationPermissionMessage[]
): RequiredMobileApplicationPermissionMessageYAML[] | undefined =>
  data.length === 0
    ? undefined
    : data.map((item) => ({
        Разрешение: RequiredMobileApplicationPermissionMessagesToYAML[item.permission],
        Описание: exportMobileApplicationPermissionDescriptionToYAML(context, item.description),
      }))

export const exportUsedMobileApplicationFunctionalitiesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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

export const exportUsedMobileApplicationFunctionalitiesToJSONSchema: ExportToJSONSchemaFn = () =>
  UsedMobileApplicationFunctionalitiesJSONSchema

registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromXML",
  importUsedMobileApplicationFunctionalitiesFromXML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToXML",
  exportUsedMobileApplicationFunctionalitiesToXML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "importFromYAML",
  importUsedMobileApplicationFunctionalitiesFromYAML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToYAML",
  exportUsedMobileApplicationFunctionalitiesToYAML
)
registerTypeRule(
  "UsedMobileApplicationFunctionalities",
  "exportToJSONSchema",
  exportUsedMobileApplicationFunctionalitiesToJSONSchema
)
