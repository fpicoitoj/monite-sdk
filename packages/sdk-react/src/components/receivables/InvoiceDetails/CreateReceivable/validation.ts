import { components } from '@/api';
import { CurrencyEnum } from '@/enums/CurrencyEnum';
import { I18n } from '@lingui/core';
import { t } from '@lingui/macro';

import * as yup from 'yup';

export const getCreateInvoiceProductsValidationSchema = (i18n: I18n) =>
  yup.object({
    currency: yup
      .mixed<(typeof CurrencyEnum)[number]>()
      .oneOf(CurrencyEnum)
      .label(t(i18n)`Currency`)
      .required(),
    items: yup
      .array()
      .min(1, t(i18n)`Please, add at least 1 item to proceed with this invoice`)
      .required(),
  });

export type CreateReceivablesProductsFormProps = yup.InferType<
  ReturnType<typeof getCreateInvoiceProductsValidationSchema>
>;

const getLineItemsSchema = (i18n: I18n, isNonVatSupported: boolean) =>
  yup
    .array()
    .of(
      yup.object({
        quantity: yup
          .number()
          .min(0.1)
          .label(t(i18n)`Quantity`)
          .when('smallest_amount', (smallestAmount, schema) => {
            if (!smallestAmount) {
              return schema;
            }

            return schema.min(
              smallestAmount,
              t(
                i18n
              )`Quantity must be greater than or equal to the smallest amount`
            );
          })
          .required(),
        ...(isNonVatSupported
          ? {
              vat_rate_value: yup.number().label(t(i18n)`VAT`),
              vat_rate_id: yup.string().label(t(i18n)`VAT`),
              tax_rate_value: yup
                .number()
                .label(t(i18n)`Tax`)
                .min(0)
                .max(100)
                .required(),
            }
          : {
              tax_rate_value: yup
                .number()
                .label(t(i18n)`Tax`)
                .min(0)
                .max(100),
              vat_rate_value: yup
                .number()
                .label(t(i18n)`VAT`)
                .required(),
              vat_rate_id: yup
                .string()
                .label(t(i18n)`VAT`)
                .required(),
            }),
        product_id: yup.string().label(t(i18n)`Product`),
        product: yup
          .object({
            name: yup
              .string()
              .label(t(i18n)`Name`)
              .required(),
            price: yup
              .object({
                currency: yup
                  .mixed<(typeof CurrencyEnum)[number]>()
                  .oneOf(CurrencyEnum)
                  .label(t(i18n)`Currency`)
                  .required(),
                value: yup
                  .number()
                  .label(t(i18n)`Price`)
                  .required(),
              })
              .label(t(i18n)`Price`),
            measure_unit_id: yup
              .string()
              .label(t(i18n)`Measure unit`)
              .required(),
            smallest_amount: yup.number().label(t(i18n)`Smallest amount`),
            type: yup
              .string()
              .oneOf(['product', 'service'])
              .label(t(i18n)`Type`)
              .required(),
          })
          .label(t(i18n)`Product`)
          .required(),
      })
    )
    .min(1, t(i18n)`Please, add at least 1 item to proceed with this invoice`)
    .required();

