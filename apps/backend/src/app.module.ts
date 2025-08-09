import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { EmployeeResolver } from './graphql/resolvers/employee.resolver';
import { HealthcarePlanResolver } from './graphql/resolvers/healthcare-plan.resolver';
import { HealthcareSubscriptionResolver } from './graphql/resolvers/healthcare-subscription.resolver';
import { FamilyDemographicsService } from './services/family-demographics.service';
import { MinioService } from './services/minio.service';
import { FileUploadService } from './services/file-upload.service';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
      formatError: (error) => {
        return {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    FamilyDemographicsService,
    MinioService,
    FileUploadService,
    EmployeeResolver,
    HealthcarePlanResolver,
    HealthcareSubscriptionResolver,
  ],
})
export class AppModule {}
