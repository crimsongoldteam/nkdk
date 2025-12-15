export type MetadataCommandGroup = string

export interface MetadataCommandGroupXML {
  "xsi:type": "xr:MDObjectRef"
  "#text": string
}

export type MetadataCommandGroupEnterprise = string

export type MetadataCommandGroups = MetadataCommandGroup[]
export type MetadataCommandGroupsXML = MetadataCommandGroupXML[]
export type MetadataCommandGroupsEnterprise = MetadataCommandGroupEnterprise[]
