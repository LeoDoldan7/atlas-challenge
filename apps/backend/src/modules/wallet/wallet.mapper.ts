import { Injectable } from '@nestjs/common';
import { Wallet } from '../../graphql/wallet/types/wallet.type';

export interface WalletData {
  id: bigint;
  balance_cents: bigint;
  currency_code: string;
  created_at: Date;
}

@Injectable()
export class WalletMapper {
  toGraphQL(wallet: WalletData, employeeId: string): Wallet {
    return {
      id: wallet.id.toString(),
      employeeId,
      balanceCents: wallet.balance_cents.toString(),
      currencyCode: wallet.currency_code,
      createdAt: wallet.created_at,
    };
  }
}
