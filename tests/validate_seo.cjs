const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2] || '../src/index.html';
const htmlPath = path.resolve(__dirname, targetPath);
const html = fs.readFileSync(htmlPath, 'utf8');

const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!match) {
  console.error('No JSON-LD script tag found in src/index.html!');
  process.exit(1);
}

try {
  const json = JSON.parse(match[1].trim());
  console.log('✅ JSON-LD parses cleanly as valid JSON.');
  console.log('✅ @context:', json['@context']);
  
  const graph = json['@graph'];
  if (!Array.isArray(graph)) {
    throw new Error('@graph is not an array!');
  }
  
  console.log(`✅ Found ${graph.length} schema objects in @graph:`);
  graph.forEach((obj, idx) => {
    console.log(`   [${idx + 1}] @type: ${JSON.stringify(obj['@type'])} | @id: ${obj['@id'] || 'N/A'}`);
  });

  // Verify critical schemas
  const types = graph.map(o => Array.isArray(o['@type']) ? o['@type'].join(',') : o['@type']);
  const hasWebSite = types.some(t => t.includes('WebSite'));
  const hasOrg = types.some(t => t.includes('Organization'));
  const hasApp = types.some(t => t.includes('SoftwareApplication') || t.includes('VideoGame'));
  const hasHowTo = types.some(t => t.includes('HowTo'));
  const hasFAQ = types.some(t => t.includes('FAQPage'));
  const hasBreadcrumbs = types.some(t => t.includes('BreadcrumbList'));

  if (!hasWebSite) throw new Error('Missing WebSite schema');
  if (!hasOrg) throw new Error('Missing Organization schema');
  if (!hasApp) throw new Error('Missing SoftwareApplication / VideoGame schema');
  if (!hasHowTo) throw new Error('Missing HowTo schema');
  if (!hasFAQ) throw new Error('Missing FAQPage schema');
  if (!hasBreadcrumbs) throw new Error('Missing BreadcrumbList schema');

  console.log('✅ All 6 Google Rich Snippet schemas verified successfully!');
} catch (err) {
  console.error('❌ Validation Failed:', err.message);
  process.exit(1);
}
