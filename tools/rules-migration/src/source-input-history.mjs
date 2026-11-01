import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {checkedCallback} from './static-callback.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';
import {mapProperty} from './mappings.mjs';
import {scalarStateView} from './record-state-view.mjs';

// Mount the previously accepted source fragment; never build a second history.
// Unknown registrations remain unsupported instead of broadening a profile.
export function sourceInputHistory(source,catalog) {
 const registered=source.properties.filter(row=>row.parameters?.type==='InputByStringFields');
 if(!registered.length)return undefined;
 const fail=reason=>({status:'blocked',reason});
 if(registered.length!==1)return fail('ambiguous-input-history');
 const snapshot=JSON.parse(readFileSync(new URL('../../../tests/migration/rules-extraction.json',import.meta.url),'utf8'));
 const original=snapshot.entries.find(row=>row.symbol===source.symbol&&row.path===source.path);
 const property=registered[0],known=original?.properties.find(row=>row.name===property.name);
 if(!isDeepStrictEqual(property,known))return fail('unreviewed-input-history-registration');
 checkedCallback(property.parameters.toXML);
 checkedCallback(property.parameters.implicitValueYAML);
 const route=sourceOwnerXmlRoute(source);
 const fragment=catalog.get('fragment.input-by-string.'+route.at(-1).split(':').at(-1).toLowerCase());
 if(fragment?.kind!=='fragment')return fail('missing-input-history-declaration');
 const properties=[],fieldViews={},renames={};
 for(const mapping of fragment.representations.xml.fields) {
  if(mapping.field==='history')continue;
  const matches=source.properties.filter(row=>JSON.stringify(mapping.path)===JSON.stringify([
   ...route,...(row.parameters?.xmlParents??[]).map(name=>'md:'+name),
   'md:'+(row.parameters?.xml??row.name[0].toUpperCase()+row.name.slice(1)),
  ]));
  if(matches.length!==1)return fail('input-history-field-registration');
  const row=matches[0];
  if(!isDeepStrictEqual(row,original.properties.find(known=>known.name===row.name)))return fail('unreviewed-input-history-field');
  properties.push(row.name);renames[mapping.field]=row.name;
  if(row.name===property.name)continue;
  const mapped=mapProperty(row,catalog),field=fragment.value.fields.find(field=>field.name===mapping.field);
  if(mapped.status!=='candidate' || !['number','SystemEnumeration'].includes(row.parameters.type))return fail('input-history-scalar-view');
  fieldViews[row.name]=scalarStateView(mapped.id,field.type,{field:row.name,module:fragment,catalog,
   payload:row.parameters.type==='number'?'capacity':'value'});
 }
 return {status:'candidate',module:structuredClone(fragment),properties,fieldViews,renames,
  indexProviders:{members:'metadata.input-by-string-members',states:'metadata.property-state-membership',
   baseNumbers:'metadata.base-owner-numbers',baseIds:'metadata.base-identities'}};
}
