import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MaritalStatus } from './enums';

@ObjectType()
export class Employee {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  companyId: string;

  @Field(() => ID)
  demographicsId: string;

  @Field()
  email: string;

  @Field()
  birthDate: Date;

  @Field(() => MaritalStatus)
  maritalStatus: MaritalStatus;

  @Field()
  createdAt: Date;
}
