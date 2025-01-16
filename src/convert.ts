type TagType =
  | 'Food'
  | 'Culture'
  | 'Healing'
  | 'Nature'
  | 'Sports'
  | 'Festival'
  | 'K-POP'
  | 'K-DRAMA'
  | 'JEJU'
  | 'etc.';

type TagPath =
  | 'food'
  | 'culture'
  | 'healing'
  | 'nature'
  | 'sports'
  | 'festival'
  | 'kpop'
  | 'kdrama'
  | 'jeju'
  | 'etc';

export const tagTypeToTagPath: { [key in TagType]: TagPath } = {
  Food: 'food',
  Culture: 'culture',
  Healing: 'healing',
  Nature: 'nature',
  Sports: 'sports',
  Festival: 'festival',
  'K-POP': 'kpop',
  'K-DRAMA': 'kdrama',
  JEJU: 'jeju',
  'etc.': 'etc',
};

export const tagPathToTagType: { [key in TagPath]: TagType } = {
  food: 'Food',
  culture: 'Culture',
  healing: 'Healing',
  nature: 'Nature',
  sports: 'Sports',
  festival: 'Festival',
  kpop: 'K-POP',
  kdrama: 'K-DRAMA',
  jeju: 'JEJU',
  etc: 'etc.',
};
