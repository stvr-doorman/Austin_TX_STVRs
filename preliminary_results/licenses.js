'use strict';
const rows=Array.from(document.querySelectorAll('#licenses tbody tr'));
const search=document.getElementById('search');
const query=new URLSearchParams(location.search);
let block=query.get('block'),zip=query.get('zip');
function filter(){const q=search.value.trim().toLowerCase();let shown=0;for(const row of rows){const cells=row.cells;const match=(!block||cells[2].textContent===block)&&(!zip||cells[5].textContent===zip)&&(!q||row.textContent.toLowerCase().includes(q));row.hidden=!match;shown+=match?1:0;}document.getElementById('count').textContent=`${shown.toLocaleString()} of ${rows.length.toLocaleString()} records`+(block?` · ${block}`:'');}
search.addEventListener('input',filter);document.getElementById('reset').addEventListener('click',()=>{block=null;zip=null;search.value='';history.replaceState(null,'',location.pathname);filter();});filter();
