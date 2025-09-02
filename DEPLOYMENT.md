# Deployment Guide - Buy Me a Coffee Dapp

This guide covers the complete deployment process for the Buy Me a Coffee decentralized application, including smart contract deployment and frontend hosting.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Git
- Hardhat (installed via npm)
- Vercel CLI (optional, for automated deployment)

### Required Accounts & API Keys
1. **WalletConnect Project ID**
   - Sign up at [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - Create a new project and get your Project ID

2. **Arbitrum RPC Access**
   - Free RPC endpoints are available
   - For production, consider using Alchemy or Infura

3. **Arbiscan API Key** (for contract verification)
   - Sign up at [Arbiscan](https://arbiscan.io/)
   - Generate an API key in your account settings

4. **Vercel Account** (for frontend hosting)
   - Sign up at [Vercel](https://vercel.com/)
   - Connect your GitHub repository

### Wallet Setup
- MetaMask or compatible wallet with ETH on Arbitrum
- For testnet: Get free ETH from [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
- For mainnet: Ensure sufficient ETH for deployment costs (~0.01 ETH)

## Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your values:

```env
# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Configuration (will be updated after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_NETWORK=arbitrumSepolia

# Deployment Private Key (NEVER COMMIT THIS)
PRIVATE_KEY=your_private_key_here

# API Keys
ARBISCAN_API_KEY=your_arbiscan_api_key_here

# Optional: Enable testnets in production
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

### 3. Security Checklist
- ✅ Never commit private keys to version control
- ✅ Use environment variables for all sensitive data
- ✅ Verify `.env.local` is in `.gitignore`
- ✅ Use separate wallets for testnet and mainnet
- ✅ Keep deployment wallet secure and backed up

## Deployment Process

### Option 1: Automated Deployment (Recommended)

#### For Testnet:
```bash
# Windows PowerShell
.\scripts\deploy-production.ps1 -Target testnet

# Linux/macOS
./scripts/deploy-production.sh testnet
```

#### For Mainnet:
```bash
# Windows PowerShell
.\scripts\deploy-production.ps1 -Target mainnet

# Linux/macOS
./scripts/deploy-production.sh mainnet
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Pre-deployment Checks
```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linting
npm run lint:fix

# Run tests
npm run test:run

# Build application
npm run build:production
```

#### Step 2: Deploy Smart Contract

**For Testnet (Arbitrum Sepolia):**
```bash
npm run deploy:contract:testnet
```

**For Mainnet (Arbitrum One):**
```bash
npm run deploy:contract:mainnet
```

#### Step 3: Verify Contract
```bash
# For testnet
npm run verify:testnet

# For mainnet
npm run verify:mainnet
```

#### Step 4: Deploy Frontend

**Using Vercel CLI:**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
vercel --prod
```

**Using Git (if auto-deployment is configured):**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## Network Configuration

### Arbitrum Sepolia (Testnet)
- **Chain ID:** 421614
- **RPC URL:** https://sepolia-rollup.arbitrum.io/rpc
- **Explorer:** https://sepolia.arbiscan.io
- **Faucet:** https://faucet.quicknode.com/arbitrum/sepolia

### Arbitrum One (Mainnet)
- **Chain ID:** 42161
- **RPC URL:** https://arb1.arbitrum.io/rpc
- **Explorer:** https://arbiscan.io

## Post-Deployment Verification

### 1. Contract Verification
- [ ] Contract appears on Arbiscan
- [ ] Contract is verified (green checkmark)
- [ ] Contract functions are readable
- [ ] Contract events are being emitted

### 2. Frontend Testing
- [ ] Website loads without errors
- [ ] Wallet connection works
- [ ] Coffee purchase flow completes
- [ ] Transaction history displays
- [ ] Responsive design works on mobile

### 3. Integration Testing
- [ ] Contract address matches in frontend
- [ ] Network configuration is correct
- [ ] Gas estimation works properly
- [ ] Error handling displays user-friendly messages

## Monitoring and Maintenance

### Performance Monitoring
- Monitor Core Web Vitals in Vercel dashboard
- Track transaction success rates
- Monitor gas usage and costs

### Error Tracking
- Set up error reporting (Sentry, LogRocket, etc.)
- Monitor contract interaction failures
- Track wallet connection issues

### Updates and Upgrades
- Keep dependencies updated
- Monitor for security vulnerabilities
- Plan for contract upgrades if needed

## Troubleshooting

### Common Issues

#### Contract Deployment Fails
```
Error: insufficient funds for intrinsic transaction cost
```
**Solution:** Ensure wallet has enough ETH for gas fees

#### Contract Verification Fails
```
Error: Contract source code already verified
```
**Solution:** Contract is already verified, this is not an error

#### Frontend Build Fails
```
Error: Type error in useContract.ts
```
**Solution:** Ensure contract.json has correct ABI and address

#### Wallet Connection Issues
```
Error: Unsupported chain id
```
**Solution:** Verify NEXT_PUBLIC_NETWORK matches deployed contract network

### Getting Help
- Check the [Hardhat documentation](https://hardhat.org/docs)
- Review [Wagmi documentation](https://wagmi.sh/)
- Ask questions in [Arbitrum Discord](https://discord.gg/arbitrum)

## Security Considerations

### Smart Contract Security
- Contract uses OpenZeppelin libraries
- Implements ReentrancyGuard
- Owner-only functions for withdrawals
- Input validation on all functions

### Frontend Security
- No private keys stored in frontend
- Input sanitization and validation
- Secure headers configured
- HTTPS enforced

### Deployment Security
- Private keys never committed to git
- Environment variables for sensitive data
- Separate wallets for different environments
- Regular security audits

## Cost Estimation

### Contract Deployment Costs
- **Testnet:** Free (using faucet ETH)
- **Mainnet:** ~0.005-0.01 ETH (varies with gas prices)

### Frontend Hosting Costs
- **Vercel:** Free tier available, $20/month for Pro
- **Alternative:** Netlify, AWS S3 + CloudFront

### Ongoing Costs
- **Contract interactions:** Gas fees paid by users
- **Frontend hosting:** Monthly hosting fees
- **Domain name:** ~$10-15/year (optional)

## Backup and Recovery

### Contract Backup
- Save deployment transaction hash
- Backup contract ABI and address
- Keep deployment private key secure
- Document all deployment parameters

### Frontend Backup
- Version control with Git
- Backup environment variables
- Document deployment configuration
- Keep build artifacts for rollback

## Conclusion

This deployment guide provides a comprehensive approach to deploying the Buy Me a Coffee dapp. Follow the security best practices and test thoroughly on testnet before mainnet deployment.

For additional support or questions, refer to the project documentation or create an issue in the repository.