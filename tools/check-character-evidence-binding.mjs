import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { energyStates,sha256,verifyApprovalEvidence,verifyRegisteredApproval } from './character-approval-evidence.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'leonsal-binding-'));
try {
 const inspected={};
 for(const state of energyStates){const masterPath=`${state}.png`,webPath=`${state}.webp`;fs.writeFileSync(path.join(root,masterPath),`fixture master ${state}`);fs.writeFileSync(path.join(root,webPath),`fixture web ${state}`);inspected[state]={masterPath,webPath,masterSha256:sha256(path.join(root,masterPath)),webSha256:sha256(path.join(root,webPath))};}
 const evidence={schemaVersion:1,decision:'approved',characterId:'fixture-only',assetVersion:'fixture-v1',approvedBy:'TEST FIXTURE — not human approval',authoritySource:'unit fixture only, never production',reviewedAt:'2026-09-10T00:00:00Z',rightsStatus:'owned',assets:inspected};
 const write=()=>fs.writeFileSync(path.join(root,'evidence.json'),JSON.stringify(evidence));write();
 const binding=verifyApprovalEvidence(root,'evidence.json','fixture-only',inspected,'fixture-v1');
 const record={id:'fixture-only',approval:binding,masterStates:Object.fromEntries(energyStates.map(s=>[s,inspected[s].masterPath])),states:Object.fromEntries(energyStates.map(s=>[s,inspected[s].webPath]))};
 verifyRegisteredApproval(root,record);
 assert.throws(()=>verifyApprovalEvidence(root,'evidence.json','other-character',inspected));
 assert.throws(()=>verifyApprovalEvidence(root,'evidence.json','fixture-only',inspected,'fixture-v2'));
 evidence.assets.empty.masterSha256='0'.repeat(64);write();
 assert.throws(()=>verifyRegisteredApproval(root,record));
 evidence.assets.empty.masterSha256=sha256(path.join(root,'empty.png'));write();
 fs.appendFileSync(path.join(root,'low.webp'),'changed');
 assert.throws(()=>verifyRegisteredApproval(root,record),'Changed derivative inherited approval');
 console.log('Evidence binding passed: exact fixture accepted; wrong character/version, stale hashes and changed bytes rejected.');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
