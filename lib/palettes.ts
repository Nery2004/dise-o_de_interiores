import {
  isSupabaseConfigured,
  supabase,
  supabaseNotConfiguredMessage,
} from "@/lib/supabaseClient";

export type ColorPaletteRecord = {
  id: string;
  name: string;
  colors: string[];
  created_at: string;
};

type PaletteResponse<T> =
  | {
      data: T;
      error: null;
      message: string;
    }
  | {
      data: null;
      error: string;
      message: string;
    };

function unavailableResponse<T>(): PaletteResponse<T> {
  return {
    data: null,
    error: supabaseNotConfiguredMessage,
    message: supabaseNotConfiguredMessage,
  };
}

function isColorArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function getColorPalettes(): Promise<
  PaletteResponse<ColorPaletteRecord[]>
> {
  if (!isSupabaseConfigured || !supabase) {
    return unavailableResponse();
  }

  const { data, error } = await supabase
    .from("color_palettes")
    .select("id,name,colors,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message,
      message: "No se pudieron cargar las paletas.",
    };
  }

  return {
    data: (data ?? []).map((palette) => ({
      id: palette.id,
      name: palette.name,
      colors: isColorArray(palette.colors) ? palette.colors : [],
      created_at: palette.created_at,
    })),
    error: null,
    message: "Paletas cargadas.",
  };
}

export async function createColorPalette(
  name: string,
  colors: string[],
): Promise<PaletteResponse<ColorPaletteRecord>> {
  if (!isSupabaseConfigured || !supabase) {
    return unavailableResponse();
  }

  const { data, error } = await supabase
    .from("color_palettes")
    .insert({ name, colors })
    .select("id,name,colors,created_at")
    .single();

  if (error) {
    return {
      data: null,
      error: error.message,
      message: "No se pudo guardar la paleta.",
    };
  }

  return {
    data: {
      id: data.id,
      name: data.name,
      colors: isColorArray(data.colors) ? data.colors : [],
      created_at: data.created_at,
    },
    error: null,
    message: "Paleta guardada.",
  };
}

export async function deleteColorPalette(
  id: string,
): Promise<PaletteResponse<{ id: string }>> {
  if (!isSupabaseConfigured || !supabase) {
    return unavailableResponse();
  }

  const { error } = await supabase.from("color_palettes").delete().eq("id", id);

  if (error) {
    return {
      data: null,
      error: error.message,
      message: "No se pudo eliminar la paleta.",
    };
  }

  return {
    data: { id },
    error: null,
    message: "Paleta eliminada.",
  };
}
