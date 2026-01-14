import { authSchemas } from "./auth.schema";
import { commonSchemas } from "./common.schema";
import { listSchemas } from "./list.schema";
import { poiSchemas } from "./poi.schema";

export const schemas = {
  ...authSchemas,
  ...commonSchemas,
  ...poiSchemas,
  ...listSchemas,
};
