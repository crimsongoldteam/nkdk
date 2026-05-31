import { describe, expect, it } from "vitest"
import { exportMetadataItemToXML } from "~/metadata/orchestration"
import { mockContext, mockContextToXML } from "~/tests/mockContext"
import { MetadataConfigurationRules } from "./rules"
import type { MetadataConfiguration } from "./types"
import {
  exportUsedMobileApplicationFunctionalitiesToXML,
  exportUsedMobileApplicationFunctionalitiesToYAML,
  importUsedMobileApplicationFunctionalitiesFromXML,
  importUsedMobileApplicationFunctionalitiesFromYAML,
  UsedMobileApplicationFunctionalities,
  UsedMobileApplicationFunctionalitiesYAML,
} from "./usedMobileApplicationFunctionalities"

const cleanDefault = [
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
] satisfies UsedMobileApplicationFunctionalities

const cleanDefaultXML = () => ({
  "app:functionality": cleanDefault.map((item) => ({
    "app:functionality": item.functionality,
    "app:use": item.use,
  })),
})

const modelWithDifferences = (): UsedMobileApplicationFunctionalities =>
  cleanDefault.map((item) => {
    if (item.functionality === "Biometrics") return { ...item, use: false }
    if (item.functionality === "Camera") return { ...item, use: true }
    return { ...item }
  })

const yamlDifferences: UsedMobileApplicationFunctionalitiesYAML = [
  { Функциональность: "Биометрия", Использовать: "Ложь" },
  { Функциональность: "Камера", Использовать: "Истина" },
]

describe("UsedMobileApplicationFunctionalities", () => {
  it("imports clean XML default as undefined", () => {
    const result = importUsedMobileApplicationFunctionalitiesFromXML(
      mockContext,
      undefined,
      cleanDefaultXML()
    )

    expect(result).toBeUndefined()
  })

  it("exports undefined model value as full clean XML default", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToXML(mockContext, undefined, undefined)

    expect(result).toEqual(cleanDefaultXML())
  })

  it("exports explicit undefined model value through metadataItem as full clean XML default", () => {
    const configuration: MetadataConfiguration = {
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
      usedMobileApplicationFunctionalities: undefined,
    }

    const result = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: configuration,
      rule: MetadataConfigurationRules,
    })

    expect(result).toMatchObject({
      MetaDataObject: {
        Configuration: {
          Properties: {
            UsedMobileApplicationFunctionalities: cleanDefaultXML(),
          },
        },
      },
    })
  })

  it("exports YAML differences with Russian boolean values", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToYAML(
      mockContext,
      undefined,
      modelWithDifferences()
    )

    expect(result).toEqual(yamlDifferences)
  })

  it("imports YAML differences into full model merged with clean default", () => {
    const result = importUsedMobileApplicationFunctionalitiesFromYAML(
      mockContext,
      undefined,
      yamlDifferences
    )

    expect(result).toEqual(modelWithDifferences())
    expect(result?.find((item) => item.functionality === "OSBackup")).toEqual({
      functionality: "OSBackup",
      use: true,
    })
  })

  it("exports clean default YAML as undefined", () => {
    const result = exportUsedMobileApplicationFunctionalitiesToYAML(
      mockContext,
      undefined,
      cleanDefault
    )

    expect(result).toBeUndefined()
  })
})
