import type { InjectionKey } from 'vue';
import dayjs from 'dayjs';

export const DayJsKey = Symbol() as InjectionKey<typeof dayjs>;
