import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('CounterModule', (m) => {
  const SubscriptionPlatform = m.contract('subscriptionPlatform');

  return { subscriptionPlatform };
});
