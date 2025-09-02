'use client';

import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { 
  TransactionConfirmation as TransactionConfirmationType,
  generateTransactionConfirmation,
  securityAuditLog 
} from '../lib/security';

interface TransactionConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  amount: bigint;
  coffeeSize: string;
  recipientName: string;
  recipientMessage: string;
  contractAddress: string;
  estimatedGas?: bigint;
  networkName?: string;
}

/**
 * Transaction Confirmation Modal for enhanced transaction safety
 * Implements requirements 7.3, 7.4 - clear user confirmations and transaction safety
 */
export const TransactionConfirmationModal: React.FC<TransactionConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  amount,
  coffeeSize,
  recipientName,
  recipientMessage,
  contractAddress,
  estimatedGas,
  networkName = 'Arbitrum',
}) => {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const [confirmationData, setConfirmationData] = useState<TransactionConfirmationType | null>(null);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10); // 10 second delay for safety

  useEffect(() => {
    if (isOpen) {
      const confirmation = generateTransactionConfirmation(
        amount,
        coffeeSize,
        contractAddress,
        networkName
      );
      setConfirmationData(confirmation);
      setTimeRemaining(10);
      setHasReadTerms(false);
      setConfirmationText('');

      // Log transaction confirmation display
      securityAuditLog.log(
        'transaction_confirmation_displayed',
        'low',
        {
          amount: confirmation.amount,
          coffeeSize: confirmation.coffeeSize,
          userAddress: address,
          timestamp: new Date().toISOString(),
        }
      );
    }
  }, [isOpen, amount, coffeeSize, contractAddress, networkName, address]);

  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, timeRemaining]);

  const handleConfirm = () => {
    if (!hasReadTerms || confirmationText !== 'CONFIRM' || timeRemaining > 0) {
      return;
    }

    // Log transaction confirmation
    securityAuditLog.log(
      'transaction_confirmed',
      'medium',
      {
        amount: confirmationData?.amount,
        coffeeSize: confirmationData?.coffeeSize,
        userAddress: address,
        timestamp: new Date().toISOString(),
      }
    );

    onConfirm();
  };

  const handleCancel = () => {
    // Log transaction cancellation
    securityAuditLog.log(
      'transaction_cancelled',
      'low',
      {
        amount: confirmationData?.amount,
        coffeeSize: confirmationData?.coffeeSize,
        userAddress: address,
        timestamp: new Date().toISOString(),
      }
    );

    onCancel();
  };

  if (!isOpen || !confirmationData) {
    return null;
  }

  const ethAmount = formatEther(amount);
  const hasInsufficientBalance = balance && balance.value < amount;
  const totalCost = estimatedGas ? amount + estimatedGas : amount;
  const hasInsufficientForGas = balance && balance.value < totalCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirm Transaction
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Please review the transaction details carefully before confirming.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="p-6 space-y-4">
          {/* Coffee Purchase Summary */}
          <div className="bg-coffee-50 rounded-lg p-4">
            <h3 className="font-semibold text-coffee-800 mb-2">Coffee Purchase</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-coffee-600">Size:</span>
                <span className="font-medium text-coffee-800">{confirmationData.coffeeSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coffee-600">Amount:</span>
                <span className="font-medium text-coffee-800">{ethAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-coffee-600">Name:</span>
                <span className="font-medium text-coffee-800 truncate ml-2">{recipientName}</span>
              </div>
              {recipientMessage && (
                <div className="pt-2 border-t border-coffee-200">
                  <span className="text-coffee-600 text-xs">Message:</span>
                  <p className="text-coffee-800 text-sm mt-1 break-words">{recipientMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Network & Contract Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Network & Contract</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium text-gray-800">{networkName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Contract:</span>
                <span className="font-mono text-xs text-gray-800 break-all ml-2">
                  {contractAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Gas & Total Cost */}
          {estimatedGas && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Transaction Costs</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">Coffee Amount:</span>
                  <span className="font-medium text-blue-800">{ethAmount} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Estimated Gas:</span>
                  <span className="font-medium text-blue-800">{formatEther(estimatedGas)} ETH</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-600 font-medium">Total Cost:</span>
                  <span className="font-semibold text-blue-800">{formatEther(totalCost)} ETH</span>
                </div>
              </div>
            </div>
          )}

          {/* Balance Check */}
          {balance && (
            <div className={`rounded-lg p-4 ${hasInsufficientForGas ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`font-semibold mb-2 ${hasInsufficientForGas ? 'text-red-800' : 'text-green-800'}`}>
                Wallet Balance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={hasInsufficientForGas ? 'text-red-600' : 'text-green-600'}>
                    Current Balance:
                  </span>
                  <span className={`font-medium ${hasInsufficientForGas ? 'text-red-800' : 'text-green-800'}`}>
                    {formatEther(balance.value)} ETH
                  </span>
                </div>
                {hasInsufficientBalance && (
                  <p className="text-red-600 text-xs">
                    ⚠️ Insufficient balance for this transaction
                  </p>
                )}
                {hasInsufficientForGas && !hasInsufficientBalance && (
                  <p className="text-red-600 text-xs">
                    ⚠️ Insufficient balance for transaction + gas fees
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Safety Checklist */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3">Safety Checklist</h3>
            <div className="space-y-2">
              <label className="flex items-start space-x-3 text-sm">
                <input
                  type="checkbox"
                  checked={hasReadTerms}
                  onChange={(e) => setHasReadTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-coffee-600 focus:ring-coffee-500 border-gray-300 rounded"
                />
                <span className="text-yellow-700">
                  I have reviewed all transaction details and understand that this action cannot be undone.
                  I confirm that I want to send {ethAmount} ETH to purchase a {coffeeSize} coffee.
                </span>
              </label>
            </div>
          </div>

          {/* Confirmation Input */}
          {hasReadTerms && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type &quot;CONFIRM&quot; to proceed:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500"
                placeholder="Type CONFIRM"
                maxLength={7}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                !hasReadTerms || 
                confirmationText !== 'CONFIRM' || 
                timeRemaining > 0 || 
                hasInsufficientForGas
              }
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                !hasReadTerms || 
                confirmationText !== 'CONFIRM' || 
                timeRemaining > 0 || 
                hasInsufficientForGas
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-coffee-600 hover:bg-coffee-700 text-white'
              }`}
            >
              {timeRemaining > 0 
                ? `Confirm Transaction (${timeRemaining}s)`
                : hasInsufficientForGas
                ? 'Insufficient Balance'
                : 'Confirm Transaction'
              }
            </button>
          </div>
          
          {timeRemaining > 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please wait {timeRemaining} seconds before confirming for your safety
            </p>
          )}
        </div>
      </div>
    </div>
  );
};