import React from 'react';
import type { FC } from 'react';

import {
  Box,
  Container,
  Fade,
  makeStyles,
  Modal,
  Typography,
} from '@material-ui/core';

import { SubmitButton } from '../../../components';
import { Theme } from '../../../theme';

const { ipcRenderer } = require('electron');

const useStyles = makeStyles((theme: Theme) => {
  return {
    button: {
      maxWidth: 300,
      width: '35vw',
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
      padding: theme.spacing(3, 4),
    },
  };
});

const CloseWalletModal: FC = () => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleOpenModal = () => {
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
  };

  const handleCloseApp = () => {
    ipcRenderer.send('close-app');
  };

  return (
    <>
      <Container maxWidth="sm" style={{ padding: '0' }}>
        <SubmitButton
          testID="close-wallet-button"
          disabled={false}
          isSubmitting={false}
          onClick={handleOpenModal}
        >
          Close Wallet
        </SubmitButton>
      </Container>
      <Modal
        data-testid="close-wallet-modal"
        className={classes.modal}
        open={open}
        onClose={handleCloseModal}
        closeAfterTransition
        disableAutoFocus
        disableEnforceFocus
      >
        <Fade in={open}>
          <Box className={classes.paper}>
            <Typography variant="h2" gutterBottom>
              Close and Secure Wallet?
            </Typography>
            <Typography variant="body2" gutterBottom>
              Are you sure you want to close and secure the wallet?
            </Typography>
            <Box display="flex">
              <SubmitButton
                testID="close-wallet-deny"
                buttonClass={classes.button}
                onClick={handleCloseModal}
                isSubmitting={false}
                disabled={!open}
              >
                No, Keep Wallet Open
              </SubmitButton>
              <Box p={1} />
              <SubmitButton
                testID="close-wallet-confirm"
                buttonClass={classes.button}
                onClick={handleCloseApp}
                isSubmitting={false}
                disabled={!open}
              >
                Yes, Close Wallet
              </SubmitButton>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default CloseWalletModal;
