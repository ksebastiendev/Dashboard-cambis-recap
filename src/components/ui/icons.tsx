import { FC } from "react";

export const DollarIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4 1.343 4 3-1.79 3-4 3m0-12v2m0 14v-2" />
  </svg>
);

export const NairaIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19V5m0 0h12m-12 0l12 14m0-14v14" />
  </svg>
);

export const ExchangeIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12m0-4v-2a2 2 0 00-2-2H6m0 4l4-4m0 0l4 4" />
  </svg>
);
