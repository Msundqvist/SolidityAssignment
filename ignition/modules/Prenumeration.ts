import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('CounterModule', (m) => {
  const prenumeration = m.contract('Prenumeration');

  return { prenumeration };
});
