import React, { useState } from 'react';
import type { FC } from 'react';

import {
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Fab,
  Fade,
  makeStyles,
  Modal,
  Typography,
} from '@material-ui/core';
import { useTranslation } from 'react-i18next';

import useMobileCoinD from '../../hooks/useMobileCoinD';
import type { Theme } from '../../theme';

const useStyles = makeStyles((theme: Theme) => {
  return {
    hiddenEntropy: {
      letterSpacing: 2.95,
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
    shownEntropy: {
      letterSpacing: 1,
    },
  };
});

const ShowEntropyModal: FC = () => {
  const classes = useStyles();
  const [alertOpen, setAlertOpen] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showEntropy, setShowEntropy] = useState(false);
  const { entropy, isEntropyKnown, confirmEntropyKnown } = useMobileCoinD();
  const { t } = useTranslation('ShowEntropyModal');
  const handleCloseModal = () => {
    confirmEntropyKnown();
  };
  // TODO, i should start making a single util for all of this coercing logic
  const entropyString = entropy ? Buffer.from(entropy).toString('hex') : '';

  const toggleEntropy = () => {
    if (!canGoForward) setCanGoForward(true);
    setShowEntropy(!showEntropy);
  };

  const handleGoForward = () => {
    setAlertOpen(true);
    setShowEntropy(false);
  };

  const handleGoBack = () => {
    setAlertOpen(false);
  };

  const handleFinalConfirm = () => {
    confirmEntropyKnown();
    setAlertOpen(false);
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      className={classes.modal}
      open={!isEntropyKnown}
      onClose={handleCloseModal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 1000,
      }}
      disableAutoFocus
      disableEnforceFocus
      disableBackdropClick
    >
      <Fade in={!isEntropyKnown}>
        {!alertOpen ? (
          <Box className={classes.paper} display="flex" flexDirection="column">
            <Typography color="textPrimary" gutterBottom variant="h2">
              {t('header')}
            </Typography>
            <br />
            <Typography variant="body2" color="textSecondary">
              {t('description')}
            </Typography>
            <br />

            <Card>
              <CardContent>
                <Box py={3} display="flex" alignItems="center" flexDirection="column">
                  <Box p={2}>
                    <Fab variant="extended" color="primary" onClick={toggleEntropy} size="small">
                      {showEntropy ? t('hide') : t('show')}
                    </Fab>
                  </Box>
                  {showEntropy ? (
                    <Typography
                      className={classes.shownEntropy}
                      variant="body2"
                      color="textPrimary"
                    >
                      {entropyString}
                    </Typography>
                  ) : (
                    <Typography
                      className={classes.hiddenEntropy}
                      variant="body2"
                      color="textPrimary"
                    >
                      ****************************************************************
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
            <br />
            <Button
              color="secondary"
              disabled={!canGoForward}
              onClick={handleGoForward}
              size="large"
              fullWidth
              type="submit"
              variant="contained"
            >
              {t('secured')}
            </Button>
          </Box>
        ) : (
          <Box className={classes.paper}>
            <Typography color="textPrimary" gutterBottom variant="h2">
              {t('confirm')}
            </Typography>
            <br />
            <Typography variant="body2" color="textSecondary">
              {t('retrieve')}
            </Typography>
            <br />
            <Typography variant="body2" color="textSecondary">
              {t('recommend')}
            </Typography>
            <br />

            <Box display="flex" justifyContent="space-between">
              <Button
                color="secondary"
                onClick={handleGoBack}
                size="large"
                fullWidth
                type="submit"
                variant="contained"
              >
                {t('back')}
              </Button>
              <Box paddingX={2} />
              <Button
                color="secondary"
                fullWidth
                onClick={handleFinalConfirm}
                size="large"
                type="submit"
                variant="contained"
              >
                {t('yes')}
              </Button>
            </Box>
          </Box>
        )}
      </Fade>
    </Modal>
  );
};

export default ShowEntropyModal;
