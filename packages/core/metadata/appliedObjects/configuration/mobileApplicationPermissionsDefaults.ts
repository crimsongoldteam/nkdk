export const EMPTY_REQUIRED_MOBILE_APPLICATION_PERMISSIONS = []

const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITY_VALUES = [
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
] as const

export const CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES = CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITY_VALUES.map(
  (item) => ({ ...item })
)

export const IMPLICIT_USED_MOBILE_APPLICATION_FUNCTIONALITIES = {
  functionalities: CLEAN_USED_MOBILE_APPLICATION_FUNCTIONALITIES,
  permissionMessages: [],
}
