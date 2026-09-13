import {extract} from '../../src/extract.mjs';
import {collectionLinks} from '../../src/collection-links.mjs';
const path='packages/rules/metadata/sample/rules.ts';
const sources={
  'packages/rules/metadata/ruleRuntime/metadataCollection/ruleFactory.ts':'export const defineMetadataItemCollectionRule = p => p;',
  [path]:`export const ItemRules={properties:{name:{type:'string',xml:'Name',xmlParents:['Properties'],yaml:'Имя'},enabled:{type:'boolean',xml:'Enabled',xmlParents:['Properties'],yaml:'Включено'}}};
export const OwnerRules={properties:{items:{type:'Items',xml:'Item',xmlParents:['Root','Items'],yaml:'Элементы'}}};`,
  'packages/rules/metadata/sample/register.ts':`import {defineMetadataItemCollectionRule} from '../ruleRuntime/metadataCollection/ruleFactory';
import {ItemRules} from './rules';
export const rules=defineMetadataItemCollectionRule({propertyType:'Items',itemRule:ItemRules,xmlElement:'Item',yamlAsArray:true});`,
};
export function fixture() {
  const entries=extract(sources,['ItemRules','OwnerRules'].map(symbol=>({path,symbol}))).map(e=>({...e,comparison:{status:'keys-match'}}));
  return {entries,graph:collectionLinks(sources,entries)};
}
export const xml='<Root><Items><Item><Properties><Name>Первый</Name><Enabled>true</Enabled></Properties></Item><Item><Properties><Name>Второй</Name><Enabled>false</Enabled></Properties></Item></Items></Root>';
export const yaml='Элементы:\n  - Имя: Первый\n    Включено: Истина\n  - Имя: Второй\n    Включено: Ложь\n';
