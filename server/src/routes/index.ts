import { Router } from "express"
import { surveysRouter } from "./surveys.js"
import { reportsRouter } from "./reports.js"
import { auditLogsRouter } from "./audit-logs.js"
import { interpretationRouter } from "./interpretation.js"

export const router = Router()

router.use("/surveys", surveysRouter)
router.use("/reports", reportsRouter)
router.use("/audit-logs", auditLogsRouter)
router.use("/interpretation", interpretationRouter)
