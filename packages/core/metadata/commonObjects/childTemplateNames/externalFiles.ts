import type { ExternalFileRule } from "~/metadata/commonObjects/externalFiles/types"

export const externalTemplateFiles: readonly ExternalFileRule[] = [
  { kind: "file", xmlPath: ({ name }) => `${name}/Ext/Template.bin`, nkdkPath: "Template.bin" },
  { kind: "directory", xmlDir: ({ name }) => `${name}/Ext/Template`, nkdkDir: "Template", include: [/\.html$/i] },
  { kind: "directory", xmlDir: ({ name }) => `${name}/Ext/Template/_files`, nkdkDir: "Template/_files", include: [/.*/] },
]
