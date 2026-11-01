import {readFileSync,readdirSync} from 'node:fs';

export function dcsProductionFactSources() {
  return [...styleItemFactSources({entry:'metadata.style-item-type-facts',ownerNames:true}),
    {entry:'metadata.system-enumeration-index-source',yaml:readFileSync('rust/data/system-enumeration-lexemes.generated.yaml','utf8')}];
}

export function styleItemFactSources({entry='probe.style-item-type-facts',ownerNames=false}={}) {
  const root='e2e/fixtures/xml/cf/StyleItems';
  return readdirSync(root).filter(name=>name.endsWith('.xml')).map(name=>({
    entry,xml:readFileSync(`${root}/${name}`,'utf8'),
    ...(ownerNames?{inputs:{ownerName:name.slice(0,-4)}}:{}),
  }));
}

export function enumerationFactSources(catalog,name) {
  return Object.entries(catalog.get(`system.${name}`).enum).map(([code,label])=>({
    entry:'migration.dcs-enumeration-lexeme',xml:'<Root/>',inputs:{name,code,label},
  }));
}
