import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}))

// Mock contract config
vi.mock('../contract.json', () => ({
  default: {
    address: '0x1234567890123456789012345678901234567890',
    abi: [
      {
        name: 'getAllCoffees',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'tuple[]', name: '', components: [] }]
      },
      {
        name: 'buyCoffee',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { type: 'string', name: '_name' },
          { type: 'string', name: '_message' }
        ],
        outputs: []
      },
      {
        name: 'getBalance',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256', name: '' }]
      },
      {
        name: 'getRecentCoffees',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'tuple[]', name: '', components: [] }]
      }
    ]
  }
}))

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

const mockUseReadContract = useReadContract as any
const mockUseWriteContract = useWriteContract as any
const mockUseWaitForTransactionReceipt = useWaitForTransactionReceipt as any

describe('Contract Configuration', () => {
  it('should export correct contract address', async () => {
    const { CONTRACT_ADDRESS } = await import('../useContract')
    expect(CONTRACT_ADDRESS).toBe('0x1234567890123456789012345678901234567890')
  })

  it('should export contract ABI', async () => {
    const { CONTRACT_ABI } = await import('../useContract')
    expect(CONTRACT_ABI).toBeDefined()
    expect(Array.isArray(CONTRACT_ABI)).toBe(true)
  })
})

describe('Contract Hook Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useGetAllCoffees hook configuration', () => {
    it('should call useReadContract with correct parameters', async () => {
      mockUseReadContract.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      })

      // Import and call the hook
      const { useGetAllCoffees } = await import('../useContract')
      useGetAllCoffees()

      expect(mockUseReadContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0x1234567890123456789012345678901234567890',
          abi: expect.any(Array),
          functionName: 'getAllCoffees',
          query: expect.objectContaining({
            refetchInterval: 30000,
          })
        })
      )
    })
  })

  describe('useBuyCoffee hook configuration', () => {
    it('should call useWriteContract and useWaitForTransactionReceipt', async () => {
      const mockWriteContract = vi.fn()
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null
      })

      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null
      })

      const { useBuyCoffee } = await import('../useContract')
      const hookResult = useBuyCoffee()

      expect(mockUseWriteContract).toHaveBeenCalled()
      expect(mockUseWaitForTransactionReceipt).toHaveBeenCalledWith({
        hash: undefined,
        query: {
          enabled: false,
        }
      })
      expect(typeof hookResult.buyCoffee).toBe('function')
    })

    it('should call writeContract with correct parameters when buyCoffee is invoked', async () => {
      const mockWriteContract = vi.fn()
      mockUseWriteContract.mockReturnValue({
        writeContract: mockWriteContract,
        data: undefined,
        isPending: false,
        error: null
      })

      mockUseWaitForTransactionReceipt.mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null
      })

      const { useBuyCoffee } = await import('../useContract')
      const { buyCoffee } = useBuyCoffee()

      const name = 'John Doe'
      const message = 'Great work!'
      const value = BigInt(1000000000000000)

      buyCoffee(name, message, value)

      expect(mockWriteContract).toHaveBeenCalledWith({
        address: '0x1234567890123456789012345678901234567890',
        abi: expect.any(Array),
        functionName: 'buyCoffee',
        args: [name, message],
        value,
      })
    })
  })

  describe('useGetBalance hook configuration', () => {
    it('should call useReadContract with correct parameters', async () => {
      mockUseReadContract.mockReturnValue({
        data: BigInt(0),
        isLoading: false,
        error: null
      })

      const { useGetBalance } = await import('../useContract')
      useGetBalance()

      expect(mockUseReadContract).toHaveBeenCalledWith({
        address: '0x1234567890123456789012345678901234567890',
        abi: expect.any(Array),
        functionName: 'getBalance',
        query: {
          refetchInterval: 10000,
        }
      })
    })
  })

  describe('useGetRecentCoffees hook configuration', () => {
    it('should call useReadContract with correct parameters', async () => {
      mockUseReadContract.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      })

      const { useGetRecentCoffees } = await import('../useContract')
      useGetRecentCoffees()

      expect(mockUseReadContract).toHaveBeenCalledWith({
        address: '0x1234567890123456789012345678901234567890',
        abi: expect.any(Array),
        functionName: 'getRecentCoffees',
        query: {
          refetchInterval: 15000,
        }
      })
    })
  })

  describe('Coffee type interface', () => {
    it('should define correct Coffee interface structure', () => {
      const mockCoffee = {
        from: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        timestamp: BigInt(1234567890),
        name: 'Test User',
        message: 'Test message',
        amount: BigInt(1000000000000000)
      }

      expect(mockCoffee.from).toBe('0x1234567890123456789012345678901234567890')
      expect(typeof mockCoffee.timestamp).toBe('bigint')
      expect(typeof mockCoffee.name).toBe('string')
      expect(typeof mockCoffee.message).toBe('string')
      expect(typeof mockCoffee.amount).toBe('bigint')
    })
  })

  describe('Coffee prices constants', () => {
    it('should export correct coffee prices', async () => {
      const { COFFEE_PRICES } = await import('../useContract')
      
      expect(COFFEE_PRICES.small).toBe(BigInt('1000000000000000'))   // 0.001 ETH
      expect(COFFEE_PRICES.medium).toBe(BigInt('3000000000000000'))  // 0.003 ETH
      expect(COFFEE_PRICES.large).toBe(BigInt('5000000000000000'))   // 0.005 ETH
    })

    it('should have correct coffee size types', async () => {
      const { COFFEE_PRICES } = await import('../useContract')
      
      expect(Object.keys(COFFEE_PRICES)).toEqual(['small', 'medium', 'large'])
    })
  })
})