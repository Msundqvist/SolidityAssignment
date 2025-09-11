import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('CounterModule', (m) => {
  const subscriptionPlatform = m.contract('SubscriptionPlatform');

  return { subscriptionPlatform };
});
