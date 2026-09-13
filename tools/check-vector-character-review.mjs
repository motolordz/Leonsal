import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import crypto from 'node:crypto';

const registry = JSON.parse(await fs.readFile('data/character-review.json', 'utf8'));
const results = [];
for (const character of registry.characters) {
  for (const [state, asset] of Object.entries(character.states)) {
    const vectorSrc = `assets/character-review/vectors/${character.id}/${state}.svg`;
    const svg = await fs.readFile(vectorSrc, 'utf8');
    assert(!/<(?:image|script|foreignObject)\b|data:image|(?:href|xlink:href)\s*=/i.test(svg), `${vectorSrc}: external or raster content`);
    assert(/<path\b/.test(svg), `${vectorSrc}: no vector paths`);
    const {data, info} = await sharp(Buffer.from(svg)).resize(512,512).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let visible=0, clear=0;
    for(let p=3;p<data.length;p+=4) { if(data[p]>24)visible++; if(data[p]===0)clear++; }
    assert(visible>1000 && clear>1000, `${vectorSrc}: empty or opaque canvas`);
    const corners=[0,511,511*512,512*512-1].map(p=>data[p*4+3]);
    assert(corners.every(a=>a===0), `${vectorSrc}: contaminated corners`);
    asset.vectorSrc=vectorSrc;
    results.push({character:character.id,state,vectorSrc,bytes:Buffer.byteLength(svg),
      pathCount:(svg.match(/<path\b/g)||[]).length,rasterEmbeddings:0,
      corners,decodedDimensions:[info.width,info.height],
      sha256:crypto.createHash('sha256').update(svg).digest('hex'),status:'review-only'});
  }
}
await fs.writeFile('data/character-review.json',JSON.stringify(registry,null,2)+'\n');
await fs.mkdir('qa/character-vectors',{recursive:true});
await fs.writeFile('qa/character-vectors/results.json',JSON.stringify({
  method:'VTracer spline tracing from supplied individual PNGs; not newly authored HD masters',
  productionApproval:false,passed:true,total:results.length,results,
  pending:['Leon empty pose','Guide uppercase clothing names','Rigged walking/running poses','Lion individual assets and vector states','Production visual approval']
},null,2)+'\n');
console.log(`${results.length} real SVGs decoded, transparent, no raster embedding. Production approval unchanged.`);
