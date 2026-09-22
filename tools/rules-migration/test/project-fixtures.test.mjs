import {execFileSync} from 'node:child_process';
import {test} from 'node:test';
import assert from 'node:assert/strict';

test('selected e2e property carries owner facts from the same XML source', () => {
  const request={
    xml:'e2e/fixtures/xml/cf/Catalogs/СправочникПолный.xml',
    propertySelector:".//{http://v8.1c.ru/8.3/xcf/readable}StandardAttribute[@name='Code']/{http://v8.1c.ru/8.3/xcf/readable}FillValue",
    root:'{http://v8.1c.ru/8.3/xcf/readable}FillValue',
    context:[
      {name:'codeType',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}CodeType'},
      {name:'codeLength',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}CodeLength'},
      {name:'owners',selector:'.//{http://v8.1c.ru/8.3/MDClasses}Properties/{http://v8.1c.ru/8.3/MDClasses}Owners/{http://v8.1c.ru/8.3/xcf/readable}Item',many:true},
    ],
  };
  const [result]=JSON.parse(execFileSync('python3',['tools/rules-migration/src/project-fixtures.py'],{
    input:JSON.stringify([request]),encoding:'utf8',
  }));
  assert.deepEqual(result.context,{
    codeType:'Number',codeLength:'11',owners:['Catalog.СправочникВладелец'],
  });
});
