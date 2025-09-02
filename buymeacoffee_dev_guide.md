# Complete Development Guide: Buy Me a Coffee Web3 Dapp

## Overview
This guide provides step-by-step instructions for building a "Buy Me a Coffee" Web3 dapp using Cursor AI for development, Next.js 15, Wagmi v2, RainbowKit v2, and deployment to Arbitrum.

## Tech Stack (Latest 2025)

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Wagmi v2** - React Hooks for Ethereum
- **RainbowKit v2** - Wallet connection UI
- **Viem** - TypeScript interface for Ethereum

### Backend/Blockchain
- **Solidity 0.8.19+** - Smart contracts
- **Hardhat** - Development environment
- **Arbitrum One/Sepolia** - Layer 2 deployment
- **Ethers.js v6** - Ethereum library

### Development Tools
- **Cursor AI Editor** - AI-powered code editor and development environment

## Phase 1: Project Setup

### 1.1 Initialize Next.js Project with RainbowKit

```bash
# Create new project using RainbowKit template
npm init @rainbow-me/rainbowkit@latest
# OR
yarn create @rainbow-me/rainbowkit

# Choose options:
# ✅ Project name: perks
# ✅ Next.js
# ✅ TypeScript
```

**Reference:** [RainbowKit Installation](https://rainbowkit.com/docs/installation)

### 1.2 Install Additional Dependencies

```bash
npm install ethers@^6 @openzeppelin/contracts dotenv
npm install -D hardhat @nomicfoundation/hardhat-toolbox
```

### 1.3 Project Structure
```
buy-me-coffee-dapp/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   └── wagmi.ts               # Wagmi configuration
├── contracts/                  # Smart contracts
├── scripts/                    # Deployment scripts
├── hardhat.config.ts          # Hardhat configuration
└── package.json
```

## Phase 2: Smart Contract Development

### 2.1 Initialize Hardhat in Project Root

```bash
npx hardhat init
# Choose "Create a TypeScript project"
```

### 2.2 Configure Hardhat for Arbitrum

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Arbitrum Sepolia Testnet
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
    },
    // Arbitrum One Mainnet
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      }
    ]
  },
};

