/**
 * Loads Claude Code agent definitions from .claude/agents/*.md in the current
 * project into opencode's agent registry as subagents.
 *
 * Enables skills that hardcode subagent_type names (e.g., rachael's branch-review
 * skill dispatching code-quality-architecture-reviewer et al.) to resolve.
 *
 * Skips any name that already exists in cfg.agent — preserves opencode's native
 * global + project agent precedence.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { readdir, readFile, stat } from "node:fs/promises"
import { join, basename } from "node:path"

const CLAUDE_AGENTS_DIR = ".claude/agents"

const MODEL_ALIASES: Record<string, string> = {
  sonnet: "anthropic/claude-sonnet-4-5",
  opus: "anthropic/claude-opus-4-7",
}

function mapModel(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const alias = MODEL_ALIASES[trimmed.toLowerCase()]
  if (alias) return alias
  return trimmed.includes("/") ? trimmed : undefined
}

type Frontmatter = Record<string, string>

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return null

  const frontmatter: Frontmatter = {}
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key) frontmatter[key] = value
  }

  return { frontmatter, body: match[2].trim() }
}

export default (async ({ directory }) => {
  return {
    config: async (cfg) => {
      const agentsDir = join(directory, CLAUDE_AGENTS_DIR)

      try {
        const s = await stat(agentsDir)
        if (!s.isDirectory()) return
      } catch {
        return
      }

      let files: string[]
      try {
        files = await readdir(agentsDir)
      } catch {
        return
      }

      const mdFiles = files.filter((f) => f.endsWith(".md"))
      cfg.agent ??= {}

      for (const file of mdFiles) {
        const filepath = join(agentsDir, file)

        let content: string
        try {
          content = await readFile(filepath, "utf-8")
        } catch {
          continue
        }

        const parsed = parseFrontmatter(content)
        if (!parsed) continue

        const name = parsed.frontmatter.name ?? basename(file, ".md")
        if (!name) continue

        if (cfg.agent[name]) continue

        const model = mapModel(parsed.frontmatter.model)
        const agentConfig: Record<string, unknown> = {
          mode: "subagent",
          description: parsed.frontmatter.description ?? `Loaded from ${CLAUDE_AGENTS_DIR}/${file}`,
          prompt: parsed.body,
        }
        if (model) agentConfig.model = model
        cfg.agent[name] = agentConfig
      }
    },
  }
}) satisfies Plugin
