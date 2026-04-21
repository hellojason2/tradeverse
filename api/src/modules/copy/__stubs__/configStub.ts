/**
 * Config stub for copy-engine development.
 * NEVER MERGE TO MAIN — replace with real imports from configService once
 * Agent 1 ships the config service implementation.
 *
 * @ownership Agent 2 (copy-engine)
 * @stubsUntil Agent 1 ships configService
 */

import { Decimal } from '@prisma/client/runtime/library';
import type { ConfigKey, ConfigValueType } from '../../../contracts/config-catalog.js';
import { CONFIG_CATALOG } from '../../../contracts/config-catalog.js';

/**
 * Stub typed config getter.
 * Returns the hard-coded PRD default for each key.
 */
export const configGet = async <K extends ConfigKey>(key: K): Promise<ConfigValueType[K]> => {
  const entry = CONFIG_CATALOG[key];
  if (!entry) {
    throw new Error(`Config key not found in catalog: ${key}`);
  }
  return entry.default as ConfigValueType[K];
};

/**
 * Convenience accessor for copy-engine keys.
 */
export const getCopyEngineConfig = async (): Promise<{
  baseUrl: string;
  frontendUrl: string;
  managerKey: string;
}> => {
  const [baseUrl, frontendUrl, managerKey] = await Promise.all([
    configGet('copy_engine.base_url'),
    configGet('copy_engine.frontend_url'),
    configGet('copy_engine.manager_key'),
  ]);
  return { baseUrl, frontendUrl, managerKey };
};
