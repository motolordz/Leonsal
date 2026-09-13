"""Author a closed-eye rest expression on Leon's traced low-energy pose.

This is a new review candidate, not a supplied or approved pose.
"""
from pathlib import Path
import json
import xml.etree.ElementTree as ET

root = Path('assets/character-review/vectors/leon')
tree = ET.parse(root / 'low.svg')
svg = tree.getroot()
ns = 'http://www.w3.org/2000/svg'
ET.register_namespace('', ns)
svg.find(f'{{{ns}}}title').text = 'Leon, resting - authored vector candidate'
fragment = ET.fromstring('''<g xmlns="http://www.w3.org/2000/svg" id="rest-expression">
<defs>
 <radialGradient id="left-lid"><stop stop-color="#f4ad6b"/><stop offset="1" stop-color="#f6ad66"/></radialGradient>
 <radialGradient id="right-lid"><stop stop-color="#f5ad68"/><stop offset="1" stop-color="#fbb16b"/></radialGradient>
 <radialGradient id="rest-mouth"><stop stop-color="#f6aa62"/><stop offset="1" stop-color="#f8ad64"/></radialGradient>
</defs>
<path d="M571 369 Q615 355 665 371 L662 418 Q621 451 578 418 Z" fill="url(#left-lid)"/>
<path d="M728 386 Q769 382 812 398 L803 438 Q768 464 730 437 Z" fill="url(#right-lid)"/>
<path d="M580 398 Q617 424 657 398 M735 418 Q770 444 804 421" fill="none" stroke="#493023" stroke-width="8" stroke-linecap="round"/>
<ellipse cx="683" cy="503" rx="44" ry="24" fill="url(#rest-mouth)"/>
<path d="M660 500 Q682 514 703 501" fill="none" stroke="#a34e27" stroke-width="5" stroke-linecap="round"/>
</g>''')
svg.append(fragment)
tree.write(root / 'empty-candidate.svg', encoding='unicode', xml_declaration=True)
Path('qa/character-vectors/leon-empty-candidate.json').write_text(json.dumps({
 'character':'leon','state':'empty','status':'rejected',
 'method':'Authored SVG eyelids and relaxed mouth on the traced low-energy body',
 'source':'assets/character-review/vectors/leon/low.svg',
 'asset':'assets/character-review/vectors/leon/empty-candidate.svg',
 'productionApproved':False,
 'visualVerdict':'Rejected: visible flat eyelid/mouth patches do not match the supplied shaded face. Never expose through a runtime or review state resolver.'
},indent=2)+'\n')
