import { useId, useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

import { components } from '@/api';
import { useDialog } from '@/components';
import {
  ApprovalPolicyScriptType,
  useApprovalPolicyScript,
} from '@/components/approvalPolicies/useApprovalPolicyScript';
import {
  useApprovalPolicyTrigger,
  ApprovalPoliciesTriggerKey,
  ApprovalPoliciesOperator,
  AmountTuple,
} from '@/components/approvalPolicies/useApprovalPolicyTrigger';
import { RHFTextField } from '@/components/RHF/RHFTextField';
import { useMoniteContext } from '@/core/context/MoniteContext';
import { useCurrencies } from '@/core/hooks';
import { MoniteCurrency } from '@/ui/Currency';
import { t, Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Breadcrumbs,
  DialogTitle,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Typography,
  DialogActions,
} from '@mui/material';

import { ConditionsTable } from '../ConditionsTable';
import { RulesTable } from '../RulesTable';
import { AutocompleteCounterparts } from './AutocompleteCounterparts';
import { AutocompleteTags } from './AutocompleteTags';
import { AutocompleteUsers } from './AutocompleteUsers';

interface ApprovalPolicyFormProps {
  /** Approval policy to be updated */
  approvalPolicy?: components['schemas']['ApprovalPolicyResource'];

  /** Callback is fired when Edit button is clicked */
  setIsEdit: (isEdit: boolean) => void;

  /** Callback is fired when a policy is created and sync with server is successful */
  onCreated?: (id: string) => void;
}

export interface FormValues {
  name: string;
  description: string;
  triggerType: ApprovalPoliciesTriggerKey | null;
  triggers: {
    was_created_by_user_id?: components['schemas']['EntityUserResponse'][];
    tags?: components['schemas']['TagReadSchema'][];
    counterpart_id?: components['schemas']['CounterpartResponse'][];
    amount?: {
      currency: components['schemas']['CurrencyEnum'];
      value: AmountTuple[];
    };
  };
  rules: {
    single_user?: components['schemas']['EntityUserResponse'];
    users_from_list?: components['schemas']['EntityUserResponse'][];
    roles_from_list?: components['schemas']['RoleResponse'][];
    approval_chain?: components['schemas']['EntityUserResponse'][];
  };
  amountOperator?: ApprovalPoliciesOperator;
  amountValue?: string | number;
  amountRangeLeftValue?: string | number;
  amountRangeRightValue?: string | number;
  amountCurrency?: components['schemas']['CurrencyEnum'];
  scriptType: ApprovalPolicyScriptType;
  script: {
    params?: {
      users?: components['schemas']['EntityUserResponse'][];
      requiredApprovalCount: number | string;
    };
  };
}

export const ApprovalPolicyForm = ({
  approvalPolicy,
  setIsEdit,
  onCreated,
}: ApprovalPolicyFormProps) => {
  const { i18n } = useLingui();
  const dialogContext = useDialog();
  const { api, queryClient } = useMoniteContext();
  const { formatFromMinorUnits, formatToMinorUnits } = useCurrencies();
  const isEdit = !!approvalPolicy;

  const formId = `Monite-Form-approvalPolicyBuilder-${useId()}`;

  const { triggers, getTriggerName } = useApprovalPolicyTrigger({
    approvalPolicy,
  });
  const { rules } = useApprovalPolicyScript({ approvalPolicy });

  const [isAddingTrigger, setIsAddingTrigger] = useState<boolean>(false);
  const [triggerInEdit, setTriggerInEdit] =
    useState<ApprovalPoliciesTriggerKey | null>(null);
  const [prevTriggerValues, setPrevTriggerValues] = useState<
    FormValues['triggers'] | null
  >(null);
  const [scriptInEdit, setScriptInEdit] =
    useState<ApprovalPolicyScriptType | null>(null);

  const { data: usersForTriggers } = api.entityUsers.getEntityUsers.useQuery(
    {
      query: {
        id__in: Array.isArray(triggers?.was_created_by_user_id)
          ? triggers.was_created_by_user_id
          : [],
      },
    },
    {
      enabled: Boolean(triggers?.was_created_by_user_id?.length),
    }
  );
  const { data: tagsForTriggers } = api.tags.getTags.useQuery(
    {
      query: {
        id__in: Array.isArray(triggers?.tags) ? triggers.tags : [],
      },
    },
    {
      enabled: Boolean(triggers?.tags?.length),
    }
  );
  const { data: counterpartsForTriggers } =
    api.counterparts.getCounterparts.useQuery(
      {
        query: {
          id__in: Array.isArray(triggers?.counterpart_id)
            ? triggers.counterpart_id
            : [],
        },
      },
      {
        enabled: Boolean(triggers?.counterpart_id?.length),
      }
    );
  const { data: userForSingleUserRule } =
    api.entityUsers.getEntityUsersId.useQuery(
      {
        path: {
          entity_user_id: rules?.single_user?.userId ?? '',
        },
      },
      {
        enabled: Boolean(rules?.single_user?.userId),
      }
    );
  const { data: usersForUsersFromListRule } =
    api.entityUsers.getEntityUsers.useQuery(
      {
        query: {
          id__in: Array.isArray(rules?.users_from_list?.userIds)
            ? rules.users_from_list.userIds
            : [],
        },
      },
      { enabled: Boolean(rules?.users_from_list?.userIds?.length) }
    );
  const { data: rolesForRolesFromListRule } = api.roles.getRoles.useQuery(
    {
      query: {
        id__in: Array.isArray(rules?.roles_from_list?.roleIds)
          ? rules.roles_from_list.roleIds
          : [],
      },
    },
    { enabled: Boolean(rules?.roles_from_list?.roleIds?.length) }
  );
  const { data: usersForApprovalChainRule } =
    api.entityUsers.getEntityUsers.useQuery(
      {
        query: {
          id__in: Array.isArray(rules?.approval_chain?.chainUserIds)
            ? rules.approval_chain.chainUserIds
            : [],
        },
      },
      { enabled: Boolean(rules?.approval_chain?.chainUserIds?.length) }
    );

  const createMutation = api.approvalPolicies.postApprovalPolicies.useMutation(
    {},
    {
      onSuccess: async (createdApprovalPolicy) => {
        await Promise.all([
          api.approvalPolicies.getApprovalPolicies.invalidateQueries(
            queryClient
          ),
          api.approvalPolicies.getApprovalPoliciesId.invalidateQueries(
            {
              parameters: {
                path: { approval_policy_id: createdApprovalPolicy.id },
              },
            },
            queryClient
          ),
        ]);
        toast.success(t(i18n)`Approval policy created`);
      },

      onError: async () => {
        toast.error(t(i18n)`Error creating approval policy`);
      },
    }
  );
  const updateMutation =
    api.approvalPolicies.patchApprovalPoliciesId.useMutation(undefined, {
      onSuccess: async (updatedApprovalPolicy) => {
        await Promise.all([
          api.approvalPolicies.getApprovalPolicies.invalidateQueries(
            queryClient
          ),
          api.approvalPolicies.getApprovalPoliciesId.invalidateQueries(
            {
              parameters: {
                path: { approval_policy_id: updatedApprovalPolicy.id },
              },
            },
            queryClient
          ),
        ]);
        toast.success(t(i18n)`Approval policy updated`);
      },

      onError: async () => {
        toast.error(t(i18n)`Error updating approval policy`);
      },
    });

  const createApprovalPolicy = async (
    values: components['schemas']['ApprovalPolicyCreate']
  ) => {
    const response = await createMutation.mutateAsync(values);

    if (response) {
      setIsEdit(false);
      onCreated?.(response.id);

      return response;
    }
  };
  const updateApprovalPolicy = async (
    id: string,
    values: components['schemas']['ApprovalPolicyUpdate']
  ) => {
    const response = await updateMutation.mutateAsync({
      path: {
        approval_policy_id: id,
      },
      body: values,
    });

    if (response) {
      setIsEdit(false);
    }

    return response;
  };

  const methods = useForm<FormValues>({
    defaultValues: {
      name: approvalPolicy?.name || '',
      description: approvalPolicy?.description || '',
      triggers: {},
      rules: {},
      amountOperator: undefined,
      amountValue: undefined,
      amountCurrency: undefined,
      amountRangeLeftValue: undefined,
      amountRangeRightValue: undefined,
    },
  });
  const { control, handleSubmit, setValue, getValues, watch } = methods;
  const currentTriggers = watch('triggers');
  const currentRules = watch('rules');
  const currentAmountOperator = watch('amountOperator');
  const currentAmountValue = watch('amountValue');
  const currentAmountRangeLeftValue = watch('amountRangeLeftValue');
  const currentAmountRangeRightValue = watch('amountRangeRightValue');
  const currentAmountCurrency = watch('amountCurrency');
  const currentTriggerType = watch('triggerType');

  // setup default values for conditions and rules
  useEffect(
    () => {
      if (!isEdit) return;

      if (usersForTriggers?.data && usersForTriggers?.data.length > 0) {
        setValue('triggers.was_created_by_user_id', usersForTriggers?.data);
      }

      if (tagsForTriggers?.data && tagsForTriggers?.data.length > 0) {
        setValue('triggers.tags', tagsForTriggers?.data);
      }

      if (
        counterpartsForTriggers?.data &&
        counterpartsForTriggers?.data.length > 0
      ) {
        setValue('triggers.counterpart_id', counterpartsForTriggers?.data);
      }

      if (triggers.amount && triggers.amount?.value?.length > 0) {
        setValue('triggers.amount', triggers.amount);

        if (triggers.amount.value.length === 2) {
          setValue('amountOperator', 'range');
          setValue(
            'amountRangeLeftValue',
            formatFromMinorUnits(
              typeof triggers.amount.value[0][1] === 'number'
                ? triggers.amount.value[0][1]
                : parseInt(triggers.amount.value[0][1]),
              triggers.amount.currency
            ) || 0
          );
          setValue(
            'amountRangeRightValue',
            formatFromMinorUnits(
              typeof triggers.amount.value[1][1] === 'number'
                ? triggers.amount.value[1][1]
                : parseInt(triggers.amount.value[1][1]),
              triggers.amount.currency
            ) || 0
          );
          setValue('amountCurrency', triggers.amount.currency);
        } else {
          setValue('amountOperator', triggers.amount.value[0][0]);
          setValue(
            'amountValue',
            formatFromMinorUnits(
              typeof triggers.amount.value[0][1] === 'number'
                ? triggers.amount.value[0][1]
                : parseInt(triggers.amount.value[0][1]),
              triggers.amount.currency
            ) || 0
          );
          setValue('amountCurrency', triggers.amount.currency);
        }
      }

      if (userForSingleUserRule) {
        setValue('rules.single_user', userForSingleUserRule);
      }

      if (
        usersForUsersFromListRule?.data &&
        usersForUsersFromListRule?.data.length > 0
      ) {
        setValue('rules.users_from_list', usersForUsersFromListRule?.data);
      }

      if (
        rolesForRolesFromListRule?.data &&
        rolesForRolesFromListRule?.data.length > 0
      ) {
        setValue('rules.roles_from_list', rolesForRolesFromListRule?.data);
      }

      if (
        usersForApprovalChainRule?.data &&
        usersForApprovalChainRule?.data.length > 0
      ) {
        setValue('rules.approval_chain', usersForApprovalChainRule?.data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      usersForTriggers?.data,
      tagsForTriggers?.data,
      counterpartsForTriggers?.data,
      userForSingleUserRule,
      usersForUsersFromListRule?.data,
      rolesForRolesFromListRule?.data,
      usersForApprovalChainRule?.data,
      isEdit,
      setValue,
    ]
  );

  useEffect(() => {
    if (triggerInEdit) {
      setValue('triggerType', triggerInEdit);
    }
  }, [setValue, triggerInEdit]);

  useEffect(() => {
    if (scriptInEdit) {
      setValue('scriptType', scriptInEdit);
    }
  }, [setValue, scriptInEdit]);

  useEffect(() => {
    if (currentAmountOperator) {
      if (
        currentAmountOperator === 'range' &&
        currentAmountRangeLeftValue &&
        currentAmountRangeRightValue
      ) {
        setValue('triggers.amount', {
          currency: currentAmountCurrency ?? 'EUR',
          value: [
            [
              '>=',
              formatToMinorUnits(
                typeof currentAmountRangeLeftValue === 'number'
                  ? currentAmountRangeLeftValue
                  : parseInt(currentAmountRangeLeftValue),
                currentAmountCurrency ?? 'EUR'
              ) || 0,
            ],
            [
              '<=',
              formatToMinorUnits(
                typeof currentAmountRangeRightValue === 'number'
                  ? currentAmountRangeRightValue
                  : parseInt(currentAmountRangeRightValue),
                currentAmountCurrency ?? 'EUR'
              ) || 0,
            ],
          ],
        });
      } else if (currentAmountValue) {
        setValue('triggers.amount', {
          currency: currentAmountCurrency ?? 'EUR',
          value: [
            [
              currentAmountOperator,
              formatToMinorUnits(
                typeof currentAmountValue === 'number'
                  ? currentAmountValue
                  : parseInt(currentAmountValue),
                currentAmountCurrency ?? 'EUR'
              ) || 0,
            ],
          ],
        });
      }
    }
  }, [
    formatToMinorUnits,
    currentAmountOperator,
    currentAmountRangeLeftValue,
    currentAmountRangeRightValue,
    currentAmountValue,
    currentAmountCurrency,
    setValue,
  ]);

  const resetFormTriggerOrScript = () => {
    if (!isAddingTrigger && triggerInEdit === 'was_created_by_user_id') {
      setValue(
        'triggers.was_created_by_user_id',
        prevTriggerValues?.was_created_by_user_id || []
      );
    }

    if (!isAddingTrigger && triggerInEdit === 'tags') {
      setValue('triggers.tags', prevTriggerValues?.tags || []);
    }

    if (!isAddingTrigger && triggerInEdit === 'counterpart_id') {
      setValue(
        'triggers.counterpart_id',
        prevTriggerValues?.counterpart_id || []
      );
    }

    if (!isAddingTrigger && triggerInEdit === 'amount') {
      setValue('triggers.amount', prevTriggerValues?.amount || undefined);
    }

    if (!isAddingTrigger && triggerInEdit === 'amount') {
      setValue('triggers.amount', prevTriggerValues?.amount || undefined);

      setValue('amountOperator', undefined);
      setValue('amountValue', undefined);
    }

    if (isAddingTrigger && prevTriggerValues) {
      setValue('triggers', prevTriggerValues);
    }

    // TODO add reset for scripts with prev values
    // if (scriptInEdit) {
    //   setValue(
    //     'script.params.users',
    //     usersForScript?.data.filter((user) =>
    //       script.params.user_ids?.includes(user.id)
    //     ) || []
    //   );
    //   setValue(
    //     'script.params.requiredApprovalCount',
    //     script.params.required_approval_count || 1
    //   );
    // }

    setTriggerInEdit(null);
    setScriptInEdit(null);
    setIsAddingTrigger(false);
    setPrevTriggerValues(null);
    setValue('triggerType', null);
  };

  return (
    <>
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          {triggerInEdit || isAddingTrigger ? (
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ cursor: 'pointer' }}
                onClick={resetFormTriggerOrScript}
              >
                {t(i18n)`Edit Approval Policy`}
              </Typography>
              <Typography variant="subtitle1" color="text.primary">
                {isAddingTrigger
                  ? t(i18n)`Add Condition`
                  : t(i18n)`Edit Condition`}
              </Typography>
            </Breadcrumbs>
          ) : (
            <Typography variant="h3" sx={{ wordBreak: 'break-word' }}>
              {t(i18n)`Edit Approval Policy`}
            </Typography>
          )}
          {dialogContext?.isDialogContent && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={dialogContext.onClose}
              aria-label={t(i18n)`Close approval policy details`}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <FormProvider {...methods}>
          <form
            id={formId}
            noValidate
            onSubmit={handleSubmit((values) => {
              const body = {
                name: values.name,
                description: values.description,
                trigger: {
                  all: [
                    "{event_name == 'submitted_for_approval'}",
                    ...(values.triggers.was_created_by_user_id?.length &&
                    values.triggers.was_created_by_user_id?.length > 0
                      ? [
                          {
                            operator: 'in',
                            left_operand: {
                              name: 'invoice.was_created_by_user_id',
                            },
                            right_operand:
                              values.triggers.was_created_by_user_id.map(
                                (user) => user.id
                              ),
                          },
                        ]
                      : []),
                    ...(values.triggers.tags?.length &&
                    values.triggers.tags?.length > 0
                      ? [
                          {
                            operator: 'in',
                            left_operand: {
                              name: 'invoice.tags.id',
                            },
                            right_operand: values.triggers.tags.map(
                              (tag) => tag.id
                            ),
                          },
                        ]
                      : []),
                    ...(values.triggers.counterpart_id?.length &&
                    values.triggers.counterpart_id?.length > 0
                      ? [
                          {
                            operator: 'in',
                            left_operand: {
                              name: 'invoice.counterpart_id',
                            },
                            right_operand: values.triggers.counterpart_id.map(
                              (counterpart) => counterpart.id
                            ),
                          },
                        ]
                      : []),
                    ...(values.triggers.amount?.value?.length &&
                    values.triggers.amount?.value?.length > 0
                      ? [
                          ...values.triggers.amount.value.map((value) => ({
                            operator: value[0],
                            left_operand: {
                              name: 'invoice.amount',
                            },
                            right_operand:
                              typeof value[1] === 'number'
                                ? value[1]
                                : parseInt(value[1]),
                          })),
                          {
                            operator: '==',
                            left_operand: {
                              name: 'invoice.currency',
                            },
                            right_operand: values.triggers.amount.currency,
                          },
                        ]
                      : []),
                  ],
                },
                // TODO: remove this script after demo
                script: [
                  {
                    call: 'ApprovalRequests.request_approval_by_users',
                    params: {
                      user_ids:
                        values.script.params?.users?.map((user) => user.id) ||
                        [],
                      required_approval_count:
                        values.script?.params?.requiredApprovalCount || '1',
                    },
                  },
                ],
              };
              isEdit
                ? // @ts-expect-error - `trigger` is not covered by the schema
                  updateApprovalPolicy(approvalPolicy.id, body)
                : // @ts-expect-error - `trigger` is not covered by the schema
                  createApprovalPolicy(body);
            })}
          >
            <Stack gap={3}>
              {(triggerInEdit || isAddingTrigger) && (
                <RHFTextField
                  label={t(i18n)`Condition type`}
                  name="triggerType"
                  control={control}
                  fullWidth
                  required
                  select
                  value={triggerInEdit || undefined}
                  disabled={Boolean(triggerInEdit)}
                >
                  {(!prevTriggerValues?.amount ||
                    triggerInEdit === 'amount') && (
                    <MenuItem value="amount">
                      {getTriggerName('amount')}
                    </MenuItem>
                  )}
                  {(!prevTriggerValues?.counterpart_id ||
                    triggerInEdit === 'counterpart_id') && (
                    <MenuItem value="counterpart_id">
                      {getTriggerName('counterpart_id')}
                    </MenuItem>
                  )}
                  {(!prevTriggerValues?.was_created_by_user_id ||
                    triggerInEdit === 'was_created_by_user_id') && (
                    <MenuItem value="was_created_by_user_id">
                      {getTriggerName('was_created_by_user_id')}
                    </MenuItem>
                  )}
                  {(!prevTriggerValues?.tags || triggerInEdit === 'tags') && (
                    <MenuItem value="tags">{getTriggerName('tags')}</MenuItem>
                  )}
                </RHFTextField>
              )}
              {scriptInEdit && (
                <RHFTextField
                  label={t(i18n)`Approval flow`}
                  name="scriptType"
                  control={control}
                  fullWidth
                  required
                  select
                  value={scriptInEdit}
                  disabled={Boolean(isEdit && scriptInEdit)}
                >
                  {/* eslint-disable-next-line lingui/no-unlocalized-strings */}
                  <MenuItem value="ApprovalRequests.request_approval_by_users">
                    {t(i18n)`User from the list - Any`}
                  </MenuItem>
                </RHFTextField>
              )}
              {(triggerInEdit === 'was_created_by_user_id' ||
                (isAddingTrigger &&
                  currentTriggerType === 'was_created_by_user_id')) && (
                <AutocompleteUsers
                  control={control}
                  name="triggers.was_created_by_user_id"
                  label={t(i18n)`Users`}
                />
              )}
              {(triggerInEdit === 'tags' ||
                (isAddingTrigger && currentTriggerType === 'tags')) && (
                <AutocompleteTags
                  control={control}
                  name="triggers.tags"
                  label={t(i18n)`Tags`}
                />
              )}
              {(triggerInEdit === 'counterpart_id' ||
                (isAddingTrigger &&
                  currentTriggerType === 'counterpart_id')) && (
                <AutocompleteCounterparts
                  control={control}
                  name="triggers.counterpart_id"
                  label={t(i18n)`Counterparts`}
                />
              )}
              {(triggerInEdit === 'amount' ||
                (isAddingTrigger && currentTriggerType === 'amount')) && (
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <RHFTextField
                      label={t(i18n)`If amount is`}
                      name="amountOperator"
                      control={control}
                      select
                      fullWidth
                    >
                      <MenuItem value=">">{t(i18n)`Greater than`}</MenuItem>
                      <MenuItem value="<">{t(i18n)`Less than`}</MenuItem>
                      <MenuItem value=">=">{t(
                        i18n
                      )`Greater than or equal to`}</MenuItem>
                      <MenuItem value="<=">{t(
                        i18n
                      )`Less than or equal to`}</MenuItem>
                      <MenuItem value="==">{t(i18n)`Equal to`}</MenuItem>
                      <MenuItem value="range">{t(i18n)`In range`}</MenuItem>
                    </RHFTextField>
                  </Grid>
                  {currentAmountOperator === 'range' ? (
                    <Grid item container spacing={2}>
                      <Grid item xs={6}>
                        <RHFTextField
                          label={t(i18n)`From (including)`}
                          name="amountRangeLeftValue"
                          control={control}
                          type="number"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <RHFTextField
                          label={t(i18n)`To (including)`}
                          name="amountRangeRightValue"
                          control={control}
                          type="number"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid item xs={4}>
                      <RHFTextField
                        label={t(i18n)`Amount`}
                        name="amountValue"
                        control={control}
                        type="number"
                        fullWidth
                      />
                    </Grid>
                  )}
                  <Grid item xs={4}>
                    <MoniteCurrency
                      name="amountCurrency"
                      control={control}
                      displayCode
                    />
                  </Grid>
                </Grid>
              )}
              {/*{scriptInEdit ===*/}
              {/*  'ApprovalRequests.request_approval_by_users' && (*/}
              {/*  <>*/}
              {/*    <AutocompleteUsers*/}
              {/*      control={control}*/}
              {/*      name="script.params.users"*/}
              {/*      label={t(i18n)`Users allowed to approve`}*/}
              {/*    />*/}
              {/*    <RHFTextField*/}
              {/*      control={control}*/}
              {/*      label={t(i18n)`Minimum number of approvals required`}*/}
              {/*      name="script.params.requiredApprovalCount"*/}
              {/*      type="number"*/}
              {/*    />*/}
              {/*  </>*/}
              {/*)}*/}
              {!triggerInEdit && !scriptInEdit && !isAddingTrigger && (
                <>
                  <RHFTextField
                    label={t(i18n)`Policy Name`}
                    name="name"
                    control={control}
                    fullWidth
                    required
                  />
                  <RHFTextField
                    label={t(i18n)`Description`}
                    name="description"
                    control={control}
                    fullWidth
                    required
                    multiline
                    rows={4}
                  />
                  <Box>
                    <Typography variant="h5" mt={4} mb={1}>
                      {t(i18n)`Conditions`}
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      <Trans>
                        Policy will be applied if document matches{' '}
                        <strong>ALL</strong> of the following conditions:
                      </Trans>
                    </Typography>
                    <ConditionsTable
                      triggers={currentTriggers}
                      onAddTrigger={() => {
                        setIsAddingTrigger(true);
                        setPrevTriggerValues({
                          ...getValues('triggers'),
                        });
                      }}
                      onEditTrigger={(triggerKey) => {
                        setTriggerInEdit(triggerKey);
                        setPrevTriggerValues({
                          ...getValues('triggers'),
                        });
                      }}
                      onDeleteTrigger={(triggerKey) => {
                        const updatedTriggers = {
                          ...currentTriggers,
                        };

                        delete updatedTriggers[triggerKey];

                        setValue('triggers', updatedTriggers);
                        setValue('amountOperator', undefined);
                        setValue('amountValue', undefined);
                        setValue('amountRangeLeftValue', undefined);
                        setValue('amountRangeRightValue', undefined);
                        setValue('amountCurrency', undefined);
                      }}
                    />
                    <Typography variant="h5" mt={4} mb={1}>
                      {t(i18n)`Approval flow`}
                    </Typography>
                    <RulesTable
                      rules={currentRules}
                      // TODO setup callbacks
                      onAddRule={() => console.log('add rule')}
                      onEditRule={() => console.log('edit rule')}
                      onDeleteRule={() => console.log('delete rule')}
                    />
                  </Box>
                </>
              )}
            </Stack>
          </form>
        </FormProvider>
      </DialogContent>
      <Divider />
      <DialogActions>
        {triggerInEdit || scriptInEdit || isAddingTrigger ? (
          <>
            <Button variant="outlined" onClick={resetFormTriggerOrScript}>{t(
              i18n
            )`Cancel`}</Button>
            <Button
              variant="contained"
              onClick={(e) => {
                e.preventDefault();
                setTriggerInEdit(null);
                setScriptInEdit(null);
                setIsAddingTrigger(false);
                setValue('triggerType', null);
              }}
            >
              {triggerInEdit ? t(i18n)`Update` : t(i18n)`Add`}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setIsEdit(false);
              }}
            >
              {t(i18n)`Cancel`}
            </Button>
            <Button
              variant="contained"
              type="submit"
              form={formId}
              disabled={updateMutation.isPending}
            >{t(i18n)`Save`}</Button>
          </>
        )}
      </DialogActions>
    </>
  );
};
