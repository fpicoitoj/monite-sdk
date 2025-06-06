import { useCallback, useMemo } from 'react';

import { components } from '@/api';
import { useMyEntity } from '@/core/queries';
import { useUpdateEntityOnboardingData } from '@/core/queries/useEntitiyOnboardingData';
import {
  useOnboardingRequirementsData,
  usePatchOnboardingRequirementsData,
} from '@/core/queries/useOnboarding';

import { generateFieldsByValues } from '../transformers';
import { type OnboardingAgreementsSchema } from '../validators';
import {
  type OnboardingFormType,
  useOnboardingForm,
} from './useOnboardingForm';

type OnboardingAgreementsReturnType = {
  isPending: boolean;

  form: OnboardingFormType<
    OnboardingAgreementsSchema,
    EntityOnboardingDataResponse | undefined
  >;

  /**
   * handleSubmitAgreements: a function that takes in the values of the agreements and
   * patches the onboarding data with the values.
   * @param values
   */
  handleSubmitAgreements: (
    values: OnboardingAgreementsSchema
  ) => Promise<EntityOnboardingDataResponse>;
};

export const useOnboardingAgreements = (): OnboardingAgreementsReturnType => {
  const { data: onboarding } = useOnboardingRequirementsData();
  const patchOnboardingRequirements = usePatchOnboardingRequirementsData();

  const { mutateAsync, isPending } = useUpdateEntityOnboardingData();

  const requirements = useMemo(() => {
    if (!onboarding?.requirements) return [];

    return onboarding.requirements.filter(
      (item): item is 'tos_acceptance' | 'ownership_declaration' =>
        item === 'tos_acceptance' || item === 'ownership_declaration'
    );
  }, [onboarding?.requirements]);

  const values: OnboardingAgreementsSchema = useMemo(
    () =>
      requirements.reduce(
        (acc, requirement) => ({
          ...acc,
          [requirement]: false,
        }),
        {}
      ),
    [requirements]
  );

  const { data: entity } = useMyEntity();

  const form = useOnboardingForm<
    OnboardingAgreementsSchema,
    EntityOnboardingDataResponse | undefined
  >(values, 'agreements', entity?.address?.country);

  const handleSubmitAgreements = useCallback(
    async (values: OnboardingAgreementsSchema) => {
      const date = new Date().toISOString();

      const data: {
        [key in (typeof requirements)[number]]?: {
          date: string;
        };
      } = Object.entries(values).reduce(
        (acc, [requirement]) => ({
          ...acc,
          [requirement]: {
            date,
          },
        }),
        {}
      );

      const response = await mutateAsync(data);

      patchOnboardingRequirements({
        requirements,
        data: generateFieldsByValues({ values: data }),
      });

      return response;
    },
    [mutateAsync, patchOnboardingRequirements, requirements]
  );

  return {
    isPending,
    handleSubmitAgreements,
    form,
  };
};

type EntityOnboardingDataResponse =
  components['schemas']['EntityOnboardingDataResponse'];
