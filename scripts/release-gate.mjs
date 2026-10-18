#!/usr/bin/env node
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {readFileSync,lstatSync,realpathSync} from 'node:fs'
import {resolve,relative,sep,isAbsolute} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createClient} from 'genlayer-js'
import {studionet} from 'genlayer-js/chains'
import {TransactionHashVariant} from 'genlayer-js/types'

export const digest=bytes=>createHash('sha256').update(bytes).digest('hex')
const requireThat=(ok,message)=>{if(!ok)throw new Error(message)}
const git=(root,args,encoding='utf8')=>execFileSync('git',['-C',root,...args],{encoding,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']})
const normalize=value=>value instanceof Map?Object.fromEntries([...value].map(([k,v])=>[String(k),normalize(v)])):Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)])):value
export function sourceIdentity(raw){
 const m=/^https:\/\/raw\.githubusercontent\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/([0-9a-f]{40})\/([A-Za-z0-9_./-]+)$/.exec(raw||'')
 requireThat(m&&!m[4].split('/').some(p=>!p||p==='.'||p==='..'),'invalid immutable candidate URL')
 return {repo:`https://github.com/${m[1]}/${m[2]}`,commit:m[3],path:m[4]}
}
function safeFile(root,file){
 const absolute=resolve(root,file),rel=relative(root,absolute)
 requireThat(rel&&!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('..'+sep),'file escapes repository root')
 let current=root
 for(const component of rel.split(sep)){current=resolve(current,component);requireThat(!lstatSync(current).isSymbolicLink(),'symlink resolution is forbidden')}
 requireThat(lstatSync(absolute).isFile(),'expected a regular file')
 requireThat(realpathSync(absolute)===absolute,'unsafe real path resolution')
 return {absolute,path:rel.split(sep).join('/')}
}
export function verifyRelease({cwd=process.cwd(),candidatePath,item,verdict,caseId,policy,artifactPath}){
 requireThat(item?.case_id===caseId&&verdict?.case_id===caseId,'case ID mismatch or missing finalized verdict')
 requireThat(verdict.case_commitment===item.commitment,'case commitment mismatch')
 requireThat(verdict.protocol_version==='patchjury-v2'&&item.protocol_version==='patchjury-v2','legacy or unknown protocol cannot authorize release')
 requireThat(verdict.decision==='READY'&&['remediation','regression','scope'].every(k=>verdict[k]==='PASS'),'a finalized READY verdict with three passing criteria is required')
 requireThat(item.scope_mode==='candidate-file'&&verdict.scope_mode==='candidate-file','unsupported assessment scope')
 const id=sourceIdentity(item.candidate_url)
 requireThat(id.repo.toLowerCase()===item.repo_url.toLowerCase(),'candidate URL repository mismatch')
 requireThat(policy?.version===1&&policy.repo_url?.toLowerCase()===id.repo.toLowerCase(),'trusted release policy repository mismatch')
 requireThat(Array.isArray(policy.authorized_authors)&&policy.authorized_authors.some(a=>/^0x[0-9a-f]{40}$/i.test(a)&&a.toLowerCase()===item.author?.toLowerCase()),'submitting wallet is not authorized by the maintainer release policy')
 requireThat(Array.isArray(policy.candidate_paths)&&policy.candidate_paths.includes(id.path),'candidate path is not authorized by maintainer policy')
 const root=realpathSync(git(cwd,['rev-parse','--show-toplevel']).trim()),file=safeFile(root,resolve(cwd,candidatePath))
 requireThat(file.path===id.path,'candidate path differs from the exact registered repository path')
 const head=git(root,['rev-parse','HEAD']).trim().toLowerCase()
 requireThat(head===id.commit&&head===item.candidate_commit,'Git HEAD differs from reviewed commit')
 const origin=git(root,['remote','get-url','origin']).trim().replace(/^git@github\.com:/,'https://github.com/').replace(/\.git$/,'')
 requireThat(origin.toLowerCase()===id.repo.toLowerCase(),'Git origin differs from reviewed repository')
 const tracked=git(root,['ls-files','--error-unmatch','--',id.path]).trim()
 requireThat(tracked===id.path,'candidate is not tracked at the registered path')
 const entry=git(root,['ls-tree',head,'--',id.path]).trim()
 requireThat(/^100(644|755) blob [0-9a-f]+\t/.test(entry),'reviewed Git entry is not a regular file blob')
 requireThat(!git(root,['status','--porcelain=v1','--untracked-files=no']).trim(),'tracked working-tree or index contents are modified')
 const blob=git(root,['show',`${head}:${id.path}`],null),bytes=readFileSync(file.absolute),sha=digest(bytes)
 requireThat(digest(blob)===sha&&sha===item.candidate_sha256,'candidate bytes differ from the reviewed Git blob or commitment')
 requireThat(verdict.ci_status==='completed'&&verdict.ci_conclusion==='success'&&verdict.ci_head_sha===head&&verdict.ci_run_url===item.ci_run_url,'CI witness does not match this release')
 requireThat(verdict.regression_authenticated===true&&verdict.report_sha256===item.test_report_sha256&&/^https:\/\/api.github.com\/repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/check-runs\/\d+$/.test(verdict.ci_check_url||''),'authenticated run-bound regression evidence is required')
 requireThat(verdict.supports&&['remediation','regression','scope'].every(k=>verdict.supports[k]?.quote&&verdict.supports[k]?.reason),'criterion-specific evidence is required')
 let artifactSha=null
 if(artifactPath){const artifact=safeFile(root,resolve(cwd,artifactPath));requireThat(artifact.path!==file.path,'release artifact must be a separately staged file');artifactSha=digest(readFileSync(artifact.absolute));requireThat(artifactSha===sha,'release artifact differs from reviewed candidate bytes')}
 return {case_id:caseId,commit:head,candidate_path:id.path,candidate_sha256:sha,artifact_sha256:artifactSha,scope:'candidate-file',authorization:'maintainer-policy',author:item.author}
}
export async function main(){
 const [caseId,candidatePath,...flags]=process.argv.slice(2),address=process.env.PATCHJURY_CONTRACT_ADDRESS
 requireThat(/^[A-Za-z0-9_-]{1,64}$/.test(caseId||'')&&candidatePath,'usage: release-gate.mjs CASE_ID candidate [--artifact staged-file]')
 requireThat(flags.length===0||(flags.length===2&&flags[0]==='--artifact'),'invalid gate arguments')
 requireThat(/^0x[0-9a-f]{40}$/i.test(address||''),'configure the reviewed v2 contract address')
 requireThat(process.env.PATCHJURY_POLICY_FILE,'set PATCHJURY_POLICY_FILE to a trusted maintainer-controlled policy')
 const policy=JSON.parse(readFileSync(process.env.PATCHJURY_POLICY_FILE,'utf8'))
 requireThat(policy.contract_address?.toLowerCase()===address.toLowerCase(),'contract address differs from trusted release policy')
 const client=createClient({chain:studionet,endpoint:process.env.GENLAYER_RPC_URL||'https://studio.genlayer.com/api'})
 const read=async(name,args=[])=>normalize(await client.readContract({address,functionName:name,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL}))
 requireThat((await read('get_protocol')).version==='patchjury-v2','a reviewed PatchJury v2 deployment is required')
 const [item,verdict]=await Promise.all([read('get_case',[caseId]),read('get_verdict',[caseId])])
 const proof=verifyRelease({candidatePath,item,verdict,caseId,policy,artifactPath:flags[1]})
 console.log('PATCHJURY READY '+JSON.stringify(proof))
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error('PATCHJURY BLOCKED: '+e.message);process.exitCode=1})
