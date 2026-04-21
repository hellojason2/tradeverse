/**
 * External reference registry.
 *
 * Any feature that introduces a new off-site identifier (tx hash, invoice
 * number, ticket ID, tracking code, etc.) registers its URL builder here.
 * Consumers call buildExternalLink to get the canonical URL — they never
 * hardcode external URLs in components.
 *
 * See BEHAVIOR.md §3 for the rule.
 */

export type ExternalLinkBuilder<P = Record<string, unknown>> = (
  params: P & { value: string }
) => string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, ExternalLinkBuilder<any>>();

export function registerExternalLink<P = Record<string, unknown>>(
  type: string,
  builder: ExternalLinkBuilder<P>
): void {
  registry.set(type, builder);
}

export interface BuildExternalLinkResult {
  url: string | null;
  type: string;
  value: string;
}

export function buildExternalLink<P = Record<string, unknown>>(
  type: string,
  value: string,
  params: P = {} as P
): BuildExternalLinkResult {
  const builder = registry.get(type);
  if (!builder) return { url: null, type, value };
  try {
    const url = builder({ ...(params as Record<string, unknown>), value });
    return { url, type, value };
  } catch {
    return { url: null, type, value };
  }
}

/**
 * Truncate a long identifier for display.
 * Default: first 6 chars + ellipsis + last 4 chars.
 */
export function truncateIdentifier(value: string, prefix = 6, suffix = 4): string {
  if (!value) return '';
  if (value.length <= prefix + suffix + 1) return value;
  return `${value.slice(0, prefix)}\u2026${value.slice(-suffix)}`;
}

// ─── Built-in registrations ───────────────────────────────────────────────
// Features add their own by importing registerExternalLink. The built-in
// blockchain registrations support the wallet feature out of the box.

type BlockchainNetwork = 'ERC20' | 'TRC20' | 'BEP20' | 'POLYGON' | 'ARBITRUM' | 'OPTIMISM';

const EXPLORER_BASES: Record<BlockchainNetwork, string> = {
  ERC20: 'https://etherscan.io',
  TRC20: 'https://tronscan.org',
  BEP20: 'https://bscscan.com',
  POLYGON: 'https://polygonscan.com',
  ARBITRUM: 'https://arbiscan.io',
  OPTIMISM: 'https://optimistic.etherscan.io',
};

const TRON_PATHS: Record<'tx' | 'address' | 'contract' | 'token', string> = {
  tx: '/#/transaction/',
  address: '/#/address/',
  contract: '/#/contract/',
  token: '/#/token20/',
};

function blockchainPath(
  network: BlockchainNetwork,
  kind: 'tx' | 'address' | 'contract' | 'token'
): string {
  if (network === 'TRC20') return TRON_PATHS[kind];
  switch (kind) {
    case 'tx':
      return '/tx/';
    case 'address':
      return '/address/';
    case 'contract':
      return '/address/';
    case 'token':
      return '/token/';
  }
}

registerExternalLink<{ network: BlockchainNetwork }>(
  'blockchain-tx',
  ({ value, network }) =>
    `${EXPLORER_BASES[network]}${blockchainPath(network, 'tx')}${encodeURIComponent(value)}`
);

registerExternalLink<{ network: BlockchainNetwork }>(
  'blockchain-address',
  ({ value, network }) =>
    `${EXPLORER_BASES[network]}${blockchainPath(network, 'address')}${encodeURIComponent(value)}`
);

registerExternalLink<{ network: BlockchainNetwork }>(
  'blockchain-contract',
  ({ value, network }) =>
    `${EXPLORER_BASES[network]}${blockchainPath(network, 'contract')}${encodeURIComponent(value)}`
);

registerExternalLink<{ network: BlockchainNetwork }>(
  'blockchain-token',
  ({ value, network }) =>
    `${EXPLORER_BASES[network]}${blockchainPath(network, 'token')}${encodeURIComponent(value)}`
);
