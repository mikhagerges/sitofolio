// Retry interrupted chunks from the server-confirmed offset. Selecting the same file resumes it.
export async function uploadFile(api,post,jobId,file,onProgress=()=>{}){
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
  let session=await post('/imports/'+jobId+'/uploads',{name:file.webkitRelativePath||file.name,bytes:file.size,digest});
  if(session.complete){onProgress(100);return}
  let attempts=0;
  while(session.offset<file.size){try{const result=await api('/uploads/'+session.id+'?offset='+session.offset,{method:'PATCH',body:file.slice(session.offset,session.offset+session.chunkSize),headers:{'Content-Type':'application/octet-stream'}});session.offset=result.offset;attempts=0;onProgress(Math.round(session.offset/file.size*100))}catch(error){if(++attempts>3||error.status&&![409,429,500,502,503].includes(error.status))throw error;await new Promise(r=>setTimeout(r,attempts*700));const latest=await api('/uploads/'+session.id);session.offset=latest.offset}}
  await post('/uploads/'+session.id+'/complete');
}
