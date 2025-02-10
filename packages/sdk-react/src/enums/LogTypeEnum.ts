import { components } from '@/api';

const schema: {
  [key in (components['schemas'] & {
    LogTypeEnum: string;
  })['LogTypeEnum']]: key;
} = {
  request: 'request',
  response: 'response',
};

export const LogTypeEnum = Object.values(schema);
