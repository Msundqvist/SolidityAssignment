import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('SubscriptionPlatformModule', (m) => {
  const contractOwner = '0x16f0F5A36Fe84EE456aE9FbBAFaA484E04495aD4';
  const subscriptionPlatform = m.contract('SubscriptionPlatform', [
    contractOwner,
  ]);

  return { subscriptionPlatform };
});
