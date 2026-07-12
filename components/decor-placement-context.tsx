"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDecorObjects } from "@/components/use-decor-objects";
import { useEditor } from "@/components/editor-context";
import {
  clampObjectToImage,
  getInitialObjectSize,
  normalizeObjectZIndexes,
} from "@/lib/decor/objectPlacementGeometry";
import {
  getPerspectiveScale,
  sortObjectsByDepth,
} from "@/lib/perspective/depthScale";
import {
  categoryForPlacedObject,
  centerFromAnchor,
  defaultPlacementForCategory,
  depthAtPoint,
  findSurfaceAtPoint,
  fitObjectToSurface,
  initialDepthScale,
  objectAnchorPoint,
  rectanglePerspectivePoints,
} from "@/lib/perspective/objectAnchoring";
import {
  clampPointToImage,
  createHeuristicSurfaces,
  translateSurface,
} from "@/lib/perspective/surfaceGeometry";
import type { DecorObject } from "@/types/decor-object";
import type { ImagePoint } from "@/types/editor";
import type {
  ObjectInteractionMode,
  PlacedDecorObject,
} from "@/types/placed-decor-object";
import type {
  PerspectiveGuide,
  PlacementSurface,
  PlacementSurfaceType,
} from "@/types/perspective";

type PlacementScene = {
  objects: PlacedDecorObject[];
  surfaces: PlacementSurface[];
  guide: PerspectiveGuide | null;
};
type PreparedScene = Pick<PlacementScene, "objects" | "surfaces" | "guide">;

type DecorPlacementContextValue = {
  placedObjects: PlacedDecorObject[];
  placementSurfaces: PlacementSurface[];
  perspectiveGuide: PerspectiveGuide | null;
  selectedObjectId: string | null;
  selectedSurfaceId: string | null;
  surfaceDraftPoints: ImagePoint[];
  surfaceDraftType: PlacementSurfaceType;
  pendingDecorObject: DecorObject | null;
  isPlacingObject: boolean;
  objectInteractionMode: ObjectInteractionMode;
  canUndo: boolean;
  canRedo: boolean;
  addPlacedObject: (
    object: DecorObject,
    point: ImagePoint,
  ) => PlacedDecorObject | null;
  updatePlacedObject: (
    id: string,
    changes: Partial<PlacedDecorObject>,
    recordHistory?: boolean,
  ) => void;
  finalizeObjectPlacement: (id: string, candidate: PlacedDecorObject) => void;
  deletePlacedObject: (id: string) => void;
  duplicatePlacedObject: (id: string) => void;
  selectPlacedObject: (id: string | null) => void;
  clearObjectSelection: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleObjectVisibility: (id: string) => void;
  toggleObjectLock: (id: string) => void;
  flipObjectHorizontal: (id: string) => void;
  flipObjectVertical: (id: string) => void;
  fitObjectPerspective: (id: string) => void;
  setFreeTransform: (id: string) => void;
  resetObjectPerspective: (id: string) => void;
  unanchorObject: (id: string) => void;
  cancelPendingObject: () => void;
  setObjectInteractionMode: (mode: ObjectInteractionMode) => void;
  addPlacementSurface: (
    type: PlacementSurfaceType,
    points: ImagePoint[],
    detected?: boolean,
  ) => PlacementSurface | null;
  updatePlacementSurface: (
    id: string,
    changes: Partial<PlacementSurface>,
    recordHistory?: boolean,
  ) => void;
  updateSurfacePoint: (
    id: string,
    index: number,
    point: ImagePoint,
    recordHistory?: boolean,
  ) => void;
  addSurfacePoint: (id: string) => void;
  removeSurfacePoint: (id: string) => void;
  movePlacementSurface: (
    id: string,
    dx: number,
    dy: number,
    recordHistory?: boolean,
  ) => void;
  deletePlacementSurface: (id: string) => void;
  selectPlacementSurface: (id: string | null) => void;
  detectPlacementSurfaces: () => void;
  beginSurfaceDraft: (type: PlacementSurfaceType) => void;
  addSurfaceDraftPoint: (point: ImagePoint) => void;
  finishSurfaceDraft: () => boolean;
  cancelSurfaceDraft: () => void;
  setPerspectiveGuide: (
    guide: PerspectiveGuide | null,
    recordHistory?: boolean,
  ) => void;
  replacePlacedObjects: (objects: PlacedDecorObject[]) => void;
  replacePlacementScene: (scene: PreparedScene) => void;
  prepareProjectRestore: (
    objects: PlacedDecorObject[],
    surfaces?: PlacementSurface[],
    guide?: PerspectiveGuide | null,
  ) => void;
  resetPlacedObjects: () => void;
  undo: () => void;
  redo: () => void;
  beginHistoryTransaction: () => void;
  commitHistoryTransaction: () => void;
};

