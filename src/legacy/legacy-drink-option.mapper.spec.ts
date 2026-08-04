import {
  DrinkCategory,
  DrinkStrength,
  MilkType,
  PortionAmount,
} from '@prisma/client';
import { LegacyDrinkOptionMapper } from './legacy-drink-option.mapper';

describe('LegacyDrinkOptionMapper', () => {
  let mapper: LegacyDrinkOptionMapper;

  beforeEach(() => {
    mapper = new LegacyDrinkOptionMapper();
  });

  it('maps legacy coffee option to preferred drink and drink configuration', () => {
    expect(
      mapper.map({
        category: 'coffee',
        isDecaf: false,
        isIced: true,
        isXHot: false,
        milk: 'oat',
        reference: 'Iced Latte',
        strength: 2,
        sugar: 0,
        sweetner: 0,
        teaBags: 1,
        title: 'Latte',
      }),
    ).toEqual({
      displayName: 'Iced Latte',
      drinkConfiguration: {
        category: DrinkCategory.COFFEE,
        drinkType: 'Latte',
        milk: MilkType.OAT,
        strength: DrinkStrength.TWO,
        sugar: PortionAmount.ZERO,
        sweetener: PortionAmount.ZERO,
        teaBagCount: undefined,
        iced: true,
        xhot: false,
        decaf: false,
      },
    });
  });

  it('maps teaBags only for tea options', () => {
    expect(
      mapper.map({
        category: 'tea',
        title: 'English Breakfast',
        teaBags: 2,
      }),
    ).toMatchObject({
      drinkConfiguration: {
        category: DrinkCategory.TEA,
        teaBagCount: PortionAmount.TWO,
      },
    });
  });

  it('uses title as displayName when reference is missing', () => {
    expect(
      mapper.map({
        category: 'coffee',
        title: 'Flat White',
      }),
    ).toMatchObject({
      displayName: 'Flat White',
      drinkConfiguration: {
        drinkType: 'Flat White',
      },
    });
  });

  it('returns null when title is missing', () => {
    expect(
      mapper.map({ category: 'coffee', reference: 'No Title' }),
    ).toBeNull();
  });
});
