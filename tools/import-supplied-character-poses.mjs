import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const input = process.argv[2];
if (!input) throw new Error('Supply the directory containing the original PNGs.');
const mapping = {
  elephant: ['A00E6AD9-596D-4B8A-B9EF-B5AC3D47E1B8','141DD311-CAFD-47A2-B608-D9845A7099A0','655C4720-865F-44B6-9D62-4B132CAA5A2F','B33C86D2-F662-4BDD-A411-41A398A7818C','0648F45D-E521-4C90-A416-2B01D720705A'],
  zaya: ['94DFB183-CEE1-4D30-B415-16DF2D460771','48CB2E37-1B58-458C-9A71-F469406BE246','12F23ED9-AD0C-49A2-BA57-264362F1D79B','FE6E929C-D223-4081-B814-F204EB43D7B0','389AD1D0-D797-4A72-9F97-0183A96FEC4E'],
  leon: [null,'B99C7F20-BC7A-4C39-A211-7736ED517606','43329A8D-9B15-4442-B997-8101A9038A6A','3E906E87-927E-442A-B240-A3632FE98B48','6FD3E169-1B1A-4873-AD01-BD9958D5E933']
};
const states = ['empty','low','calm','happy','excited'];
const review = JSON.parse(await fs.readFile('data/character-review.json','utf8'));
review.characters = [];
for (const [id, files] of Object.entries(mapping)) {
  const character = {id, name:id[0].toUpperCase()+id.slice(1), status:'review-only', notes:'Supplied individual transparent poses. Native 1254 px is below the 2048 px production requirement. Edge quality and five-state distinction require review.' + (id !== 'elephant' ? ' Clothing needs the canonical uppercase name.' : '') + (id === 'leon' ? ' Empty pose has not been supplied.' : ''), states:{}};
  for (let index=0;index<states.length;index++) {
    if (!files[index]) continue;
    const state=states[index], original=path.join(input,files[index]+'.PNG');
    const bytes=await fs.readFile(original), meta=await sharp(bytes).metadata();
    const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let transparent=0;
    for(let p=3;p<data.length;p+=4) if(data[p]===0) transparent++;
    const corners=[0,info.width-1,(info.height-1)*info.width,info.width*info.height-1].map(p=>data[p*4+3]);
    const source=`assets/source-safe-keeping/supplied-20260911/${id}/${state}.png`;
    const src=`assets/character-review/supplied-20260911/${id}/${state}.webp`;
    await fs.mkdir(path.dirname(source),{recursive:true}); await fs.mkdir(path.dirname(src),{recursive:true});
    await fs.copyFile(original,source);
    await sharp(bytes).resize({width:800,height:800,fit:'inside',withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toFile(src);
    character.states[state]={src,source,width:meta.width,height:meta.height,hasAlpha:meta.hasAlpha,transparentPixels:transparent,cornerAlpha:corners,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }
  review.characters.push(character);
}
const lion='69F27C2E-E4FE-43F6-B910-DB32D32BE9DE.PNG';
const lionPath='assets/source-safe-keeping/supplied-20260911/lion-reference.png';
await fs.copyFile(path.join(input,lion),lionPath);
review.references.push({name:'Lion five-pose reference',src:lionPath,notes:'Multi-character reference sheet, not individual runtime artwork.'});
await fs.writeFile('data/character-review.json',JSON.stringify(review,null,2)+'\n');
console.log('Preserved 14 individual originals and one Lion reference. Production registry unchanged.');
