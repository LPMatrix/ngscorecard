/**
 * Pattern Detector — statistical analysis of the NGScorecard dataset
 * Surfaces investigative angles: sector failure rates, admin comparisons, anomalies
 */

import { chatText, parseJsonReply, DEFAULT_MODEL } from './openrouter.js'
import { sql } from 'drizzle-orm'
import { db } from './db.js'
import * as t from './schema.js'

// An OpenRouter model id; override with AI_TOOLS_MODEL without a code change.
const MODEL = process.env.AI_TOOLS_MODEL || DEFAULT_MODEL

/**
 * Aggregate promise statistics by sector across all or one administration
 */
export async function getSectorPatterns(administration = null) {
  const whereClause = administration
    ? sql`WHERE administration = ${administration}`
    : sql``

  const rows = await db.all(sql`
    SELECT
      category,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'kept' THEN 1 ELSE 0 END) as kept,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN status = 'broken' THEN 1 ELSE 0 END) as broken,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM promises
    ${whereClause}
    GROUP BY category
    ORDER BY total DESC
  `)

  return rows.map(r => ({
    category: r.category,
    total: r.total,
    kept: r.kept,
    partial: r.partial,
    broken: r.broken,
    pending: r.pending,
    kept_rate: r.total > 0 ? Math.round((r.kept / r.total) * 100) : 0,
    broken_rate: r.total > 0 ? Math.round((r.broken / r.total) * 100) : 0,
  }))
}

/**
 * Compare administrations on promise delivery rates
 */
export async function getAdminComparison() {
  const rows = await db.all(sql`
    SELECT
      administration,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'kept' THEN 1 ELSE 0 END) as kept,
      SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN status = 'broken' THEN 1 ELSE 0 END) as broken,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM promises
    GROUP BY administration
    ORDER BY administration
  `)

  return rows.map(r => ({
    administration: r.administration,
    total: r.total,
    kept: r.kept,
    partial: r.partial,
    broken: r.broken,
    pending: r.pending,
    kept_rate: r.total > 0 ? Math.round((r.kept / r.total) * 100) : 0,
    broken_rate: r.total > 0 ? Math.round((r.broken / r.total) * 100) : 0,
  }))
}

/**
 * Surface anomalies — sectors or admins that are outliers vs. peers
 */
export async function getAnomalies() {
  const sectorData = await getSectorPatterns()
  const adminData = await getAdminComparison()

  if (!sectorData.length) return { sector_anomalies: [], admin_anomalies: [] }

  // Calculate averages
  const avgKeptRate = sectorData.reduce((s, r) => s + r.kept_rate, 0) / sectorData.length
  const avgBrokenRate = sectorData.reduce((s, r) => s + r.broken_rate, 0) / sectorData.length

  // Flag sectors >20pts away from average
  const sectorAnomalies = sectorData
    .filter(r => r.total >= 3)
    .filter(r =>
      Math.abs(r.kept_rate - avgKeptRate) > 20 ||
      Math.abs(r.broken_rate - avgBrokenRate) > 20
    )
    .map(r => ({
      category: r.category,
      kept_rate: r.kept_rate,
      broken_rate: r.broken_rate,
      deviation: Math.round(Math.abs(r.kept_rate - avgKeptRate)),
      type: r.kept_rate > avgKeptRate ? 'overperformer' : 'underperformer',
    }))

  const avgAdminKeptRate = adminData.reduce((s, r) => s + r.kept_rate, 0) / Math.max(adminData.length, 1)
  const adminAnomalies = adminData
    .filter(r => r.total >= 5)
    .filter(r => Math.abs(r.kept_rate - avgAdminKeptRate) > 15)
    .map(r => ({
      administration: r.administration,
      kept_rate: r.kept_rate,
      broken_rate: r.broken_rate,
      deviation: Math.round(Math.abs(r.kept_rate - avgAdminKeptRate)),
      type: r.kept_rate > avgAdminKeptRate ? 'overperformer' : 'underperformer',
    }))

  return { sector_anomalies: sectorAnomalies, admin_anomalies: adminAnomalies }
}

/**
 * Use the model to generate narrative insights from the pattern data
 */
export async function generateInsights(sectorData, adminData, anomalies) {
  if (!sectorData.length && !adminData.length) {
    return 'Not enough data to generate insights yet.'
  }

  const systemPrompt = `You are a data journalist analyzing government accountability statistics.
Given aggregated promise data, surface the 3-5 most newsworthy insights.
Focus on: surprising patterns, stark contrasts, potential stories, questions worth investigating.
Write each insight as a one-sentence headline a journalist could use to pitch a story.
Be specific with numbers. Be direct.`

  const userPrompt = `
SECTOR DATA (category, total promises, kept%, broken%):
${sectorData.map(r => `${r.category}: ${r.total} promises, ${r.kept_rate}% kept, ${r.broken_rate}% broken`).join('\n')}

ADMINISTRATION COMPARISON:
${adminData.map(r => `${r.administration}: ${r.total} promises, ${r.kept_rate}% kept, ${r.broken_rate}% broken`).join('\n')}

ANOMALIES:
${anomalies.sector_anomalies.map(a => `${a.category} sector is an ${a.type} (${a.kept_rate}% kept, ${a.deviation}pts from average)`).join('\n')}
${anomalies.admin_anomalies.map(a => `${a.administration} is an ${a.type} (${a.kept_rate}% kept, ${a.deviation}pts from average)`).join('\n')}

What are the 3-5 most newsworthy patterns in this data? Respond in JSON: { insights: ["insight1", "insight2", ...] }`

  const text = await chatText({
    model: MODEL,
    maxTokens: 512,
    system: systemPrompt,
    user: userPrompt,
  })

  try {
    const result = parseJsonReply(text)
    return result.insights || []
  } catch (e) {
    return []
  }
}

/**
 * Full pattern report — all aggregations + AI insights
 */
export async function getPatternReport(administration = null) {
  const [sectorData, adminData, anomalies] = await Promise.all([
    getSectorPatterns(administration),
    administration ? [] : getAdminComparison(),
    administration ? { sector_anomalies: [], admin_anomalies: [] } : getAnomalies(),
  ])

  const insights = await generateInsights(sectorData, adminData, anomalies)

  return {
    sector_patterns: sectorData,
    admin_comparison: adminData,
    anomalies,
    insights,
    generated_at: new Date().toISOString(),
  }
}
