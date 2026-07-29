import { Router } from "express"
import { z } from "zod"
import { query } from "../db.js"

export const auditLogsRouter = Router()

const AUDIT_ACTIONS = [
  "PROJECT_VIEWED",
  "FILTER_APPLIED",
  "FILTER_CLEARED",
  "REPORT_EXPORTED",
  "MAP_TOOL_USED",
  "TIMELINE_PLAYED",
  "MAP_VIEWPORT_CHANGED",
  "DETAILS_OPENED",
] as const

auditLogsRouter.get("/", async (req, res, next) => {
  try {
    const basin = typeof req.query.basin === "string" ? req.query.basin : null
    let text = `SELECT id, action, project_id, si_code, basin, details, created_at FROM audit_logs`
    const params: any[] = []
    if (basin) {
      text += ` WHERE basin = $1`
      params.push(basin)
    }
    text += ` ORDER BY created_at DESC LIMIT 300`
    const { rows } = await query(text, params)
    res.json(rows.map((row: any) => ({ ...row, user_session: null as string | null })))
  } catch (err) {
    next(err)
  }
})

auditLogsRouter.post("/", async (req, res, next) => {
  try {
    const input = z
      .object({
        action: z.enum(AUDIT_ACTIONS),
        user_session: z.string().trim().min(3).max(64),
        project_id: z.number().int().positive().nullable().optional(),
        si_code: z.string().trim().max(64).nullable().optional(),
        basin: z.string().trim().max(120).nullable().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(req.body)

    const details = JSON.stringify(input.details ?? {})
    if (details.length > 3500) {
      res.status(400).json({ error: "Audit payload too large" })
      return
    }

    await query(
      `INSERT INTO audit_logs (user_session, action, project_id, si_code, basin, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        input.user_session,
        input.action,
        input.project_id ?? null,
        input.si_code ?? null,
        input.basin ?? null,
        details,
      ],
    )
    res.status(201).json({ ok: true })
  } catch (err) {
    next(err)
  }
})
