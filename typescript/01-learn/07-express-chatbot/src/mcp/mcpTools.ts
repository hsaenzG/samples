/**
 * Optional MCP (Model Context Protocol) integration.
 *
 * When `MCP_SERVER_URL` is configured, the server connects to that MCP server
 * over Streamable HTTP at startup and loads its tools so the agent can call
 * them alongside the local Zod tools. When no URL is set, MCP is skipped and
 * the chatbot runs with local tools only.
 *
 * `continueOnError: true` keeps the server usable even if the MCP server is
 * unreachable — a failed connection yields an empty tool list instead of
 * crashing the process.
 */

import { McpClient } from "@strands-agents/sdk";
import { config } from "../config.js";

/** The tools returned by `McpClient.listTools()`. */
export type McpTools = Awaited<ReturnType<McpClient["listTools"]>>;

export interface McpConnection {
  client: McpClient;
  tools: McpTools;
  disconnect: () => Promise<void>;
}

/**
 * Connect to the configured MCP server and return its tools.
 * Returns `null` when no MCP server URL is configured.
 */
export async function connectMcp(): Promise<McpConnection | null> {
  const url = config.mcp.serverUrl;
  if (!url) {
    return null;
  }

  const client = new McpClient({
    url,
    applicationName: "express-strands-chatbot",
    continueOnError: true,
  });

  await client.connect();
  const tools = await client.listTools();

  console.log(
    `[mcp] connected to ${url} — loaded ${tools.length} tool(s): ` +
      tools.map((t) => t.name).join(", "),
  );

  return {
    client,
    tools,
    disconnect: () => client.disconnect(),
  };
}
