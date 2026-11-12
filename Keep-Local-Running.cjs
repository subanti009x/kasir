const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const root = 'F:/sir';
const nodeExe = path.join(root,'.runtime/node/node.exe');
const pgCtl = path.join(root,'.runtime/pgsql/bin/pg_ctl.exe');
const pgData = path.join(root,'.data/postgres');
const backend = path.join(root,'backend');
const logs = path.join(root,'.logs');
const data = path.join(root,'.data');
const temp = path.join(root,'.tmp');
fs.mkdirSync(logs,{recursive:true}); fs.mkdirSync(data,{recursive:true}); fs.mkdirSync(temp,{recursive:true}); fs.mkdirSync(path.join(root,'.cache/npm'),{recursive:true});
const env = {...process.env,TEMP:temp,TMP:temp,TMPDIR:temp,npm_config_cache:path.join(root,'.cache/npm'),NEXT_TELEMETRY_DISABLED:'1',PATH:path.join(root,'.runtime/node')+';'+path.join(root,'.runtime/pgsql/bin')+';'+process.env.PATH};
const envText=fs.readFileSync(path.join(backend,'.env'),'utf8');
for(const line of envText.split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!line.trim().startsWith('#'))env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
let api=null, web=null;
function log(msg){fs.appendFileSync(path.join(logs,'supervisor.log'),new Date().toISOString()+' '+msg+'\n');}
function spawnService(which,args,cwd){const stamp=new Date().toISOString().replace(/[:.]/g,'-');const out=fs.openSync(path.join(logs,which+'-'+stamp+'-out.log'),'a');const err=fs.openSync(path.join(logs,which+'-'+stamp+'-err.log'),'a');const child=spawn(nodeExe,args,{cwd,env,stdio:['ignore',out,err],windowsHide:true,detached:true});child.unref();const obj={pid:child.pid,started:Date.now(),exited:false};child.once('exit',(code,signal)=>{obj.exited=true;log(which+' stopped pid='+obj.pid+' code='+code+' signal='+signal);});fs.writeFileSync(path.join(data,'supervisor-'+which+'.pid'),String(child.pid));log('started '+which+' pid='+child.pid);return obj;}
function pgRunning(){const r=spawnSync(pgCtl,['-D',pgData,'status'],{windowsHide:true,stdio:'ignore'});return r.status===0;}
function ensurePg(){if(!pgRunning()){const r=spawnSync(pgCtl,['-D',pgData,'-o','-h 127.0.0.1 -p 5432','-l',path.join(logs,'postgres.log'),'start'],{windowsHide:true,encoding:'utf8'});if(r.status!==0)log('PostgreSQL start returned '+r.status+' '+(r.stderr||''));else log('PostgreSQL started');}}
async function healthy(url){try{const r=await fetch(url,{signal:AbortSignal.timeout(3500)});return r.status>=200&&r.status<500;}catch{return false;}}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function supervise(){log('supervisor online');for(;;){try{ensurePg();
 if(!await healthy('http://127.0.0.1:3000/api/docs')){if(!api||api.exited){api=spawnService('backend',['dist/src/main.js'],backend);}else if(Date.now()-api.started>45000){try{process.kill(api.pid);}catch{} api=spawnService('backend',['dist/src/main.js'],backend);}}
 if(!await healthy('http://127.0.0.1:3001')){if(!web||web.exited){web=spawnService('frontend',['node_modules/next/dist/bin/next','start','-p','3001'],root);}else if(Date.now()-web.started>45000){try{process.kill(web.pid);}catch{} web=spawnService('frontend',['node_modules/next/dist/bin/next','start','-p','3001'],root);}}
 }catch(e){log('supervisor check error '+e.message);}await delay(12000);}}
supervise();