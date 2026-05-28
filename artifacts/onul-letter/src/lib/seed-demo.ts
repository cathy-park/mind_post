import { format, subDays, subMonths, subYears } from 'date-fns';
import { JournalEntry, WEEKDAYS } from './constants';

const ENTRIES_KEY = 'onul-letters';
const SEED_KEY = 'onul-demo-seeded';

export function seedDemoEntries() {
  if (localStorage.getItem(SEED_KEY)) return;

  const today = new Date();

  const lastWeekDate = subDays(today, 7);
  const lastMonthDate = subMonths(today, 1);
  const lastYearDate = subYears(today, 1);

  const demos: JournalEntry[] = [
    {
      id: 'demo-week-1',
      date: format(lastWeekDate, 'yyyy-MM-dd'),
      weekday: WEEKDAYS[lastWeekDate.getDay()],
      emotion: '행복',
      question: '오늘 무엇이 당신을 웃게 만들었나요?',
      shortAnswer: '오랜만에 친구와 카페에서 수다를 떨었어요. 별것 아닌 이야기에 배를 잡고 웃었는데, 그 순간이 너무 좋았어요.',
      longAnswer: '요즘 바쁘다는 핑계로 연락을 미뤘던 친구를 오랜만에 만났어요. 그 친구가 예전이랑 하나도 안 변해서 신기했고, 우리가 함께 공유하는 추억들이 새록새록 떠올랐어요. 오늘 하루는 참 따뜻하게 마무리됐어요.',
      createdAt: new Date(lastWeekDate).toISOString(),
    },
    {
      id: 'demo-month-1',
      date: format(lastMonthDate, 'yyyy-MM-dd'),
      weekday: WEEKDAYS[lastMonthDate.getDay()],
      emotion: '평온',
      question: '오늘 가장 조용했던 순간은 언제였나요?',
      shortAnswer: '이른 아침, 커피 한 잔을 들고 창밖을 바라보던 순간이요. 아무 소리도 없이 눈이 살짝 내리고 있었어요.',
      longAnswer: '요즘 너무 바빴는데, 오늘 아침만큼은 일부러 일찍 일어나서 아무것도 하지 않고 그냥 창밖을 바라봤어요. 눈이 소리 없이 내리는 걸 보면서 마음이 정말 고요해지는 느낌이었어요. 이런 시간이 가끔은 꼭 필요하다는 걸 다시 한번 깨달았어요.',
      createdAt: new Date(lastMonthDate).toISOString(),
    },
    {
      id: 'demo-year-1',
      date: format(lastYearDate, 'yyyy-MM-dd'),
      weekday: WEEKDAYS[lastYearDate.getDay()],
      emotion: '복잡함',
      question: '어떤 생각이 가장 오래 남아 있었나요?',
      shortAnswer: '1년 후의 내가 어떤 사람이 되어있을지 계속 생각했어요. 지금 이 선택들이 맞는 방향인지 모르겠어서요.',
      longAnswer: '지금 내가 걷고 있는 이 길이 정말 내가 원하는 길인지 자꾸 되물어보게 되는 날이에요. 남들보다 뒤처지는 것 같기도 하고, 하지만 비교를 해봤자 의미가 없다는 것도 알아요. 그냥 오늘 하루를 잘 살면 되는 거라고 스스로를 다독여봐요. 1년 뒤의 나, 잘 해냈으면 좋겠어요.',
      createdAt: new Date(lastYearDate).toISOString(),
    },
  ];

  const existing: JournalEntry[] = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
  const existingDates = new Set(existing.map(e => e.date));

  const toAdd = demos.filter(d => !existingDates.has(d.date));
  if (toAdd.length > 0) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify([...existing, ...toAdd]));
  }

  localStorage.setItem(SEED_KEY, '1');
}
