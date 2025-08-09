import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('BigInt', () => String)
export class BigIntScalar implements CustomScalar<string, bigint> {
  description = 'BigInt custom scalar type';

  parseValue(value: string): bigint {
    return BigInt(value);
  }

  serialize(value: bigint): string {
    return value.toString();
  }

  parseLiteral(ast: ValueNode): bigint {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return BigInt(ast.value);
    }
    throw new Error('Invalid literal for BigInt');
  }
}

@Scalar('Decimal', () => String)
export class DecimalScalar implements CustomScalar<string, number> {
  description = 'Decimal custom scalar type for precise numeric values';

  parseValue(value: string): number {
    return parseFloat(value);
  }

  serialize(value: number): string {
    return value.toString();
  }

  parseLiteral(ast: ValueNode): number {
    if (ast.kind === Kind.STRING) {
      return parseFloat(ast.value);
    }
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value);
    }
    throw new Error('Invalid literal for Decimal');
  }
}
