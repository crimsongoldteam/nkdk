import { Type } from "@sinclair/typebox"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import {
  MobileApplicationFunctionalities,
  MobileApplicationFunctionalitiesFromYAML,
  MobileApplicationFunctionalitiesToYAML,
  MobileApplicationFunctionalitiesYAML,
} from "~/metadata/systemEnumerations/types"

export interface UsedMobileApplicationFunctionality {
  functionality: MobileApplicationFunctionalities
  use: boolean
}

export type UsedMobileApplicationFunctionalities = UsedMobileApplicationFunctionality[]

export interface UsedMobileApplicationFunctionalityYAML {
  Функциональность: MobileApplicationFunctionalitiesYAML
  Использовать: StringboolYAML
}

interface UsedMobileApplicationFunctionalityXML {
  "app:functionality": MobileApplicationFunctionalities
  "app:use": boolean | "true" | "false"
}

interface UsedMobileApplicationFunctionalitiesXML {
  "app:functionality"?: UsedMobileApplicationFunctionalityXML | UsedMobileApplicationFunctionalityXML[]
}

const usedMobileApplicationFunctionalitiesKey = "usedMobileApplicationFunctionalities"

export const UsedMobileApplicationFunctionalitiesJSONSchema = Type.Array(
  Type.Object({
    Функциональность: Type.Union(
      Object.keys(MobileApplicationFunctionalitiesFromYAML).map((value) => Type.Literal(value)) as [
        ReturnType<typeof Type.Literal>,
        ReturnType<typeof Type.Literal>,
        ...ReturnType<typeof Type.Literal>[],
      ]
    ),
    Использовать: BooleanJSONSchema,
  })
)

export type UsedMobileApplicationFunctionalitiesYAML = UsedMobileApplicationFunctionalityYAML[]

export const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES: UsedMobileApplicationFunctionalities = [
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

const cloneCleanDefaultUsedMobileApplicationFunctionalities = (): UsedMobileApplicationFunctionalities =>
  CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.map((item) => ({ ...item }))

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const isCleanDefaultUsedMobileApplicationFunctionalities = (
  data: UsedMobileApplicationFunctionalities
): boolean =>
  data.length === CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.length &&
  data.every((item, index) => {
    const defaultItem = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES[index]
    return item.functionality === defaultItem.functionality && item.use === defaultItem.use
  })

const isReferenceXMLImport = (context: ConfigurationContext): boolean =>
  (context as { fromXML?: { forReference?: boolean } }).fromXML?.forReference === true

const hasExplicitUsedMobileApplicationFunctionalities = (metadataItem: unknown): boolean =>
  typeof metadataItem === "object" &&
  metadataItem !== null &&
  Object.prototype.hasOwnProperty.call(metadataItem, usedMobileApplicationFunctionalitiesKey)

const exportUsedMobileApplicationFunctionalitiesItemsToXML = (
  data: UsedMobileApplicationFunctionalities
): UsedMobileApplicationFunctionalitiesXML =>
  ({
    "app:functionality": data.map((item) => ({
      "app:functionality": item.functionality,
      "app:use": item.use,
    })),
  }) satisfies UsedMobileApplicationFunctionalitiesXML

export const importUsedMobileApplicationFunctionalitiesFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: UsedMobileApplicationFunctionalitiesXML | "" | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  const result = normalizeArray(xml["app:functionality"]).map((item) => ({
    functionality: item["app:functionality"],
    use: item["app:use"] === true || item["app:use"] === "true",
  }))

  return !isReferenceXMLImport(context) && isCleanDefaultUsedMobileApplicationFunctionalities(result)
    ? undefined
    : result
}

export function exportUsedMobileApplicationFunctionalitiesToXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalitiesXML | "" | undefined {
  if (data === undefined) {
    return exportUsedMobileApplicationFunctionalitiesItemsToXML(
      cloneCleanDefaultUsedMobileApplicationFunctionalities()
    )
  }
  if (data.length === 0) return ""

  return exportUsedMobileApplicationFunctionalitiesItemsToXML(data)
}

const exportUsedMobileApplicationFunctionalitiesToXMLFromMetadata = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UsedMobileApplicationFunctionalities | undefined
  metadataItem?: unknown
}): UsedMobileApplicationFunctionalitiesXML | "" | undefined => {
  if (params.value === undefined && !hasExplicitUsedMobileApplicationFunctionalities(params.metadataItem)) {
    return undefined
  }

  return exportUsedMobileApplicationFunctionalitiesToXML(params.context, params.rule, params.value)
}

export const importUsedMobileApplicationFunctionalitiesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: UsedMobileApplicationFunctionalityYAML[] | undefined
): UsedMobileApplicationFunctionalities | undefined => {
  if (yaml === undefined) return undefined

  const result = cloneCleanDefaultUsedMobileApplicationFunctionalities()
  const resultByFunctionality = new Map<MobileApplicationFunctionalities, UsedMobileApplicationFunctionality>(
    result.map((item): [MobileApplicationFunctionalities, UsedMobileApplicationFunctionality] => [
      item.functionality,
      item,
    ])
  )

  yaml.forEach((item) => {
    const functionality = MobileApplicationFunctionalitiesFromYAML[item.Функциональность]
    const use = importBooleanFromYAML(context, undefined, item.Использовать)
    const resultItem = resultByFunctionality.get(functionality)
    if (resultItem !== undefined && use !== undefined) {
      resultItem.use = use
    }
  })

  return result
}

export const exportUsedMobileApplicationFunctionalitiesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: UsedMobileApplicationFunctionalities | undefined
): UsedMobileApplicationFunctionalityYAML[] | undefined => {
  if (data === undefined) return undefined

  const dataByFunctionality = new Map<MobileApplicationFunctionalities, boolean>(
    data.map((item): [MobileApplicationFunctionalities, boolean] => [item.functionality, item.use])
  )
  const result = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES.flatMap((defaultItem) => {
    const use = dataByFunctionality.get(defaultItem.functionality)
    if (use === undefined || defaultItem.use === use) {
      return []
    }

    const exportedUse = exportBooleanToYAML(context, undefined, use)
    if (exportedUse === undefined) return []

    return [
      {
        Функциональность: MobileApplicationFunctionalitiesToYAML[defaultItem.functionality],
        Использовать: exportedUse,
      },
    ]
  })

  return result.length === 0 ? undefined : result
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
  exportUsedMobileApplicationFunctionalitiesToXMLFromMetadata
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
