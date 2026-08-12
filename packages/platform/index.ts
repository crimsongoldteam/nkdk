export { findPlatform, type PlatformInstallation } from "./src/platform/findPlatform"
export {
  PlatformSessionError,
  type PlatformCommandOutcome,
  type PlatformFailureDetails,
  type PlatformFailureStage,
  type PlatformSessionErrorCode,
} from "./src/sessions/errors"
export {
  concisePlatformMessage,
  createPlatformOperationLog,
  platformFailure,
  redactPlatformText,
  type PlatformFailureParams,
  type PlatformOperationLog,
  type PlatformOperationLogDependencies,
  type PlatformOperationLogFileSystem,
} from "./src/sessions/operationLog"
export type {
  CloseAllConnectionsResult,
  CloseConnectionResult,
  CreatePlatformSessionParams,
  DatabaseConnectionSettings,
  DatabaseManagementSystem,
  ExportConfigurationParams,
  ExportConfigurationResult,
  InfobaseImportSettings,
  ListConfigurationExtensionsParams,
  ListConfigurationExtensionsResult,
  LoadPartialConfigurationParams,
  LoadPartialConfigurationResult,
  NormalizedPlatformConnectionSettings,
  PlatformSession,
  PlatformSessionManager,
  PlatformSessionMode,
  ProjectSettings,
  UnresolvedReferencesMode,
} from "./src/sessions/types"
export {
  parseProjectSettingsYaml,
  readProjectSettings,
  validateProjectSettings,
  type ProjectSettingsDependencies,
  type ProjectSettingsDiagnostic,
  type ProjectSettingsFileSystem,
  type ProjectSettingsReadResult,
  type ProjectSettingsValidationResult,
} from "./src/settings/projectSettings"
export {
  PROJECT_SETTINGS_SCHEMA_URI,
  projectSettingsExamples,
  projectSettingsJsonSchema,
} from "./src/settings/projectSettingsSchema"
export { createPlatformSessionManager, type PlatformSessionManagerDependencies } from "./src/sessions/manager"
export {
  listInfobases,
  type InfobaseConnection,
  type InfobaseFolderNode,
  type InfobaseNode,
  type InfobaseSource,
  type InfobaseTreeNode,
  type InfobaseTreeResult,
  type InfobaseWarning,
  type InfobaseWarningCode,
} from "./src/infobases/listInfobases"
export type {
  ConfigurationExtensionInfo,
  ConfigurationExtensionPurpose,
  ConfigurationExtensionScope,
} from "./src/extensions/types"
