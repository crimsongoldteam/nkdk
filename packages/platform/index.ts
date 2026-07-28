export { findPlatform, type PlatformInstallation } from "./src/platform/findPlatform"
export { PlatformSessionError, type PlatformSessionErrorCode } from "./src/sessions/errors"
export type {
  CloseAllConnectionsResult,
  CloseConnectionResult,
  CreatePlatformSessionParams,
  DatabaseConnectionSettings,
  DatabaseManagementSystem,
  ExportConfigurationParams,
  ExportConfigurationResult,
  ListConfigurationExtensionsParams,
  ListConfigurationExtensionsResult,
  NormalizedPlatformConnectionSettings,
  PlatformConnectionSettings,
  PlatformSession,
  PlatformSessionManager,
  PlatformSessionMode,
  ProjectSettings,
} from "./src/sessions/types"
export {
  parseProjectSettings,
  readProjectSettings,
  writeProjectSettings,
  type ProjectSettingsDependencies,
  type ProjectSettingsFileSystem,
} from "./src/settings/projectSettings"
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
