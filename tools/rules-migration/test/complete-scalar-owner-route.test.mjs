import {test} from 'node:test';
import assert from 'node:assert/strict';
import {numericOwnerOperation} from '../src/numeric-owner-operation.mjs';

test('complete scalar operation derives routes and dependencies from its owner declarations',()=>{
 const operation=numericOwnerOperation();
 assert.equal(operation.routes?.routes.length,1);
 const route=operation.routes.routes[0];
 assert.equal(route.xmlDir,'DocumentNumerators');
 assert.equal(route.yamlDir,'Нумератор');
 assert.equal(route.validators.cfe,'candidate.complete-scalar-owner.documentnumerator.validation');
 assert.deepEqual(route.inputs.owner,{snapshot:{entry:'candidate.complete-scalar-owner.documentnumerator.own-identity',field:'uuid'}});
 const external=operation.routes.factRoutes[0];
 assert.equal(external.fromBase,true);
 assert.deepEqual(external.only,['cf']);
 assert.deepEqual(external.factDirections,['yaml-to-xml']);
 assert.deepEqual(external.inputs.owner,route.inputs.owner);
 const production=new Set(operation.production.map(row=>row.id));
 assert(production.has(route.owners.cf));
 assert(production.has(route.validators.cfe));
 assert(production.has(external.entry));
 for(const source of route.sources)assert(production.has(source.entry),source.entry);
 assert(!operation.production.some(row=>row.id.includes('accountingregister')));
});
