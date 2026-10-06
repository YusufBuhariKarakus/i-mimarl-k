// Tek dosyalık tıklanabilir web demosu üretir (sunucu gerekmez).
//
//   EXPO_PUBLIC_DEMO=1 npx expo export --platform web --output-dir dist-demo
//   node scripts/build-demo.mjs dist-demo odaai-demo.html
//
// Paket ve görseller HTML'in içine gömülür; böylece dosya herhangi bir
// adreste (alt dizinde bile) açılabilir.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [exportDir, outFile] = process.argv.slice(2);
if (!exportDir || !outFile) {
  console.error('Kullanım: node scripts/build-demo.mjs <export-klasörü> <çıktı.html>');
  process.exit(1);
}

const jsDir = join(exportDir, '_expo/static/js/web');
const bundles = readdirSync(jsDir).filter((f) => f.endsWith('.js'));
if (bundles.length !== 1) throw new Error(`Tek bir web paketi bekleniyordu, bulunan: ${bundles.join(', ')}`);
let js = readFileSync(join(jsDir, bundles[0]), 'utf8');

// Mutlak "/assets/..." adresleri alt dizinde kırılır; PNG'leri data URI olarak göm.
js = js.replace(/uri:"(\/assets\/[^"]+\.png)"/g, (_, path) => {
  const data = readFileSync(join(exportDir, path)).toString('base64');
  return `uri:"data:image/png;base64,${data}"`;
});
if (/<\/script|<!--/i.test(js)) throw new Error('Paket satır içi gömülemeyecek bir dizi içeriyor');

const html = `<title>OdaAI Demo</title>
<style>
  :root { --bg: #f7f3ee; --frame: #e4dcd2; color-scheme: light; }
  html, body { height: 100%; }
  body { margin: 0; background: var(--bg); overflow: hidden; }
  #root { display: flex; height: 100%; flex: 1; max-width: 480px; margin: 0 auto; }
  @media (min-width: 520px) { #root { box-shadow: 0 0 0 1px var(--frame); } }
</style>
<div id="root"></div>
<script>
  // Expo Router adresi yol (pathname) üzerinden okur; demo hangi adreste
  // açılırsa açılsın ana ekrandan başlasın.
  try { history.replaceState(null, '', '/'); } catch (e) {}
</script>
<script>
${js}
</script>
`;

writeFileSync(outFile, html);
console.log(`${outFile} (${(html.length / 1024 / 1024).toFixed(1)} MB)`);
