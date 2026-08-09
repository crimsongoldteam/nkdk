export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface XmlSyncStateDiff {
  added: string[]
  changed: string[]
  deleted: string[]
}
