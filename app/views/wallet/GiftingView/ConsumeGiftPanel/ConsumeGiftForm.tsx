import React, { useState } from 'react';
import type { FC } from 'react';

import {
  Backdrop,
  Box,
  Button,
  Container,
  Fade,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  LinearProgress,
  Slide,
  Modal,
  Radio,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { Formik, Form, Field } from 'formik';
import { RadioGroup, TextField } from 'formik-material-ui';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';

import { SubmitButton, MOBNumberFormat } from '../../../../components';
import ShortCode from '../../../../components/ShortCode';
import useIsMountedRef from '../../../../hooks/useIsMountedRef';
import useMobileCoinD from '../../../../hooks/useMobileCoinD';
import type { Theme } from '../../../../theme';
import type Account from '../../../../types/Account';

// CBB: Shouldn't have to use this hack to get around state issues
const EMPTY_CONFIRMATION = {
  feeConfirmation: null,
  giftB58Code: '',
  totalValueConfirmation: null,
  txProposal: null,
};

const useStyles = makeStyles((theme: Theme) => {
  return {
    button: {
      width: 300,
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
    },
    code: {
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column',
      letterSpacing: '.70rem',
      marginRight: '-.70rem',
      padding: theme.spacing(1),
    },
    form: {
      paddingBottom: theme.spacing(2),
    },
    formControlLabelRoot: {
      marginRight: 0,
    },
    label: {
      width: '100%',
    },
    modal: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      border: '2px solid #000',
      boxShadow: theme.shadows[5],
      maxWidth: 800,
      padding: theme.spacing(2, 4, 3),
    },
    root: {},
  };
});

