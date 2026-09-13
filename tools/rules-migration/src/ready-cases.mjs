import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
export function readyCases() {
  const xmlText=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const manifest={sources:['tests/migration/additional-indexes-e2e.json'],factSources:[],cases:[]};
  const helpFiles=execFileSync('rg',['--files','e2e/fixtures/xml'],{encoding:'utf8'}).trim().split('\n').filter(path=>path.endsWith('/Ext/Help.xml')).sort();
  for(const help of helpFiles) {
    const directory=help.slice(0,-4);
    const pages=readdirSync(directory).filter(name=>name.endsWith('.html')).sort().map(name=>name.slice(0,-5));
    manifest.sources.push(help,...pages.map(page=>`${directory}/${page}.html`));
    manifest.cases.push({id:help,entry:'candidate.attachment.fragment.help',inputs:{pages},
      xml:'<Probe><Name>example</Name></Probe>',yaml:'Проверка: example',
      documents:[{path:['Ext','Help.xml'],xml:readFileSync(help,'utf8')}]});
  }
  for(const row of JSON.parse(readFileSync('tests/migration/additional-indexes-e2e.json','utf8'))) {
    manifest.sources.push(row.source);
    for(const identity of row.identities)manifest.factSources.push({entry:'candidate.attachment.identities',
      xml:'<Identity>'+Object.entries({owner:row.owner,...identity}).map(([key,value])=>`<${key}>${xmlText(value)}</${key}>`).join('')+'</Identity>'});
    manifest.cases.push({id:row.source,entry:'candidate.attachment.fragment.additional-indexes',inputs:{owner:row.owner},
      factBindings:{identities:'migration.attachment-identities'},xml:'<Probe><Name>example</Name></Probe>',
      yaml:'ДополнительныеИндексы:\n'+row.yaml.trimEnd().split('\n').map(line=>'  '+line+'\n').join('')+'Проверка: example\n',
      documents:[{path:['Ext','AdditionalIndexes.xml'],xml:readFileSync(row.source,'utf8')}]});
  }
  return manifest;
}
