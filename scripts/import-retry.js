#!/usr/bin/env node
// Retry for rate-limited categories from first import run
const { Client } = require('pg');

const DB = { host: 'localhost', port: 5432, database: 'mini2gis', user: process.env.USER };
const BBOX = '51.05,71.20,51.35,71.75';

const RETRY_CATS = [
  { slug: 'shop',    name: 'Дүкен',    tagKey: 'shop',    tagVal: 'supermarket' },
  { slug: 'pharmacy',name: 'Дәріхана', tagKey: 'amenity', tagVal: 'pharmacy' },
  { slug: 'atm',     name: 'Банкомат', tagKey: 'amenity', tagVal: 'atm' },
  { slug: 'fuel',    name: 'АЖС',      tagKey: 'amenity', tagVal: 'fuel' },
];

async function fetchOSM(tagKey, tagVal) {
  const query = `[out:json][timeout:60];(node["${tagKey}"="${tagVal}"](${BBOX});way["${tagKey}"="${tagVal}"](${BBOX}););out center;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  const resp = await fetch(url, { headers: { 'User-Agent': 'mini2gis-import/1.0', 'Accept': '*/*' } });
  if (!resp.ok) throw new Error(`${resp.status}`);
  const data = await resp.json();
  return data.elements || [];
}

async function main() {
  const client = new Client(DB);
  await client.connect();
  let total = 0;

  for (const cat of RETRY_CATS) {
    console.log(`Fetching ${cat.name}...`);
    await new Promise(r => setTimeout(r, 3000));
    let elements;
    try { elements = await fetchOSM(cat.tagKey, cat.tagVal); }
    catch (e) { console.error(`  Failed: ${e.message}`); continue; }
    console.log(`  Got ${elements.length} elements`);

    const { rows } = await client.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
    const categoryId = rows[0]?.id;

    for (const el of elements) {
      let lat, lng;
      if (el.type === 'node') { lat = el.lat; lng = el.lon; }
      else if (el.center) { lat = el.center.lat; lng = el.center.lon; }
      else continue;

      const name = el.tags?.name || el.tags?.['name:ru'] || el.tags?.['name:kk'] || null;
      if (!name) continue;

      const osmId = `${el.type}/${el.id}`;
      const address = [el.tags?.['addr:street'], el.tags?.['addr:housenumber']].filter(Boolean).join(', ') || null;
      const phone = el.tags?.phone || el.tags?.['contact:phone'] || null;
      const hours = el.tags?.opening_hours || null;

      await client.query(
        `INSERT INTO places (name, address, phone, opening_hours, lat, lng, osm_id, source, "categoryId")
         VALUES ($1,$2,$3,$4,$5,$6,$7,'osm',$8)
         ON CONFLICT (osm_id) DO UPDATE SET name=$1,address=$2,phone=$3,opening_hours=$4`,
        [name, address, phone, hours, lat, lng, osmId, categoryId],
      );
      total++;
    }
  }

  const { rows } = await client.query('SELECT count(*) FROM places');
  console.log(`\nDone! Added ${total} more. Total: ${rows[0].count}`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
