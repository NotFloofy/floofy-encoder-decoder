const readline = require('readline')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const morseMap = {
  a:'.-', b:'-...', c:'-.-.', d:'-..', e:'.', f:'..-.',
  g:'--.', h:'....', i:'..', j:'.---', k:'-.-', l:'.-..',
  m:'--', n:'-.', o:'---', p:'.--.', q:'--.-', r:'.-.',
  s:'...', t:'-', u:'..-', v:'...-', w:'.--', x:'-..-',
  y:'-.--', z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', '\'':'.----.',
  '!':'-.-.--', '/':'-..-.', '(':'-.--.', ')':'-.--.-',
  '&':'.-...', ':':'---...', ';':'-.-.-.', '=':'-...-',
  '+':'.-.-.', '-':'-....-','_':'..--.-','"':'.-..-.',
  '$':'...-..-','@':'.--.-.',' ':'/'
}

const encodeStuff = {
  binary:t=>t.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '),
  hex:t=>t.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '),
  base64:t=>Buffer.from(t,'utf8').toString('base64'),
  rot13:t=>t.replace(/[a-z]/gi,c=>String.fromCharCode((c<='Z'?90:122)>=((c=c.charCodeAt(0)+13))?c:c-26)),
  morse:t=>t.toLowerCase().split('').map(c=>morseMap[c]||'').join(' '),
  reversed:t=>t.split('').reverse().join(''),
  atbash:t=>t.replace(/[a-z]/gi,c=>String.fromCharCode((c<='Z'?155:219)-c.charCodeAt(0))),
  url:t=>encodeURIComponent(t),
  unicode:t=>t.split('').map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join(''),
  base32:t=>base32Encode(Buffer.from(t,'utf8')),
  hex_no_spaces:t=>t.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(''),
  decimal:t=>t.split('').map(c=>c.charCodeAt(0)).join(' '),
  octal:t=>t.split('').map(c=>c.charCodeAt(0).toString(8)).join(' '),
  leetspeak:t=>t.toLowerCase().replace(/a/g,'4').replace(/e/g,'3').replace(/l/g,'1').replace(/o/g,'0').replace(/t/g,'7').replace(/s/g,'5'),
  emoji:t=>t.split('').map(c=>`\\u{${c.charCodeAt(0).toString(16)}}`).join(''),
  base91:t=>base91Encode(t),
  hexdump:t=>t.split('').map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '),
  soundex:t=>soundex(t)
}

const decodeStuff = {
  binary:t=>t.split(' ').map(b=>String.fromCharCode(parseInt(b,2))).join(''),
  hex:t=>t.split(' ').map(h=>String.fromCharCode(parseInt(h,16))).join(''),
  base64:t=>Buffer.from(t,'base64').toString('utf8'),
  rot13:t=>encodeStuff.rot13(t),
  morse:t=>t.split(' ').map(m=>Object.keys(morseMap).find(k=>morseMap[k]===m)||' ').join(''),
  reversed:t=>encodeStuff.reversed(t),
  atbash:t=>encodeStuff.atbash(t),
  url:t=>decodeURIComponent(t),
  unicode:t=>t.replace(/\\u[\dA-Fa-f]{4}/g,m=>String.fromCharCode(parseInt(m.slice(2),16))),
  base32:t=>Buffer.from(base32Decode(t)).toString('utf8'),
  hex_no_spaces:t=>t.match(/.{1,2}/g).map(h=>String.fromCharCode(parseInt(h,16))).join(''),
  decimal:t=>t.split(' ').map(d=>String.fromCharCode(parseInt(d,10))).join(''),
  octal:t=>t.split(' ').map(o=>String.fromCharCode(parseInt(o,8))).join(''),
  leetspeak:t=>t.replace(/4/g,'a').replace(/3/g,'e').replace(/1/g,'l').replace(/0/g,'o').replace(/7/g,'t').replace(/5/g,'s'),
  emoji:t=>t.replace(/\\u\{([0-9a-f]+)\}/gi,(m,g)=>String.fromCharCode(parseInt(g,16))),
  base91:t=>base91Decode(t),
  hexdump:t=>t.split(' ').map(h=>String.fromCharCode(parseInt(h,16))).join(''),
  soundex:t=>t
}

function base32Encode(buf){
  const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits=0,val=0,out=''
  for(let b of buf){
    val=(val<<8)|b;bits+=8
    while(bits>=5){out+=a[(val>>>(bits-5))&31];bits-=5}
  }
  if(bits>0)out+=a[(val<<(5-bits))&31]
  return out
}

