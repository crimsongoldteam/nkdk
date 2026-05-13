import { I8nTextXML, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { MetadataNameYAML } from "~/metadata/commonObjects/metadataName/types"
import { MetadataItemLinksXML, MetadataItemLinksYAML } from "~/metadata/commonObjects/metadataRef/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import * as SE from "~/metadata/systemEnumerations/types"
import { MetadataDocumentJournalColumnRules } from "./rules"

export type MetadataDocumentJournalColumn = MetadataTypeByRule<typeof MetadataDocumentJournalColumnRules>

export interface MetadataDocumentJournalColumnXML {
  _uuid?: string
  Properties: {
    Comment?: string
    Indexing?: SE.Indexing
    Name: string
    ObjectBelonging?: SE.ObjectBelonging
    References?: MetadataItemLinksXML
    Synonym?: I8nTextXML
    Type?: TypeDescriptionXML
  }
}

export interface MetadataDocumentJournalColumnFullYAML {
  Тип?: TypeDescriptionYAML
  Синоним?: I8nTextYAML
  Комментарий?: string
  Ссылки?: MetadataItemLinksYAML
  Индексирование?: SE.IndexingYAML
}

export type MetadataDocumentJournalColumnYAML = MetadataDocumentJournalColumnFullYAML

export type MetadataDocumentJournalColumns = MetadataDocumentJournalColumn[]
export type MetadataDocumentJournalColumnsXML = MetadataDocumentJournalColumnXML | MetadataDocumentJournalColumnXML[]
export type MetadataDocumentJournalColumnsYAML = Record<MetadataNameYAML, MetadataDocumentJournalColumnYAML>
