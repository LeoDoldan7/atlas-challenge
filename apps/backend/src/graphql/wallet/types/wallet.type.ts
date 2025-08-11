import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Employee } from '../../employee/types/employee.type';

@ObjectType()
export class Wallet {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  employeeId: string;

  @Field()
  balanceCents: string;

  @Field()
  currencyCode: string;

  @Field()
  createdAt: Date;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;
}
