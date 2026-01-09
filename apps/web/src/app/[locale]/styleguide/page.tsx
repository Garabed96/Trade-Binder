import { notFound } from 'next/navigation';
import { Styleguide } from '@trade-binder/ui';

export default function StyleguidePage() {
  // Only allow access in development
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  return <Styleguide />;
}
