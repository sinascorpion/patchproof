import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureStudioDevnet } from '../src/app/wallet-network.ts';

test('keeps an already connected Studio-dev wallet unchanged', async () => {
  const calls = [];
  await ensureStudioDevnet({ request: async ({ method }) => { calls.push(method); return '0xf22d'; } });
  assert.deepEqual(calls, ['eth_chainId']);
});

test('switches an existing network and verifies the result', async () => {
  let chain = '0x1';
  const calls = [];
  await ensureStudioDevnet({ request: async ({ method }) => { calls.push(method); if (method === 'wallet_switchEthereumChain') chain = '0xf22d'; return chain; } });
  assert.deepEqual(calls, ['eth_chainId', 'wallet_switchEthereumChain', 'eth_chainId']);
});

test('adds the correct network when missing, then switches if necessary', async () => {
  let chain = '0x1';
  let switches = 0;
  let added;
  await ensureStudioDevnet({ request: async ({ method, params }) => {
    if (method === 'wallet_switchEthereumChain') { if (++switches === 1) throw { code: 4902 }; chain = '0xf22d'; }
    if (method === 'wallet_addEthereumChain') added = params?.[0];
    return chain;
  } });
  assert.equal(switches, 2);
  assert.deepEqual(added, { chainId: '0xf22d', chainName: 'GenLayer Studio Devnet', nativeCurrency: { name: 'GEN Token', symbol: 'GEN', decimals: 18 }, rpcUrls: ['https://studio-dev.genlayer.com/api'], blockExplorerUrls: ['https://explorer-studio-dev.genlayer.com'] });
});

test('preserves a rejected switch without adding a network', async () => {
  const calls = [];
  await assert.rejects(ensureStudioDevnet({ request: async ({ method }) => { calls.push(method); if (method === 'wallet_switchEthereumChain') throw Object.assign(new Error('User rejected'), { code: 4001 }); return '0x1'; } }), /User rejected/);
  assert.deepEqual(calls, ['eth_chainId', 'wallet_switchEthereumChain']);
});

