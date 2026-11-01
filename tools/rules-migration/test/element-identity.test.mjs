import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceElementIdentity,sourceElementIdentityFacts} from '../src/source-element-identity.mjs';
import {candidateCatalog} from '../src/candidate-catalog.mjs';

test('singleton identity emits fixed and owner suffix contracts from checked registrations',()=>{
  const graph=JSON.parse(readFileSync('tests/migration/form-element-links.json','utf8'));
  const {catalog}=candidateCatalog();
  for(const row of graph.registrations) {
    const contract=sourceElementIdentity(row,catalog);
    const requests=sourceElementIdentityFacts(row,catalog).contributions.filter(item=>item.allocate);
    assert.deepEqual(requests.map(item=>item.allocate),row.parameters.directId===undefined?[{scope:['component','owner'],first:1}]:[]);
    assert.equal(contract.kind,'fragment');
    assert.deepEqual(contract.representations.xml.fields.map(field=>field.attribute),['name','id']);
    assert(contract.presence.some(presence=>presence.target.field==='name' && presence.yaml.omitWhen));
    const xmlName=contract.presence.find(presence=>presence.target.field==='name').yaml.missing.denotes;
    assert.equal(xmlName.variant.name,'explicit');
    assert(JSON.stringify(xmlName).includes(row.parameters.nameStyle.canonicalSuffix));
    assert.equal(JSON.stringify(xmlName).includes('ownerName'),row.parameters.nameStyle.canonicalNameMode==='ownerSuffix');
    const id=contract.presence.find(presence=>presence.target.field==='id').yaml.missing.denotes;
    if(row.parameters.directId!==undefined) {
      assert.deepEqual(id,{literal:row.parameters.directId});
      assert(contract.constraints.some(rule=>rule.assert.eq?.[1]?.literal===row.parameters.directId));
    }
    else assert(JSON.stringify(id).includes('identities'));
  }
  const row=graph.registrations[0];
  for(const change of [
    value=>value.parameters.extra=true,
    value=>value.parameters.nameStyle.canonicalNameMode='unknown',
    value=>value.parameters.nameStyle.referenceSuffixes=['another'],
    value=>value.constantOutput.name='Different',
    value=>value.blockers=['unknown'],
  ]) {
    const changed=structuredClone(row);change(changed);
    assert.throws(()=>sourceElementIdentity(changed,catalog),/identity registration/);
  }
});
