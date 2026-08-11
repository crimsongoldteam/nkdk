import { externalFileRule } from "../../commonObjects/externalFile/types"
import { moduleRule } from "../../commonObjects/module/types"

export const configurationRootExternalResources = {
  managedApplicationModule: moduleRule({
    nkdkPath: "МодульПриложения.bsl",
    xmlPath: "Ext/ManagedApplicationModule.bsl",
    syncExternalOnly: true,
  }),
  sessionModule: moduleRule({
    nkdkPath: "МодульСеанса.bsl",
    xmlPath: "Ext/SessionModule.bsl",
    syncExternalOnly: true,
  }),
  externalConnectionModule: moduleRule({
    nkdkPath: "МодульВнешнегоСоединения.bsl",
    xmlPath: "Ext/ExternalConnectionModule.bsl",
    syncExternalOnly: true,
  }),
  ordinaryApplicationModule: moduleRule({
    nkdkPath: "МодульОбычногоПриложения.bsl",
    xmlPath: "Ext/OrdinaryApplicationModule.bsl",
    syncExternalOnly: true,
  }),
  standaloneConfigurationContent: externalFileRule({
    nkdkPath: "СодержимоеАвтономнойКонфигурации.bin",
    xmlPath: "Ext/StandaloneConfigurationContent.bin",
    syncExternalOnly: true,
  }),
} as const
