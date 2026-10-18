#!/usr/bin/env node
import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import{createClient}from'genlayer-js';import{studionet}from'genlayer-js/chains';import{TransactionHashVariant}from'genlayer-js/types';
const address=process.argv[2],filename=process.argv[3]||'contracts/patchjury.py';if(!/^0x[0-9a-f]{40}$/i.test(address||''))throw Error('Provide exact StudioNet contract address');
const client=createClient({chain:studionet,endpoint:process.env.GENLAYER_RPC_URL||'https://studio.genlayer.com/api'}),local=readFileSync(filename),remote=await client.getContractCode(address);
const code=typeof remote==='string'?(remote.startsWith('0x')?Buffer.from(remote.slice(2),'hex'):Buffer.from(remote)):Buffer.from(remote);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');if(!local.equals(code))throw Error('DEPLOYMENT SOURCE MISMATCH local='+sha(local)+' deployed='+sha(code));
const record={network:'StudioNet',address,reviewed_commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),source_path:filename,source_sha256:sha(local),deployed_source_sha256:sha(code),verified_at:new Date().toISOString(),transaction_hash_variant:TransactionHashVariant.LATEST_FINAL};
writeFileSync('artifacts/deployment-source-equivalence.json',JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
