export const howItWorksSteps = [
  { title: "Sube una foto", description: "Usa una fotografía de tu habitación en su resolución original.", icon: "upload" },
  { title: "Detecta o selecciona las paredes", description: "Comienza con detección asistida o dibuja la zona manualmente.", icon: "scan" },
  { title: "Prueba colores y combinaciones", description: "Explora tonos interiores y ajusta cada selección con precisión.", icon: "palette" },
  { title: "Guarda o descarga el resultado", description: "Conserva proyectos localmente o exporta la imagen terminada.", icon: "download" },
] as const;

export const landingFeatures = [
  { title: "Detección inteligente de paredes", description: "Prepara selecciones iniciales con proveedores configurables.", icon: "sparkles" },
  { title: "Selección manual y corrección", description: "Ajusta vértices y refina bordes con herramientas de pincel.", icon: "pen" },
  { title: "Biblioteca de colores", description: "Busca tonos por ambiente, subtono y tipo de habitación.", icon: "swatch" },
  { title: "Comparador antes y después", description: "Revisa original y edición con deslizador o vistas paralelas.", icon: "compare" },
  { title: "Múltiples propuestas", description: "Guarda opciones distintas para una misma habitación.", icon: "layers" },
  { title: "Exportación original", description: "Descarga el resultado manteniendo la resolución de la fotografía.", icon: "image" },
  { title: "Proyectos locales", description: "Continúa tus ideas desde el mismo dispositivo mediante IndexedDB.", icon: "folder" },
  { title: "Paletas personalizadas", description: "Combina colores propios y paletas guardadas para cada estudio.", icon: "droplets" },
] as const;

export const audiences = [
  ["Propietarios", "Para explorar opciones antes de transformar una habitación."],
  ["Diseñadores de interiores", "Para presentar alternativas visuales con claridad."],
  ["Arquitectos", "Para estudiar color dentro del contexto real del espacio."],
  ["Pintores", "Para conversar con clientes sobre tonos y superficies."],
  ["Asesores de decoración", "Para construir paletas coherentes alrededor del ambiente."],
  ["Tiendas de pintura", "Para acompañar la elección de color con una referencia visual."],
] as const;

export const faqItems = [
  ["¿Necesito crear una cuenta?", "No. Actualmente puedes usar el editor y guardar proyectos localmente sin crear una cuenta."],
  ["¿La aplicación detecta todas las paredes automáticamente?", "No se promete una detección perfecta. Puedes usar la detección disponible y corregir o crear selecciones manualmente."],
  ["¿Puedo corregir una selección?", "Sí. Puedes mover puntos, añadir o eliminar vértices y refinar zonas con pinceles de añadir y quitar."],
  ["¿Las imágenes se guardan en internet?", "Los proyectos se guardan localmente por defecto. El procesamiento puede variar si habilitas un proveedor externo de IA."],
  ["¿Puedo descargar el resultado?", "Sí. El editor permite exportar la edición en la resolución original de la imagen."],
  ["¿Funciona en celular?", "La interfaz es responsive y admite interacción táctil, aunque una pantalla amplia facilita los ajustes precisos."],
  ["¿Puedo guardar varios diseños?", "Sí. Cada proyecto puede incluir varias propuestas de color para comparar."],
  ["¿Los colores se verán exactamente iguales en la pared real?", "No necesariamente. La apariencia puede variar por la iluminación, la cámara, la pantalla, el acabado de pintura y la superficie real."],
] as const;