export default config;
```

**Reference:** [Arbitrum Hardhat Quickstart](https://developer.arbitrum.io/for-devs/quickstart-solidity-hardhat)

### 2.3 Create Smart Contract

Create `contracts/BuyMeACoffee.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BuyMeACoffee is Ownable, ReentrancyGuard {
    // Events
    event NewCoffee(
        address indexed from,
        uint256 timestamp,
        string name,
        string message,
        uint256 amount
    );

    // Coffee struct
    struct Coffee {
        address from;
        uint256 timestamp;
        string name;
        string message;
        uint256 amount;
    }

    // Array to store coffee purchases
    Coffee[] public coffees;
    
    // Coffee prices (in wei)
    uint256 public constant SMALL_COFFEE = 0.001 ether;
    uint256 public constant MEDIUM_COFFEE = 0.003 ether;
    uint256 public constant LARGE_COFFEE = 0.005 ether;

    constructor() {}

    /**
     * @dev Buy a coffee for contract owner (payable function)
     * @param _name name of the coffee purchaser
     * @param _message a nice message from the purchaser
     */
    function buyCoffee(
        string memory _name,
        string memory _message
    ) public payable nonReentrant {
        require(msg.value > 0, "Must send some ETH to buy coffee");
        require(bytes(_name).length > 0, "Name cannot be empty");

        // Add the coffee to storage
        coffees.push(
            Coffee(msg.sender, block.timestamp, _name, _message, msg.value)
        );

        // Emit event
        emit NewCoffee(msg.sender, block.timestamp, _name, _message, msg.value);
    }

    /**
     * @dev Send the entire balance stored in this contract to the owner
     */
    function withdrawTips() public {
        require(owner() == msg.sender, "Only owner can withdraw");
        require(address(this).balance > 0, "No tips to withdraw");
        
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Failed to withdraw tips");
    }

    /**
     * @dev Retrieve all the coffees received and stored on the blockchain
     */
    function getAllCoffees() public view returns (Coffee[] memory) {
        return coffees;
    }

    /**
     * @dev Get the total number of coffees
     */
    function getTotalCoffees() public view returns (uint256) {
        return coffees.length;
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get recent coffees (last 10)
     */
    function getRecentCoffees() public view returns (Coffee[] memory) {
        uint256 totalCoffees = coffees.length;
        if (totalCoffees == 0) {
            return new Coffee[](0);
        }

        uint256 recentCount = totalCoffees > 10 ? 10 : totalCoffees;
        Coffee[] memory recentCoffees = new Coffee[](recentCount);

        for (uint256 i = 0; i < recentCount; i++) {
            recentCoffees[i] = coffees[totalCoffees - 1 - i];
        }

        return recentCoffees;
    }
}
```

### 2.4 Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("Deploying BuyMeACoffee contract...");

  // Get the contract factory
  const BuyMeACoffee = await ethers.getContractFactory("BuyMeACoffee");
  
  // Deploy the contract
  const buyMeACoffee = await BuyMeACoffee.deploy();
  await buyMeACoffee.waitForDeployment();

  const contractAddress = await buyMeACoffee.getAddress();
  console.log("BuyMeACoffee deployed to:", contractAddress);

  // Save contract address and ABI to frontend
  const contractData = {
    address: contractAddress,
    abi: JSON.parse(buyMeACoffee.interface.formatJson())
  };

  fs.writeFileSync(
    "./src/lib/contract.json",
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract address and ABI saved to src/lib/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 2.5 Environment Configuration

Create `.env.local`:

```env
# Wallet private key (DO NOT COMMIT THIS)
PRIVATE_KEY=your_private_key_here

# API Keys
ARBISCAN_API_KEY=your_arbiscan_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Security Note:** Never commit private keys to git. Add `.env.local` to `.gitignore`.

## Phase 3: Frontend Development with Wagmi v2 & RainbowKit v2

### 3.1 Configure Wagmi and RainbowKit

Update `src/wagmi.ts`:

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Buy Me a Coffee Dapp',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [arbitrum, arbitrumSepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});
```

**Reference:** [RainbowKit Wagmi v2 Migration Guide](https://rainbowkit.com/guides/rainbowkit-wagmi-v2)

### 3.2 Update App Layout

Update `src/app/layout.tsx`:

```typescript
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '../wagmi';

const client = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={client}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

### 3.3 Create Contract Hook

Create `src/lib/useContract.ts`:

```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import contractData from './contract.json';

export const CONTRACT_ADDRESS = contractData.address as `0x${string}`;
export const CONTRACT_ABI = contractData.abi;

export function useGetAllCoffees() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllCoffees',
  });
}

export function useBuyCoffee() {
  const { writeContract, data: hash, ...rest } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const buyCoffee = (name: string, message: string, value: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyCoffee',
      args: [name, message],
      value,
    });
  };

  return {
    buyCoffee,
    hash,
    isConfirming,
    isConfirmed,
    ...rest
  };
}

export function useGetBalance() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getBalance',
  });
}
```

## Phase 4: Frontend Development with Cursor AI

### 4.1 Using Cursor AI for Component Generation

Open your project in Cursor and use AI prompts to generate components:

**Example Cursor Prompts:**
```
Create a modern coffee donation form component with:
- Coffee size selection (Small 0.001 ETH, Medium 0.003 ETH, Large 0.005 ETH) 
- Name input field
- Message textarea
- Buy coffee button that calls the smart contract
- Recent donations display
- Use dark theme with coffee/warm colors
- Make it responsive with TailwindCSS
- Use Wagmi v2 hooks for blockchain interaction
```

### 4.2 Main Page Component

Create `src/app/page.tsx`:

```typescript
'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { BuyCoffeeForm } from '../components/BuyCoffeeForm';
import { CoffeeList } from '../components/CoffeeList';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-4">
            ☕ Buy Me a Coffee
          </h1>
          <p className="text-amber-700 mb-6">
            Support my work with a virtual coffee on Arbitrum!
          </p>
          <ConnectButton />
        </header>

        {isConnected ? (
          <div className="grid md:grid-cols-2 gap-8">
            <BuyCoffeeForm />
            <CoffeeList />
          </div>
        ) : (
          <div className="text-center text-amber-700">
            Please connect your wallet to buy me a coffee! 
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Buy Coffee Form Component

Create `src/components/BuyCoffeeForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { useBuyCoffee } from '../lib/useContract';

const COFFEE_PRICES = {
  small: parseEther('0.001'),
  medium: parseEther('0.003'), 
  large: parseEther('0.005'),
};

export function BuyCoffeeForm() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedSize, setSelectedSize] = useState<keyof typeof COFFEE_PRICES>('medium');
  
  const { buyCoffee, isConfirming, isConfirmed, hash } = useBuyCoffee();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    buyCoffee(name, message, COFFEE_PRICES[selectedSize]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-amber-900">
        Buy Me a Coffee ☕
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Coffee Size Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Coffee Size</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(COFFEE_PRICES).map(([size, price]) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size as keyof typeof COFFEE_PRICES)}
                className={`p-3 rounded-lg border-2 text-center ${
                  selectedSize === size
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="font-medium capitalize">{size}</div>
                <div className="text-sm text-gray-600">
                  {(Number(price) / 1e18).toFixed(3)} ETH
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Message (Optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a nice message..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isConfirming || !name.trim()}
          className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? 'Confirming...' : 'Buy Coffee'}
        </button>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-4 text-sm">
            <div className="text-green-600">Transaction sent!</div>
            {isConfirmed && <div className="text-green-600">Coffee purchased! ☕</div>}
          </div>
        )}
      </form>
    </div>
  );
}
```

### 4.4 Coffee List Component

Create `src/components/CoffeeList.tsx`:

```typescript
'use client';

import { useGetAllCoffees } from '../lib/useContract';
import { formatEther } from 'viem';

export function CoffeeList() {
  const { data: coffees, isLoading, error } = useGetAllCoffees();

  if (isLoading) return <div>Loading coffees...</div>;
  if (error) return <div>Error loading coffees</div>;

  const coffeesArray = coffees as any[] || [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6 text-amber-900">
        Recent Supporters ☕
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {coffeesArray.length === 0 ? (
          <p className="text-gray-500 text-center">No coffees yet. Be the first!</p>
        ) : (
          coffeesArray.slice().reverse().map((coffee, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-amber-900">{coffee.name}</div>
                <div className="text-sm text-amber-600 font-medium">
                  {formatEther(coffee.amount)} ETH
                </div>
              </div>
              {coffee.message && (
                <p className="text-gray-600 text-sm">{coffee.message}</p>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {new Date(Number(coffee.timestamp) * 1000).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

## Phase 5: Deployment

### 5.1 Deploy Smart Contract

```bash
# Deploy to Arbitrum Sepolia (testnet) first
npx hardhat run scripts/deploy.ts --network arbitrumSepolia

# Verify contract on Arbiscan
npx hardhat verify --network arbitrumSepolia YOUR_CONTRACT_ADDRESS
```

### 5.2 Deploy Frontend

**Option 1: Vercel (Recommended)**
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

**Option 2: Netlify**
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify

**Option 3: Self-hosted**
1. Build for production: `npm run build`
2. Deploy to your preferred hosting provider

### 5.3 Production Deployment

```bash
# Deploy to Arbitrum One (mainnet)
npx hardhat run scripts/deploy.ts --network arbitrumOne

# Verify on mainnet
npx hardhat verify --network arbitrumOne YOUR_MAINNET_CONTRACT_ADDRESS
```

## Phase 6: Testing & Optimization

### 6.1 Contract Testing

Create `test/BuyMeACoffee.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { BuyMeACoffee } from "../typechain-types";

describe("BuyMeACoffee", function () {
  let buyMeACoffee: BuyMeACoffee;
  let owner: any;
  let tipper: any;

  beforeEach(async function () {
    [owner, tipper] = await ethers.getSigners();
    
    const BuyMeACoffeeFactory = await ethers.getContractFactory("BuyMeACoffee");
    buyMeACoffee = await BuyMeACoffeeFactory.deploy();
    await buyMeACoffee.waitForDeployment();
  });

  it("Should allow users to buy coffee", async function () {
    const tip = ethers.parseEther("0.001");
    const name = "Alice";
    const message = "Great work!";

    await buyMeACoffee.connect(tipper).buyCoffee(name, message, { value: tip });
    
    const coffees = await buyMeACoffee.getAllCoffees();
    expect(coffees.length).to.equal(1);
    expect(coffees[0].name).to.equal(name);
    expect(coffees[0].message).to.equal(message);
    expect(coffees[0].amount).to.equal(tip);
  });

  it("Should allow owner to withdraw tips", async function () {
    const tip = ethers.parseEther("0.001");
    
    await buyMeACoffee.connect(tipper).buyCoffee("Alice", "Thanks!", { value: tip });
    
    const initialBalance = await ethers.provider.getBalance(owner.address);
    await buyMeACoffee.connect(owner).withdrawTips();
    const finalBalance = await ethers.provider.getBalance(owner.address);
    
    expect(finalBalance).to.be.greaterThan(initialBalance);
  });
});
```

Run tests:
```bash
npx hardhat test
```

## Reference Documentation

### Essential Links

1. **Next.js Documentation**: https://nextjs.org/docs
2. **Wagmi v2 Documentation**: https://wagmi.sh/
3. **RainbowKit v2 Documentation**: https://rainbowkit.com/
4. **Hardhat Documentation**: https://hardhat.org/
5. **Arbitrum Developer Docs**: https://developer.arbitrum.io/
6. **Cursor AI Editor**: https://cursor.com/

### API References

- **Wagmi Hooks**: https://wagmi.sh/react/api/hooks
- **Viem Utilities**: https://viem.sh/docs/utilities/formatEther.html
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Arbitrum RPC Endpoints**: https://developer.arbitrum.io/build-decentralized-apps/reference/node-providers

### Useful Resources

- **Wagmi Examples**: https://wagmi.sh/examples
- **RainbowKit Examples**: https://rainbowkit.com/examples
- **Solidity Documentation**: https://docs.soliditylang.org/
- **Ethers.js v6 Documentation**: https://docs.ethers.org/v6/

## Development Workflow with Cursor AI

### Using Cursor Effectively

1. **Context Setup**: Always provide this entire document as context to Cursor
2. **Component Generation**: Ask Cursor to generate components based on specifications
3. **Code Review**: Use Cursor to review and optimize your code
4. **Debugging**: Paste error messages to get instant debugging help

### Cursor Prompts for Development

```
// For contract development
"Help me add a feature to tip with custom amounts in my BuyMeACoffee contract"

// For frontend development  
"Create a responsive component that displays coffee statistics using Wagmi hooks"

// For testing
"Generate comprehensive tests for my BuyMeACoffee contract functions"
```

## Troubleshooting Common Issues

### Smart Contract Issues
- **Gas Estimation Failed**: Check contract balance and function parameters
- **Transaction Reverted**: Review require statements and contract state

### Frontend Issues
- **Wallet Connection**: Verify WalletConnect Project ID
- **Contract Calls**: Check contract address and ABI accuracy
- **Network Issues**: Ensure correct chain configuration

### Development Issues
- **Build Errors**: Check TypeScript types and import paths
- **Deployment Failures**: Verify environment variables and network configuration

---

## Final Notes

This guide provides a complete foundation for building a modern Web3 dapp. The combination of v0 for UI generation, Cursor for AI-assisted development, and the latest Web3 tools creates an efficient development workflow for beginners and experienced developers alike.

Remember to:
- Always test on testnets first
- Keep private keys secure
- Follow best practices for smart contract security
- Use TypeScript for better development experience
- Leverage AI tools to accelerate development

Happy coding! ☕