import { generateOptionalFields } from '@/components/onboarding/transformers';
import { OnboardingOptionalParams } from '@/components/onboarding/types';
import {
  onboardingEntityIndividualFixture,
  onboardingEntityOrganizationFixture,
} from '@/mocks/onboarding/entityDataMapperFixture';
import { components } from '@monite/sdk-api/src/api';

export const onboardingEntityFixture = (
  type: 'individual' | 'organization',
  params?: OnboardingOptionalParams
): components['schemas']['OnboardingEntity'] => {
  const entity =
    type === 'individual'
      ? onboardingEntityIndividualFixture()
      : onboardingEntityOrganizationFixture();

  return generateOptionalFields({
    fields: entity.fields,
    ...params,
  });
};
