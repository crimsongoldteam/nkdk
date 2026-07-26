export type InfobaseConnection =
  | { type: "file"; path: string }
  | { type: "server"; server: string; reference: string }
  | { type: "web"; url: string }
  | { type: "unknown"; raw: string }

export type InfobaseWarningCode =
  | "source-not-found"
  | "source-unreadable"
  | "invalid-config"
  | "invalid-section"
  | "implicit-folder"

export type InfobaseWarning = { code: InfobaseWarningCode; source: string; message: string }

type ParsedRecordBase = {
  name: string
  folder: string
  orderInTree?: number
  fields: Readonly<Record<string, string>>
  source: string
  sourceOrder: number
  recordOrder: number
}

export type ParsedInfobaseRecord = ParsedRecordBase & {
  kind: "infobase"
  id?: string
  connection: InfobaseConnection
  rawConnection: string
  version?: string
  defaultVersion?: string
  app?: string
}

export type ParsedFolderRecord = ParsedRecordBase & { kind: "folder" }
export type ParsedRecord = ParsedInfobaseRecord | ParsedFolderRecord
export type ParsedV8i = { records: ParsedRecord[]; warnings: InfobaseWarning[] }
