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
function attachExisting(which){try{const pid=Number(fs.readFileSync(path.join(data,'supervisor-'+which+'.pid'),'utf8'));process.kill(pid,0);return {pid,started:Date.now(),exited:false};}catch{return null;}}
let api=attachExisting('backend'), web=attachExisting('frontend'), apiFailures=0, webFailures=0;
function log(msg){fs.appendFileSync(path.join(logs,'supervisor.log'),new Date().toISOString()+' '+msg+'\n');}
function spawnService(which,args,cwd){const stamp=new Date().toISOString().replace(/[:.]/g,'-');const out=fs.openSync(path.join(logs,which+'-'+stamp+'-out.log'),'a');const err=fs.openSync(path.join(logs,which+'-'+stamp+'-err.log'),'a');const child=spawn(nodeExe,args,{cwd,env,stdio:['ignore',out,err],windowsHide:true,detached:true});child.unref();const obj={pid:child.pid,started:Date.now(),exited:false};child.once('exit',(code,signal)=>{obj.exited=true;log(which+' stopped pid='+obj.pid+' code='+code+' signal='+signal);});fs.writeFileSync(path.join(data,'supervisor-'+which+'.pid'),String(child.pid));log('started '+which+' pid='+child.pid);return obj;}
function pgRunning(){const r=spawnSync(pgCtl,['-D',pgData,'status'],{windowsHide:true,stdio:'ignore'});return r.status===0;}
function ensurePg(){if(!pgRunning()){const r=spawnSync(pgCtl,['-D',pgData,'-o','-h 127.0.0.1 -p 5432','-l',path.join(logs,'postgres.log'),'start'],{windowsHide:true,encoding:'utf8'});if(r.status!==0)log('PostgreSQL start returned '+r.status+' '+(r.stderr||''));else log('PostgreSQL started');}}
async function healthy(url){try{const r=await fetch(url,{signal:AbortSignal.timeout(3500)});return r.status>=200&&r.status<500;}catch{return false;}}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function supervise(){log('supervisor online');for(;;){try{ensurePg();if(api&&!api.exited){try{process.kill(api.pid,0);}catch{api.exited=true;}}if(web&&!web.exited){try{process.kill(web.pid,0);}catch{web.exited=true;}}
 const apiOk=await healthy('http://127.0.0.1:3000/api/docs');
 if(apiOk){apiFailures=0;}else{apiFailures++;if(apiFailures===1)log('backend health check failed; will retry before restarting');if(!api||api.exited){api=spawnService('backend',['dist/src/main.js'],backend);apiFailures=0;}else if(apiFailures>=10&&Date.now()-api.started>120000){log('backend unhealthy for 10 checks; restarting pid='+api.pid);try{process.kill(api.pid);}catch{}api=spawnService('backend',['dist/src/main.js'],backend);apiFailures=0;}}
 const webOk=await healthy('http://127.0.0.1:3001');
 if(webOk){webFailures=0;}else{webFailures++;if(webFailures===1)log('frontend health check failed; will retry before restarting');if(!web||web.exited){web=spawnService('frontend',['node_modules/next/dist/bin/next','start','-p','3001'],root);webFailures=0;}else if(webFailures>=10&&Date.now()-web.started>120000){log('frontend unhealthy for 10 checks; restarting pid='+web.pid);try{process.kill(web.pid);}catch{}web=spawnService('frontend',['node_modules/next/dist/bin/next','start','-p','3001'],root);webFailures=0;}} }catch(e){log('supervisor check error '+e.message);}await delay(12000);}}
supervise();

