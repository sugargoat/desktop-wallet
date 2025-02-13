import React, { useState } from 'react';
import type { ChangeEvent, FC } from 'react';

import {
  Backdrop,
  Box,
  Button,
  Fade,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputAdornment,
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
import LongCode from '../../../../components/LongCode';
import ShortCode from '../../../../components/ShortCode';
import { MOBIcon } from '../../../../components/icons';
import useIsMountedRef from '../../../../hooks/useIsMountedRef';
import useMobileCoinD from '../../../../hooks/useMobileCoinD';
import type { Theme } from '../../../../theme';
import type Account from '../../../../types/Account';

// CBB: Shouldn't have to use this hack to get around state issues
const EMPTY_CONFIRMATION = {
  feeConfirmation: null,
  totalValueConfirmation: null,
  txProposal: null,
  txProposalReceiverB58Code: '',
};

const useStyles = makeStyles((theme: Theme) => {
  return {
    button: {
      width: 200,
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

// TODO - ya, this definitely shouldn't live here
const convertMobStringToPicoMobBigInt = (mobString: string): bigint => {
  return BigInt(mobString.replace('.', ''));
};

const convertPicoMobStringToMob = (picoMobString: string): string => {
  if (picoMobString.length <= 12) {
    return `0.${'0'.repeat(12 - picoMobString.length)}${picoMobString}`;
  }

  return [
    picoMobString.slice(0, picoMobString.length - 12),
    '.',
    picoMobString.slice(picoMobString.length - 12),
  ].join('');
};

// MOVE LATER
function commafy(num: string) {
  const str = num.split('.');
  if (str[0].length >= 4) {
    str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  return str.join('.');
}

const SendMobForm: FC = () => {
  const classes = useStyles();
  const [confirmation, setConfirmation] = useState(EMPTY_CONFIRMATION);

  const [open, setOpen] = useState(false);
  const [isAwaitingConformation, setIsAwaitingConformation] = useState(false);
  const [sendingOpen, setSendingOpen] = useState(false);
  const [slideExitSpeed, setSlideExitSpeed] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const isMountedRef = useIsMountedRef();
  const {
    accountName,
    b58Code,
    balance,
    buildTransaction,
    networkHighestBlockIndex,
    nextBlock,
    submitTransaction,
  } = useMobileCoinD();

  // TODO - this isSynced stuff should live in 1 location -- maybe as context state
  let isSynced = false;
  if (
    networkHighestBlockIndex === null
    || nextBlock === null
    || networkHighestBlockIndex < 0
    || nextBlock < 0
    || nextBlock - 1 > networkHighestBlockIndex
  ) {
    isSynced = false;
  } else {
    isSynced = networkHighestBlockIndex - nextBlock < 2; // Let's say a diff of 1 is fine.
  }

  // We'll use this array in prep for future patterns with multiple accounts
  const mockMultipleAccounts: Array<Account> = [
    {
      b58Code: b58Code || '', // TODO -- This hack is to bypass the null state hack on initailization
      balance: balance || BigInt(0), // once we move to multiple accounts, we won't have to null the values of an account (better typing!)
      name: accountName,
    },
  ];

  const handleOpen = (values, setStatus, setErrors) => {
    return async () => {
      try {
        setIsAwaitingConformation(true);
        const result = await buildTransaction(
          convertMobStringToPicoMobBigInt(values.mobAmount),
          convertMobStringToPicoMobBigInt(values.feeAmount),
          values.recipientPublicAddress,
        );
        if (result === null || result === undefined) throw new Error('Could not build transaction.');

        const {
          feeConfirmation,
          totalValueConfirmation,
          txProposal,
          txProposalReceiverB58Code,
        } = result;
        setConfirmation({
          feeConfirmation,
          totalValueConfirmation,
          txProposal,
          txProposalReceiverB58Code,
        });

        setOpen(true);
      } catch (err) {
        setStatus({ success: false });
        setErrors({ submit: err.message });
        setIsAwaitingConformation(false);
        setConfirmation(EMPTY_CONFIRMATION);
      }
    };
  };

  const handleClose = (
    setSubmitting: (boolean: boolean) => void,
    resetForm: () => void,
  ) => {
    return () => {
      setSlideExitSpeed(0);
      enqueueSnackbar('Transaction Canceled', {
        variant: 'warning',
      });
      setOpen(false);
      setSubmitting(false);
      resetForm();
      setIsAwaitingConformation(false);
      setConfirmation(EMPTY_CONFIRMATION);
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
            value={account.balance.toString()}
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
                classes={{ label: classes.label }}
              />
            );
          })}
        </Field>
      </Box>
    );
  };

  const validateAmount = (selectedBalance: bigint, fee: bigint) => {
    return (valueString: string) => {
      let error;
      const valueAsPicoMob = BigInt(valueString.replace('.', ''));
      if (valueAsPicoMob + fee > selectedBalance) {
        // TODO - probably want to replace this before launch
        error = 'Please reserve 0.01 MOB for transaction fee.';
      }
      return error;
    };
  };

  // We'll use this to auto-select all text when focused. This is a better user
  // experience than having to click the left-most area to start typing (else)
  // having to spam backspace.
  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    <Formik
      isInitialValid={false}
      initialValues={{
        feeAmount: '0.010000000000', // TODO we need to pull this from constants
        mobAmount: '0', // mobs
        recipientPublicAddress: '',
        senderPublicAddress: mockMultipleAccounts[0].b58Code,
        submit: null,
      }}
      validationSchema={Yup.object().shape({
        mobAmount: Yup.number()
          .positive('A positive, non-zero amount is required to send MOB.')
          .required('A positive, non-zero amount is required to send MOB.'),
        recipientPublicAddress: Yup.string().required(
          'A Public Address is required to send MOB.',
        ),
      })}
      validateOnMount
      onSubmit={async (
        values,
        {
          setErrors, setStatus, setSubmitting, resetForm,
        },
      ) => {
        // TODO -- I don't like this flow. The cnvenience call skips verification.
        // That means that we are "verifying" based on the front-end UI state --
        // this is pretty horrendous for a verification step in any payment flow.
        // We should, instead, display exactly what mobilecoind is about to send
        // (not what the UI thinks it is telling mobilecoind).
        // But it looks like we're going to have to gut payAddressCode and use 2
        // calls instead.

        try {
          setSlideExitSpeed(1000);
          setOpen(false);
          setSendingOpen(true);
          submitTransaction(confirmation.txProposal);

          if (isMountedRef.current) {
            const totalValueConfirmationAsMob = convertPicoMobStringToMob(
              confirmation?.totalValueConfirmation?.toString(),
            );
            const totalValueConfirmationAsMobComma = commafy(
              totalValueConfirmationAsMob,
            );

            enqueueSnackbar(
              `Successfully sent ${totalValueConfirmationAsMobComma} MOB!`,
              {
                variant: 'success',
              },
            );
            setStatus({ success: true });
            setSendingOpen(false);
            setSubmitting(false);
            resetForm();
            setIsAwaitingConformation(false);
            setConfirmation(EMPTY_CONFIRMATION);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          if (isMountedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSendingOpen(false);
            setSubmitting(false);
            setIsAwaitingConformation(false);
            setConfirmation(EMPTY_CONFIRMATION);
          }
        }
      }}
    >
      {({
        errors,
        isSubmitting,
        isValid,
        resetForm,
        submitForm,
        setSubmitting,
        setStatus,
        setErrors,
        values,
      }) => {
        // NOTE: because this is just a display for the value up to 3 dec mob,
        // We do not need the precision to be BigInt

        const selectedBalance =
          // TODO -- this is fine. we'll gut it anyway once we add multiple accounts
          // eslint-disable-next-line
          // @ts-ignore
          mockMultipleAccounts.find((account) => {
            return account.b58Code === values.senderPublicAddress;
          }).balance;

        let remainingBalance;
        let totalSent;
        if (
          confirmation?.totalValueConfirmation
          && confirmation?.feeConfirmation
        ) {
          remainingBalance = selectedBalance
            - (confirmation?.totalValueConfirmation
              + confirmation?.feeConfirmation);
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
                <Typography color="primary">Transaction Details</Typography>
              </FormLabel>
              <Field
                component={TextField}
                fullWidth
                label="Recipient Public Address"
                margin="normal"
                name="recipientPublicAddress"
                type="text"
              />
              <Field
                component={TextField}
                fullWidth
                label="MOB Amount"
                margin="normal"
                name="mobAmount"
                id="mobAmount"
                type="text"
                onFocus={handleSelect}
                validate={validateAmount(
                  selectedBalance,
                  BigInt(values.feeAmount * 1_000_000_000_000),
                )}
                InputProps={{
                  inputComponent: MOBNumberFormat,
                  startAdornment: (
                    <InputAdornment position="start">
                      <MOBIcon height={20} width={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            {errors.submit && (
              <Box mt={3}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}
            {!isSynced && (
              <Box mt={3}>
                <FormHelperText error>
                  Wallet must sync with ledger before sending MOB.
                </FormHelperText>
              </Box>
            )}
            <SubmitButton
              disabled={!isSynced || !isValid || isSubmitting}
              onClick={handleOpen(values, setStatus, setErrors)}
              isSubmitting={isAwaitingConformation || isSubmitting}
            >
              {isSynced ? 'Send Payment' : 'Wallet syncing...'}
            </SubmitButton>
            {/* TODO - disable model if invalid */}
            <Modal
              aria-labelledby="transition-modal-title"
              aria-describedby="transition-modal-description"
              className={classes.modal}
              open={open}
              onClose={handleClose(setSubmitting, resetForm)}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 1000,
              }}
              disableAutoFocus
              disableEnforceFocus
            >
              <Slide in={open} timeout={{ enter: 0, exit: slideExitSpeed }}>
                <div className={classes.paper}>
                  <h2 id="transition-modal-title">Send MOB Confirmation</h2>
                  <p id="transition-modal-description">
                    Please check and confirm your payment intent:
                  </p>
                  <br />

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
                    <Typography color="primary">Amount:</Typography>
                    <Typography color="primary">
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={confirmation?.totalValueConfirmation?.toString()}
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
                    <Typography>---</Typography>
                    <Typography>---</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Remaining Balance:</Typography>
                    <Typography>
                      <MOBNumberFormat
                        suffix=" MOB"
                        valueUnit="pMOB"
                        value={remainingBalance?.toString()}
                      />
                    </Typography>
                  </Box>
                  <br />

                  <p className={classes.center}>
                    Recipient Address (Their Address)
                  </p>
                  <LongCode
                    code={confirmation?.txProposalReceiverB58Code}
                    codeClass={classes.code}
                    tip=""
                  />
                  <br />

                  <p className={classes.center}>
                    Sender Address (Your Address)
                  </p>
                  <LongCode
                    code={values.senderPublicAddress}
                    codeClass={classes.code}
                    tip=""
                  />
                  <br />
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      className={classes.button}
                      color="secondary"
                      disabled={!isValid || isSubmitting}
                      onClick={handleClose(setSubmitting, resetForm)}
                      size="large"
                      fullWidth
                      type="submit"
                      variant="contained"
                    >
                      Cancel
                    </Button>
                    <Button
                      className={classes.button}
                      color="secondary"
                      disabled={!isValid || isSubmitting}
                      fullWidth
                      onClick={submitForm}
                      size="large"
                      type="submit"
                      variant="contained"
                    >
                      Confirm Send
                    </Button>
                  </Box>
                </div>
              </Slide>
            </Modal>
            <Modal
              className={classes.modal}
              open={sendingOpen}
              closeAfterTransition
              disableAutoFocus
              disableEnforceFocus
              disableBackdropClick
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 1000,
              }}
            >
              <Fade in={sendingOpen} timeout={{ enter: 15000, exit: 0 }}>
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

export default SendMobForm;
