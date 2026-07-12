"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@/components/editor-context";
import {
  analyzeWallBase,
  analysisToWhiteBaseSummary,
  createWallAnalysisKey,
  whiteBaseSummaryToAnalysis,
} from "@/lib/paint/wallBaseAnalysisService";
import {
  DEFAULT_WHITE_BASE_SETTINGS,
  getRecommendedWhiteBaseSettings,
} from "@/lib/paint/whiteBaseOptimizer";
import type { WallMask, WhiteBaseSettings } from "@/types/editor";

type AnalysisStatus = "idle" | "analyzing" | "ready" | "error";

type ScheduledAnalysis = {
  cancel: () => void;
};

function scheduleBackgroundAnalysis(callback: () => void): ScheduledAnalysis {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: 400 });
    return { cancel: () => window.cancelIdleCallback(id) };
  }
  const id = window.setTimeout(callback, 0);
  return { cancel: () => window.clearTimeout(id) };
}

export function useWallBaseAnalysis(mask: WallMask | undefined) {
  const { image, setWhiteBaseAnalysis } = useEditor();
  const [statusState, setStatusState] = useState<{
    key: string | null;
    status: AnalysisStatus;
  }>({ key: null, status: "idle" });
  const activeControllerRef = useRef<AbortController | null>(null);
  const analysisKey = useMemo(
    () => (image && mask ? createWallAnalysisKey(image, mask) : null),
    [image, mask],
  );
  const currentAnalysis =
    mask?.whiteBaseSettings?.analysisKey === analysisKey
      ? whiteBaseSummaryToAnalysis(mask.whiteBaseSettings)
      : null;
  const status =
    statusState.key === analysisKey ? statusState.status : "idle";

  const persistAnalysis = useCallback(
    (
      targetMask: WallMask,
      key: string,
      analysis: Awaited<ReturnType<typeof analyzeWallBase>>["analysis"],
    ) => {
      const existing: WhiteBaseSettings = {
        ...DEFAULT_WHITE_BASE_SETTINGS,
        ...targetMask.whiteBaseSettings,
      };
      const recommendation = getRecommendedWhiteBaseSettings(analysis);
      const recommendedSettings = {
        neutralizationStrength: recommendation.neutralizationStrength,
        saturationReduction: recommendation.saturationReduction,
        warmthCorrection: recommendation.warmthCorrection,
        baseBrightness: recommendation.baseBrightness,
        baseContrast: recommendation.baseContrast,
        shadowPreservation: recommendation.shadowPreservation,
        texturePreservation: recommendation.texturePreservation,
      };
      setWhiteBaseAnalysis(targetMask.id, {
        ...existing,
        ...(existing.mode === "auto" ? recommendedSettings : {}),
        ...analysisToWhiteBaseSummary(analysis, key),
      });
    },
    [setWhiteBaseAnalysis],
  );

  const runAnalysis = useCallback(
    async (force: boolean) => {
      if (!image || !mask || !analysisKey) return;
      activeControllerRef.current?.abort();
      const controller = new AbortController();
      activeControllerRef.current = controller;
      setStatusState({ key: analysisKey, status: "analyzing" });
      try {
        const result = await analyzeWallBase(image, mask, {
          force,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        persistAnalysis(mask, result.analysisKey, result.analysis);
        setStatusState({ key: analysisKey, status: "ready" });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatusState({ key: analysisKey, status: "error" });
      }
    },
    [analysisKey, image, mask, persistAnalysis],
  );

  useEffect(() => {
    if (
      !image ||
      !mask ||
      mask.paintMode !== "white-base" ||
      (mask.whiteBaseSettings?.mode ?? "auto") !== "auto" ||
      currentAnalysis
    ) {
      return;
    }
    const scheduled = scheduleBackgroundAnalysis(() => void runAnalysis(false));
    return () => {
      scheduled.cancel();
      activeControllerRef.current?.abort();
    };
  }, [currentAnalysis, image, mask, runAnalysis]);

  useEffect(
    () => () => {
      activeControllerRef.current?.abort();
    },
    [],
  );

  const cancel = useCallback(() => {
    activeControllerRef.current?.abort();
    setStatusState({ key: analysisKey, status: "idle" });
  }, [analysisKey]);

  return {
    analysis: currentAnalysis,
    cancel,
    recalculate: () => runAnalysis(true),
    status,
  };
}
