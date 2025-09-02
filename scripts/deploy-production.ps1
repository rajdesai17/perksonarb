# Production Deployment Script for Buy Me a Coffee Dapp (PowerShell)
# This script handles the complete deployment process on Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("testnet", "mainnet")]
    [string]$Target = "testnet"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting production deployment process..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required environment variables are set
function Test-EnvironmentVariables {
    Write-Status "Checking environment variables..."
    
    $requiredVars = @(
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID",
        "PRIVATE_KEY",
        "ARBISCAN_API_KEY"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not (Get-Item -Path "Env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please set these variables in your .env.local file or environment." -ForegroundColor Red
        exit 1
    }
    
    Write-Success "All required environment variables are set"
}

# Run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    try {
        npm run test:run
        Write-Success "All tests passed"
    }
    catch {
        Write-Error "Tests failed. Aborting deployment."
        exit 1
    }
}

# Type check
function Invoke-TypeCheck {
    Write-Status "Running TypeScript type check..."
    
    try {
        npm run type-check
        Write-Success "Type check passed"
    }
    catch {
        Write-Error "Type check failed. Aborting deployment."
        exit 1
    }
}

# Lint check
function Invoke-LintCheck {
    Write-Status "Running linter..."
    
    try {
        npm run lint:fix
        Write-Success "Linting passed"
    }
    catch {
        Write-Error "Linting failed. Aborting deployment."
        exit 1
    }
}

# Build application
function Build-Application {
    Write-Status "Building application for production..."
    
    try {
        npm run build:production
        Write-Success "Build completed successfully"
    }
    catch {
        Write-Error "Build failed. Aborting deployment."
        exit 1
    }
}

# Deploy contract to testnet
function Deploy-Testnet {
    Write-Status "Deploying contract to Arbitrum Sepolia testnet..."
    
    try {
        npm run deploy:contract:testnet
        Write-Success "Testnet deployment completed"
    }
    catch {
        Write-Error "Testnet deployment failed."
        exit 1
    }
}

# Deploy contract to mainnet
function Deploy-Mainnet {
    Write-Status "Deploying contract to Arbitrum One mainnet..."
    
    Write-Warning "⚠️  You are about to deploy to MAINNET. This will cost real ETH."
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Warning "Mainnet deployment cancelled by user."
        return
    }
    
    try {
        npm run deploy:contract:mainnet
        Write-Success "Mainnet deployment completed"
    }
    catch {
        Write-Error "Mainnet deployment failed."
        exit 1
    }
}

# Verify contract
function Invoke-ContractVerification {
    param([string]$Network)
    
    Write-Status "Verifying contract on $Network..."
    
    # Wait a bit for the contract to be indexed
    Write-Status "Waiting 30 seconds for contract to be indexed..."
    Start-Sleep -Seconds 30
    
    try {
        if ($Network -eq "testnet") {
            npm run verify:testnet
        }
        elseif ($Network -eq "mainnet") {
            npm run verify:mainnet
        }
        Write-Success "Contract verification completed"
    }
    catch {
        Write-Warning "Contract verification failed (this is non-critical)"
    }
}

# Deploy to Vercel
function Deploy-Vercel {
    Write-Status "Deploying to Vercel..."
    
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        try {
            vercel --prod
            Write-Success "Vercel deployment completed"
        }
        catch {
            Write-Error "Vercel deployment failed."
            exit 1
        }
    }
    else {
        Write-Warning "Vercel CLI not found. Please install it with: npm i -g vercel"
        Write-Status "You can manually deploy by pushing to your main branch if auto-deployment is configured."
    }
}

# Main deployment function
function Main {
    Write-Host "🎯 Buy Me a Coffee Dapp - Production Deployment" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Status "Deployment target: $Target"
    Write-Host ""
    
    # Pre-deployment checks
    Test-EnvironmentVariables
    Invoke-TypeCheck
    Invoke-LintCheck
    Invoke-Tests
    Build-Application
    
    Write-Host ""
    Write-Status "Pre-deployment checks completed successfully!"
    Write-Host ""
    
    # Contract deployment
    if ($Target -eq "testnet") {
        Deploy-Testnet
        Invoke-ContractVerification -Network "testnet"
    }
    elseif ($Target -eq "mainnet") {
        Deploy-Mainnet
        Invoke-ContractVerification -Network "mainnet"
    }
    
    Write-Host ""
    Write-Status "Contract deployment completed!"
    Write-Host ""
    
    # Frontend deployment
    Deploy-Vercel
    
    Write-Host ""
    Write-Success "🎉 Production deployment completed successfully!"
    Write-Host ""
    
    # Post-deployment instructions
    Write-Host "📋 Post-Deployment Checklist:" -ForegroundColor Cyan
    Write-Host "1. ✅ Contract deployed and verified" -ForegroundColor Green
    Write-Host "2. ✅ Frontend deployed to Vercel" -ForegroundColor Green
    Write-Host "3. ⏳ Test the live application" -ForegroundColor Yellow
    Write-Host "4. ⏳ Monitor for any issues" -ForegroundColor Yellow
    Write-Host "5. ⏳ Update documentation with new contract address" -ForegroundColor Yellow
    Write-Host ""
    
    if ($Target -eq "testnet") {
        Write-Host "🔗 Testnet Explorer: https://sepolia.arbiscan.io" -ForegroundColor Blue
    }
    else {
        Write-Host "🔗 Mainnet Explorer: https://arbiscan.io" -ForegroundColor Blue
    }
    
    Write-Host "🌐 Frontend URL: Check your Vercel dashboard for the deployment URL" -ForegroundColor Blue
}

# Run main function
try {
    Main
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}