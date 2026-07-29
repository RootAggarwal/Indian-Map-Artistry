import { Router } from "express"
import { query } from "../db.js"

export const reportsRouter = Router()

reportsRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT id, project_id, si_code, report_type, file_name
      FROM project_reports
    `)
    res.json(rows.map((row: any) => ({ ...row, report_path: null as string | null })))
  } catch (err) {
    next(err)
  }
})
