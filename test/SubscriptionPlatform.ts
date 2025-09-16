import { expect } from 'chai';
import { network } from 'hardhat';
import { parseEther } from 'ethers';

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
    it('Should revert if payment is less than fee', async () => {
      const { subscriptions } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, 1000);

      await expect(
        subscriptions.subscribe(1, { value: 500 })
      ).to.be.revertedWith('Insuffient payment.');
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
    it('Should revert when subscription is gifted to owner', async () => {
      const { subscriptions, owner } = await subscriptionsFixture();
      await subscriptions.createSubscription('Netflix', 30, 1000);
      await expect(
        subscriptions.giftSubscription(1, owner.address, { value: 1000 })
      ).to.be.revertedWith('You cannot gift yourself a subscription.');
    });
  });

  describe('Withdrawal earnings', () => {
    it('Should allow owner of subscription to withdraw earnings', async () => {
      const { subscriptions, owner } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, parseEther('1'));

      await subscriptions.subscribe(1, { value: parseEther('1') });
      const balanceBefore = await subscriptions.contractBalance();
      const tx = await subscriptions.withdrawEarnings(1, parseEther('1'));

      await expect(tx)
        .to.emit(subscriptions, 'WithdrawalMade')
        .withArgs(owner.address, parseEther('1'));
      const balanceAfter = await subscriptions.contractBalance();

      expect(balanceAfter).to.equal(balanceBefore - parseEther('1'));
    });

    it('Should not allow withdrawing more than 1 ETH per transaction', async () => {
      const { subscriptions } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, parseEther('2'));
      await subscriptions.subscribe(1, { value: parseEther('2') });

      await expect(
        subscriptions.withdrawEarnings(1, parseEther('2'))
      ).to.be.revertedWith(
        'You cannot withdraw more than 1 ETH per transaction'
      );
    });
    it('Should not allow to withdraw more than availible balance', async () => {
      const { subscriptions } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, parseEther('1'));
      await subscriptions.subscribe(1, { value: parseEther('1') });
      await subscriptions.withdrawEarnings(1, parseEther('1'));

      await expect(
        subscriptions.withdrawEarnings(1, parseEther('1'))
      ).to.be.revertedWith('You have an insufficient balance');
    });
  });
});
