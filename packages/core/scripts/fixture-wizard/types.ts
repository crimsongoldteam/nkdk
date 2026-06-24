export type MetadataTarget = {
  metadataItem: string
  itemDir: string
  fixturesDir: string
  syncXmlDir: string
  xmlDir?: string
}

export type XmlCandidate = {
  name: string
  fileName: string
  path: string
}

export type CandidateScan = {
  xmlDir: string
  sourceDir: string
  candidates: XmlCandidate[]
  fullCandidates: XmlCandidate[]
  minimalCandidates: XmlCandidate[]
}

export type FixtureSelection = {
  full: XmlCandidate
  minimal?: XmlCandidate
}

export type CopyOperation = {
  source: string
  target: string
  kind: "full" | "minimal" | "sync-root" | "related"
}

export type CopyPlan = {
  metadataItem: string
  sourceXmlDir: string
  fixturesDir: string
  syncXmlDir: string
  fullName: string
  operations: CopyOperation[]
  overwrites: CopyOperation[]
}

export type CopyReport = {
  created: string[]
  updated: string[]
  verified: string[]
}

export type Prompt = (question: string) => Promise<string>
