import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useIntervalFn, watchIgnorable } from '@vueuse/core';

await waitGlobalInitialized('Mvu');

export const useDataStore = defineStore(
  `mvu_data.message.${getCurrentMessageId()}`,
  errorCatched(() => {
    const data = ref(_.get(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data', {}));

    let ignoreUpdates: ReturnType<typeof watchIgnorable>['ignoreUpdates'];

    useIntervalFn(() => {
      const stat_data = _.get(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data', {});
      if (!_.isEqual(data.value, stat_data)) {
        ignoreUpdates(() => {
          data.value = stat_data;
        });
        if (!_.isEqual(stat_data, data.value)) {
          updateVariablesWith(variables => _.set(variables, 'stat_data', data.value), {
            type: 'message',
            message_id: getCurrentMessageId(),
          });
        }
      }
    }, 2000);

    const { ignoreUpdates: ignore } = watchIgnorable(
      data,
      new_data => {
        updateVariablesWith(variables => _.set(variables, 'stat_data', new_data), {
          type: 'message',
          message_id: getCurrentMessageId(),
        });
      },
      { deep: true },
    );

    ignoreUpdates = ignore;

    return { data };
  }),
);
