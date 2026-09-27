'use strict';
const data = window.previewData;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => n.toLocaleString();
const signed = n => (n > 0 ? '+' : '') + fmt(n);
const range = (a,b,sign=false) => a === null ? 'Unavailable (incomplete search)' : a === b ? (sign?signed(a):fmt(a)) : `${sign?signed(a):fmt(a)} to ${sign?signed(b):fmt(b)}`;
const links = urls => `<div class="listing-links"><ol>${urls.map(u=>`<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">Airbnb ${esc(u.split('/').pop())}</a></li>`).join('')}</ol></div>`;
const popup = (title,body) => `<div class="popup-content"><h3>${esc(title)}</h3>${body}</div>`;
const map = L.map('map', {preferCanvas:true}).setView([30.27,-97.75],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
map.createPane('permits');map.getPane('permits').style.zIndex=450;
map.createPane('overlaps');map.getPane('overlaps').style.zIndex=420;
let heatMode='listings';
function tileStyle(f){const p=f.properties;let fill='#999';if(p.status==='complete'||p.status==='empty'){
 if(heatMode==='listings'){const n=p.listing_count;fill=n===0?'#fff7ec':n<=25?'#fee8c8':n<=50?'#fdbb84':n<=100?'#fc8d59':n<=200?'#e34a33':'#990000';}
 else{fill=p.difference_max<0?'#d95f0e':p.difference_min>0?'#3182bd':p.difference_min===0&&p.difference_max===0?'#ffffff':'#bdbdbd';}
 }return {color:'#755849',weight:1,fillColor:fill,fillOpacity:.48};}
const tileLayer = L.geoJSON([...data.tiles].sort((a,b)=>L.geoJSON(b).getBounds().getNorthEast().distanceTo(L.geoJSON(b).getBounds().getSouthWest())-L.geoJSON(a).getBounds().getNorthEast().distanceTo(L.geoJSON(a).getBounds().getSouthWest())),{
 style:tileStyle,
 onEachFeature:(f,layer)=>{
  const p=f.properties;
  layer.bindTooltip(`Airbnb search area · ${fmt(p.listing_count)} listings`);
  layer.bindPopup(()=>popup('Airbnb search area',`<p>Tile ${esc(p.tile_id)} · ${esc(p.status)}</p><p><b>${fmt(p.listing_count)} saved unique Airbnb listings</b><br>Mapped permit range: ${range(p.mapped_permits_min,p.mapped_permits_max)}<br>Permits minus listings: ${range(p.difference_min,p.difference_max,true)}</p><p>Range uses candidate blocks fully inside / intersecting this tile. Unmapped permits are excluded; this is not a compliance finding.</p>${links(p.listing_urls)}`),{maxWidth:390});
 }}).addTo(map);
map.createPane('airbnbCounts');map.getPane('airbnbCounts').style.zIndex=640;
const airbnbLabels=L.layerGroup().addTo(map);
for(const layer of tileLayer.getLayers()){const p=layer.feature.properties;const partial=!['complete','empty'].includes(p.status);L.marker(layer.getBounds().getCenter(),{pane:'airbnbCounts',zIndexOffset:1000,icon:L.divIcon({className:'airbnb-label',html:`${fmt(p.listing_count)}${partial?'*':''}`,iconSize:[48,28],iconAnchor:[24,14]}),title:`Airbnb: ${p.listing_count}${partial?' (incomplete search)':''}`}).bindPopup(()=>layer.getPopup().getContent()(layer),{maxWidth:390}).addTo(airbnbLabels);}
const overlapLayer=L.geoJSON([...data.overlaps].reverse(),{
 pane:'overlaps',style:{color:'#8050a1',weight:1,dashArray:'4 3',fillColor:'#ad8ac7',fillOpacity:.18},
 onEachFeature:(f,layer)=>{const p=f.properties;layer.bindTooltip(`${fmt(p.listing_count)} shared Airbnb listings`);layer.bindPopup(()=>popup('Inferred overlap area',`<p>${fmt(p.listing_count)} listings found in ${p.tile_ids.length} completed search tiles. This shared area is inferred, not an exact location.</p>${links(p.listing_urls)}`),{maxWidth:390});}
});
function permitPopup(p){return popup(p.address_block,`<p><b>${fmt(p.permit_count)} licenses in this block</b> · ZIP ${esc(p.zip)}</p><p>The full green area combines ${fmt(p.candidate_plots)} candidate plots. It does not identify which plots are licensed. A number repeated across disconnected pieces still refers to the whole block.</p><p><a href="licenses.html?block=${encodeURIComponent(p.address_block)}&zip=${encodeURIComponent(p.zip)}">See these city license records ↗</a><br><a href="licenses.html">View the entire city license list ↗</a></p>`);}
const permitLayer=L.geoJSON(data.areas,{
 pane:'permits',style:{color:'#13713b',weight:1.4,fillColor:'#43b568',fillOpacity:.48},
 onEachFeature:(f,layer)=>{const p=f.properties;layer.bindTooltip(`${p.address_block} · ${fmt(p.permit_count)} licenses`);layer.bindPopup(()=>permitPopup(p),{maxWidth:380});}
}).addTo(map);
const labels=L.layerGroup().addTo(map);
const labelMarkers=[];
// Label anchors are saved representative points within the candidate geometry.
for(const f of [...data.areas].sort((a,b)=>b.properties.permit_count-a.properties.permit_count)){const p=f.properties;const latlng=p.label_point || L.geoJSON(f).getBounds().getCenter();const marker=L.marker(latlng,{icon:L.divIcon({className:'permit-label',html:fmt(p.permit_count),iconSize:[30,24],iconAnchor:[15,12]}),keyboard:true,title:`${p.address_block}: ${p.permit_count} licenses`}).bindPopup(()=>permitPopup(p),{maxWidth:380}).addTo(labels);labelMarkers.push(marker);}
L.control.layers(null,{'Airbnb tile heatmap':tileLayer,'Airbnb counts (red pills)':airbnbLabels,'Inferred shared Airbnb areas':overlapLayer,'Green permit-block areas':permitLayer,'Permit counts':labels},{collapsed:window.innerWidth<650}).addTo(map);
function labelVisibility(){const occupied=[];const size=map.getSize();for(const marker of labelMarkers){const el=marker.getElement();if(!el)continue;const pt=map.latLngToContainerPoint(marker.getLatLng());const show=pt.x>=0&&pt.y>=0&&pt.x<size.x&&pt.y<size.y&&!occupied.some(p=>Math.abs(p.x-pt.x)<40&&Math.abs(p.y-pt.y)<30);el.style.display=show?'':'none';if(show)occupied.push(pt);}}
map.on('zoomend moveend overlayadd',labelVisibility);labelVisibility();
document.getElementById('coverage').textContent=`${fmt(data.meta.mapped_licenses)} of ${fmt(data.meta.total_licenses)} city licenses mapped; ${fmt(data.meta.unmapped_licenses)} remain in the full list only. Zoom in for more count labels.`;
const dialog=document.getElementById('intro');document.getElementById('about').addEventListener('click',()=>dialog.showModal());dialog.showModal();

const heatSelect=document.getElementById('heat-mode');
function updateHeat(){heatMode=heatSelect.value;tileLayer.setStyle(tileStyle);document.getElementById('heat-key').innerHTML=heatMode==='listings'?'Airbnb listings per search tile:<br><span class="heat-ramp"></span><br>0 · 1–25 · 26–50 · 51–100 · 101–200 · 201+<br>Gray = incomplete search; * = partial count':'Mapped permits minus Airbnb listings:<br><span style="color:#d95f0e">■</span> More listings &nbsp; <span style="color:#3182bd">■</span> More permits<br>Gray = range crosses zero or incomplete; white = equal.<br>Click for the comparison range.';}
heatSelect.addEventListener('change',updateHeat);updateHeat();

const legendToggle=document.getElementById('legend-toggle');
legendToggle.addEventListener('click',()=>{
 const minimized=document.getElementById('legend').classList.toggle('legend-minimized');
 document.getElementById('legend-details').hidden=minimized;
 legendToggle.textContent=minimized?'+':'−';
 legendToggle.setAttribute('aria-expanded',String(!minimized));
 legendToggle.setAttribute('aria-label',minimized?'Expand map legend':'Minimize map legend');
 legendToggle.title=minimized?'Expand':'Minimize';
});
