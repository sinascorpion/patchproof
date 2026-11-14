import { studioDevnet } from 'genlayer-js/chains';

type Provider = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

export async function ensureStudioDevnet(provider: Provider) {
  const chainId = `0x${studioDevnet.id.toString(16)}`;
  if (await provider.request({ method: 'eth_chainId' }) === chainId) return;

  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (error) {
    if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 4902) throw error;
    await provider.request({ method: 'wallet_addEthereumChain', params: [{
      chainId,
      chainName: studioDevnet.name,
      nativeCurrency: studioDevnet.nativeCurrency,
      rpcUrls: [...studioDevnet.rpcUrls.default.http],
      blockExplorerUrls: ['https://explorer-studio-dev.genlayer.com'],
    }] });
    if (await provider.request({ method: 'eth_chainId' }) !== chainId) {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    }
  }
  if (await provider.request({ method: 'eth_chainId' }) !== chainId) {
    throw Error('Please switch your wallet to GenLayer Studio Devnet to continue.');
  }
}

