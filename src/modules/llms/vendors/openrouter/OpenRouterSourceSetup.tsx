import * as React from 'react';

import { Button, Typography } from '@mui/joy';

import { FormInputKey } from '~/common/components/forms/FormInputKey';
import { InlineError } from '~/common/components/InlineError';
import { Link } from '~/common/components/Link';
import { SetupFormRefetchButton } from '~/common/components/forms/SetupFormRefetchButton';
import { apiQuery } from '~/common/util/trpc.client';
import { getCallbackUrl } from '~/common/app.routes';

import { DModelSourceId, useModelsStore, useSourceSetup } from '../../store-llms';
import { modelDescriptionToDLLM } from '../openai/OpenAISourceSetup';

import { isValidOpenRouterKey, ModelVendorOpenRouter } from './openrouter.vendor';


export function OpenRouterSourceSetup(props: { sourceId: DModelSourceId }) {

  // external state
  const { source, sourceHasLLMs, access, updateSetup } =
    useSourceSetup(props.sourceId, ModelVendorOpenRouter.getAccess);

  // derived state
  const { oaiKey } = access;

  const needsUserKey = !ModelVendorOpenRouter.hasBackendCap?.();
  const keyValid = isValidOpenRouterKey(oaiKey);
  const keyError = (/*needsUserKey ||*/ !!oaiKey) && !keyValid;
  const shallFetchSucceed = oaiKey ? keyValid : !needsUserKey;

  // fetch models
  const { isFetching, refetch, isError, error } = apiQuery.llmOpenAI.listModels.useQuery({ access }, {
    enabled: !sourceHasLLMs && shallFetchSucceed,
    onSuccess: models => source && useModelsStore.getState().setLLMs(
      models.models.map(model => modelDescriptionToDLLM(model, source)),
      props.sourceId,
    ),
    staleTime: Infinity,
  });


  const handleOpenRouterLogin = () => {
    // replace the current page with the OAuth page
    const callbackUrl = getCallbackUrl('openrouter');
    const oauthUrl = 'https://openrouter.ai/auth?callback_url=' + encodeURIComponent(callbackUrl);
    window.open(oauthUrl, '_self');
    // ...bye / see you soon at the callback location...
  };


  return <>

    {/*<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>*/}
    {/*<OpenRouterIcon />*/}
    <Typography level='body-sm'>
      <Link href='https://openrouter.ai/keys' target='_blank'>OpenRouter</Link> is an independent, premium service
      granting access to <Link href='https://openrouter.ai/docs#models' target='_blank'>exclusive models</Link> such
      as GPT-4 32k, Claude, and more, typically unavailable to the public. <Link
      href='https://github.com/enricoros/big-agi/blob/main/docs/config-openrouter.md'>Configuration &amp; documentation</Link>.
    </Typography>
    {/*</Box>*/}

    <FormInputKey
      id='openrouter-key' label='OpenRouter API Key'
      rightLabel={<>{needsUserKey
        ? !oaiKey && <Link level='body-sm' href='https://openrouter.ai/keys' target='_blank'>your keys</Link>
        : '✔️ already set in server'
      } {oaiKey && keyValid && <Link level='body-sm' href='https://openrouter.ai/activity' target='_blank'>check usage</Link>}
      </>}
      value={oaiKey} onChange={value => updateSetup({ oaiKey: value })}
      required={needsUserKey} isError={keyError}
      placeholder='sk-or-...'
    />

    <SetupFormRefetchButton
      refetch={refetch} disabled={!shallFetchSucceed || isFetching} error={isError}
      leftButton={
        <Button color='neutral' variant={(needsUserKey && !keyValid) ? 'solid' : 'outlined'} onClick={handleOpenRouterLogin}>
          OpenRouter Login
        </Button>
      }
    />

    {isError && <InlineError error={error} />}

  </>;
}
