import { components } from '@/api';
import { isActionAllowed, usePermissions } from '@/core/queries/usePermissions';
import { I18n } from '@lingui/core';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import type { GridActionsColDef } from '@mui/x-data-grid/models/colDef/gridColDef';

export interface UseInvoiceRowActionMenuCellProps {
  /**
   * The event handler for an invoice row action.
   * If not provided, the action menu will not be displayed.
   * @param props.id - The identifier of the clicked row, a string.
   * @param props.action - The action to be performed, an `InvoicesTableRowAction`.
   */
  onRowActionClick: (props: {
    id: string;
    action?: InvoicesTableRowAction;
  }) => void;

  /**
   * The actions to be displayed in the row's action menu.
   * If not provided, default actions will be displayed,
   * in case if `onRowActionClick` is provided.
   *
   * @example
   * ```ts
   * {
   *   "draft": ['view', 'edit', 'issue', 'delete'], // Optional
   *   "issued": ['view', 'send', 'cancel', 'copyPaymentLink'], // Optional
   *   "canceled": ['view', 'send'], // Optional
   *   "partially_paid": ['view', 'send', 'copyPaymentLink', 'cancel'], // Optional
   *   "overdue": ['view', 'send', 'copyPaymentLink', 'cancel', 'markUncollectible'], // Optional
   *   "paid": ['view'], // Optional
   *   "uncollectible": ['view'], // Optional
   *   "expired": ['view'], // Optional
   *   "accepted": ['view'], // Optional
   *   "declined": ['view'], // Optional
   *   "recurring": ['view'], // Optional
   *   "deleted": [], // Optional
   * }
   * ```
   */
  rowActions?: Partial<InvoicesTableRowActionSchema>;
}

export const useInvoiceRowActionMenuCell = (
  props: UseInvoiceRowActionMenuCellProps | {}
):
  | GridActionsColDef<components['schemas']['ReceivableResponse']>
  | undefined => {
  const { data: receivableActionSchema, userIdFromAuthToken } =
    usePermissions('receivable');
  const { i18n } = useLingui();

  if (!('onRowActionClick' in props && props.onRowActionClick)) return;

  return {
    field: 'action_menu',
    type: 'actions',
    headerName: t(i18n)({
      message: 'Action menu',
      context: 'InvoicesTableRowActionMenu',
    }),
    renderHeader: () => null,
    getActions: (params) => {
      const menuItems = getInvoiceActionMenuItems({
        // casts, because it is not possible to resolve `type` based on multiple different enum
        invoice: params.row as components['schemas']['InvoiceResponsePayload'],
        actions: props.rowActions,
        receivableActionSchema,
        userIdFromAuthToken,
        i18n,
      });

      return menuItems.map(({ label, action }) => (
        <GridActionsCellItem
          showInMenu
          label={label}
          onClick={(event) => {
            event.preventDefault();
            props.onRowActionClick({ id: params.row.id, action });
          }}
        />
      ));
    },
  };
};

const getInvoiceActionMenuItems = ({
  invoice,
  actions: inActions,
  receivableActionSchema,
  userIdFromAuthToken,
  i18n,
}: {
  invoice: components['schemas']['InvoiceResponsePayload'];
  actions?: Partial<InvoicesTableRowActionSchema>;
  receivableActionSchema: components['schemas']['ActionSchema'][] | undefined;
  userIdFromAuthToken: string | undefined;
  i18n: I18n;
}): InvoicesTableRowActionMenuItem[] => {
  const actions =
    inActions?.[invoice.status] ?? DEFAULT_ACTION_LIST[invoice.status];

  const allowedActions = filterInvoiceActionMenuAllowedItems(
    receivableActionSchema,
    actions,
    invoice,
    userIdFromAuthToken
  );

  const allMenuItems = getInvoiceActionMenuItemLabels(i18n);

  return Object.entries(allMenuItems)
    .filter(
      (menuItem): menuItem is [action: InvoicesTableRowAction, label: string] =>
        allowedActions.includes(menuItem[0] as InvoicesTableRowAction)
    )
    .map(([action, label]) => ({ action, label }));
};

export const filterInvoiceActionMenuAllowedItems = (
  actionSchema: components['schemas']['ActionSchema'][] | undefined,
  menuItemsToFilter: InvoicesTableRowAction[],
  invoice: components['schemas']['InvoiceResponsePayload'],
  userIdFromAuthToken: string | undefined
) => {
  const isAllowedInvoiceAction = (
    action: Parameters<typeof isActionAllowed>[0]['action']
  ) =>
    isActionAllowed({
      action,
      actions: actionSchema as Array<components['schemas']['ActionSchema']>,
      entityUserId: invoice.entity_user_id,
      entityUserIdFromAuthToken: userIdFromAuthToken,
    });

  const menuItemsPermissionMap: Record<InvoicesTableRowAction, boolean> = {
    view: isAllowedInvoiceAction('read'),
    edit: isAllowedInvoiceAction('update'),
    issue: isAllowedInvoiceAction('update'),
    delete: isAllowedInvoiceAction('delete'),
    copyPaymentLink: isAllowedInvoiceAction('read'),
    cancel: isAllowedInvoiceAction('update'),
    markUncollectible: isAllowedInvoiceAction('update'),
    recurrent: isAllowedInvoiceAction('create'),
    partiallyPay: isAllowedInvoiceAction('update'),
    pay: isAllowedInvoiceAction('update'),
    overduePayment: isAllowedInvoiceAction('update'),
    send: isAllowedInvoiceAction('create'),
  };

  return menuItemsToFilter.filter(
    (itemValue) => menuItemsPermissionMap[itemValue]
  );
};

