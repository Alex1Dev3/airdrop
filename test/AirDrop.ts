import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { ethers } from "hardhat";
import { expect } from "chai";

const TOTAL_AMOUNT = ethers.parseEther("100.0");
const CLAIM_AMOUNT = ethers.parseEther("1.0");

describe("Airdrop", function () {
  async function deployAirdropFixture() {
    const [deployer, user1, user2, user3, user4] = await hre.ethers.getSigners();
    const leafs = [
      [user1.address],
      [user2.address],
      [user3.address],
      [user4.address],
    ]
    const tree = StandardMerkleTree.of(leafs, ["address"]);

    const tokenFactory = await hre.ethers.getContractFactory("Token");
    const token = await tokenFactory.connect(deployer).deploy();
    const airDropFactory = await hre.ethers.getContractFactory("AirDrop");
    const airDrop = await airDropFactory.connect(deployer).deploy(token.target, CLAIM_AMOUNT, tree.root);

    await token.connect(deployer).mint(deployer, TOTAL_AMOUNT);
    await token.connect(deployer).transfer(airDrop, TOTAL_AMOUNT);

    return { airDrop, token, tree, user1, deployer };
  }

  describe("claim", function () {
    it("valid user", async function () {
      const { airDrop, token, tree, user1 } = await loadFixture(deployAirdropFixture);
      await airDrop.connect(user1).claim(tree.getProof(0));
      const balance = await token.balanceOf(user1.address);

      expect(balance).to.be.eq(CLAIM_AMOUNT);
    });

    it("only one claim", async function () {
      const { airDrop, tree, user1 } = await loadFixture(deployAirdropFixture);

      await airDrop.connect(user1).claim(tree.getProof(0));

      await expect(
        airDrop.connect(user1).claim(tree.getProof(0))
      ).to.be.revertedWithCustomError(airDrop, "AlreadyClaimed");
    });

    it("invalid user", async function () {
      const { airDrop, tree, deployer } = await loadFixture(deployAirdropFixture);

      await expect(
        airDrop.connect(deployer).claim(tree.getProof(0))
      ).to.be.revertedWithCustomError(airDrop, "InvalidUser");
    });
  });
});