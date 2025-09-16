import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe('Subscriptions', () => {
  async function subscriptionsFixture() {
    const [owner] = await ethers.getSigners();
    const Subscriptions = await ethers.getContractFactory(
      'SubscriptionPlatform'
    );
    const subscriptions = await Subscriptions.deploy(owner.address);

    return { subscriptions, owner };
  }

  describe('Create subscription', () => {
    it('should create a new subscription', async () => {
      const { subscriptions, owner } = await subscriptionsFixture();
      const name = 'Netflix';
      const duration = 30;
      const fee = 1000;

      const tx = await subscriptions.createSubscription(name, duration, fee);
      await expect(tx)
        .to.emit(subscriptions, 'SubscriptionCreated')
        .withArgs(1, name, owner.address);

      const subService = await subscriptions.subService(1);

      expect(subService.name).to.equal(name);
      expect(subService.durationInDays).to.equal(duration);
      expect(subService.fee).to.equal(fee);
      expect(subService.owner).to.equal(owner.address);
      expect(subService.state).to.equal(1);
    });
  });
});
