import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = await readFile(path.join(root, "data/decorObjects.ts"), "utf8");
const matcher = /\{ slug: "([^"]+)", name: "([^"]+)", category: "([^"]+)", folder: "([^"]+)", style: "[^"]+", colors: \["(#[0-9A-F]+)", "(#[0-9A-F]+)"/g;
const objects = [...source.matchAll(matcher)].map((match) => ({ slug: match[1], name: match[2], category: match[3], folder: match[4], primary: match[5], secondary: match[6] }));

function shapes(category, primary, secondary) {
  const common = `fill="${primary}" stroke="${secondary}" stroke-width="18" stroke-linejoin="round"`;
  const dark = `fill="${secondary}"`;
  switch (category) {
    case "sillones": return `<rect x="145" y="330" width="510" height="245" rx="74" ${common}/><rect x="112" y="390" width="108" height="220" rx="50" ${common}/><rect x="580" y="390" width="108" height="220" rx="50" ${common}/><path d="M210 365h380v115H210z" fill="${primary}" opacity=".72"/><path d="M205 610v70M595 610v70" ${dark} stroke="${secondary}" stroke-width="28"/>`;
    case "sillas": return `<path d="M245 170h310v290H245z" ${common}/><path d="M215 440h370v125H215z" ${common}/><path d="M255 560l-28 145M545 560l28 145" fill="none" stroke="${secondary}" stroke-width="28"/>`;
    case "mesas": return `<ellipse cx="400" cy="330" rx="285" ry="105" ${common}/><path d="M235 385l-42 280M565 385l42 280" fill="none" stroke="${secondary}" stroke-width="34"/><path d="M265 620h270" fill="none" stroke="${secondary}" stroke-width="24"/>`;
    case "macetas": return `<path d="M225 280h350l-48 355q-10 65-75 65H348q-65 0-75-65z" ${common}/><ellipse cx="400" cy="280" rx="175" ry="60" fill="${secondary}"/><ellipse cx="400" cy="282" rx="128" ry="35" fill="#243a2e" opacity=".75"/>`;
    case "plantas": return `<path d="M345 430c-155-70-170-220-103-278 115 52 160 147 103 278zM455 430c155-70 170-220 103-278-115 52-160 147-103 278zM400 425c-115-145-60-292 0-325 60 33 115 180 0 325z" ${common}/><path d="M400 375v155" fill="none" stroke="${secondary}" stroke-width="22"/><path d="M255 505h290l-38 180H293z" fill="${secondary}"/>`;
    case "lamparas": return `<path d="M250 295h300L485 115H315z" ${common}/><circle cx="400" cy="286" r="28" fill="#F4D784"/><path d="M400 305v330" fill="none" stroke="${secondary}" stroke-width="28"/><ellipse cx="400" cy="665" rx="155" ry="42" ${common}/>`;
    case "alfombras": return `<path d="M112 285l565-82 52 330-565 82z" ${common}/><path d="M180 330l470-68M195 405l470-68M210 480l470-68M225 555l470-68" fill="none" stroke="${secondary}" stroke-width="12" opacity=".55"/>`;
    case "cuadros": return `<rect x="155" y="105" width="490" height="590" rx="16" fill="${secondary}"/><rect x="195" y="145" width="410" height="510" fill="#F3EFE6"/><circle cx="330" cy="335" r="112" fill="${primary}"/><path d="M250 560c110-210 220-220 320 0z" fill="${secondary}" opacity=".85"/>`;
    case "estanterias": return `<path d="M185 105h430v590H185z" fill="none" stroke="${secondary}" stroke-width="28"/><path d="M185 255h430M185 415h430M185 575h430" stroke="${secondary}" stroke-width="24"/><path d="M230 145h75v100h-75zM340 180h65v65h-65zM455 135h105v110H455zM235 285h120v120H235zM390 315h70v90h-70zM490 275h80v130h-80zM225 455h90v110h-90zM350 475h120v90H350z" fill="${primary}"/>`;
    case "decoracion": return `<path d="M205 590q0-180 130-235 130 55 130 235z" ${common}/><path d="M440 590q0-280 100-360 100 80 60 360z" fill="${secondary}"/><circle cx="540" cy="200" r="42" fill="${primary}"/>`;
    case "camas": return `<path d="M135 345h530v275H135z" ${common}/><path d="M135 170h185q55 0 55 55v120H135z" fill="${secondary}"/><path d="M375 230h230q60 0 60 60v55H375z" fill="#F3EFE6" stroke="${secondary}" stroke-width="18"/><path d="M165 620v65M635 620v65" stroke="${secondary}" stroke-width="26"/>`;
    case "escritorios": return `<path d="M115 315h570v125H115z" ${common}/><path d="M185 440v235M615 440v235" stroke="${secondary}" stroke-width="34"/><rect x="250" y="140" width="300" height="175" rx="14" fill="${secondary}"/><rect x="278" y="165" width="244" height="125" fill="${primary}" opacity=".75"/>`;
    default: return `<circle cx="400" cy="390" r="240" ${common}/>`;
  }
}

function svg(object) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="18" flood-color="#18201c" flood-opacity=".2"/></filter></defs><g filter="url(#shadow)">${shapes(object.category, object.primary, object.secondary)}</g><g transform="translate(400 754)"><rect x="-128" y="-26" width="256" height="48" rx="24" fill="#202621" opacity=".88"/><text x="0" y="7" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="white">OBJETO DE PRUEBA</text></g></svg>`;
}

if (objects.length < 40) throw new Error(`Solo se encontraron ${objects.length} objetos.`);
for (const object of objects) {
  const directory = path.join(root, "public", "decor", object.folder);
  await mkdir(directory, { recursive: true });
  const input = Buffer.from(svg(object));
  await sharp(input).webp({ lossless: true, effort: 4 }).toFile(path.join(directory, `${object.slug}.webp`));
  await sharp(input).resize(320, 320).webp({ quality: 82, alphaQuality: 90, effort: 4 }).toFile(path.join(directory, `${object.slug}-thumb.webp`));
}

process.stdout.write(`Generated ${objects.length * 2} transparent WebP assets for ${objects.length} decor objects.\n`);
