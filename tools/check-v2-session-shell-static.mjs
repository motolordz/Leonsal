import assert from 'node:assert/strict';
import fs from 'node:fs';

const shell = fs.readFileSync('js/v2-game-shell.js', 'utf8');
const css = fs.readFileSync('v2-proofs.css', 'utf8');
const browserCheck = fs.readFileSync('tools/check-v2-session-browser.mjs', 'utf8');

for (const label of ['Home', 'Pause', 'Finished', 'Keep playing', 'Start again', 'Choose another game']) {
  assert(shell.includes(label), `Shared game shell missing ${label}`);
}

assert(shell.includes('this.scene.inert = true'), 'Shared shell must inert the scene while paused');
assert(shell.includes('this.scene.inert = false'), 'Shared shell must restore the scene on resume');
assert(shell.includes("event.key === 'Escape'"), 'Shared shell must support Escape for settings/dialog flow');
assert(shell.includes("this.audio.forEach((audio) => audio.stop())"), 'Shared shell must stop audio on pause');
assert(shell.includes('reset = () => {}'), 'Shared shell must make reset optional-safe');
assert(shell.includes('typeof reset === \'function\''), 'Shared shell must guard non-function reset callbacks');
assert(shell.includes('restart()'), 'Shared shell must route Start again through a shared restart method');
assert(shell.includes("new Event('leonsal-reset')"), 'Shared shell must dispatch a reset lifecycle event');

assert(css.includes('.session-controls'), 'CSS missing shared session controls');
assert(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), 'Session controls must use stable three-column touch layout');
assert(css.includes('env(safe-area-inset-bottom)'), 'Session controls must respect mobile safe area');
assert(css.includes('position: sticky'), 'Session controls must stay reachable on mobile');
assert(css.includes('min-height: 46px') || css.includes('min-height: 48px'), 'Session controls must keep large touch targets');

assert(browserCheck.includes("locator('.need-card').count(), 5"), 'Session browser check must expect all five need cards');
assert(browserCheck.includes("locator('.bus-need')"), 'Session browser check must cover bus need card route');
assert(browserCheck.includes("'double-decker-bus'"), 'Session browser check must include the double-decker bus route');

console.log('V2 session shell static checks passed.');
