import type { PhoneOwner } from '@/features/account/session';
import type { useHandoverFlow } from '../useHandoverFlow';

type Flow = ReturnType<typeof useHandoverFlow>;
export type HandoverStepProps = { flow: Flow; owner: PhoneOwner };
