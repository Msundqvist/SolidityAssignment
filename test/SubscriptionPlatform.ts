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
    describe('Pause and resume subscriptions', () => {
      it('Should allow owner to pause and resume subscriptions', async () => {
        const { subscriptions } = await subscriptionsFixture();

        await subscriptions.createSubscription('Netflix', 30, 1000);

        await subscriptions.pauseSubscription(1);
        let service = await subscriptions.subService(1);
        expect(service.state).to.equal(0);

        await subscriptions.resumeSucription(1);
        service = await subscriptions.subService(1);
        expect(service.state).to.equal(1);
      });
    });
    describe('Change fee', () => {
      it('should allow owner to change fee', async () => {
        const { subscriptions, owner } = await subscriptionsFixture();

        await subscriptions.createSubscription('Netflix', 30, 1000);
        await subscriptions.connect(owner).changeFee(1, 2000);

        const updated = await subscriptions.subService(1);
        expect(updated.fee).to.equal(2000);
      });
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
    it('Should revert if user tries to subscribe while having an active subscription', async () => {
      const { subscriptions, user } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 1, 1000);
      await subscriptions.connect(user).subscribe(1, { value: 1000 });

      await expect(
        subscriptions.connect(user).subscribe(1, { value: 1000 })
      ).to.be.revertedWith('Subscription is still active.');
    });

    it('Should not duplicate subscriptionId in currentSubscription when subscribing', async () => {
      const { subscriptions, user } = await subscriptionsFixture();

      await subscriptions.createSubscription('Spotify', 0, 1000);
      await subscriptions.connect(user).subscribe(1, { value: 1000 });

      let current = await subscriptions.connect(user).getCurrentSubscriptions();
      expect(current.length).to.equal(1);
      expect(current[0]).to.equal(1);

      await subscriptions.connect(user).subscribe(1, { value: 1000 });

      current = await subscriptions.connect(user).getCurrentSubscriptions();
      expect(current.length).to.equal(1);
    });
    describe('Check active subscriptions', () => {
      it('Should return true if user has an active subscription', async () => {
        const { subscriptions, user, owner } = await subscriptionsFixture();

        await subscriptions.createSubscription('Netflix', 1, 1000);
        await subscriptions.connect(user).subscribe(1, { value: 1000 });

        const isActive = await subscriptions.hasActiveSubscription(
          1,
          user.address
        );
        expect(isActive).to.be.true;
      });
      it('Should return false if subscription does not exist', async () => {
        const { subscriptions, user } = await subscriptionsFixture();

        const subscriptionId = 1;

        const isActive = await subscriptions.hasActiveSubscription(
          subscriptionId,
          user.address
        );
        expect(isActive).to.be.false;
      });
      it('Should return false if subscription exists but has expired', async () => {
        const { subscriptions, user } = await subscriptionsFixture();

        await subscriptions.createSubscription('Netflix', 0, 1000);
        await subscriptions.connect(user).subscribe(1, { value: 1000 });

        const isActive = await subscriptions.hasActiveSubscription(
          1,
          user.address
        );
        expect(isActive).to.equal(false);
      });
    });

    describe('getCurrentSubscriptions', () => {
      it('Should return current subscriptions for the user', async () => {
        const { subscriptions, user } = await subscriptionsFixture();

        await subscriptions
          .connect(user)
          .createSubscription('Netflix', 30, 1000);
        await subscriptions.connect(user).subscribe(1, { value: 1000 });

        const current = await subscriptions
          .connect(user)
          .getCurrentSubscriptions();
        expect(current.length).to.equal(1);
        expect(current[0]).to.equal(1);
      });
      it('Should return created subscriptionid and name', async () => {
        const { subscriptions } = await subscriptionsFixture();

        await subscriptions.createSubscription('Netflix', 30, 1000);
        await subscriptions.createSubscription('Spotify', 30, 2000);

        const [ids, names] = await subscriptions.getSubscriptions();

        expect(ids.length).to.equal(2);
        expect(names[0]).to.equal('Netflix');
        expect(names[1]).to.equal('Spotify');
      });

      it('Should teturn an empty array if user dont have a subscription', async () => {
        const { subscriptions, user } = await subscriptionsFixture();
        const result = await subscriptions
          .connect(user)
          .getCurrentSubscriptions();

        const [ids, names] = await subscriptions
          .connect(user)
          .getSubscriptions();

        expect(ids.length).to.equal(0);
        expect(names.length).to.equal(0);
      });
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
    it('Should extend the recipients subscription if already active', async () => {
      const { subscriptions, owner, recipient } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 1, 1000);
      await subscriptions
        .connect(owner)
        .giftSubscription(1, recipient.address, { value: 1000 });

      const originalSub = await subscriptions.subscriptions(
        1,
        recipient.address
      );

      await subscriptions
        .connect(owner)
        .giftSubscription(1, recipient.address, { value: 1000 });

      const updatedSub = await subscriptions.subscriptions(
        1,
        recipient.address
      );

      expect(updatedSub.endtime).to.be.greaterThan(originalSub.endtime);
    });
    it('Should revert if trying to gifed a paused subscription', async () => {
      const { subscriptions, recipient } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 30, 100);
      await subscriptions.pauseSubscription(1);

      await expect(
        subscriptions.giftSubscription(1, recipient.address, { value: 1000 })
      ).to.be.revertedWith('Subscription is paused.');
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

  describe('Access', () => {
    it('Should revert with custom error if non-owner tries to change the fee for subscription', async () => {
      const { subscriptions, recipient } = await subscriptionsFixture();

      await subscriptions.createSubscription('Netflix', 1, 1000);

      await expect(
        subscriptions.connect(recipient).changeFee(1, 2000)
      ).to.be.revertedWithCustomError(subscriptions, 'NotSubscriptionOwner');
    });
    it('Should revert with custom error if non-owner tries to take out a withdraw from earnings', async () => {
      const { subscriptions, user, recipient } = await subscriptionsFixture();

      await subscriptions
        .connect(user)
        .createSubscription('Netflix', 1, parseEther('1'));
      await subscriptions
        .connect(recipient)
        .subscribe(1, { value: parseEther('1') });

      await expect(
        subscriptions.connect(recipient).withdrawEarnings(1, parseEther('1'))
      ).to.be.revertedWithCustomError(subscriptions, 'NotSubscriptionOwner');
    });
  });

  describe('receive ()', () => {
    it('Should receive Ether via receive() and emit DepositMade', async () => {
      const { subscriptions, user } = await subscriptionsFixture();
      const amount = parseEther('1.0');

      await expect(
        user.sendTransaction({
          to: await subscriptions.getAddress(),
          value: amount,
        })
      )
        .to.emit(subscriptions, 'DepositMade')
        .withArgs(user.address, amount);

      const contractBalance = await subscriptions.contractBalance();
      expect(contractBalance).to.equal(amount);
    });
  });

  describe('fallback ()', () => {
    it('Should revert when fallback() is triggerd', async () => {
      const { subscriptions, user } = await subscriptionsFixture();

      await expect(
        user.sendTransaction({
          to: await subscriptions.getAddress(),
          data: '0x12345678',
          value: parseEther('0.01'),
        })
      ).to.be.revertedWith('Fallback function called: invalid function.');
    });
  });

  describe('deposit()', () => {
    it('Should accept a deposit and update amount', async () => {
      const { subscriptions, user } = await subscriptionsFixture();
      const depositAmount = parseEther('1');

      await expect(
        subscriptions.connect(user).deposit({ value: depositAmount })
      )
        .to.emit(subscriptions, 'DepositMade')
        .withArgs(user.address, depositAmount);

      expect(await subscriptions.contractBalance()).to.equal(depositAmount);
    });
  });
});
