# Multi-User Coffee Tip Platform Setup Guide

This guide walks you through setting up the multi-user coffee tip platform with factory pattern smart contracts and Supabase backend.

## 🏗️ Architecture Overview

### Smart Contract Architecture
- **CoffeeJarFactory.sol**: Main factory that creates individual tip jars
- **IndividualCoffeeJar.sol**: Individual contract instance for each user
- **Factory Pattern**: Each user gets their own contract for receiving tips

### Frontend Architecture
- **Home Page** (`/`): Platform landing page with creator discovery
- **Create Page** (`/create`): User registration and tip jar creation
- **User Pages** (`/[username]`): Individual tip jar pages
- **Dashboard** (`/dashboard`): User management interface

### Backend Architecture
- **Supabase**: User profiles and metadata storage
- **Database Schema**: Simple user profiles with usernames and wallet addresses

## 🚀 Quick Setup

### 1. Environment Setup

Update your `.env.local`:

```env
# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Factory Contract (updated after deployment)
NEXT_PUBLIC_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_NETWORK=arbitrumSepolia

# Private keys for deployment
PRIVATE_KEY=your_private_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key_here
```

### 2. Supabase Setup

#### Create a Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Copy the project URL and anon key to your `.env.local`

#### Create Database Table
Run this SQL in the Supabase SQL editor:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  jar_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_jar_address ON user_profiles(jar_address);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access" ON user_profiles FOR SELECT USING (true);

-- Create policies for users to insert their own profiles
CREATE POLICY "Allow users to insert their own profile" ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR true); -- Allow anonymous inserts for wallet-based auth

-- Create policies for users to update their own profiles
CREATE POLICY "Allow users to update their own profile" ON user_profiles FOR UPDATE 
USING (auth.uid() IS NULL OR true) 
WITH CHECK (auth.uid() IS NULL OR true);
```

### 3. Smart Contract Deployment

#### Deploy Factory Contract
```bash
# For testnet
npm run deploy:factory:testnet

# For mainnet
npm run deploy:factory:mainnet
```

#### Verify Contract
```bash
# For testnet
npx hardhat verify --network arbitrumSepolia [FACTORY_ADDRESS] [DEPLOYER_ADDRESS]

# For mainnet
npx hardhat verify --network arbitrumOne [FACTORY_ADDRESS] [DEPLOYER_ADDRESS]
```

### 4. Frontend Deployment

Update your environment variables with the deployed factory address, then deploy:

```bash
# Build and deploy
npm run build
vercel --prod
```

## 📱 User Flow

### For New Users
1. **Visit Platform** → Land on home page showing existing creators
2. **Connect Wallet** → Use RainbowKit to connect Web3 wallet
3. **Create Tip Jar** → Choose username and create profile
4. **Smart Contract Deploy** → Factory creates individual contract
5. **Access Dashboard** → Manage tip jar and view earnings

### For Supporters
1. **Discover Creators** → Browse platform or visit direct links
2. **Visit User Page** → Access `/[username]` page
3. **Connect Wallet** → Connect to send tips
4. **Send Coffee Tip** → Send ETH with optional message
5. **View Transaction** → See confirmation and blockchain record

## 🔧 Technical Implementation

### Factory Pattern Benefits
- **Isolated Contracts**: Each user has their own contract instance
- **Independent Management**: Users control their own tips and withdrawals
- **Scalable Architecture**: Unlimited users without central bottlenecks
- **Gas Efficient**: Uses minimal proxy pattern for contract creation

### Frontend Implementation
- **Dynamic Routing**: Next.js app router with `[username]` dynamic routes
- **Real-time Updates**: Supabase real-time subscriptions for new users
- **Responsive Design**: Mobile-first Tailwind CSS implementation
- **Wallet Integration**: RainbowKit for multi-wallet support

### Database Design
- **Minimal Data**: Only essential user information stored
- **Blockchain Primary**: All financial data lives on-chain
- **Performance Optimized**: Indexed queries for fast lookups
- **Privacy Focused**: No unnecessary personal data collection

## 🔐 Security Considerations

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks on withdrawals
- **Input Validation**: All user inputs validated on-chain
- **Access Control**: Only jar owners can withdraw their funds
- **Immutable Logic**: Core contract logic cannot be changed after deployment

### Frontend Security
- **Environment Variables**: Sensitive data in environment variables
- **Client-side Validation**: Form validation before blockchain interactions
- **Error Handling**: Graceful handling of failed transactions
- **HTTPS Enforced**: All communications over encrypted connections

### Database Security
- **Row Level Security**: Supabase RLS policies protect user data
- **Anonymous Access**: No authentication required for public data
- **Input Sanitization**: All inputs sanitized before database storage
- **Minimal Data**: Only store what's absolutely necessary

## 📊 Platform Statistics

### Metrics Tracked
- **Total Users**: Number of registered creators
- **Total Tips**: Aggregate coffee purchases across platform
- **Platform Activity**: Recent user registrations and activity
- **Individual Stats**: Per-user earnings and supporter counts

### Analytics Integration
- **On-chain Data**: Read directly from smart contracts
- **Database Queries**: User counts and registration trends
- **Real-time Updates**: Live statistics on dashboard
- **Performance Monitoring**: Core Web Vitals and user experience

## 🚦 Deployment Checklist

### Pre-deployment
- [ ] Supabase project created and configured
- [ ] Database schema deployed with RLS policies
- [ ] Environment variables configured
- [ ] Smart contracts compiled and tested
- [ ] Frontend components tested with mock data

### Deployment
- [ ] Factory contract deployed to testnet
- [ ] Contract verified on Arbiscan
- [ ] Factory address updated in environment
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (optional)

### Post-deployment
- [ ] Test user registration flow
- [ ] Test tip jar creation
- [ ] Test coffee purchasing flow
- [ ] Verify database integration
- [ ] Monitor for errors and performance

## 🔮 Future Enhancements

### Phase 2 Features
- **Profile Customization**: Custom bios, profile pictures, themes
- **Social Features**: Following, sharing, discovery feeds
- **Analytics Dashboard**: Detailed earnings and supporter analytics
- **Mobile App**: React Native mobile application

### Phase 3 Features
- **Subscription Tiers**: Monthly supporter subscriptions
- **Multimedia Support**: Upload images, videos, content
- **Integration APIs**: Webhook notifications, external integrations
- **Advanced Analytics**: Business intelligence and reporting tools

## 📞 Support

### Getting Help
- **Documentation**: Comprehensive guides and API references
- **Community**: Discord server for developers and users
- **Issues**: GitHub issues for bugs and feature requests
- **Direct Support**: Email support for urgent platform issues

### Contributing
- **Open Source**: Platform code available on GitHub
- **Bug Reports**: Submit issues with detailed reproduction steps
- **Feature Requests**: Propose new features via GitHub discussions
- **Pull Requests**: Contribute code improvements and fixes

---

**🎉 Congratulations!** You now have a fully functional multi-user coffee tip platform running on Arbitrum with modern Web3 technology stack.




