import { createAccount, createClient, isSuccessful } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';

const rpc = 'https://studio-dev.genlayer.com/api';
const address = '0x3D6Aa87eA11f174295CDc682345c7f19CB645348';
const account = createAccount(); // Disposable test-only account, kept in memory.
const client = createClient({ chain: studioDevnet, account });
const funding = await fetch(rpc, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'sim_fundAccount',params:[account.address, 10]})});
const funded = await funding.json();
if (!funding.ok || funded.error) throw Error(`Faucet failed: ${JSON.stringify(funded.error)}`);
const write = {address, functionName:'compare_versions', args:['npm','lodash','4.17.20','4.17.21']};
const estimate = await client.estimateTransactionFeesForWrite(write);
const hash = await client.writeContract({...write, fees:{distribution:estimate.distribution,feeValue:estimate.feeValue}});
console.log('Transaction:',hash);
const receipt = await client.waitForFinalization({hash,interval:5000,retries:90});
console.log('Result:',receipt.statusName,receipt.txExecutionResultName);
if (!isSuccessful(receipt)) throw Error('Transaction execution did not succeed');
const count = await client.readContract({address,functionName:'get_count',args:[]});
console.log('Latest record number:',String(count));
console.log('Record:',await client.readContract({address,functionName:'get_record',args:[BigInt(count)]}));

