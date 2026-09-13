import fs from 'node:fs/promises';
import sharp from 'sharp';
const review=JSON.parse(await fs.readFile('data/character-review.json','utf8'));
const states=['empty','low','calm','happy','excited'];
const cell=360, row=460, width=cell*5, height=row*3;
const text=(value,w,h,size=24)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w/2}" y="${h/2+size/3}" text-anchor="middle" font-family="sans-serif" font-size="${size}" fill="#162238">${value}</text></svg>`);
const checker=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="c" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#fff"/><path d="M0 0H16V16H0ZM16 16H32V32H16Z" fill="#e6e8ec"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`);
const layers=[];
for(let r=0;r<review.characters.length;r++) {
 const character=review.characters[r];
 for(let c=0;c<5;c++) {
  const state=states[c], asset=character.states[state];
  layers.push({input:text(`${character.name} / ${state.toUpperCase()}`,cell,60),left:c*cell,top:r*row});
  layers.push({input:asset?.vectorSrc ? await sharp(asset.vectorSrc).resize(320,360,{fit:'contain',background:'#00000000'}).png().toBuffer():text('NOT SUPPLIED',320,360),left:c*cell+20,top:r*row+70});
 }
}
await fs.mkdir('qa/character-vectors',{recursive:true});
await sharp(checker).composite(layers).png().toFile('qa/character-vectors/supplied-vector-states.png');
console.log('Contact sheet generated from the actual SVG paths. Missing Leon empty remains explicit.');
