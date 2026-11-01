pub fn run(script: &str) -> Vec<u8> {
    let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    let output = std::process::Command::new("node")
        .args(["--input-type=module", "-e", script])
        .current_dir(root)
        .output()
        .expect("migration source adapter starts");
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    output.stdout
}

pub fn load(complete: bool) -> Vec<nkdk_rule_compiler::Module> {
    let script = r#"
import {readFileSync} from 'node:fs';
import {candidateCatalog,dependencyFiles,yaml} from './tools/rules-migration/src/candidate-catalog.mjs';
import {assembleRecordStateOwner} from './tools/rules-migration/src/source-record-owner.mjs';
import {recordOwnerOperation} from './tools/rules-migration/src/record-owner-operation.mjs';
import {bindPreparedOwnerIndexes} from './tools/rules-migration/src/owner-index-requirements.mjs';
import {composeOwnerFragments} from './tools/rules-migration/src/owner-composition.mjs';
import {sourceOwnerFieldOrder,canonicalOwnerYamlOrder} from './tools/rules-migration/src/source-owner-assembly.mjs';
const {catalog}=candidateCatalog();
const source=JSON.parse(readFileSync('tests/migration/rules-extraction.json','utf8')).entries.find(row=>row.symbol==='MetadataCatalogAttributeRules');
const options={id:'test.complete-record-state',xmlNamespace:'http://v8.1c.ru/8.3/MDClasses'};
const assembly=COMPLETE_OWNER?recordOwnerOperation({entries:[source]},catalog,{...options,symbol:source.symbol}):
 assembleRecordStateOwner(source,catalog,options);
const state=assembly.state;
const local=new Map([...catalog,...state.declarations.map(row=>[row.id,row])]);
let roots;
if(COMPLETE_OWNER) {
 if(assembly.coverage.pending.length||assembly.coverage.assembled.length!==source.properties.length)throw new Error('Incomplete stateful owner properties');
 const nested=composeOwnerFragments('test.borrowed-record-context',[{alias:'state',fragment:state.module,bindings:Object.fromEntries(Object.keys(state.module.inputs).map(name=>[name,'state_'+name]))}]);
 const context=bindPreparedOwnerIndexes(nested,{bindings:Object.fromEntries(Object.entries(assembly.indexRequirements.bindings)
  .filter(([name])=>Object.hasOwn(nested.inputs,name))),missing:[]});
 context.xmlOrder=sourceOwnerFieldOrder(state.module,source,local);
 context.yamlOrder=canonicalOwnerYamlOrder(state.module,local);
 roots=[...assembly.modules,context];
} else {state.module.kind='object';state.module.id='test.source-record-state';roots=[state.module,...state.declarations];}
const modules=[...roots,...dependencyFiles(roots,local,{includeIndexes:COMPLETE_OWNER})];
process.stdout.write(yaml.dump({format:'nkdk-declarations/1',kind:'catalog',declarations:modules.map(({format,...module})=>module)},{noRefs:true}));
"#.replace("COMPLETE_OWNER", if complete {"true"} else {"false"});
    let bytes = run(&script);
    nkdk_rule_compiler::parse_many(nkdk_rule_compiler::SourceFile {
        path: "source-record-state.yaml",
        bytes: &bytes,
    })
    .unwrap()
}
