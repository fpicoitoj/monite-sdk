import { ReactNode } from 'react';

import { components } from '@/api';
import { ContainerCssBaseline } from '@/components/ContainerCssBaseline';
import { EmotionCacheProvider } from '@/core/context/EmotionCacheProvider';
import {
  MoniteAPIProvider,
  MoniteQraftContext,
} from '@/core/context/MoniteAPIProvider';
import { MoniteLocale } from '@/core/context/MoniteI18nProvider';
import { ThemeConfig } from '@/core/theme/types';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { GlobalToast } from '../GlobalToast';
import { MoniteContextProvider, useMoniteContext } from './MoniteContext';

export interface MoniteSettings {
  entityId: string;
  apiUrl?: string;
  fetchToken: () => Promise<components['schemas']['AccessTokenResponse']>;
}

export interface MoniteProviderProps {
  children?: ReactNode;

  /**
   * `theme` responsible for global styling of all Widgets provided.
   * If `theme` is not provided, `Monite` uses default theme.
   */
  theme?: ThemeConfig;

  /** Monite initial settings  */
  monite: MoniteSettings;

  /**
   * `locale` responsible for internationalisation
   *  of all Widgets provided.
   */
  locale?: MoniteLocale;
}

export const MoniteProvider = ({
  monite,
  theme,
  children,
  locale,
}: MoniteProviderProps) => {
  return (
    <MoniteContextProvider monite={monite} locale={locale} theme={theme}>
      <EmotionCacheProvider cacheKey="monite-css-baseline">
        <MoniteMuiThemeProvider>
          <ContainerCssBaseline enableColorScheme />
          <GlobalToast />
        </MoniteMuiThemeProvider>
      </EmotionCacheProvider>
      <MoniteAPIProvider APIContext={MoniteQraftContext}>
        {children}
      </MoniteAPIProvider>
    </MoniteContextProvider>
  );
};

const MoniteMuiThemeProvider = ({ children }: { children: ReactNode }) => {
  const { theme } = useMoniteContext();
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};
