import type { DecorCollectionId, DecorObject, DecorObjectStyle, DecorRoomType, PremiumDecorCategory } from "@/types/decor-object";

export type DecorObjectFiltersState = {
  category: PremiumDecorCategory | "";
  collection: DecorCollectionId | "";
  style: DecorObjectStyle | "";
  room: DecorRoomType | "";
  dominantColor: string;
  favoritesOnly: boolean;
};

export const EMPTY_DECOR_FILTERS: DecorObjectFiltersState = {
  category: "",
  collection: "",
  style: "",
  room: "",
  dominantColor: "",
  favoritesOnly: false,
};

export function normalizeDecorSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

export function matchesDecorSearch(object: DecorObject, query: string) {
  const normalizedQuery = normalizeDecorSearchText(query);
  if (!normalizedQuery) return true;
  const searchable = [
    object.name,
    object.category,
    object.catalogCategory,
    object.style,
    ...(object.tags ?? []),
    ...(object.recommendedRooms ?? []),
    ...(object.dominantColors ?? []),
    ...object.collectionIds,
  ].map(normalizeDecorSearchText).join(" ");
  return normalizedQuery.split(/\s+/).every((term) => searchable.includes(term));
}

export function filterDecorObjects(
  objects: DecorObject[],
  query: string,
  filters: DecorObjectFiltersState,
  favoriteIds: string[],
) {
  const favoriteSet = new Set(favoriteIds);
  return objects.filter((object) =>
    matchesDecorSearch(object, query) &&
    (!filters.category || object.catalogCategory === filters.category) &&
    (!filters.collection || object.collectionIds.includes(filters.collection)) &&
    (!filters.style || object.style === filters.style) &&
    (!filters.room || object.recommendedRooms?.includes(filters.room)) &&
    (!filters.dominantColor || object.dominantColors?.includes(filters.dominantColor)) &&
    (!filters.favoritesOnly || favoriteSet.has(object.id)));
}

export function getSimilarDecorObjects(source: DecorObject, objects: DecorObject[], maximum = 4) {
  return objects
    .filter((object) => object.id !== source.id)
    .map((object) => ({
      object,
      score: (object.catalogCategory === source.catalogCategory ? 10 : 0) +
        (object.category === source.category ? 8 : 0) +
        (object.style === source.style ? 3 : 0) +
        object.collectionIds.filter((collection) => source.collectionIds.includes(collection)).length * 2 +
        Math.max(0, 2 - Math.abs(object.approximateWidthCm - source.approximateWidthCm) / 80) +
        object.tags.filter((tag) => source.tags.includes(tag)).length +
        (object.recommendedRooms ?? []).filter((room) => source.recommendedRooms?.includes(room)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score || first.object.name.localeCompare(second.object.name, "es"))
    .slice(0, maximum)
    .map((item) => item.object);
}
