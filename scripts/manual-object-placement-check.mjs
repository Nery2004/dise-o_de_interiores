import { readdir, mkdir, rm } from "node:fs/promises";

const pages = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("Chrome debe ejecutarse con --remote-debugging-port=9222.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let commandId = 0;
const commands = new Map();
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const pending = commands.get(message.id);
  if (!pending) return;
  commands.delete(message.id);
  if (message.error) pending.reject(new Error(message.error.message)); else pending.resolve(message.result);
};
function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => commands.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(expression, timeout = 12_000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timeout: ${expression}`);
}
async function rect(selector) {
  return evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return null; const bounds = element.getBoundingClientRect(); return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, centerX: bounds.x + bounds.width / 2, centerY: bounds.y + bounds.height / 2 }; })()`);
}
async function mouseDrag(start, end) {
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: start.x, y: start.y, button: "left", buttons: 1, clickCount: 1 });
  for (let step = 1; step <= 5; step += 1) await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: start.x + (end.x - start.x) * step / 5, y: start.y + (end.y - start.y) * step / 5, button: "left", buttons: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: end.x, y: end.y, button: "left", buttons: 0, clickCount: 1 });
}
async function key(key, code, virtualKeyCode, modifiers = 0) {
  await command("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: virtualKeyCode, nativeVirtualKeyCode: virtualKeyCode, modifiers });
}

await command("Runtime.enable");
await command("Page.enable");
await command("Page.navigate", { url: "http://localhost:3000/objects" });
await waitFor(`location.pathname === '/objects'`);
await waitFor(`document.querySelector('button[aria-label^="Usar Sillón moderno beige"]')`);
await evaluate(`document.querySelector('button[aria-label^="Usar Sillón moderno beige"]').click()`);
await waitFor(`location.pathname === '/editor'`);
await waitFor(`document.querySelector('input[type="file"]')`);
await evaluate(`(async () => { const input = document.querySelector('input[type="file"]'); const blob = await fetch('/interior-studio-room.png').then(response => response.blob()); const file = new File([blob], 'room.png', { type: 'image/png' }); const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await waitFor(`document.querySelector('[data-canvas-stage="true"]') && document.body.textContent.includes('Haz clic sobre la habitación para colocar el objeto.')`);

const stage = await rect('[data-canvas-stage="true"]');
await mouseDrag({ x: stage.centerX, y: stage.centerY }, { x: stage.centerX, y: stage.centerY });
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 1`);
const placedAt = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); return { left: parseFloat(object.style.left), top: parseFloat(object.style.top), width: parseFloat(object.style.width), height: parseFloat(object.style.height) }; })()`);

let objectRect = await rect('[data-placed-decor-object]');
await mouseDrag({ x: objectRect.centerX, y: objectRect.centerY }, { x: objectRect.centerX + 80, y: objectRect.centerY + 45 });
const movedTo = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); return { left: parseFloat(object.style.left), top: parseFloat(object.style.top) }; })()`);

const resizeHandle = await rect('button[aria-label^="Redimensionar"]');
const sizeBefore = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); return { width: parseFloat(object.style.width), height: parseFloat(object.style.height) }; })()`);
await mouseDrag({ x: resizeHandle.centerX, y: resizeHandle.centerY }, { x: resizeHandle.centerX + 55, y: resizeHandle.centerY + 55 });
const sizeAfter = await evaluate(`(() => { const object = document.querySelector('[data-placed-decor-object]'); return { width: parseFloat(object.style.width), height: parseFloat(object.style.height) }; })()`);

const rotateHandle = await rect('button[aria-label^="Rotar"]');
objectRect = await rect('[data-placed-decor-object]');
await mouseDrag({ x: rotateHandle.centerX, y: rotateHandle.centerY }, { x: objectRect.centerX + objectRect.width / 2 + 35, y: objectRect.centerY });
const rotation = await evaluate(`document.querySelector('[data-placed-decor-object]').style.transform`);

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim().startsWith('Mano'))?.click()`);
await new Promise((resolve) => setTimeout(resolve, 150));
const positionBeforeHand = await evaluate(`parseFloat(document.querySelector('[data-placed-decor-object]').style.left)`);
objectRect = await rect('[data-placed-decor-object]');
await mouseDrag({ x: objectRect.centerX, y: objectRect.centerY }, { x: objectRect.centerX + 90, y: objectRect.centerY + 20 });
const positionAfterHand = await evaluate(`parseFloat(document.querySelector('[data-placed-decor-object]').style.left)`);

