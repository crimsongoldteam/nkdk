import {readFileSync} from 'node:fs';
import {candidateCatalog} from './candidate-catalog.mjs';
import {mapProperty} from './mappings.mjs';

const extraction=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8'));
const {catalog}=candidateCatalog();
const namespaces={xr:'http://v8.1c.ru/8.3/xcf/readable'};
const rows=[];
for(const entry of extraction.entries)for(const property of entry.properties??[]) {
  if(!['MetadataItemLink','MetadataItemLinks'].includes(property.type) || property.parameters?.metadataTarget?.kind!=='member')continue;
  const result=mapProperty(property,catalog,namespaces);
  rows.push({owner:entry.symbol,property:property.name,status:result.status,reason:result.reason});
}
const candidates=rows.filter(row=>row.status==='candidate').length;
console.log(`Ссылки на члены metadataRef: ${candidates}/${rows.length} свойств-кандидатов`);
for(const row of rows.filter(row=>row.status!=='candidate'))console.log(`  ${row.owner}.${row.property}: ${row.reason}`);
const inputByString=extraction.entries.flatMap(entry=>entry.properties??[]).filter(property=>
  property.type==='InputByStringFields' && property.parameters?.metadataTarget?.kind==='member');
console.log(`Отдельный тип InputByStringFields: ${inputByString.length} свойств`);
