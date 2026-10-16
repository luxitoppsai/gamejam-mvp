# Arte de referencia (provisional)

**Esto NO es el arte final.** Son assets de terceros con licencia libre para prototipar y como referencia visual de estilo. El arte definitivo del juego es original (ver `specs/constitution.md`).

## Contenido

| Carpeta | Pack | Autor | Licencia | Uso previsto |
|---------|------|-------|----------|--------------|
| `kenney/tiny-town/` | [Tiny Town](https://kenney.nl/assets/tiny-town) | Kenney (kenney.nl) | CC0 1.0 | Tiles de pasto, tierra, árboles (verdes y naranjas), cercas, herramientas e ítems (pala, pico, hacha, balde) |
| `kenney/tiny-dungeon/` | [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | Kenney (kenney.nl) | CC0 1.0 | Personajes de 16x16 como placeholder de los brigadistas, cofres, pociones |

Cada carpeta incluye `License.txt` del autor, `Preview.png` (mapa visual de todos los tiles), `tilemap.png` (con 1 px de separación) y `tilemap_packed.png` (sin separación).

## Formato de las hojas

- Tile **16 x 16 px**, igual que `TILE_SIZE` del proyecto.
- 12 columnas x 11 filas = 132 tiles.
- `tilemap.png`: 203 x 186 px, 1 px entre tiles. `tilemap_packed.png`: 192 x 176 px, sin separación (usar este en Phaser con `frameWidth: 16, frameHeight: 16`).

## Reglas

1. Los assets de esta carpeta son **solo referencia/provisionales**. Si un asset llega al juego final, debe reemplazarse por arte original.
2. No mezclar assets de otras fuentes aquí sin verificar su licencia y copiar su `License.txt`.
3. Antes de publicar el juego, revisar qué tiles de Kenney siguen en uso y reemplazarlos o conservar la atribución (opcional en CC0, pero recomendada).
4. Para cargar una hoja en Phaser, copiarla a `public/` de la PoC que la use (no referenciar fuera del paquete).

Descartado: Kenney *Particle Pack* (partículas suaves de alta resolución que chocan con el pixel art de 16 bits; 14 MB).