import { createHash } from 'node:crypto';
export function i8nContracts(observations, entry, profile=0) {
 if(![0,2].includes(profile)) throw new Error(`Unsupported candidate profile ${profile}`);
 const cases=[];
 for (const row of observations.rows.filter(row=>row.profile===profile && (profile===2 || row.case!=='missing'))) {
  if(createHash('sha256').update(row.sourceXML).digest('hex')!==row.sourceSha256)throw new Error(`Changed XML observation ${row.case}`);
  if(!row.sourceXML.startsWith('<Root>') || !row.sourceXML.endsWith('</Root>') || Object.entries(row.parameters).some(([key,value])=>Boolean(value)!==(profile===2 && key==='excludeIfEqualNameYAML'))) throw new Error(`Unsupported observation shape ${row.case}`);
  let expected=row.yaml;
  // Explicit approved corrections to the recorded TS result, never Rust-generated expectations.
  // A present empty element is empty text; null removes the element.
  if(row.case==='empty-container' && profile===0) expected='Title: !xml/raw\n  $xml: ""';
  if(row.case==='empty-first-duplicate' && profile===0) expected='Заголовок:\n  !xml/invalid ru: ""\n  !xml/invalid/2 ru: Второй';
  if(row.case==='noncanonical-order') expected='Заголовок: !xml/invalid\n  en: Text\n  ru: Текст';
  if(profile===2 && row.case==='empty-first-duplicate') expected='Заголовок:\n  ru: ""\n  !xml/invalid ru: Второй';
  if(profile===2 && row.case==='equal-name-with-foreign') expected='Заголовок:\n  en: Text';
  if(profile===2 && row.case==='equal-name') expected='';
  if(profile===2 && row.case==='missing') expected='Title: !xml/raw\n  $xml: null';
  if(typeof expected!=='string') throw new Error(`Unreviewed failed TS observation ${row.case}`);
  const namespaces=' xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
  const xml=profile===2 ? row.sourceXML.replaceAll('Root','Properties').replaceAll('Title','Synonym').replace('<Properties','<Properties'+namespaces) : row.sourceXML.slice(6,-7).replace('<Title','<Title'+namespaces);
  if(profile===2) expected=expected.replaceAll('Заголовок','Синоним').replaceAll('Title','Synonym');
  cases.push({id:`i8n-contract-${profile}-${row.case}`,entry,source:[{path:'tests/migration/i8n-full-round-trip-observations.json',profile,case:row.case}],xml,yaml:expected,inputs:{defaultLanguage:'ru',registeredLanguages:['ru','en'],...(typeof row.name==='string'?{ownerName:row.name}:{})},adaptation:profile===2 ? 'Root → Properties, Title → Synonym, YAML key → Синоним; empty mapping separates absent meaning from inferred name; raw null removes the declared default empty XML element' : 'Remove test Root wrapper; bind namespace context; preserve approved order and repeated-empty corrections'});
 }
 return cases;
}
