#!/usr/bin/env node
/**
 * OSM Overpass -> PostgreSQL import script
 * Astana bounding box: 51.05,71.20,51.35,71.75 (S,W,N,E)
 *
 * Usage: node import-osm.js
 */

const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || null;

const DB = DATABASE_URL ? { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } } : {
  host: 'localhost',
  port: 5432,
  database: 'mini2gis',
  user: process.env.USER,
};

// Categories mapped from OSM tags
const CATEGORY_MAP = [
  { slug: 'cafe',       name: 'Кафе',       tags: { amenity: 'cafe' } },
  { slug: 'restaurant', name: 'Мейрамхана', tags: { amenity: 'restaurant' } },
  { slug: 'fast_food',  name: 'Фастфуд',    tags: { amenity: 'fast_food' } },
  { slug: 'shop',       name: 'Дүкен',      tags: { shop: 'supermarket' } },
  { slug: 'pharmacy',   name: 'Дәріхана',   tags: { amenity: 'pharmacy' } },
  { slug: 'hospital',   name: 'Аурухана',   tags: { amenity: 'hospital' } },
  { slug: 'bank',       name: 'Банк',       tags: { amenity: 'bank' } },
  { slug: 'atm',        name: 'Банкомат',   tags: { amenity: 'atm' } },
  { slug: 'fuel',       name: 'АЖС',        tags: { amenity: 'fuel' } },
  { slug: 'hotel',      name: 'Қонақ үй',   tags: { tourism: 'hotel' } },
  { slug: 'park',       name: 'Саябақ',     tags: { leisure: 'park' } },
  { slug: 'school',     name: 'Мектеп',     tags: { amenity: 'school' } },
  { slug: 'university', name: 'Университет',tags: { amenity: 'university' } },
];

// Astana bounding box
const BBOX = '51.05,71.20,51.35,71.75'; // S,W,N,E for Overpass

async function fetchOSM(amenityKey, amenityValue) {
  const query = `[out:json][timeout:60];(node["${amenityKey}"="${amenityValue}"](${BBOX});way["${amenityKey}"="${amenityValue}"](${BBOX}););out center;`;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'mini2gis-import/1.0', 'Accept': '*/*' },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Overpass error: ${resp.status} - ${body.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.elements || [];
}

function extractCoords(el) {
  if (el.type === 'node') return { lat: el.lat, lng: el.lon };
  if (el.type === 'way' && el.center) return { lat: el.center.lat, lng: el.center.lon };
  return null;
}

async function main() {
  const client = new Client(DB);
  await client.connect();
  console.log('Connected to PostgreSQL');

  // Ensure categories exist
  for (const cat of CATEGORY_MAP) {
    await client.query(
      `INSERT INTO categories (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = $2`,
      [cat.slug, cat.name],
    );
  }
  console.log(`Upserted ${CATEGORY_MAP.length} categories`);

  let totalInserted = 0;

  for (const cat of CATEGORY_MAP) {
    const [tagKey, tagVal] = Object.entries(cat.tags)[0];
    console.log(`Fetching ${cat.name} (${tagKey}=${tagVal})...`);

    let elements;
    try {
      elements = await fetchOSM(tagKey, tagVal);
    } catch (e) {
      console.error(`  Failed: ${e.message}`);
      continue;
    }

    console.log(`  Got ${elements.length} elements`);

    const { rows } = await client.query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
    const categoryId = rows[0]?.id;

    for (const el of elements) {
      const coords = extractCoords(el);
      if (!coords) continue;

      const name = el.tags?.name || el.tags?.['name:ru'] || el.tags?.['name:kk'] || null;
      if (!name) continue;

      const osmId = `${el.type}/${el.id}`;
      const address = [
        el.tags?.['addr:street'],
        el.tags?.['addr:housenumber'],
      ].filter(Boolean).join(', ') || null;
      const phone = el.tags?.phone || el.tags?.['contact:phone'] || null;
      const hours = el.tags?.opening_hours || null;

      await client.query(
        `INSERT INTO places (name, address, phone, opening_hours, lat, lng, osm_id, source, "categoryId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'osm', $8)
         ON CONFLICT (osm_id) DO UPDATE
           SET name = $1, address = $2, phone = $3, opening_hours = $4`,
        [name, address, phone, hours, coords.lat, coords.lng, osmId, categoryId],
      );
      totalInserted++;
    }

    // Respectful delay between Overpass requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\nDone! Total places inserted/updated: ${totalInserted}`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
