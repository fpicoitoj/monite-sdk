import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { ReceivablesTable } from './ReceivablesTable';

const meta: Meta<typeof ReceivablesTable> = {
  title: 'Receivables/Receivables — Table View',
  component: ReceivablesTable,
};

type Story = StoryObj<typeof ReceivablesTable>;

export const FullPermissions: Story = {
  args: {
    onRowClick: action('onRowClick'),
  },
  render: (args) => (
    <div style={{ height: 500, padding: 20 }}>
      <ReceivablesTable {...args} />
    </div>
  ),
};

export default meta;
