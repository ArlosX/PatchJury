const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {webcrypto,createHash}=require('node:crypto');
function harness({receipt={statusName:'FINALIZED',txExecutionResultName:'FINISHED_WITH_RETURN'},provider,readValue=new Map(),fetchResponse}={}) {
  const calls=[];
  const sdk={createClient:()=>({readContract:async args=>{calls.push(args);return readValue},writeContract:async args=>{calls.push(args);return '0xhash'},waitForTransactionReceipt:async args=>{calls.push(args);return receipt}})};
  const source=fs.readFileSync('src/genlayer.ts','utf8').replaceAll('import.meta.env.VITE_PATCHJURY_CONTRACT_ADDRESS',JSON.stringify('0x'+'1'.repeat(40))).replaceAll('import.meta.env.VITE_GENLAYER_RPC_URL',JSON.stringify('https://studio.genlayer.com/api'));
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const context={exports:{},require:name=>name==='genlayer-js'?sdk:name==='genlayer-js/chains'?{studionet:{}}:{TransactionHashVariant:{LATEST_FINAL:'final'}},window:{ethereum:provider},Map,AbortSignal,TextDecoder,crypto:webcrypto,fetch:async()=>fetchResponse};
  vm.runInNewContext(code,context); return {...context.exports,calls};
}
test('read requests finalized state and normalizes maps',async()=>{const h=harness({readValue:new Map([['version','patchjury-v1']])});assert.equal((await new h.PatchJuryClient().protocol()).version,'patchjury-v1');assert.equal(h.calls[0].transactionHashVariant,'final')});
test('successful finalized write returns hash',async()=>{const h=harness();let submitted;assert.equal(await new h.PatchJuryClient().review('REL-1',hash=>submitted=hash),'0xhash');assert.equal(submitted,'0xhash');assert.equal(h.calls[1].status,'FINALIZED')});
for(const receipt of [{statusName:'ACCEPTED',txExecutionResultName:'FINISHED_WITH_RETURN'},{statusName:'FINALIZED',txExecutionResultName:'USER_ERROR'},{statusName:'FINALIZED'},{statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{status:'error'}}]}}])test('rejects unsafe receipt '+JSON.stringify(receipt),async()=>{const h=harness({receipt});await assert.rejects(new h.PatchJuryClient().review('REL-1',()=>{}),/did not finish successfully/)});
test('supports StudioNet leader return receipt',async()=>{const h=harness({receipt:{status:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{status:'return'},genvm_result:{error_code:null}}]}}});await new h.PatchJuryClient().review('REL-1',()=>{})});
test('no installed wallet reports useful error',async()=>{await assert.rejects(harness().connectWallet(),/Install an EVM wallet/)});
test('no account selected rejected',async()=>{await assert.rejects(harness({provider:{request:async()=>[]}}).connectWallet(),/Select a wallet account/)});
test('wallet switches to StudioNet',async()=>{const calls=[];let chain='0x1';const account='0x'+'a'.repeat(40);const h=harness({provider:{request:async({method})=>{calls.push(method);if(method==='wallet_switchEthereumChain')chain='0xf22f';return method==='eth_requestAccounts'||method==='eth_accounts'?[account]:method==='eth_chainId'?chain:null}}});assert.equal(await h.connectWallet(),account);assert.ok(calls.includes('wallet_switchEthereumChain'))});
test('unknown chain is added and explicitly selected',async()=>{const calls=[];let chain='0x1',added=false;const h=harness({provider:{request:async({method})=>{calls.push(method);if(method==='wallet_switchEthereumChain'){if(!added)throw {code:4902};chain='0xf22f'}if(method==='wallet_addEthereumChain')added=true;return method==='eth_requestAccounts'||method==='eth_accounts'?['0x'+'a'.repeat(40)]:method==='eth_chainId'?chain:null}}});await h.connectWallet();assert.ok(calls.includes('wallet_addEthereumChain'));assert.equal(calls.filter(x=>x==='wallet_switchEthereumChain').length,2)});
test('wallet ignoring a switch cannot submit on wrong chain',async()=>{const h=harness({provider:{request:async({method})=>method==='eth_requestAccounts'?['0x'+'a'.repeat(40)]:method==='eth_chainId'?'0x1':null}});await assert.rejects(h.connectWallet(),/not connected to GenLayer StudioNet/)});
test('active account is re-read after network selection',async()=>{const h=harness({provider:{request:async({method})=>method==='eth_requestAccounts'?['0x'+'a'.repeat(40)]:method==='eth_accounts'?['0x'+'b'.repeat(40)]:'0xf22f'}});assert.equal(await h.connectWallet(),'0x'+'b'.repeat(40))});
test('wallet rejection propagates',async()=>{const h=harness({provider:{request:async()=>{throw new Error('User rejected')}}});await assert.rejects(h.connectWallet(),/User rejected/)});
test('source fingerprint matches exact bytes',async()=>{const bytes=new TextEncoder().encode('exact source\n');const h=harness({fetchResponse:{ok:true,arrayBuffer:async()=>bytes.buffer}});assert.equal(await h.sha256FromUrl('https://example.test/file'),createHash('sha256').update(bytes).digest('hex'))});
for(const size of [0,12001])test('source size boundary '+size,async()=>{const h=harness({fetchResponse:{ok:true,arrayBuffer:async()=>new ArrayBuffer(size)}});await assert.rejects(h.sha256FromUrl('https://example.test'),/1–12,000/)});
test('source HTTP failure rejected',async()=>{const h=harness({fetchResponse:{ok:false,status:403}});await assert.rejects(h.sha256FromUrl('https://example.test'),/HTTP 403/)});

test('invalid UTF-8 source rejected',async()=>{const h=harness({fetchResponse:{ok:true,arrayBuffer:async()=>new Uint8Array([255]).buffer}});await assert.rejects(h.sha256FromUrl('https://example.test'),/UTF-8/)});
test('whitespace-only source rejected',async()=>{const h=harness({fetchResponse:{ok:true,arrayBuffer:async()=>new TextEncoder().encode('   ').buffer}});await assert.rejects(h.sha256FromUrl('https://example.test'),/non-whitespace/)});
const{test:paginationTest}=require('node:test');
paginationTest('registry read requests one bounded page instead of full history',async()=>{const page={cases:[],verdicts:{},next_offset:25,has_more:true,total:2000};const h=harness({readValue:page});const result=await new h.PatchJuryClient().page(0);assert.equal(result.total,2000);assert.equal(h.calls.length,1);assert.equal(h.calls[0].functionName,'get_registry_page');assert.deepEqual(Array.from(h.calls[0].args),[0,25])});

test('actual GenVM model-shape failure is exposed rather than silently returning to review',async()=>{const h=harness({receipt:{statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'ERROR',result:{status:'contract_error',payload:'exit_code 1'},genvm_result:{stderr:"Traceback\nAttributeError: list object has no attribute get"}}]}}});await assert.rejects(new h.PatchJuryClient().review('REL-1',()=>{}),/AttributeError: list object has no attribute get/)})