export const getCreateInvoiceValidationSchema = (
  i18n: I18n,
  isNonVatSupported: boolean,
  isNonCompliantFlow: boolean,
  shouldEnableBankAccount: boolean
) =>
  yup.object({
    type: yup.string().required(),
    counterpart_id: yup
      .string()
      .label(t(i18n)`Counterpart`)
      .required(),
    entity_bank_account_id: shouldEnableBankAccount
      ? yup
          .string()
          .label(t(i18n)`Bank account`)
          .required(t(i18n)`Choose how to get paid.`)
      : yup.string().label(t(i18n)`Bank account`),
    entity_vat_id_id:
      isNonCompliantFlow || isNonVatSupported
        ? yup.string().label(t(i18n)`VAT ID`)
        : yup
            .string()
            .label(t(i18n)`VAT ID`)
            .required(),
    counterpart_vat_id_id: yup.string().label(t(i18n)`Counterpart VAT ID`),
    fulfillment_date: yup
      .date()
      .label(t(i18n)`Fulfillment date`)
      .nullable(),
    purchase_order: yup.string().label(t(i18n)`Purchase order`),
    terms_and_conditions: yup.string().label(t(i18n)`Terms and Conditions`),
    default_billing_address_id: yup
      .string()
      .label(t(i18n)`Billing address`)
      .required(
        t(i18n)`Set a billing address for this customer to issue invoice`
      ),
    default_shipping_address_id: yup.string().label(t(i18n)`Shipping address`),
    vat_exemption_rationale: yup
      .string()
      .label(t(i18n)`VAT exemption rationale`),
    memo: yup
      .string()
      .label(t(i18n)`Memo`)
      .optional(),
    payment_terms_id: yup
      .string()
      .label(t(i18n)`Payment terms`)
      .required(),
    line_items: getLineItemsSchema(i18n, isNonVatSupported),
    overdue_reminder_id: yup
      .string()
      .optional()
      .nullable()
      .label(t(i18n)`Overdue reminder`),
    payment_reminder_id: yup
      .string()
      .optional()
      .nullable()
      .label(t(i18n)`Payment reminder`),
  });

export const getUpdateInvoiceValidationSchema = (
  i18n: I18n,
  isNonVatSupported: boolean,
  isNonCompliantFlow: boolean
) =>
  yup.object({
    counterpart_id: yup
      .string()
      .label(t(i18n)`Counterpart`)
      .required(),
    entity_bank_account_id: yup.string().label(t(i18n)`Bank account`),
    entity_vat_id_id:
      isNonCompliantFlow || isNonVatSupported
        ? yup.string().label(t(i18n)`VAT ID`)
        : yup
            .string()
            .label(t(i18n)`VAT ID`)
            .required(),
    counterpart_vat_id_id: yup.string().label(t(i18n)`Counterpart VAT ID`),
    fulfillment_date: yup
      .date()
      .label(t(i18n)`Fulfillment date`)
      .nullable(),
    purchase_order: yup.string().label(t(i18n)`Purchase order`),
    default_billing_address_id: yup
      .string()
      .label(t(i18n)`Billing address`)
      .required(
        t(i18n)`Set a billing address for this customer to issue invoice`
      ),
    default_shipping_address_id: yup.string().label(t(i18n)`Shipping address`),
    vat_exemption_rationale: yup
      .string()
      .label(t(i18n)`VAT exemption rationale`),
    memo: yup
      .string()
      .label(t(i18n)`Memo`)
      .optional(),
    payment_terms_id: yup
      .string()
      .label(t(i18n)`Payment terms`)
      .required(),
    line_items: getLineItemsSchema(i18n, isNonVatSupported),
    overdue_reminder_id: yup
      .string()
      .optional()
      .nullable()
      .label(t(i18n)`Overdue reminder`),
    payment_reminder_id: yup
      .string()
      .optional()
      .nullable()
      .label(t(i18n)`Payment reminder`),
  });

export interface CreateReceivablesFormBeforeValidationLineItemProps {
  id: string;
  quantity: number;
  product_id?: string;
  name?: string;
  price?: components['schemas']['PriceFloat'];
  measure_unit_id?: string;
  product?: {
    name: string;
    price?: components['schemas']['PriceFloat'];
    measure_unit_id?: string;
    measure_unit_name?: string;
    type: 'product' | 'service';
  };
  measure_unit?: {
    name: string;
    id: null;
  };
  vat_rate_id?: string;
  vat_rate_value?: number;
  tax_rate_value?: number;
  smallest_amount?: number;
}

export interface CreateReceivablesFormBeforeValidationProps {
  type: string;
  counterpart_id: string;
  line_items: Array<CreateReceivablesFormBeforeValidationLineItemProps>;
  vat_exemption_rationale?: string;
}

/** Describes a final version of the form (AFTER the user filled all required fields) */
export type CreateReceivablesFormProps = yup.InferType<
  ReturnType<typeof getCreateInvoiceValidationSchema>
>;
