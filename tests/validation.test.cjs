const {test}=require('node:test'); const assert=require('node:assert/strict'); const fs=require('node:fs'); const vm=require('node:vm');const ts=require('typescript');
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/validation.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsObject});
const {validateCaseInput,validateSources}=exportsObject;
function valid(){const c='a'.repeat(40),h='b'.repeat(64),raw=`https://raw.githubusercontent.com/owner/repo.test/${c}/`;return {case_id:'REL-1',title:'Fix parser',release_policy:'Fix boundary',repo_url:'https://github.com/owner/repo.test',baseline_url:raw+'before.py',baseline_sha256:h,candidate_url:raw+'after.py',candidate_sha256:h,test_report_url:raw+'report.txt',test_report_sha256:h,ci_run_url:'https://api.github.com/repos/owner/repo.test/actions/runs/42',parent_id:''}}
test('valid complete input accepted',()=>assert.equal(validateCaseInput(valid()),null));
for(const [label,changes] of [['invalid ID',{case_id:'bad/id'}],['empty title',{title:' '}],['empty policy',{release_policy:''}],['mutable URL',{candidate_url:'https://raw.githubusercontent.com/owner/repo.test/main/file.py'}],['regex repository impersonation',{candidate_url:valid().candidate_url.replace('repo.test','repoXtest')}],['traversal',{candidate_url:valid().candidate_url.replace('after.py','../after.py')}],['report mismatch',{test_report_url:valid().test_report_url.replace('a'.repeat(40),'c'.repeat(40))}],['wrong hash',{candidate_sha256:'X'.repeat(64)}],['wrong CI repository',{ci_run_url:valid().ci_run_url.replace('repo.test','repoXtest')}],['wrong CI endpoint',{ci_run_url:'https://evil.test/run'}]])test(label+' rejected',()=>assert.ok(validateCaseInput({...valid(),...changes})));
test('fingerprinting rejects empty sources before fetch',()=>assert.ok(validateSources({...valid(),baseline_url:''})));

for(const [name,url] of [
 ['javascript','javascript:alert(1)'],
 ['private network','http://127.0.0.1/secret'],
 ['userinfo spoof','https://raw.githubusercontent.com@evil.test/a'],
 ['subdomain spoof','https://raw.githubusercontent.com.evil.test/a'],
 ['query injection',valid().candidate_url+'?x=1'],
 ['encoded traversal',valid().candidate_url.replace('after.py','%2e%2e/after.py')],
 ['fragment suffix',valid().candidate_url+'#fake'],
 ['backslash path',valid().candidate_url.replace('after.py','a\\b')]
])test(name+' source rejected',()=>assert.ok(validateCaseInput({...valid(),candidate_url:url})));
