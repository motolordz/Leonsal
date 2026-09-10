import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export const energyStates = ['empty', 'low', 'calm', 'happy', 'excited'];
export const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// Evidence is a reviewed declaration, never something constructed from current bytes
// while promoting an asset. This validates its binding, not a human's identity.
export function verifyApprovalEvidence(root, evidencePath, characterId, inspected, expectedVersion) {
  const absolute = path.resolve(root, evidencePath);
  if (!absolute.startsWith(path.resolve(root) + path.sep)) throw new Error('Approval evidence must be repository-accessible');
  const evidence = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  if (evidence.schemaVersion !== 1 || evidence.decision !== 'approved' || evidence.characterId !== characterId) throw new Error('Approval evidence decision/character mismatch');
  if (!evidence.assetVersion || (expectedVersion && evidence.assetVersion !== expectedVersion)) throw new Error('Approval asset version mismatch');
  if (typeof evidence.approvedBy !== 'string' || !evidence.approvedBy.trim() || typeof evidence.authoritySource !== 'string' || !evidence.authoritySource.trim()) throw new Error('Approval requires recorded reviewer and actual authority source');
  if (!Number.isFinite(Date.parse(evidence.reviewedAt))) throw new Error('Approval review date is missing');
  if (evidence.rightsStatus !== 'owned' && evidence.rightsStatus !== 'licensed') throw new Error('Approval rights remain unresolved');
  for (const state of energyStates) {
    const bound = evidence.assets?.[state];
    const current = inspected[state];
    for (const key of ['masterPath','webPath','masterSha256','webSha256']) {
      if (!bound?.[key] || bound[key] !== current?.[key]) throw new Error(`Approval evidence does not match ${characterId}/${state}/${key}`);
    }
  }
  return { path: path.relative(root, absolute).split(path.sep).join('/'), sha256: sha256(absolute), assetVersion: evidence.assetVersion,
    assetHashes: Object.fromEntries(energyStates.map(state => [state, {masterSha256: inspected[state].masterSha256, webSha256: inspected[state].webSha256}])) };
}

export function verifyRegisteredApproval(root, record) {
  const inspected = Object.fromEntries(energyStates.map(state => {
    const masterPath = record.masterStates?.[state]; const webPath = record.states?.[state];
    if (!masterPath || !webPath) throw new Error('Missing approved state paths');
    return [state, {masterPath,webPath,masterSha256:sha256(path.join(root,masterPath)),webSha256:sha256(path.join(root,webPath))}];
  }));
  if (!record.approval?.path) throw new Error('Missing exact-version approval');
  const checked = verifyApprovalEvidence(root,record.approval.path,record.id,inspected,record.approval.assetVersion);
  if (checked.sha256 !== record.approval.sha256 || JSON.stringify(checked.assetHashes) !== JSON.stringify(record.approval.assetHashes)) throw new Error('Approval evidence or approved asset bytes changed');
}
