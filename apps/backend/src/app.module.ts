import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { Request } from 'express';
import { EmployeeModule } from './modules/employee/employee.module';
import { HealthcarePlanModule } from './modules/healthcare-plan/healthcare-plan.module';
import { HealthcareSubscriptionModule } from './modules/healthcare-subscription/healthcare-subscription.module';
import { CompanySpendingModule } from './modules/company-spending/company-spending.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req }: { req: Request }) => ({ req }),
      formatError: (error) => {
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
      // Increase limits for file uploads
      persistedQueries: false,
    }),
    EmployeeModule,
    HealthcarePlanModule,
    HealthcareSubscriptionModule,
    CompanySpendingModule,
    PaymentModule,
  ],
})
export class AppModule {}
