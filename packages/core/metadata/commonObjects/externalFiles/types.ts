export type ExternalFilePathParams = { name: string; parentName?: string; itemName?: string }

export type ExternalFilePath = string | ((params: ExternalFilePathParams) => string)

export type ExternalFileRule =
  | {
      kind: "file"
      xmlPath: ExternalFilePath
      nkdkPath: ExternalFilePath
    }
  | {
      kind: "directory"
      xmlDir: ExternalFilePath
      nkdkDir: ExternalFilePath
      include: readonly (string | RegExp)[]
    }
