import { Router } from "express";

import { listCollaboratorsRouter } from "./collaborators.routes";
import { listPoiRouter } from "./poi.routes";
import { listRouter } from "./routes";
import { listShareRouter } from "./share.routes";

export const router = Router();

router.use("/", listRouter);
router.use("/", listPoiRouter);
router.use("/", listShareRouter);
router.use("/", listCollaboratorsRouter);

export { router as listRouter };
