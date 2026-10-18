#!/usr/bin/env node
// Run only after the fixed test command has completed in the evidence job
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const sha=b=>createHash('sha256').update(b).digest('hex')
const report=readFileSync('.patchjury-output/actual-report.txt'),expected=readFileSync('examples/review-ready/test-report.txt')
if(!report.equals(expected))throw Error('Actual CI stdout differs from committed report')
const repository=process.env.GITHUB_REPOSITORY,runId=Number(process.env.GITHUB_RUN_ID),attempt=Number(process.env.GITHUB_RUN_ATTEMPT),head=process.env.GITHUB_SHA,token=process.env.GITHUB_TOKEN
if(!token||!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository||'')||!Number.isSafeInteger(runId)||!head)throw Error('Run this inside the declared repository Actions job')
const base='https://api.github.com/repos/'+repository
async function api(path,options={}){const r=await fetch(base+path,{...options,headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('GitHub evidence HTTP '+r.status);return r.json()}
const jobs=await api(`/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100`)
if(jobs.total_count>100)throw Error('Job listing exceeds bound')
const job=jobs.jobs.find(j=>j.name==='PatchJury regression evidence')
if(!job?.check_run_url?.startsWith(base+'/check-runs/'))throw Error('No run-associated check found')
const checkId=job.check_run_url.split('/').pop(),nativeCheck=await api('/check-runs/'+checkId),candidatePath='examples/review-ready/candidate.py'
const witness={schema:'patchjury-ci-v1',job_id:job.id,check_external_id:nativeCheck.external_id,run_id:runId,run_attempt:attempt,head_sha:head,candidate_path:candidatePath,candidate_sha256:sha(readFileSync(candidatePath)),report_sha256:sha(report),report:report.toString('utf8')}
await api('/check-runs/'+checkId,{method:'PATCH',body:JSON.stringify({name:'PatchJury regression evidence',external_id:nativeCheck.external_id,output:{title:'Captured regression test output',summary:'Exact stdout and candidate hash from the regression evidence job',text:JSON.stringify(witness)}})})
console.log('Published run-associated regression witness '+checkId)