const DecorPlacementContext = createContext<DecorPlacementContextValue | null>(
  null,
);

function cloneScene(scene: PlacementScene): PlacementScene {
  return {
    objects: scene.objects.map((object) => ({
      ...object,
      perspectivePoints: object.perspectivePoints
        ? {
            topLeft: { ...object.perspectivePoints.topLeft },
            topRight: { ...object.perspectivePoints.topRight },
            bottomRight: { ...object.perspectivePoints.bottomRight },
            bottomLeft: { ...object.perspectivePoints.bottomLeft },
          }
        : undefined,
    })),
    surfaces: scene.surfaces.map((surface) => ({
      ...surface,
      points: surface.points.map((point) => ({ ...point })),
    })),
    guide: scene.guide
      ? {
          ...scene.guide,
          vanishingPoint1: scene.guide.vanishingPoint1
            ? { ...scene.guide.vanishingPoint1 }
            : undefined,
          vanishingPoint2: scene.guide.vanishingPoint2
            ? { ...scene.guide.vanishingPoint2 }
            : undefined,
        }
      : null,
  };
}

function selectedId(objects: PlacedDecorObject[]) {
  return objects.find((object) => object.selected)?.id ?? null;
}
function selectedSurfaceId(surfaces: PlacementSurface[]) {
  return surfaces.find((surface) => surface.selected)?.id ?? null;
}

