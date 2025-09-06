// app/(root)/(home)/captions/page.tsx

import CaptionHistory from '@/components/captions/CaptionHistory';

const CaptionsPage = () => {
  return (
    <section className="flex size-full flex-col gap-5 text-white">
      <h1 className="text-3xl font-bold">Caption History</h1>
      <CaptionHistory />
    </section>
  );
};

export default CaptionsPage;