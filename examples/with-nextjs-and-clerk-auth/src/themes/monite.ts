import '@monite/sdk-react/mui-styles.d.ts';
import { createTheme } from '@mui/material';
import type { Components } from '@mui/material/styles/components';
import type {
  Palette,
  PaletteOptions,
} from '@mui/material/styles/createPalette';
import type { Theme } from '@mui/material/styles/createTheme';
import type { TypographyOptions } from '@mui/material/styles/createTypography';
import { deepmerge } from '@mui/utils';
import '@mui/x-data-grid/themeAugmentation';
import {
  moniteLight as baseMoniteLight,
  moniteDark as baseMoniteDark,
} from '@team-monite/sdk-themes';

const paletteLight: PaletteOptions = {
  primary: {
    dark: '#1D59CC',
    main: '#3737FF',
    light: '#F4F8FF',
  },
  background: {
    menu: '#F1F2F5',
    highlight: '#EBEBFF',
  },
  neutral: {
    '10': '#111111',
    '50': '#707070',
    '80': '#DDDDDD',
  },
  divider: '#DDDDDD',
};

const paletteDark: PaletteOptions = {
  primary: {
    dark: '#1D59CC',
    main: '#3737FF',
    light: '#F4F8FF',
  },
  background: {
    menu: '#F1F2F5',
  },
  neutral: {
    '80': '#B8B8B8',
    '50': '#F3F3F3',
    '10': '#FFFFFF',
  },
};

const statusColors: {
  [key: string]: { color: string; backgroundColor: string };
} = {
  black: {
    color: '#292929',
    backgroundColor: '#F2F2F2',
  },
  blue: {
    color: '#3737FF',
    backgroundColor: '#F4F4FE',
  },
  violet: {
    color: '#A06DC8',
    backgroundColor: '#FBF1FC',
  },
  green: {
    color: '#0DAA8E',
    backgroundColor: '#EEFBF9',
  },
  orange: {
    color: '#E27E46',
    backgroundColor: '#FFF5EB',
  },
  red: {
    color: '#CC394B',
    backgroundColor: '#FFE0E4',
  },
};

