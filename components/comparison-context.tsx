"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import type { ComparisonMode } from "@/types/proposal";

type ComparisonContextValue = {
  mode: ComparisonMode;
  comparisonPosition: number;
  syncViews: boolean;
  presentationMode: boolean;
  includeExportInfo: boolean;
  setMode: (mode: ComparisonMode) => void;
  setComparisonPosition: (position: number) => void;
  setSyncViews: (enabled: boolean) => void;
  setPresentationMode: (enabled: boolean) => void;
  setIncludeExportInfo: (enabled: boolean) => void;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ComparisonMode>("edited");
  const [comparisonPosition, setPosition] = useState(50);
  const [syncViews, setSyncViews] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [includeExportInfo, setIncludeExportInfo] = useState(false);
  return <ComparisonContext.Provider value={{ mode, comparisonPosition, syncViews, presentationMode, includeExportInfo, setMode, setComparisonPosition: (position) => setPosition(Math.min(100, Math.max(0, position))), setSyncViews, setPresentationMode, setIncludeExportInfo }}>{children}</ComparisonContext.Provider>;
}

export function useComparison() { const context = useContext(ComparisonContext); if (!context) throw new Error("useComparison debe usarse dentro de ComparisonProvider."); return context; }
