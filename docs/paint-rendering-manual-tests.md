# Pruebas manuales del motor de pintura

Ejecutar en Chrome, Safari y Firefox de escritorio; repetir los casos marcados en un móvil real. Usar una copia del proyecto y conservar el HEX, parámetros y exportación para comparar. La referencia es una simulación visual, no una muestra física de pintura.

## Preparación

1. Abrir una foto sRGB con pared cálida, otra con pared fría, una pared oscura y otra con textura/reflejo.
2. Usar una máscara que llegue a un borde de alto contraste y otra que incluya sombra lateral.
3. Mantener `paint-simulation`, Base Blanca, intensidad 100, imprimación 100, sombras 90, textura 90, feather 4 y calidad Alta como punto de partida.
4. Exportar PNG en cada caso importante y compararlo a igual tamaño y zoom con el editor.

## Matriz funcional

| Caso | Acción | Resultado esperado |
|---|---|---|
| Color claro | Aplicar blanco cálido sobre gris oscuro | Aclara claramente; la esquina sombreada sigue siendo más oscura y no hay blanco plano. |
| Color oscuro | Aplicar azul profundo sobre pared blanca | El color es inequívoco; reflejos excepcionales permanecen, pero la pared clara uniforme sí acepta el tono oscuro. |
| Pared cálida | Aplicar verde salvia sobre beige | El midtone se ve salvia, sin dominante amarilla evidente. |
| Pared amarilla | Aplicar azul medio | El resultado se ve azul, no verde. |
| Pared fría | Aplicar terracota sobre azul | El resultado se ve terracota, no violeta. |
| Base Blanca | Alternar directo/Base Blanca | Base Blanca reduce la contaminación original sin borrar luz, sombra o textura. |
| Intensidad | Probar 0, 50, 100, 150 y 200 | 0 conserva el color; 50 es útil; 100 cubre con claridad; 150–200 refuerzan sin destruir detalle ni clipping. |
| Imprimación | Probar 0, 50 y 100 | Cambia la neutralización de la dominante de forma progresiva, sin cambiar el alpha del borde. |
| Sombras | Probar preservación 0 y 100 | 100 mantiene mejor la jerarquía oscura; ningún valor debe producir negro puro abrupto. |
| Textura | Probar preservación 0 y 100 | El grano de pared cambia; bordes de cuadros/objetos no deben crear halos evidentes. |
| Reflejo | Pintar pared con ventana o lámpara reflejada | El reflejo no desaparece ni se satura con el color; la transición usa un knee suave. |
| Feather | Probar 0, 5, 10, 20 y 40 px | 0 es duro y sin fuga; los demás aumentan gradualmente la transición, simétrica y sin borde claro/oscuro. |
| Blend modes | Recorrer los siete modos | Todos funcionan en editor y exportación; `paint-simulation` es el recomendado. Los otros son efectos artísticos, no modelos físicos. |
| Calidad | Comparar Borrador, Alta y Ultra | Geometría y color se mantienen; cambia resolución/detalle. Alta es interactiva y Ultra se usa en exportación. |
| Comparador | Alternar antes/después | El lado pintado coincide con el editor para los mismos parámetros. |
| Exportación | Comparar Alta del editor con PNG Ultra | No hay cambio visible de matiz ni feather; pequeñas diferencias de detalle por escala son aceptables. |
| Propuesta/miniatura | Crear propuesta y reabrir miniatura | Conserva color, Base Blanca, intensidad y feather; JPEG puede introducir compresión leve. |
| Móvil | Cambiar color rápidamente y exportar | El último color gana, no aparecen flashes tardíos y la interfaz no queda bloqueada permanentemente. |

## Inspección de halos y banding

- Ver el límite de máscara al 100 %, 200 % y 400 % sobre fondo muy claro y muy oscuro. No debe existir una línea de color distinta a ambos lados.
- Revisar gradientes suaves sin zoom y a 200 %. No debe aparecer posterización nueva; distinguir banding ya presente en el JPEG original.
- En feather, comprobar que la pintura se compone una sola vez y que `opacity` de selección no altera el PNG.

## Registro de resultado

Anotar navegador/dispositivo, imagen, máscara, HEX, parámetros, si pasó, captura del editor, PNG y diferencia observada. Registrar por separado variaciones de pantalla, perfil de color o compresión; no ocultarlas como si fueran precisión física.
