import { useEffect, useState, type ReactNode } from 'react';

import { expoDb } from '@/db/connection';

function DrizzleStudioPlugin() {
  // Keep the optional dev plugin out of production module evaluation.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useDrizzleStudio } = require('expo-drizzle-studio-plugin') as {
    useDrizzleStudio: (database: typeof expoDb) => void;
  };
  useDrizzleStudio(expoDb);
  return null;
}

export function DrizzleStudio({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Delay the plugin until the native React context is ready.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <>
      {__DEV__ && mounted ? <DrizzleStudioPlugin /> : null}
      {children}
    </>
  );
}
