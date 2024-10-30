import { components } from '@monite/sdk-api/src/api';

import { http, HttpResponse, delay } from 'msw';

import {
  counterpartBankFixture,
  counterpartBankListFixture,
  genCounterpartBankFixture,
} from './counterpartBankFixture';

type CreateCounterpartBankAccountParams = { counterpartId: string };
type UpdateCounterpartBankAccountParams = CreateCounterpartBankAccountParams & {
  bankAccountId: string;
};

const bankAccountPath = `*/counterparts/:counterpartId/bank_accounts`;
const bankAccountIdPath = `${bankAccountPath}/:bankAccountId`;

let bankAccountId = 1;

export const counterpartBankHandlers = [
  /**
   * Get counterpart bank account list
   */
  http.get<
    {},
    CreateCounterpartBankAccountParams,
    components['schemas']['CounterpartBankAccountResourceList']
  >(bankAccountPath, async () => {
    await delay();

    return HttpResponse.json(
      { data: counterpartBankListFixture },
      {
        status: 201,
      }
    );
  }),

  /**
   * Create counterpart bank account
   */
  http.post<
    CreateCounterpartBankAccountParams,
    components['schemas']['CreateCounterpartBankAccount'],
    components['schemas']['CounterpartBankAccountResponse']
  >(bankAccountPath, async ({ request }) => {
    const json = await request.json();

    const response: components['schemas']['CounterpartBankAccountResponse'] = {
      id: String(++bankAccountId),
      counterpart_id: counterpartBankFixture.counterpart_id,
      name: json.name,
      bic: json.bic,
      iban: json.iban,
      account_holder_name: json.account_holder_name,
      account_number: json.account_number,
      country: json.country,
      currency: json.currency,
      routing_number: json.routing_number,
      sort_code: json.sort_code,
      is_default_for_currency: false,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Read counterpart bank account
   */
  http.get<
    UpdateCounterpartBankAccountParams,
    components['schemas']['CounterpartBankAccountResponse']
  >(bankAccountIdPath, ({ params }) => {
    const { bankAccountId } = params;
    const fixture =
      genCounterpartBankFixture(bankAccountId) || genCounterpartBankFixture();

    return HttpResponse.json(fixture);
  }),

  /**
   * Update counterpart bank account
   */
  http.patch<
    UpdateCounterpartBankAccountParams,
    components['schemas']['UpdateCounterpartBankAccount'],
    components['schemas']['CounterpartBankAccountResponse']
  >(bankAccountIdPath, async () => {
    await delay();
    return HttpResponse.json(counterpartBankFixture);
  }),

  /**
   * Delete counterpart bank account
   */
  http.delete<{}, UpdateCounterpartBankAccountParams, string>(
    bankAccountIdPath,
    () => {
      return HttpResponse.json(counterpartBankFixture.id);
    }
  ),
];