await evaluate(`document.querySelector('button[aria-label="Duplicar objeto"]')?.click()`);
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 2`);
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim().startsWith('Seleccionar'))?.click()`);
await key("Delete", "Delete", 46);
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 1`);
await key("z", "KeyZ", 90, 2);
await waitFor(`document.querySelectorAll('[data-placed-decor-object]').length === 2`);

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Comparar Antes'))?.click()`);
await waitFor(`document.querySelector('[role="slider"][aria-label="Posición de comparación"]') && document.querySelectorAll('[data-placed-decor-object]').length === 2`);
const clippedInComparison = await evaluate(`Boolean(document.querySelector('[data-placed-decor-object]')?.parentElement?.parentElement?.style.clipPath)`);

await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Guardar proyecto'))?.click()`);
await waitFor(`document.querySelector('[role="dialog"] input')`);
await evaluate(`(() => { const input = document.querySelector('[role="dialog"] input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(input, 'Prueba objetos E2E'); input.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[role="dialog"] form').requestSubmit(); return true; })()`);
await waitFor(`document.body.textContent.includes('Prueba objetos E2E')`, 20_000);
const projectId = await evaluate(`new Promise((resolve, reject) => { const request = indexedDB.open('interior-color-studio'); request.onerror = () => reject(request.error); request.onsuccess = () => { const tx = request.result.transaction('projects', 'readonly'); const all = tx.objectStore('projects').getAll(); all.onerror = () => reject(all.error); all.onsuccess = () => resolve(all.result.find(project => project.name === 'Prueba objetos E2E')?.id ?? null); }; })`);
if (!projectId) throw new Error("El proyecto no fue persistido.");
await command("Page.navigate", { url: `http://localhost:3000/editor?project=${encodeURIComponent(projectId)}` });
await waitFor(`location.search.includes('project=') && document.querySelectorAll('[data-placed-decor-object]').length === 2`, 20_000);
const restored = await evaluate(`Array.from(document.querySelectorAll('[data-placed-decor-object]')).map(object => ({ left: parseFloat(object.style.left), top: parseFloat(object.style.top), width: parseFloat(object.style.width) }))`);

const downloadPath = "/tmp/interior-color-studio-downloads";
await rm(downloadPath, { recursive: true, force: true });
await mkdir(downloadPath, { recursive: true });
await command("Browser.setDownloadBehavior", { behavior: "allow", downloadPath });
await evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.includes('Descargar'))?.click()`);
const downloadStarted = Date.now();
let downloads = [];
while (Date.now() - downloadStarted < 20_000) {
  downloads = (await readdir(downloadPath)).filter((name) => name.endsWith(".png"));
  if (downloads.length) break;
  await new Promise((resolve) => setTimeout(resolve, 200));
}
if (!downloads.length) throw new Error("No se generó la exportación PNG.");

const summary = {
  placedCentered: Math.abs(placedAt.left - 847) < 3 && Math.abs(placedAt.top - 464.5) < 3,
  movedOnlyObject: movedTo.left > placedAt.left && movedTo.top > placedAt.top,
  resizedProportionally: Math.abs(sizeAfter.width - sizeBefore.width) > 1 && Math.abs(sizeAfter.width / sizeAfter.height - sizeBefore.width / sizeBefore.height) < 0.01,
  rotatedAroundCenter: rotation.includes("rotate(") && !rotation.includes("rotate(0deg)"),
  handDidNotMoveObject: positionBeforeHand === positionAfterHand,
  comparisonUsesEditedClip: clippedInComparison,
  duplicateDeleteUndo: restored.length === 2,
  projectRestoredObjects: restored.length === 2 && restored.every((object) => object.width > 0),
  exportedPng: downloads[0],
};
socket.close();
if (Object.values(summary).some((value) => value === false)) throw new Error(JSON.stringify(summary));
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