// TODO -- right now, we can show a progress bar for the sending modal
// But, it would be nice to have a counter that parses up to, say, 10 seconds, before
// warning that it's taking a bit long...
// TODO -- we may want to refactor out the modals and feed them props just to keep
// this component managable.
const ConsumeGiftForm: FC = () => {
  const classes = useStyles();
  const [confirmation, setConfirmation] = useState(EMPTY_CONFIRMATION);
  const [showModal, setShowModal] = useState(false);
  const [isAwaitingConformation, setIsAwaitingConformation] = useState(false);
  const [submittingConfimedGift, setSubmittingConfirmedGift] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const isMountedRef = useIsMountedRef();
  const {
    accountName,
    balance,
    openGiftCode,
    b58Code,
    submitTransaction,
  } = useMobileCoinD();

  // We'll use this array in prep for future patterns with multiple accounts
  const mockMultipleAccounts: Array<Account> = [
    {
      b58Code: b58Code || '', // TODO -- This hack is to bypass the null state hack on initailization
      balance: balance || BigInt(0), // once we move to multiple accounts, we won't have to null the values of an account (better typing!)
      name: accountName,
    },
  ];

  const handleClose = () => {
    setShowModal(false);
    setIsAwaitingConformation(false);
    setConfirmation(EMPTY_CONFIRMATION);
    enqueueSnackbar('Gift Canceled', {
      variant: 'warning',
    });
  };

  const handleConfirm = (setErrors, setStatus) => {
    return async () => {
      setSubmittingConfirmedGift(true);
      setShowModal(false);
      try {
        if (
          confirmation.txProposal === null
          || confirmation.txProposal === undefined
        ) throw new Error('Could not find confirmation');

        await submitTransaction(confirmation.txProposal);
        if (isMountedRef.current) {
          setStatus({ success: true });
          setSubmittingConfirmedGift(false);
          setIsAwaitingConformation(false);
          setConfirmation(EMPTY_CONFIRMATION);
          enqueueSnackbar('Gift Received! Your balance will update shortly.', {
            variant: 'success',
          });
        }
      } catch (err) {
        if (isMountedRef.current) {
          const santitizedError = err.message
            === '13 INTERNAL: transactions_manager.submit_tx_proposal: Connection(Operation { error: TransactionValidation(ContainsSpentKeyImage), total_delay: 0ns, tries: 1 })'
            ? 'This gift has already been claimed!'
            : err.message;
          setStatus({ success: false });
          setErrors({ submit: santitizedError });
          setSubmittingConfirmedGift(false);
          setIsAwaitingConformation(false);
          setConfirmation(EMPTY_CONFIRMATION);
          enqueueSnackbar('Hmm, something went wrong.', {
            variant: 'error',
          });
        }
      }
    };
  };

  const createAccountLabel = (account: Account) => {
    const name = account.name && account.name.length > 0
      ? `${account.name}: `
      : 'Unnamed Account: ';
    return (
      <Box display="flex" justifyContent="space-between">
        <Typography>
          {name}
          <ShortCode code={account.b58Code} />
        </Typography>
        <Typography>
          <MOBNumberFormat
            value={account.balance.toString()} // TODO - have MOBNumberFormat take BigInt
            valueUnit="pMOB"
          />
        </Typography>
      </Box>
    );
  };

  const renderSenderPublicAdddressOptions = (
    accounts: Account[],
    isSubmitting: boolean,
  ) => {
    return (
      <Box pt={2}>
        <FormLabel className={classes.form} component="legend">
          <Typography color="primary">Select Account</Typography>
        </FormLabel>
        <Field component={RadioGroup} name="senderPublicAddress">
          <Box display="flex" justifyContent="space-between">
            <Typography>Account Name</Typography>
            <Typography>Account Balance</Typography>
          </Box>
          {accounts.map((account: Account) => {
            return (
              <FormControlLabel
                key={account.b58Code}
                value={account.b58Code}
                control={<Radio disabled={isSubmitting} />}
                label={createAccountLabel(account)}
                labelPlacement="end"
                disabled={isSubmitting}
                classes={{
                  label: classes.label,
                  root: classes.formControlLabelRoot,
                }}
              />
            );
          })}
        </Field>
      </Box>
    );
  };

  return (
    <Formik
      isInitialValid={false}
      initialValues={{
        giftB58Code: '', // mobs
        senderPublicAddress: mockMultipleAccounts[0].b58Code,
        submit: null,
      }}
      validationSchema={Yup.object().shape({
        giftB58Code: Yup.string().required(
          'You need a valid gift code to open a gift.',
        ),
      })}
      validateOnMount
      onSubmit={async (
        values,
        {
          setErrors, setStatus, setSubmitting, resetForm,
        },
      ) => {
        try {
          setIsAwaitingConformation(true);
          const result = await openGiftCode(values.giftB58Code);
          if (result === null || result === undefined) throw new Error('Could not find gift with code.');

          const {
            feeConfirmation,
            totalValueConfirmation,
            txProposal,
          } = result;

          setConfirmation({
            feeConfirmation,
            totalValueConfirmation,
            txProposal,
          });
          setShowModal(true);

          if (isMountedRef.current) {
            setSubmitting(false);
            resetForm();
          }
        } catch (err) {
          if (isMountedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
            setIsAwaitingConformation(false);
          }
        }
      }}
    >
      {({
        errors,
        isSubmitting,
        isValid,
        submitForm,
        setErrors,
        setStatus,
        values,
      }) => {
        const selectedBalance =
          // TODO -- this is fine. we'll gut it anyway once we add multiple accounts
          // eslint-disable-next-line
          // @ts-ignore
          mockMultipleAccounts.find((account) => {
            return account.b58Code === values.senderPublicAddress;
          }).balance;
        let increasedBalance;
        let totalSent;
        if (
          confirmation?.totalValueConfirmation
          && confirmation?.feeConfirmation
        ) {
          increasedBalance = selectedBalance + confirmation?.totalValueConfirmation;
          // TODO - wtf is totalsent? rename or recalc
          totalSent = confirmation?.totalValueConfirmation
            + confirmation?.feeConfirmation;
        }
        return (
          <Form>
            {renderSenderPublicAdddressOptions(
              mockMultipleAccounts,
              isSubmitting,
            )}
            <Box pt={4}>
              <FormLabel component="legend">
                <Typography color="primary">Gift Details</Typography>
              </FormLabel>
              <Field
                component={TextField}
                fullWidth
                label="Gift Code"
                margin="normal"
                name="giftB58Code"
                id="giftB58Code"
                type="text"
              />
            </Box>
            {errors.submit && (
              <Box mt={3}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}
            <SubmitButton
              disabled={!isValid || isSubmitting}
              onClick={submitForm}
              isSubmitting={isAwaitingConformation || isSubmitting}
            >
              Open Gift
            </SubmitButton>
            <Modal
              aria-labelledby="transition-modal-title"
              aria-describedby="transition-modal-description"
              className={classes.modal}
              open={showModal}
              onClose={handleClose}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 1000,
              }}
              disableAutoFocus
              disableEnforceFocus
            >
              <Slide in={showModal} timeout={{ enter: 0, exit: 0 }}>
                <Container className={classes.paper}>
                  <Typography variant="h1" id="transition-modal-title">
                    Gift Confirmation
                  </Typography>
                  <Box py={2} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Account Balance:</Typography>
                    <Typography>
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={selectedBalance?.toString()}
                      />
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>---</Typography>
                    <Typography>---</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Total:</Typography>
                    <Typography>
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={totalSent?.toString()}
                      />
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Fee:</Typography>
                    <Typography>
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={confirmation?.feeConfirmation?.toString()}
                      />
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="primary">Gift Value:</Typography>
                    <Typography color="primary">
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={confirmation?.totalValueConfirmation?.toString()}
                      />
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>---</Typography>
                    <Typography>---</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography color="primary">New Balance:</Typography>
                    <Typography color="primary">
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={increasedBalance?.toString()}
                      />
                    </Typography>
                  </Box>
                  <Box py={1} />
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      className={classes.button}
                      color="secondary"
                      onClick={handleClose}
                      size="large"
                      fullWidth
                      variant="contained"
                    >
                      Cancel
                    </Button>
                    <Box px={2} />
                    <Button
                      className={classes.button}
                      color="secondary"
                      fullWidth
                      onClick={handleConfirm(setErrors, setStatus)}
                      variant="contained"
                    >
                      Claim Gift
                    </Button>
                  </Box>
                </Container>
              </Slide>
            </Modal>
            <Modal
              className={classes.modal}
              open={submittingConfimedGift}
              closeAfterTransition
              disableAutoFocus
              disableEnforceFocus
              disableBackdropClick
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 1000,
              }}
            >
              <Fade
                in={submittingConfimedGift}
                timeout={{ enter: 15000, exit: 0 }}
              >
                <Box width="100%" p={3}>
                  <LinearProgress />
                </Box>
              </Fade>
            </Modal>
          </Form>
        );
      }}
    </Formik>
  );
};

export default ConsumeGiftForm;
