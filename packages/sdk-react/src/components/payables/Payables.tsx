import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { CustomerTypes } from '@/components/counterparts/types';
import { Dialog } from '@/components/Dialog';
import { PageHeader } from '@/components/PageHeader';
import { PayableDetails } from '@/components/payables/PayableDetails';
import { UsePayableDetailsProps } from '@/components/payables/PayableDetails/usePayableDetails';
import { PayablesTable } from '@/components/payables/PayablesTable';
import { useMoniteContext } from '@/core/context/MoniteContext';
import { MoniteScopedProviders } from '@/core/context/MoniteScopedProviders';
import { useRootElements } from '@/core/context/RootElementsProvider';
import { useFileInput } from '@/core/hooks';
import { useEntityUserByAuthToken } from '@/core/queries';
import { useIsActionAllowed } from '@/core/queries/usePermissions';
import { getAPIErrorMessage } from '@/core/utils/getAPIErrorMessage';
import { AccessRestriction } from '@/ui/accessRestriction';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { CircularProgress } from '@mui/material';

import { CreatePayableMenu } from './CreatePayableMenu';

export type PayablesProps = {
  /** @see {@link CustomerTypes} */
  customerTypes?: CustomerTypes;
} & Pick<
  UsePayableDetailsProps,
  | 'onSaved'
  | 'onCanceled'
  | 'onSubmitted'
  | 'onRejected'
  | 'onApproved'
  | 'onReopened'
  | 'onDeleted'
  | 'onPay'
  | 'onPayUS'
>;

export const Payables = (props: PayablesProps) => {
  return (
    <MoniteScopedProviders>
      <PayablesBase {...props} />
    </MoniteScopedProviders>
  );
};

const PayablesBase = ({
  onSaved,
  onCanceled,
  onSubmitted,
  onRejected,
  onApproved,
  onReopened,
  onDeleted,
  onPay,
  onPayUS,
  customerTypes,
}: PayablesProps) => {
  const { i18n } = useLingui();
  const { api, queryClient, componentSettings } = useMoniteContext();

  const [invoiceIdDialog, setInvoiceIdDialog] = useState<{
    invoiceId: string | undefined;
    open: boolean;
  }>({ invoiceId: undefined, open: false });

  const closeEditDialog = () => {
    setInvoiceIdDialog((prev) => ({
      ...prev,
      open: false,
      invoiceId: undefined,
    }));
  };

  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] =
    useState(false);

  const { FileInput, openFileInput, checkFileError } = useFileInput();
  const payableUploadFromFileMutation =
    api.payables.postPayablesUploadFromFile.useMutation(
      {},
      {
        onSuccess: () =>
          api.payables.getPayables.invalidateQueries(queryClient),
        onError: () => {
          // This onError does nothing.
          // The actionable onError is defined in payableUploadFromFileMutation.mutateAsync().
          // Need to define this onError so that global QueryClient.mutationCache.onError is skipped.
          return;
        },
      }
    );

  const handleFileUpload = (files: File | FileList) => {
    const fileArray = files instanceof File ? [files] : Array.from(files);

    fileArray.forEach((file) => {
      const error = checkFileError(file);
      if (error) {
        toast.error(error);
        return;
      }

      toast.promise(
        payableUploadFromFileMutation.mutateAsync({
          file,
        }),
        {
          loading: t(i18n)`Uploading ${file.name}`,
          success: t(i18n)`Payable ${file.name} uploaded successfully`,
          error: (error) => getAPIErrorMessage(i18n, error),
        }
      );
    });
  };

  const { data: user } = useEntityUserByAuthToken();

  const { data: isCreateAllowed, isLoading: isCreateAllowedLoading } =
    useIsActionAllowed({
      method: 'payable',
      action: 'create',
      entityUserId: user?.id,
    });

  const { data: isReadAllowed, isLoading: isReadAllowedLoading } =
    useIsActionAllowed({
      method: 'payable',
      action: 'read',
      entityUserId: user?.id,
    });

  const { root } = useRootElements();

  const className = 'Monite-Payables-Header';

  return (
    <>
      <PageHeader
        className={className + '-Header'}
        title={
          <>
            {t(i18n)`Payables`}
            {(isReadAllowedLoading || isCreateAllowedLoading) && (
              <CircularProgress size="0.7em" color="secondary" sx={{ ml: 1 }} />
            )}
          </>
        }
        extra={
          <CreatePayableMenu
            isCreateAllowed={isCreateAllowed}
            onCreateInvoice={() => setIsCreateInvoiceDialogOpen(true)}
            handleFileUpload={handleFileUpload}
          />
        }
      />
      {!isReadAllowed && !isReadAllowedLoading && <AccessRestriction />}
      {isReadAllowed && (
        <PayablesTable
          onRowClick={(id) => setInvoiceIdDialog({ open: true, invoiceId: id })}
          onPay={onPay}
          onPayUS={onPayUS}
          openFileInput={openFileInput}
          setIsCreateInvoiceDialogOpen={setIsCreateInvoiceDialogOpen}
        />
      )}
      <FileInput
        aria-label={t(i18n)`Upload payable files`}
        multiple
        onChange={(event) => {
          const files = event.target.files;
          if (files) handleFileUpload(files);
        }}
      />
      <Dialog
        className={className + '-Dialog-PayableDetails'}
        open={invoiceIdDialog.open}
        container={root}
        onClose={closeEditDialog}
        onClosed={closeEditDialog}
        fullScreen
      >
        <PayableDetails
          id={invoiceIdDialog.invoiceId}
          onClose={closeEditDialog}
          onSaved={onSaved}
          onCanceled={onCanceled}
          onSubmitted={onSubmitted}
          onRejected={onRejected}
          onApproved={onApproved}
          onReopened={onReopened}
          onDeleted={(payableId) => {
            onDeleted?.(payableId);
            closeEditDialog();
            toast(t(i18n)`Bill #${payableId} has been deleted`, {
              duration: 5000,
            });
          }}
          onPay={onPay}
          onPayUS={onPayUS}
          customerTypes={
            customerTypes || componentSettings?.counterparts?.customerTypes
          }
        />
      </Dialog>

      <Dialog
        className={className + '-Dialog-CreatePayable'}
        open={isCreateInvoiceDialogOpen}
        container={root}
        onClose={() => setIsCreateInvoiceDialogOpen(false)}
        fullScreen
      >
        <PayableDetails
          onClose={() => setIsCreateInvoiceDialogOpen(false)}
          onSaved={onSaved}
          customerTypes={
            customerTypes || componentSettings?.counterparts?.customerTypes
          }
        />
      </Dialog>
    </>
  );
};