export function DecorPlacementProvider({ children }: { children: ReactNode }) {
  const editor = useEditor();
  const decor = useDecorObjects();
  const [sceneState, setSceneState] = useState<PlacementScene>({
    objects: [],
    surfaces: [],
    guide: null,
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null);
  const [surfaceDraftPoints, setSurfaceDraftPoints] = useState<ImagePoint[]>(
    [],
  );
  const [surfaceDraftType, setSurfaceDraftType] =
    useState<PlacementSurfaceType>("floor");
  const [objectInteractionMode, setObjectInteractionMode] =
    useState<ObjectInteractionMode>("idle");
  const [past, setPast] = useState<PlacementScene[]>([]);
  const [future, setFuture] = useState<PlacementScene[]>([]);
  const sceneRef = useRef(sceneState);
  const preparedRestoreRef = useRef<PreparedScene | null>(null);
  const previousImageRef = useRef<string | null | undefined>(undefined);
  const transactionRef = useRef<PlacementScene | null>(null);

  const setScene = useCallback((scene: PlacementScene) => {
    sceneRef.current = scene;
    setSceneState(scene);
    setSelectedObjectId(selectedId(scene.objects));
    setSelectedSurface(selectedSurfaceId(scene.surfaces));
  }, []);

  const commitScene = useCallback(
    (operation: (current: PlacementScene) => PlacementScene) => {
      const current = sceneRef.current;
      const next = operation(cloneScene(current));
      if (JSON.stringify(current) === JSON.stringify(next)) return;
      setPast((history) => [...history.slice(-49), cloneScene(current)]);
      setFuture([]);
      setScene(next);
    },
    [setScene],
  );

  const applyWithoutHistory = useCallback(
    (operation: (current: PlacementScene) => PlacementScene) => {
      const next = operation(cloneScene(sceneRef.current));
      setScene(next);
    },
    [setScene],
  );

  useEffect(() => {
    const imageKey = editor.image?.url ?? null;
    if (previousImageRef.current === undefined) {
      previousImageRef.current = imageKey;
      return;
    }
    if (previousImageRef.current === imageKey) return;
    previousImageRef.current = imageKey;
    const restored = preparedRestoreRef.current;
    preparedRestoreRef.current = null;
    setScene(
      restored
        ? {
            objects: normalizeObjectZIndexes(
              cloneScene({ ...restored }).objects,
            ),
            surfaces: cloneScene({ ...restored }).surfaces,
            guide: cloneScene({ ...restored }).guide,
          }
        : { objects: [], surfaces: [], guide: null },
    );
    setPast([]);
    setFuture([]);
    setSurfaceDraftPoints([]);
    setObjectInteractionMode("idle");
  }, [editor.image?.url, setScene]);

  useEffect(() => {
    if (!decor.pendingDecorObject || editor.activeTool === "objects") return;
    const timer = window.setTimeout(() => editor.setActiveTool("objects"), 0);
    return () => window.clearTimeout(timer);
  }, [decor.pendingDecorObject, editor]);

  const selectPlacedObject = useCallback(
    (id: string | null) =>
      applyWithoutHistory((current) => ({
        ...current,
        objects: current.objects.map((object) => ({
          ...object,
          selected: object.id === id,
        })),
        surfaces: current.surfaces.map((surface) => ({
          ...surface,
          selected: false,
        })),
      })),
    [applyWithoutHistory],
  );
  const selectPlacementSurface = useCallback(
    (id: string | null) =>
      applyWithoutHistory((current) => ({
        ...current,
        objects: current.objects.map((object) => ({
          ...object,
          selected: false,
        })),
        surfaces: current.surfaces.map((surface) => ({
          ...surface,
          selected: surface.id === id,
        })),
      })),
    [applyWithoutHistory],
  );

  const updatePlacedObject = useCallback(
    (id: string, changes: Partial<PlacedDecorObject>, recordHistory = true) => {
      const update = (current: PlacementScene): PlacementScene => ({
        ...current,
        objects: current.objects.map((object) =>
          object.id === id
            ? {
                ...object,
                ...changes,
                id,
                updatedAt: new Date().toISOString(),
                scaleX:
                  changes.width !== undefined
                    ? changes.width / object.originalWidth
                    : (changes.scaleX ?? object.scaleX),
                scaleY:
                  changes.height !== undefined
                    ? changes.height / object.originalHeight
                    : (changes.scaleY ?? object.scaleY),
              }
            : object,
        ),
      });
      if (recordHistory) commitScene(update);
      else applyWithoutHistory(update);
    },
    [applyWithoutHistory, commitScene],
  );

  const orderOperation = useCallback(
    (id: string, direction: "forward" | "backward" | "front" | "back") =>
      commitScene((current) => {
        const ordered = normalizeObjectZIndexes(current.objects);
        const index = ordered.findIndex((object) => object.id === id);
        if (index < 0) return current;
        if (direction === "front") ordered.push(ordered.splice(index, 1)[0]);
        else if (direction === "back")
          ordered.unshift(ordered.splice(index, 1)[0]);
        else {
          const target = direction === "forward" ? index + 1 : index - 1;
          if (target < 0 || target >= ordered.length) return current;
          [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        }
        return {
          ...current,
          objects: normalizeObjectZIndexes(
            ordered.map((object) =>
              object.id === id
                ? { ...object, zOrderMode: "manual" as const }
                : object,
            ),
          ),
        };
      }),
    [commitScene],
  );

  const resetPlacedObjects = useCallback(() => {
    preparedRestoreRef.current = null;
    transactionRef.current = null;
    setScene({ objects: [], surfaces: [], guide: null });
    setPast([]);
    setFuture([]);
    setSurfaceDraftPoints([]);
    setObjectInteractionMode("idle");
  }, [setScene]);

  const addPlacementSurface = useCallback(
    (type: PlacementSurfaceType, points: ImagePoint[], detected = false) => {
      if (!editor.dimensions || points.length < 3) return null;
      const now = new Date().toISOString();
      const count =
        sceneRef.current.surfaces.filter((surface) => surface.type === type)
          .length + 1;
      const label =
        type === "floor"
          ? "Piso"
          : type === "wall"
            ? "Pared"
            : type === "table"
              ? "Mesa"
              : type === "ceiling"
                ? "Techo"
                : "Superficie";
      const surface: PlacementSurface = {
        id: crypto.randomUUID(),
        name: `${label} ${count}`,
        type,
        points: points.map((point) =>
          clampPointToImage(point, editor.dimensions!),
        ),
        visible: true,
        locked: false,
        selected: true,
        detected,
        snapEnabled: true,
        createdAt: now,
        updatedAt: now,
      };
      commitScene((current) => ({
        ...current,
        objects: current.objects.map((object) => ({
          ...object,
          selected: false,
        })),
        surfaces: [
          ...current.surfaces.map((item) => ({ ...item, selected: false })),
          surface,
        ],
      }));
      return surface;
    },
    [commitScene, editor.dimensions],
  );

  const value = useMemo<DecorPlacementContextValue>(
    () => ({
      placedObjects: sceneState.objects,
      placementSurfaces: sceneState.surfaces,
      perspectiveGuide: sceneState.guide,
      selectedObjectId,
      selectedSurfaceId: selectedSurface,
      surfaceDraftPoints,
      surfaceDraftType,
      pendingDecorObject: decor.pendingDecorObject,
      isPlacingObject: Boolean(decor.pendingDecorObject),
      objectInteractionMode: decor.pendingDecorObject
        ? "placing"
        : objectInteractionMode,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      addPlacedObject: (object, point) => {
        if (!editor.dimensions) return null;
        const defaults = defaultPlacementForCategory(object.category);
        const surface = findSurfaceAtPoint(
          sceneRef.current.surfaces,
          point,
          defaults.surfaceType,
          Math.max(editor.dimensions.width, editor.dimensions.height) * 0.018,
        );
        const depth = depthAtPoint(surface, point, editor.dimensions);
        const size = getInitialObjectSize(object, editor.dimensions);
        const factor = initialDepthScale(
          object,
          depth,
          defaults.autoScaleByDepth && Boolean(surface),
        );
        let width = size.width * factor;
        let height = size.height * factor;
        const availableWidth = Math.max(
          16,
          2 * Math.min(point.x, editor.dimensions.width - point.x),
        );
        const availableHeight = Math.max(
          16,
          defaults.anchor === "bottom-center"
            ? point.y
            : defaults.anchor === "top-center"
              ? editor.dimensions.height - point.y
              : 2 * Math.min(point.y, editor.dimensions.height - point.y),
        );
        const fitAtAnchor = Math.min(
          1,
          availableWidth / Math.max(1, width),
          availableHeight / Math.max(1, height),
        );
        width *= fitAtAnchor;
        height *= fitAtAnchor;
        const center = centerFromAnchor(point, height, defaults.anchor);
        const now = new Date().toISOString();
        const placed = clampObjectToImage<PlacedDecorObject>(
          {
            id: crypto.randomUUID(),
            decorObjectId: object.id,
            name: object.name,
            assetUrl: object.assetUrl,
            assetType: object.assetType,
            originalWidth: object.width,
            originalHeight: object.height,
            x: center.x,
            y: center.y,
            width,
            height,
            scaleX: width / object.width,
            scaleY: height / object.height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            selected: true,
            zIndex: sceneRef.current.objects.length,
            flipX: false,
            flipY: false,
            lockAspectRatio: true,
            surfaceType: surface?.type ?? defaults.surfaceType,
            anchor: defaults.anchor,
            depth,
            perspectiveMode: surface ? "surface" : "none",
            surfaceId: surface?.id,
            autoScaleByDepth: defaults.autoScaleByDepth && Boolean(surface),
            baseContactOffset: 0,
            zOrderMode: surface ? "depth" : "manual",
            createdAt: now,
            updatedAt: now,
          },
          editor.dimensions,
        );
        if (
          surface &&
          (object.category === "alfombras" || object.category === "cuadros")
        )
          placed.perspectivePoints = fitObjectToSurface(placed, surface);
        commitScene((current) => ({
          ...current,
          objects: sortObjectsByDepth([
            ...current.objects.map((item) => ({ ...item, selected: false })),
            placed,
          ]),
        }));
        void decor.clearPendingDecorObject();
        setObjectInteractionMode("idle");
        return placed;
      },
      updatePlacedObject,
      finalizeObjectPlacement: (id, candidate) => {
        if (!editor.dimensions) return;
        const anchorPoint = objectAnchorPoint(candidate);
        const preferred = candidate.surfaceType;
        const surface = findSurfaceAtPoint(
          sceneRef.current.surfaces,
          anchorPoint,
          preferred,
          Math.max(editor.dimensions.width, editor.dimensions.height) * 0.02,
        );
        let next = {
          ...candidate,
          surfaceId: surface?.id,
          surfaceType: surface?.type ?? candidate.surfaceType,
          perspectiveMode: surface
            ? candidate.perspectiveMode === "none"
              ? ("surface" as const)
              : candidate.perspectiveMode
            : candidate.perspectiveMode,
          depth: depthAtPoint(surface, anchorPoint, editor.dimensions),
        };
        if (candidate.autoScaleByDepth) {
          const category = categoryForPlacedObject(candidate);
          const previousScale = getPerspectiveScale(candidate.depth, category);
          const nextScale = getPerspectiveScale(next.depth, category);
          const ratio = nextScale / Math.max(0.01, previousScale);
          const height = candidate.height * ratio;
          const center = centerFromAnchor(
            anchorPoint,
            height,
            candidate.anchor,
            candidate.baseContactOffset,
          );
          const perspectivePoints = candidate.perspectivePoints
            ? {
                topLeft: {
                  x:
                    anchorPoint.x +
                    (candidate.perspectivePoints.topLeft.x - anchorPoint.x) *
                      ratio,
                  y:
                    anchorPoint.y +
                    (candidate.perspectivePoints.topLeft.y - anchorPoint.y) *
                      ratio,
                },
                topRight: {
                  x:
                    anchorPoint.x +
                    (candidate.perspectivePoints.topRight.x - anchorPoint.x) *
                      ratio,
                  y:
                    anchorPoint.y +
                    (candidate.perspectivePoints.topRight.y - anchorPoint.y) *
                      ratio,
                },
                bottomRight: {
                  x:
                    anchorPoint.x +
                    (candidate.perspectivePoints.bottomRight.x -
                      anchorPoint.x) *
                      ratio,
                  y:
                    anchorPoint.y +
                    (candidate.perspectivePoints.bottomRight.y -
                      anchorPoint.y) *
                      ratio,
                },
                bottomLeft: {
                  x:
                    anchorPoint.x +
                    (candidate.perspectivePoints.bottomLeft.x - anchorPoint.x) *
                      ratio,
                  y:
                    anchorPoint.y +
                    (candidate.perspectivePoints.bottomLeft.y - anchorPoint.y) *
                      ratio,
                },
              }
            : undefined;
          next = {
            ...next,
            perspectivePoints,
            x: center.x,
            y: center.y,
            width: candidate.width * ratio,
            height,
          };
        }
        commitScene((current) => {
          const objects = current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  ...next,
                  id,
                  scaleX: next.width / object.originalWidth,
                  scaleY: next.height / object.originalHeight,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          );
          return {
            ...current,
            objects:
              next.zOrderMode === "depth"
                ? sortObjectsByDepth(objects)
                : objects,
          };
        });
      },
      deletePlacedObject: (id) =>
        commitScene((current) => ({
          ...current,
          objects: normalizeObjectZIndexes(
            current.objects.filter((object) => object.id !== id),
          ),
        })),
      duplicatePlacedObject: (id) => {
        if (!editor.dimensions) return;
        commitScene((current) => {
          const source = current.objects.find((object) => object.id === id);
          if (!source) return current;
          const now = new Date().toISOString();
          const perspectivePoints = source.perspectivePoints
            ? {
                topLeft: {
                  x: source.perspectivePoints.topLeft.x + 20,
                  y: source.perspectivePoints.topLeft.y + 20,
                },
                topRight: {
                  x: source.perspectivePoints.topRight.x + 20,
                  y: source.perspectivePoints.topRight.y + 20,
                },
                bottomRight: {
                  x: source.perspectivePoints.bottomRight.x + 20,
                  y: source.perspectivePoints.bottomRight.y + 20,
                },
                bottomLeft: {
                  x: source.perspectivePoints.bottomLeft.x + 20,
                  y: source.perspectivePoints.bottomLeft.y + 20,
                },
              }
            : undefined;
          const duplicate = clampObjectToImage<PlacedDecorObject>(
            {
              ...source,
              perspectivePoints,
              id: crypto.randomUUID(),
              name: `${source.name} copia`,
              x: source.x + 20,
              y: source.y + 20,
              selected: true,
              locked: false,
              zIndex: current.objects.length,
              createdAt: now,
              updatedAt: now,
            },
            editor.dimensions!,
          );
          return {
            ...current,
            objects: normalizeObjectZIndexes([
              ...current.objects.map((object) => ({
                ...object,
                selected: false,
              })),
              duplicate,
            ]),
          };
        });
      },
      selectPlacedObject,
      clearObjectSelection: () => selectPlacedObject(null),
      bringForward: (id) => orderOperation(id, "forward"),
      sendBackward: (id) => orderOperation(id, "backward"),
      bringToFront: (id) => orderOperation(id, "front"),
      sendToBack: (id) => orderOperation(id, "back"),
      toggleObjectVisibility: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  visible: !object.visible,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      toggleObjectLock: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  locked: !object.locked,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      flipObjectHorizontal: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  flipX: !object.flipX,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      flipObjectVertical: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  flipY: !object.flipY,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      fitObjectPerspective: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) => {
            const surface = current.surfaces.find(
              (item) => item.id === object.surfaceId,
            );
            return object.id === id && surface
              ? {
                  ...object,
                  perspectiveMode: "surface" as const,
                  perspectivePoints: fitObjectToSurface(object, surface),
                  updatedAt: new Date().toISOString(),
                }
              : object;
          }),
        })),
      setFreeTransform: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  perspectiveMode: "free-transform" as const,
                  perspectivePoints:
                    object.perspectivePoints ??
                    rectanglePerspectivePoints(object),
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      resetObjectPerspective: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  perspectiveMode: "none" as const,
                  perspectivePoints: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      unanchorObject: (id) =>
        commitScene((current) => ({
          ...current,
          objects: current.objects.map((object) =>
            object.id === id
              ? {
                  ...object,
                  surfaceId: undefined,
                  surfaceType: "free" as const,
                  perspectiveMode:
                    object.perspectiveMode === "surface"
                      ? ("none" as const)
                      : object.perspectiveMode,
                  autoScaleByDepth: false,
                  zOrderMode: "manual" as const,
                  updatedAt: new Date().toISOString(),
                }
              : object,
          ),
        })),
      cancelPendingObject: () => {
        void decor.clearPendingDecorObject();
        setObjectInteractionMode("idle");
      },
      setObjectInteractionMode,
      addPlacementSurface,
      updatePlacementSurface: (id, changes, recordHistory = true) => {
        const operation = (current: PlacementScene): PlacementScene => ({
          ...current,
          surfaces: current.surfaces.map((surface) =>
            surface.id === id
              ? {
                  ...surface,
                  ...changes,
                  id,
                  updatedAt: new Date().toISOString(),
                }
              : surface,
          ),
        });
        if (recordHistory) commitScene(operation);
        else applyWithoutHistory(operation);
      },
      updateSurfacePoint: (id, index, point, recordHistory = true) => {
        if (!editor.dimensions) return;
        const operation = (current: PlacementScene): PlacementScene => ({
          ...current,
          surfaces: current.surfaces.map((surface) =>
            surface.id === id
              ? {
                  ...surface,
                  points: surface.points.map((item, pointIndex) =>
                    pointIndex === index
                      ? clampPointToImage(point, editor.dimensions!)
                      : item,
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : surface,
          ),
        });
        if (recordHistory) commitScene(operation);
        else applyWithoutHistory(operation);
      },
      addSurfacePoint: (id) =>
        commitScene((current) => ({
          ...current,
          surfaces: current.surfaces.map((surface) => {
            if (surface.id !== id || surface.locked) return surface;
            let edge = 0;
            let longest = -1;
            surface.points.forEach((point, index) => {
              const next = surface.points[(index + 1) % surface.points.length];
              const length = Math.hypot(next.x - point.x, next.y - point.y);
              if (length > longest) {
                longest = length;
                edge = index;
              }
            });
            const next = surface.points[(edge + 1) % surface.points.length];
            const points = [...surface.points];
            points.splice(edge + 1, 0, {
              x: (surface.points[edge].x + next.x) / 2,
              y: (surface.points[edge].y + next.y) / 2,
            });
            return { ...surface, points, updatedAt: new Date().toISOString() };
          }),
        })),
      removeSurfacePoint: (id) =>
        commitScene((current) => ({
          ...current,
          surfaces: current.surfaces.map((surface) =>
            surface.id === id && !surface.locked && surface.points.length > 3
              ? {
                  ...surface,
                  points: surface.points.slice(0, -1),
                  updatedAt: new Date().toISOString(),
                }
              : surface,
          ),
        })),
      movePlacementSurface: (id, dx, dy, recordHistory = true) => {
        if (!editor.dimensions) return;
        const operation = (current: PlacementScene): PlacementScene => ({
          ...current,
          surfaces: current.surfaces.map((surface) =>
            surface.id === id && !surface.locked
              ? {
                  ...translateSurface(surface, dx, dy, editor.dimensions!),
                  updatedAt: new Date().toISOString(),
                }
              : surface,
          ),
        });
        if (recordHistory) commitScene(operation);
        else applyWithoutHistory(operation);
      },
      deletePlacementSurface: (id) =>
        commitScene((current) => ({
          ...current,
          surfaces: current.surfaces.filter((surface) => surface.id !== id),
          objects: current.objects.map((object) =>
            object.surfaceId === id
              ? {
                  ...object,
                  surfaceId: undefined,
                  surfaceType: "free" as const,
                  perspectiveMode:
                    object.perspectiveMode === "surface"
                      ? ("none" as const)
                      : object.perspectiveMode,
                  autoScaleByDepth: false,
                }
              : object,
          ),
        })),
      selectPlacementSurface,
      detectPlacementSurfaces: () => {
        if (editor.dimensions)
          commitScene((current) => ({
            ...current,
            surfaces: [
              ...current.surfaces.filter((surface) => !surface.detected),
              ...createHeuristicSurfaces(editor.dimensions!),
            ],
          }));
      },
      beginSurfaceDraft: (type) => {
        setSurfaceDraftType(type);
        setSurfaceDraftPoints([]);
        setObjectInteractionMode("surface");
        editor.setActiveTool("define-surface");
      },
      addSurfaceDraftPoint: (point) =>
        setSurfaceDraftPoints((points) => [...points, point]),
      finishSurfaceDraft: () => {
        if (surfaceDraftPoints.length < 3) return false;
        const added = addPlacementSurface(surfaceDraftType, surfaceDraftPoints);
        setSurfaceDraftPoints([]);
        setObjectInteractionMode("idle");
        editor.setActiveTool("objects");
        return Boolean(added);
      },
      cancelSurfaceDraft: () => {
        setSurfaceDraftPoints([]);
        setObjectInteractionMode("idle");
        editor.setActiveTool("objects");
      },
      setPerspectiveGuide: (guide, recordHistory = true) => {
        const operation = (current: PlacementScene): PlacementScene => ({
          ...current,
          guide,
        });
        if (recordHistory) commitScene(operation);
        else applyWithoutHistory(operation);
      },
      replacePlacedObjects: (objects) => {
        transactionRef.current = null;
        setScene({
          ...sceneRef.current,
          objects: normalizeObjectZIndexes(
            cloneScene({ ...sceneRef.current, objects }).objects,
          ),
        });
        setPast([]);
        setFuture([]);
        setObjectInteractionMode("idle");
      },
      replacePlacementScene: (scene) => {
        transactionRef.current = null;
        setScene(cloneScene(scene));
        setPast([]);
        setFuture([]);
        setObjectInteractionMode("idle");
      },
      prepareProjectRestore: (objects, surfaces = [], guide = null) => {
        preparedRestoreRef.current = cloneScene({ objects, surfaces, guide });
      },
      resetPlacedObjects,
      undo: () => {
        const previous = past.at(-1);
        if (!previous) return;
        setFuture((history) =>
          [cloneScene(sceneRef.current), ...history].slice(0, 50),
        );
        setPast((history) => history.slice(0, -1));
        setScene(cloneScene(previous));
      },
      redo: () => {
        const next = future[0];
        if (!next) return;
        setPast((history) => [
          ...history.slice(-49),
          cloneScene(sceneRef.current),
        ]);
        setFuture((history) => history.slice(1));
        setScene(cloneScene(next));
      },
      beginHistoryTransaction: () => {
        transactionRef.current ??= cloneScene(sceneRef.current);
      },
      commitHistoryTransaction: () => {
        const snapshot = transactionRef.current;
        transactionRef.current = null;
        if (
          !snapshot ||
          JSON.stringify(snapshot) === JSON.stringify(sceneRef.current)
        )
          return;
        setPast((history) => [...history.slice(-49), snapshot]);
        setFuture([]);
      },
    }),
    [
      addPlacementSurface,
      applyWithoutHistory,
      commitScene,
      decor,
      editor,
      future,
      objectInteractionMode,
      orderOperation,
      past,
      resetPlacedObjects,
      sceneState,
      selectPlacedObject,
      selectPlacementSurface,
      selectedObjectId,
      selectedSurface,
      setScene,
      surfaceDraftPoints,
      surfaceDraftType,
      updatePlacedObject,
    ],
  );

  return (
    <DecorPlacementContext.Provider value={value}>
      {children}
    </DecorPlacementContext.Provider>
  );
}

export function useDecorPlacement() {
  const context = useContext(DecorPlacementContext);
  if (!context)
    throw new Error(
      "useDecorPlacement debe usarse dentro de DecorPlacementProvider.",
    );
  return context;
}
