import { mkdir, readdir, rm } from "node:fs/promises";

const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("Chrome debe ejecutarse con --remote-debugging-port=9222.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let commandId = 0;
const commands = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data); if (!message.id) return;
  const pending = commands.get(message.id); if (!pending) return; commands.delete(message.id);
  if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
};
function command(method, params = {}) {
  const id = ++commandId; socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => commands.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value;
}
async function waitFor(expression, timeout = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise((resolve) => setTimeout(resolve, 100)); }
  throw new Error(`Timeout: ${expression}`);
}
async function rect(selector) {
  return evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return null; const bounds = element.getBoundingClientRect(); return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, centerX: bounds.x + bounds.width / 2, centerY: bounds.y + bounds.height / 2 }; })()`);
}
async function click(x, y, clickCount = 1) {
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", buttons: 1, clickCount });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", buttons: 0, clickCount });
}
async function drag(start, end) {
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 6; step += 1) await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x + (end.x - start.x) * step / 6, y: start.y + (end.y - start.y) * step / 6, button: "left", buttons: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: end.x, y: end.y, button: "left", buttons: 0, clickCount: 1 });
}

await command("Runtime.enable"); await command("Page.enable");
await command("Page.navigate", { url: "http://localhost:3000/objects" });
await waitFor(`document.querySelector('button[aria-label^="Usar Alfombra tejida neutra"]')`);
await new Promise((resolve) => setTimeout(resolve, 1500));
await evaluate(`document.querySelector('button[aria-label^="Usar Alfombra tejida neutra"]').click()`);
await waitFor(`location.pathname === '/editor' && document.querySelector('input[type="file"]')`);
await evaluate(`(async () => { const input = document.querySelector('input[type="file"]'); const blob = await fetch('/interior-studio-room.png').then(response => response.blob()); const file = new File([blob], 'perspective-room.png', { type: 'image/png' }); const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await waitFor(`document.querySelector('[data-canvas-stage="true"]') && document.querySelector('button[title="Detectar superficies"]')`);
await evaluate(`document.querySelector('button[title="Detectar superficies"]').click()`);
await waitFor(`document.querySelectorAll('[data-placement-surface]').length === 2`);

const stage = await rect('[data-canvas-stage="true"]');
await click(stage.centerX, stage.y + stage.height * 0.83);
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 1 && document.querySelectorAll('button[aria-label^="Ajustar esquina"]').length === 4`);
const rugBefore = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); const canvas = object.querySelector('canvas'); return { left: parseFloat(object.style.left), top: parseFloat(object.style.top), width: parseFloat(object.style.width), height: parseFloat(object.style.height), canvas: Boolean(canvas) }; })()`);
let corner = await rect('button[aria-label^="Ajustar esquina 1"]');
await drag({ x: corner.centerX, y: corner.centerY }, { x: corner.centerX + 35, y: corner.centerY - 18 });
const rugAfter = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); return { left: parseFloat(object.style.left), top: parseFloat(object.style.top), width: parseFloat(object.style.width), height: parseFloat(object.style.height) }; })()`);
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Pared principal (heurística)Pared')?.click()`);
await waitFor(`document.querySelectorAll('button[aria-label^="Mover punto"]').length === 4`);
const surfaceMoveHandle = await rect('button[aria-label^="Mover superficie completa"]');
await drag({ x: surfaceMoveHandle.centerX, y: surfaceMoveHandle.centerY }, { x: surfaceMoveHandle.centerX + 24, y: surfaceMoveHandle.centerY + 18 });

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Cuadros')?.click()`);
await waitFor(`Array.from(document.querySelectorAll('button')).some(button => button.textContent.includes('Cuadro abstracto cálido'))`);
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Cuadro abstracto cálido'))?.click()`);
await waitFor(`document.body.textContent.includes('Objeto listo para colocar')`);
await click(stage.centerX + 80, stage.y + stage.height * 0.34);
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 2 && document.querySelectorAll('button[aria-label^="Ajustar esquina"]').length === 4`);
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === '4 esquinas')?.click()`);
await waitFor(`document.body.textContent.includes('Profundidad y perspectiva')`);
corner = await rect('button[aria-label^="Ajustar esquina 2"]');
await drag({ x: corner.centerX, y: corner.centerY }, { x: corner.centerX + 28, y: corner.centerY + 12 });

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === 'Definir')?.click()`);
await waitFor(`Array.from(document.querySelectorAll('button')).some(button => button.textContent.includes('Guía de perspectiva') && button.className.includes('bg-[#1f2421]'))`);
await click(stage.centerX - 120, stage.y + stage.height * 0.38);
await click(stage.centerX + 180, stage.y + stage.height * 0.38);

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Guardar proyecto'))?.click()`);
await waitFor(`document.querySelector('[role="dialog"] input')`);
await evaluate(`(() => { const input = document.querySelector('[role="dialog"] input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'Prueba perspectiva E2E'); input.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[role="dialog"] form').requestSubmit(); return true; })()`);
await waitFor(`document.body.textContent.includes('Prueba perspectiva E2E')`, 20_000);
const persisted = await evaluate(`new Promise((resolve, reject) => { const request = indexedDB.open('interior-color-studio'); request.onerror = () => reject(request.error); request.onsuccess = () => { const tx = request.result.transaction('projects', 'readonly'); const all = tx.objectStore('projects').getAll(); all.onerror = () => reject(all.error); all.onsuccess = () => { const project = all.result.filter(item => item.name === 'Prueba perspectiva E2E').sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).at(-1); const wall = project?.placementSurfaces?.find(item => item.type === 'wall'); resolve(project ? { id: project.id, version: project.version, surfaces: project.placementSurfaces?.length, wallX: wall?.points?.[0]?.x, surfaceMoved: wall?.points?.[0]?.x > project.originalImage.width * 0.045, objects: project.placedObjects?.length, perspectiveObjects: project.placedObjects?.filter(item => item.perspectivePoints && item.surfaceId).length, guide: Boolean(project.perspectiveGuide?.vanishingPoint1) } : null); }; }; })`);
if (!persisted?.id) throw new Error("El proyecto de perspectiva no fue persistido.");

