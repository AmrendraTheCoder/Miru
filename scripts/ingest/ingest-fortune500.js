/**
 * ingest-fortune500.js  (fixed)
 * Scrapes Fortune 500 + Forbes 2000 + Unicorns from Wikipedia.
 * Run: node scripts/ingest/ingest-fortune500.js
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(n=""){return n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function strip(s=""){return s.replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").replace(/&#[0-9]+;/g,"").replace(/\[.*?\]/g,"").trim();}
function parseNum(s=""){return parseInt(s.replace(/[^0-9]/g,""),10)||null;}
function parseBillions(s=""){const m=s.match(/([\d.]+)/);return m?Math.round(parseFloat(m[1])*1e9):null;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchWiki(page) {
  const url=`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&origin=*`;
  const res=await fetch(url,{headers:{"User-Agent":"Miru/1.0"}});
  return (await res.json())?.parse?.text?.["*"]||"";
}

function parseRows(html, minCols=4) {
  const rows=[];
  const tableMatch=html.match(/<table[^>]*wikitable[^>]*>([\s\S]*?)<\/table>/);
  if(!tableMatch) return rows;
  const trs=tableMatch[1].split(/<tr[^>]*>/).slice(1);
  for(const tr of trs){
    const cells=(tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)||[]).map(c=>strip(c));
    if(cells.length>=minCols) rows.push(cells);
  }
  return rows;
}

async function ingestFortune500() {
  console.log("\n📊 Fortune 500 (US largest companies by revenue)...");
  const html=await fetchWiki("List_of_largest_companies_in_the_United_States_by_revenue");
  const rows=parseRows(html,5);
  const data=rows.filter(r=>r[0]&&!isNaN(parseInt(r[0]))).map(r=>({
    slug:toSlug(r[1]),name:r[1],source:"fortune500",category:"public",
    sector:r[2]?[r[2]]:[],is_public:true,ranking:parseInt(r[0])||null,
    revenue_usd:parseNum(r[3])*1_000_000||null,
    employee_count:parseNum(r[5])||null,
    hq_city:(r[6]||"").split(",")[0].trim()||null,
    country:"US",updated_at:new Date().toISOString(),
  })).filter(r=>r.slug&&r.name.length>1);
  console.log(`  Parsed ${data.length} companies`);
  let t=0;
  for(let i=0;i<data.length;i+=100){
    const {error}=await db.from("companies").upsert(data.slice(i,i+100),{onConflict:"slug"});
    if(error) console.error("  err:",error.message); else t+=data.slice(i,i+100).length;
    await sleep(200);
  }
  console.log(`  ✅ Inserted ${t} Fortune 500 companies`);
  return t;
}

async function ingestForbes2000() {
  console.log("\n🌍 Forbes Global 2000...");
  const html=await fetchWiki("Forbes_Global_2000");
  // Forbes table: Rank | Company | Country | Sales ($B) | Profit ($B) | Assets ($B) | Market cap ($B)
  const allTables=[...html.matchAll(/<table[^>]*wikitable[^>]*>([\s\S]*?)<\/table>/g)];
  let data=[];
  for(const tm of allTables){
    const trs=tm[1].split(/<tr[^>]*>/).slice(1);
    for(const tr of trs){
      const cells=(tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)||[]).map(c=>strip(c));
      if(cells.length<4) continue;
      const rank=parseInt(cells[0]);
      if(!rank||isNaN(rank)) continue;
      const name=cells[1];
      const country=cells[2]||"US";
      const sales=parseBillions(cells[3]);
      const marketCap=cells[6]?parseBillions(cells[6]):null;
      if(!name||name.length<2) continue;
      data.push({slug:toSlug(name),name,source:"forbes2000",category:"public",
        is_public:true,ranking:rank,revenue_usd:sales,market_cap_usd:marketCap,
        country,updated_at:new Date().toISOString()});
    }
  }
  // dedupe
  const seen=new Set();
  data=data.filter(d=>{if(seen.has(d.slug))return false;seen.add(d.slug);return true;});
  console.log(`  Parsed ${data.length} companies`);
  let t=0;
  for(let i=0;i<data.length;i+=100){
    const {error}=await db.from("companies").upsert(data.slice(i,i+100),{onConflict:"slug"});
    if(error) console.error("  err:",error.message); else t+=data.slice(i,i+100).length;
    await sleep(200);
  }
  console.log(`  ✅ Inserted ${t} Forbes 2000 companies`);
  return t;
}

async function ingestUnicorns() {
  console.log("\n🦄 Unicorn companies...");
  const html=await fetchWiki("List_of_unicorn_startup_companies");
  // Find ALL wikitables — the real one has columns: Company | Valuation | Date | Country | City | Industry | Investors
  const allTables=[...html.matchAll(/<table[^>]*wikitable[^>]*>([\s\S]*?)<\/table>/g)];
  let data=[];
  for(const tm of allTables){
    const trs=tm[1].split(/<tr[^>]*>/).slice(1);
    for(const tr of trs){
      const cells=(tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)||[]).map(c=>strip(c));
      if(cells.length<5) continue;
      const name=cells[0];
      const valStr=cells[1];
      const country=cells[3]||"";
      const city=cells[4]||"";
      const industry=cells[5]||"";
      if(!name||name.length<2||!name.match(/[a-zA-Z]/)) continue;
      // parse valuation "$X billion"
      const vm=valStr.match(/([\d.]+)\s*(billion|trillion|B|T)?/i);
      let valuation=null;
      if(vm){const n=parseFloat(vm[1]);const u=(vm[2]||"B").toLowerCase();
        valuation=u.startsWith("t")?Math.round(n*1e12):Math.round(n*1e9);}
      data.push({slug:toSlug(name),name,source:"unicorn",category:"unicorn",
        sector:industry?[industry]:[],is_public:false,valuation_usd:valuation,
        country:country||"US",hq_city:city||null,updated_at:new Date().toISOString()});
    }
  }
  // dedupe
  const seen=new Set();
  data=data.filter(d=>{if(seen.has(d.slug)||!d.slug)return false;seen.add(d.slug);return true;});
  // filter out obvious non-company entries (short names, all numbers)
  data=data.filter(d=>d.name.length>2&&isNaN(parseInt(d.name)));
  console.log(`  Parsed ${data.length} unicorns`);
  let t=0;
  for(let i=0;i<data.length;i+=100){
    const {error}=await db.from("companies").upsert(data.slice(i,i+100),{onConflict:"slug"});
    if(error) console.error("  err:",error.message); else t+=data.slice(i,i+100).length;
    await sleep(200);
  }
  console.log(`  ✅ Inserted ${t} unicorns`);
  return t;
}

async function main(){
  const {error:check}=await db.from("companies").select("id").limit(1);
  if(check?.code==="42P01"){console.error("❌ Run setup.sql first.");process.exit(1);}
  const f=await ingestFortune500();
  const fb=await ingestForbes2000();
  const u=await ingestUnicorns();
  // Final count
  const {count}=await db.from("companies").select("*",{count:"exact",head:true});
  console.log(`\n🎉 All done! Total companies in DB: ${count}`);
  console.log(`   Fortune 500: ${f} | Forbes 2000: ${fb} | Unicorns: ${u}`);
}
main().catch(console.error);