const DEFAULT_ACTION_LIST: InvoicesTableRowActionSchema = {
  ['draft']: ['view', 'edit', 'delete'], // 'issue', 'recurrent' are not default
  ['issued']: ['view', 'send', 'cancel'], // 'copyPaymentLink', 'partiallyPay', 'overduePayment' are not default
  ['canceled']: ['view'],
  ['partially_paid']: [
    // 'copyPaymentLink', 'pay', 'overduePayment' are not default
    'view',
    'send',
    'cancel',
  ],
  ['overdue']: ['view', 'send', 'cancel'], // 'copyPaymentLink', 'pay','markUncollectible' are not default
  ['paid']: ['view'],
  ['uncollectible']: ['view'],
  ['expired']: ['view'],
  ['accepted']: ['view'],
  ['declined']: ['view'],
  ['recurring']: ['view'],
  ['deleted']: [],
};

const getInvoiceActionMenuItemLabels = (
  i18n: I18n
): Record<InvoicesTableRowAction, string> => ({
  view: t(i18n)({
    message: 'View',
    context: 'InvoicesTableRowActionMenu',
  }),
  send: t(i18n)({
    message: 'Send',
    context: 'InvoicesTableRowActionMenu',
  }),
  copyPaymentLink: t(i18n)({
    message: 'Copy payment link',
    context: 'InvoicesTableRowActionMenu',
  }),
  cancel: t(i18n)({
    message: 'Cancel',
    context: 'InvoicesTableRowActionMenu',
  }),
  edit: t(i18n)({
    message: 'Edit',
    context: 'InvoicesTableRowActionMenu',
  }),
  delete: t(i18n)({
    message: 'Delete',
    context: 'InvoicesTableRowActionMenu',
  }),
  markUncollectible: t(i18n)({
    message: 'Mark uncollectible',
    context: 'InvoicesTableRowActionMenu',
  }),
  issue: t(i18n)({
    message: 'Issue',
    context: 'InvoicesTableRowActionMenu',
  }),
  recurrent: t(i18n)({
    message: 'Recurring',
    context: 'InvoicesTableRowActionMenu',
  }),
  partiallyPay: t(i18n)({
    message: 'Partially pay',
    context: 'InvoicesTableRowActionMenu',
  }),
  pay: t(i18n)({
    message: 'Pay',
    context: 'InvoicesTableRowActionMenu',
  }),
  overduePayment: t(i18n)({
    message: 'Overdue payment',
    context: 'InvoicesTableRowActionMenu',
  }),
});

interface InvoicesTableRowActionMenuItem {
  label: string;
  action: InvoicesTableRowAction;
}

/**
 * Represents the possible actions that can be performed on an Invoice row.
 *
 * @property {'recurrent'} recurrent - Sets an invoice as recurrent.
 * @property {'issue'} issue - Issues an invoice.
 * @property {'delete'} delete - Deletes an invoice.
 * @property {'cancel'} cancel - Cancels an invoice.
 * @property {'partiallyPay'} partiallyPay - Partially pays an invoice.
 * @property {'pay'} pay - Fully pays an invoice.
 * @property {'overduePayment'} overduePayment - Marks an invoice payment as overdue.
 * @property {'markUncollectible'} markUncollectible - Marks an invoice as uncollectible.
 * @property {'view'} view - Views an invoice.
 * @property {'edit'} edit - Edits an invoice.
 * @property {'copyPaymentLink'} copyPaymentLink - Copies the payment link of an invoice.
 * @property {'send'} send - Sends an invoice.
 */
export type InvoicesTableRowAction =
  | 'recurrent'
  | 'issue'
  | 'delete'
  | 'cancel'
  | 'partiallyPay'
  | 'pay'
  | 'overduePayment'
  | 'markUncollectible'
  // custom actions
  | 'view'
  | 'edit'
  | 'copyPaymentLink'
  | 'send';

/**
 * Represents the possible actions that can be performed on an Invoice row for each status.
 *
 * @description Each status corresponds to a specific set of actions that can be executed on an invoice.
 */
export interface InvoicesTableRowActionSchema
  extends Record<
    components['schemas']['ReceivablesStatusEnum'],
    InvoicesTableRowAction[]
  > {
  ['draft']: Array<'view' | 'edit' | 'issue' | 'recurrent' | 'delete'>;
  ['issued']: Array<
    | 'view'
    | 'send'
    | 'copyPaymentLink'
    | 'pay'
    | 'partiallyPay'
    | 'overduePayment'
    | 'cancel'
  >;
  ['canceled']: Array<'view'>;
  ['partially_paid']: Array<
    'view' | 'send' | 'copyPaymentLink' | 'pay' | 'overduePayment' | 'cancel'
  >;
  ['overdue']: Array<
    'view' | 'send' | 'copyPaymentLink' | 'pay' | 'cancel' | 'markUncollectible'
  >;
  ['paid']: Array<'view'>;
  ['uncollectible']: Array<'view'>;
  ['expired']: Array<'view'>;
  ['accepted']: Array<'view'>;
  ['declined']: Array<'view'>;
  ['recurring']: Array<'view'>;
  ['deleted']: Array<never>;
}