await command("Page.navigate", { url: `http://localhost:3000/editor?project=${encodeURIComponent(persisted.id)}` });
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 2 && document.querySelectorAll('[data-placement-surface]').length === 2`, 20_000);
const restored = await evaluate(`({ objects: document.querySelectorAll('[data-placed-decor-object]').length, warped: document.querySelectorAll('[data-placed-decor-object] canvas').length, surfaces: document.querySelectorAll('[data-placement-surface]').length })`);

const downloadPath = "/tmp/interior-perspective-downloads";
await rm(downloadPath, { recursive: true, force: true }); await mkdir(downloadPath, { recursive: true });
await command("Browser.setDownloadBehavior", { behavior: "allow", downloadPath });
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Descargar'))?.click()`);
const started = Date.now(); let downloads = [];
while (Date.now() - started < 20_000) { downloads = (await readdir(downloadPath)).filter((name) => name.endsWith(".png")); if (downloads.length) break; await new Promise((resolve) => setTimeout(resolve, 200)); }

const summary = {
  heuristicSurfaces: persisted.surfaces === 2,
  movedSurfaceFirstX: persisted.wallX,
  wholeSurfaceMoved: persisted.surfaceMoved,
  rugWarpedOnFloor: rugBefore.canvas && rugBefore.width > 0 && rugBefore.height > 0,
  freeCornerChanged: Math.abs(rugBefore.left - rugAfter.left) > 1 || Math.abs(rugBefore.top - rugAfter.top) > 1 || Math.abs(rugBefore.width - rugAfter.width) > 1 || Math.abs(rugBefore.height - rugAfter.height) > 1,
  anchoredPerspectiveObjects: persisted.objects === 2 && persisted.perspectiveObjects === 2,
  guidePersisted: persisted.guide,
  version5: persisted.version === 5,
  restoredScene: restored.objects === 2 && restored.warped === 2 && restored.surfaces === 2,
  exportedPng: downloads[0] ?? false,
};
socket.close();
if (Object.values(summary).some((value) => value === false)) throw new Error(JSON.stringify(summary));
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
