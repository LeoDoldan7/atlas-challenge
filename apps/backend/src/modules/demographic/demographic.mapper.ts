import { Injectable } from '@nestjs/common';
import { Demographic } from '../../graphql/demographic/types/demographic.type';
import { Demographic as PrismaDemographic } from '@prisma/client';

@Injectable()
export class DemographicMapper {
  toGraphQL(demographic: PrismaDemographic): Demographic {
    return {
      id: demographic.id.toString(),
      firstName: demographic.first_name,
      lastName: demographic.last_name,
      governmentId: demographic.government_id,
      birthDate: demographic.birth_date,
      createdAt: demographic.created_at,
    };
  }
}
