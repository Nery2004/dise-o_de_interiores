export type ObjectGroup = {
  id: string;
  name: string;
  objectIds: string[];
  visible: boolean;
  locked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ObjectAlignment = "left" | "center-x" | "right" | "top" | "center-y" | "bottom" | "same-width" | "same-height";
export type ObjectDistribution = "horizontal" | "vertical";
