const { ethers } = require("ethers");
require("dotenv").config({ path: '.env.local' });

async function main() {
  console.log("🚀 Starting SimpleBuyMeACoffee contract deployment...");
  
  // Setup provider and signer
  const provider = new ethers.JsonRpcProvider("https://sepolia-rollup.arbitrum.io/rpc");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("📝 Deploying contracts with account:", wallet.address);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    throw new Error("❌ Deployer account has no ETH. Please fund the account first.");
  }

  // Contract ABI and bytecode (we'll get this from the compiled contract)
  const contractArtifact = require("../artifacts/contracts/SimpleBuyMeACoffee.sol/SimpleBuyMeACoffee.json");
  
  // Deploy the contract
  console.log("📦 Deploying SimpleBuyMeACoffee contract...");
  const factory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );
  
  const contract = await factory.deploy();
  console.log("⏳ Waiting for deployment to be mined...");
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ SimpleBuyMeACoffee deployed to:", contractAddress);
  
  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const totalCoffees = await contract.getTotalCoffees();
  console.log("📊 Initial total coffees:", totalCoffees.toString());
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployer: wallet.address,
    network: await provider.getNetwork(),
    timestamp: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction()?.hash
  };
  
  console.log("📋 Deployment Summary:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Deployer:", wallet.address);
  console.log("   Network:", deploymentInfo.network.name, "(" + deploymentInfo.network.chainId + ")");
  console.log("   Transaction Hash:", deploymentInfo.transactionHash);
  
  // Instructions for next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Add to your .env.local file:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Update contractService.ts if needed");
  console.log("3. Test the contract functions");
  
  return deploymentInfo;
}

// Handle errors gracefully
main()
  .then((deploymentInfo) => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.transaction) {
      console.error("Transaction details:", error.transaction);
    }
    process.exit(1);
  });
