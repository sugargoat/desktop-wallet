import React from 'react';
import type { FC } from 'react';

import { Box, FormLabel, Typography, Switch } from '@material-ui/core';
import { useTranslation } from 'react-i18next';

import useMobilecoindConfigs from '../../../hooks/useMobilecoindConfigs';

const LeaveMobilecoindRunning: FC = () => {
  const { leaveMobilecoindRunning, toggleLeaveMobilecoindRunning } = useMobilecoindConfigs();
  const { t } = useTranslation('LeaveMobilecoindRunning');

  return (
    <Box flexGrow={1} mt={3}>
      <Box pt={2}>
        <FormLabel component="legend">
          <Typography color="primary">{t('formLabel')}</Typography>
        </FormLabel>
      </Box>
      <Box pt={2}>
        <Box display="flex" justifyContent="space-between">
          <Typography
            variant="body2"
            color={leaveMobilecoindRunning ? 'textPrimary' : 'textSecondary'}
          >
            {leaveMobilecoindRunning ? t('ternaryOn') : t('ternaryOff')}
          </Typography>
          <Box>
            <Switch
              checked={leaveMobilecoindRunning}
              onChange={toggleLeaveMobilecoindRunning}
              name="checkedC"
            />
          </Box>
        </Box>
        <Typography
          variant="body2"
          display="inline"
          color={leaveMobilecoindRunning ? 'textPrimary' : 'textSecondary'}
        >
          {leaveMobilecoindRunning ? t('ternaryWillSync') : t('ternaryWillNotSync')}
        </Typography>
        <Box py={1} />
        <Typography variant="body2" color="textSecondary">
          {t('defaultDescription')}
        </Typography>
      </Box>
    </Box>
  );
};

export default LeaveMobilecoindRunning;