const typography:
  | TypographyOptions
  | ((palette: Palette) => TypographyOptions) = {
  subtitle2: {
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  label2: {
    fontSize: '0.875rem',
    fontStyle: 'normal',
    fontWeight: 500,
  },
  label3: {
    fontSize: '0.75rem',
    fontStyle: 'normal',
    fontWeight: 600,
  },
};

const typographyLight = deepmerge(typography, {
  body2: {
    color: paletteLight.neutral && paletteLight.neutral['10'],
  },
  label3: {
    color: paletteLight.neutral && paletteLight.neutral['50'],
  },
});

const typographyDark = deepmerge(typography, {
  body2: {
    color: paletteDark.neutral && paletteDark.neutral['10'],
  },
  label3: {
    color: paletteDark.neutral && paletteDark.neutral['80'],
  },
});

const components: Components<Omit<Theme, 'components'>> = {
  MuiFormLabel: {
    styleOverrides: {
      root: {
        '&.Mui-disabled': {
          color: 'black',
        },
      },
    },
  },
  MuiInputLabel: {
    defaultProps: {
      shrink: true,
    },
    styleOverrides: {
      root: {
        fontSize: '14px',
        transform: 'none',
        position: 'static',
        color: 'black',
        minHeight: '28px',
        '&.Mui-disabled': {
          color: 'black',
        },
      },
      asterisk: {
        color: '#ff0000',
        transform: 'scale(2) translate(6px, 2px)',
        display: 'inline-block',
        width: '20px',
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        borderRadius: `8px`,
        minHeight: '40px',
        '& .MuiInputBase-input': {
          height: '40px',
          padding: '0 14px', // Adjust padding if needed
          boxSizing: 'border-box',
        },
      },
    },
  },
  MuiFormControl: {
    styleOverrides: {
      root: {
        '& .MuiInputBase-root': {
          minHeight: '48px',
          borderRadius: '8px',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          top: 0,
        },
        // Hide border cutout
        '& .MuiOutlinedInput-notchedOutline legend': {
          display: 'none',
        },
        '& .MuiOutlinedInput-root': {
          left: 0,
          top: 0,
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      InputLabelProps: {
        shrink: true,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.menu,
      }),
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.background.menu,
        borderRight: 0,
      }),
    },
  },
  MuiList: {
    styleOverrides: {
      root: {
        '&.NavigationList': {
          margin: '0px 12px',

          '.MuiListItem-root': {
            marginTop: 8,
          },

          '.MuiListItemButton-root': {
            borderRadius: 6,
            padding: '8px 12px',
          },

          '.MuiListItemIcon-root': {
            minWidth: 35,
          },

          '.MuiCollapse-root': {
            marginTop: -8,
            marginLeft: 12,
          },

          '.Mui-selected': {
            color: 'primary.main',
          },
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        '&.ThemeSelect': {
          borderRadius: 8,
        },
        '&.ThemeSelect .ThemeSelect-modeLabel': {
          display: 'flex',
        },
      },
      containedPrimary: ({ theme }) => ({
        backgroundColor: theme.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.palette.primary.main,
        },
      }),
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        border: 'none',
        borderRadius: 16,
        width: 240,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: '#F4F4FE',
        borderRadius: '4px',
        color: '#3737FF',
        fontSize: '14px',
        lineHeight: '16px',
        fontWeight: 500,
        padding: '7px 8px',
      },
      label: {
        padding: '0',
      },
    },
  },
  MuiDataGrid: {
    defaultProps: {
      columnHeaderHeight: 40,
      showCellVerticalBorder: false,
      showColumnVerticalBorder: false,
    },
    styleOverrides: {
      root: ({ theme }) => ({
        border: 0,
        borderColor: 'transparent',
        '--DataGrid-rowBorderColor': theme.palette.divider,
        '& .MuiDataGrid-columnHeaderTitle': {
          color: '#707070',
          fontWeight: 700,
        },
      }),
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        '& .MuiButtonBase-root': {
          paddingTop: 10,
          paddingBottom: 10,
        },
        '& .MuiButtonBase-root.Mui-selected': {
          backgroundColor: '#F4F4FE',
          borderRadius: 10,
        },
      },
    },
  },
  MoniteInvoiceStatusChip: {
    styleOverrides: {
      root: {
        fontSize: '13px',
      },
    },
    variants: [
      {
        props: { status: 'draft' },
        style: statusColors.black,
      },
      {
        props: { status: 'issued' },
        style: statusColors.blue,
      },
      {
        props: { status: 'accepted' },
        style: statusColors.green,
      },
      {
        props: { status: 'expired' },
        style: statusColors.red,
      },
      {
        props: { status: 'declined' },
        style: statusColors.red,
      },
      {
        props: { status: 'recurring' },
        style: statusColors.green,
      },
      {
        props: { status: 'partially_paid' },
        style: statusColors.violet,
      },
      {
        props: { status: 'paid' },
        style: statusColors.green,
      },
      {
        props: { status: 'overdue' },
        style: statusColors.orange,
      },
      {
        props: { status: 'uncollectible' },
        style: statusColors.red,
      },
      {
        props: { status: 'canceled' },
        style: statusColors.orange,
      },
      {
        props: { status: 'deleted' },
        style: statusColors.black,
      },
    ],
  },
  MonitePayableStatusChip: {
    styleOverrides: {
      root: {
        fontSize: '13px',
      },
    },
    variants: [
      {
        props: { status: 'draft' },
        style: statusColors.black,
      },
      {
        props: { status: 'new' },
        style: statusColors.blue,
      },
      {
        props: { status: 'approve_in_progress' },
        style: statusColors.orange,
      },
      {
        props: { status: 'waiting_to_be_paid' },
        style: statusColors.orange,
      },
      {
        props: { status: 'partially_paid' },
        style: statusColors.violet,
      },
      {
        props: { status: 'paid' },
        style: statusColors.green,
      },
      {
        props: { status: 'canceled' },
        style: statusColors.orange,
      },
      {
        props: { status: 'rejected' },
        style: statusColors.red,
      },
    ],
  },
};

export const moniteLight = () =>
  createTheme(
    deepmerge(baseMoniteLight, {
      palette: paletteLight,
      typography: typographyLight,
      components,
    })
  );

export const moniteDark = () =>
  createTheme(
    deepmerge(baseMoniteDark, {
      palette: paletteDark,
      typography: typographyDark,
      components,
    })
  );
