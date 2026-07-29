import express from "express"
import cors from "cors"
import { router } from "./routes/index.js"

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }))
app.use(express.json())

app.use("/api", router)

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("[server] unhandled error:", err)
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  })
})

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
