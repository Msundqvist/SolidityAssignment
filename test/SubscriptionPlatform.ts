import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe('Subscriptions', () => {
  async function subscriptionsFixture() {
    const [owner, user, recipient] = await ethers.getSigners();
    const Subscriptions = await ethers.getContractFactory(
      'SubscriptionPlatform'
    );
    const subscriptions = await Subscriptions.deploy(owner.address);

    return { subscriptions, owner, user, recipient };
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

  describe('Subscribe', () => {
    it('Should let a user subscribe', async () => {
      const { subscriptions, owner } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, 1000);
      await subscriptions.subscribe(1, { value: 1000 }); // betalar för id 1 och lägger in rätt pris för pren.
      const sub = await subscriptions.subscriptions(1, owner.address);

      expect(sub.exists).to.equal(true);
    });
  });

  describe('Subscription gifted', () => {
    it('Should allow a user to gift subscription', async () => {
      const { subscriptions, owner, recipient } = await subscriptionsFixture();
      await subscriptions.createSubscription('Netflix', 30, 1000);
      const tx = await subscriptions.giftSubscription(1, recipient.address, {
        value: 1000,
      });
      const giftedSubscriber = await subscriptions.subscriptions(
        1,
        recipient.address
      );

      await expect(tx)
        .to.emit(subscriptions, 'SubscriptionGifted')
        .withArgs(
          owner.address,
          recipient.address,
          1,
          giftedSubscriber.endtime
        );

      expect(giftedSubscriber.exists).to.be.true;
      expect(giftedSubscriber.endtime).to.not.equal(0);
    });
  });

  describe('Withdrawal earnings', () => {
    it('Should allow owner of subscription to withdraw earnings', async () => {});
  });
});