function base32Decode(s){
  const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits=0,val=0,out=[]
  for(let ch of s.toUpperCase()){
    const v=a.indexOf(ch)
    if(v<0)continue
    val=(val<<5)|v;bits+=5
    if(bits>=8){out.push((val>>>(bits-8))&255);bits-=8}
  }
  return Uint8Array.from(out)
}

const BASE91='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"'
function base91Encode(s){
  let b=0,n=0,out=''
  for(let i=0;i<s.length;i++){
    b|=s.charCodeAt(i)<<n;n+=8
    while(n>13){
      let v=b&8191
      if(v>88){b>>=13;n-=13}else{v=b&16383;b>>=14;n-=14}
      out+=BASE91[v%91]+BASE91[Math.floor(v/91)]
    }
  }
  if(n)out+=BASE91[b%91]
  if(n>7)out+=BASE91[Math.floor(b/91)]
  return out
}

function base91Decode(s){
  let v=-1,b=0,n=0,out=[]
  for(let c of s){
    const i=BASE91.indexOf(c)
    if(i<0)continue
    if(v<0)v=i
    else{
      v+=i*91;b|=v<<n;n+=(v&8191)>88?13:14
      while(n>7){out.push(b&255);b>>=8;n-=8}
      v=-1
    }
  }
  if(v>=0)out.push((b|v<<n)&255)
  return String.fromCharCode(...out)
}

function soundex(s){
  const a=s.toLowerCase().split(''),f=a.shift()
  const codes={b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6}
  let r=f.toUpperCase(),p=codes[f]||0
  for(let c of a){
    const v=codes[c]||0
    if(v&&v!==p)r+=v
    p=v
  }
  return(r+'000').slice(0,4)
}

function autodetect(t){
  t=t.trim()
  if(/^[A-Za-z0-9+/=]+\s*$/.test(t)&&t.length%4===0)return'base64'
  if(/^[01\s]+$/.test(t)&&t.split(' ').every(b=>b.length===8))return'binary'
  if(/^[0-9A-Fa-f\s]+$/.test(t)&&t.split(' ').every(h=>h.length===2))return'hex'
  if(/^[0-9A-Fa-f]+$/.test(t)&&t.length%2===0)return'hex'
  if(/^[0-9\s]+$/.test(t)&&t.split(' ').every(d=>d&&+d<256))return'decimal'
  if(/^[0-7\s]+$/.test(t)&&t.split(' ').every(o=>o&&+o<256))return'octal'
  if(/^[.\-/\s]+$/.test(t))return'morse'
  if(/%[0-9A-Fa-f]{2}/.test(t))return'url'
  if(/^[a-zA-Z\s]+$/.test(t))return'rot13'
  let rev=t.split('').reverse().join('')
  if(/^[\x20-\x7E]+$/.test(rev))return'reversed'
  if(/^[A-Z2-7]+$/.test(t.replace(/\s/g,'')))return'base32'
  if(/\\u[\dA-Fa-f]{4}/.test(t))return'unicode'
  return'plain'
}

const formats = Object.keys(encodeStuff)

function ask(q){return new Promise(res=>rl.question(q,res))}

async function main(){
  console.log('\nfloofy decoder/encoder\n')
  console.log('1 = encode')
  console.log('2 = decode')
  console.log('3 = autodetect\n')
  const m = await ask('pick 1 2 or 3 > ')
  if(!['1','2','3'].includes(m))return rl.close()

  if(m==='1'){
    formats.forEach((f,i)=>console.log(`${i+1} = ${f}`))
    const n = await ask('\npick format > ')
    const f = formats[+n-1]
    if(!f)return rl.close()
    const t = await ask('\ntext to encode > ')
    console.log('\nresult\n'+encodeStuff[f](t))
  }

  if(m==='2'){
    formats.forEach((f,i)=>console.log(`${i+1} = ${f}`))
    const n = await ask('\npick format :3 > ')
    const f = formats[+n-1]
    if(!f)return rl.close()
    const t = await ask('\ntext to decode > ')
    console.log('\nresult\n'+decodeStuff[f](t))
  }

  if(m==='3'){
    const t = await ask('\ntext to autodetect > ')
    const f = autodetect(t)
    if(f==='plain'){console.log('\ncould not detect :(');return rl.close()}
    console.log(`\ndetected ${f}\n`+decodeStuff[f](t))
  }

  rl.close()
}

main().then(()=>{
  const r2=readline.createInterface({ input:process.stdin, output:process.stdout })
  r2.question('\npress enter to exit :D > ',()=>r2.close())
})