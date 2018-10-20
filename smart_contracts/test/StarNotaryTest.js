const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => {

    beforeEach(async function() {
        this.contract = await StarNotary.new({from: accounts[0]})
    })

    describe('can create a star', () => {
        it('can create a star and get its name', async function () {
            await this.contract.createStar('awesome star!', 'ra_032.155','dec_121.874','mag_245.978','beautiful star',1, {from: accounts[0]})
            let info = await this.contract.tokenIdToStarInfo(1);
            console.log(info)
            assert.deepEqual(info, ['awesome star!','ra_032.155','dec_121.874','mag_245.978','beautiful star']);
        })

        it('cannot create a star with same coordinates',async function(){
          await this.contract.createStar('awesome star!', 'ra_032.155','dec_121.874','mag_245.978','beautiful star',2, {from: accounts[0]})
          assert.equal(await this.contract.checkIfStarExist('ra_032.155','dec_121.874','mag_245.978'),true);
        })

        it('can get star info by function _tokenIdToStarInfo',async function(){
            await this.contract.createStar('Star power 103!', 'ra_032.155','dec_121.874','mag_245.978','I love my wonderful star',2, {from: accounts[0]})
          assert.deepEqual(await this.contract._tokenIdToStarInfo(2),["Star power 103!", "I love my wonderful star", "ra_032.155", "dec_121.874", "mag_245.978"]);
        })
    })

    describe('buying and selling stars', () => {
        let user1 = accounts[1]
        let user2 = accounts[2]
        let randomMaliciousUser = accounts[3]

        let starId = 3
        let starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () {
          await this.contract.createStar('awesome star!', 'ra_032.154','dec_121.874','mag_245.978','beautiful star', starId, {from: user1})
        })

        it('user1 can put up their star for sale', async function () {
            let ownerId = await this.contract._ownerOf(starId);
            assert.equal(ownerId, user1)
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            let price = await this.contract._starsForSale(starId);
            console.log(price);
            assert.equal(price, starPrice)
        })

        describe('user2 can buy a star that was put up for sale', () => {
            beforeEach(async function () {
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1})
            })

            it('user2 is the owner of the star after they buy it', async function() {
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0})
                assert.equal(await this.contract.ownerOf(starId), user2)
            })

            it('user2 ether balance changed correctly', async function () {
                let overpaidAmount = web3.toWei(.05, 'ether')
                const balanceBeforeTransaction = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0})
                const balanceAfterTransaction = web3.eth.getBalance(user2)
                assert.equal(balanceBeforeTransaction.sub(balanceAfterTransaction), starPrice)
            })
        })
    })
})
