import {internalInfoAttachment} from './internal-info-attachment.mjs';
import {internalTypeDeclaration} from './owner-creation-declarations.mjs';
import {sourceOwnerXmlRoute} from './owner-root-source.mjs';

// Independent type rows precede the owner that consumes their prepared indexes.
// Creation reuses the accepted identity declaration; conversion remains AOT.
export function sourceInternalTypeFacts(source,id,catalog,{yamlKind}={}) {
 const property=source.properties.find(row=>row.parameters?.type==='InternalInfo');
 if(!property?.parameters.items?.length)return [];
 const attached=internalInfoAttachment(source);
 const template=catalog.get('migration.document-internal-types');
 if(attached.status!=='candidate' || !template || !yamlKind)
  throw new Error('Registered internal type fact source required');
 // This reader projects type rows only. Other InternalInfo services retain
 // their own fact contracts and must not become dependencies of this reader.
 const fragment=structuredClone(attached.module);
 fragment.value.fields=fragment.value.fields.filter(row=>row.name==='types');
 for(const side of ['xml','yaml'])fragment.representations[side].fields=
  fragment.representations[side].fields.filter(row=>row.field==='types');
 const kind=sourceOwnerXmlRoute(source).at(-1).split(':').at(-1);
 const module=internalTypeDeclaration({template,fragment,id:id+'.internal-type-facts',
  identityKind:kind,yamlKind,items:property.parameters.items,identityContext:[{input:'owner'}]});
 for(const name of ['component','parent','identities'])delete module.inputs[name];
 module.inputs.owner={type:{kind:'scalar',scalar:'text'}};
 for(const contribution of module.contributions)contribution.key.record.owner={input:'owner'};
 return [module];
}
