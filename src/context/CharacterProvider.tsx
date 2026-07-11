import { CharacterContext, type CharacterContextValue, type CharacterState, type PaceValues } from './CharacterContext';
import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  CharacterSkill,
  CharacterPower,
  Artifact,
  Ally,
  PersonalShadow,
  CharacterAspectRatings,
  CharacterFunctionRatings,
  AttributeName,
  CharacterWeapon,
  CharacterArmor,
  RatingValue,
  WeaponTagDefinition,
} from '../types/character';
import { ATTRIBUTES } from '../types/character';
import { getDiePoolEntry } from '../data/diePoolTable';
import { calculateImmaterialSize, computeCharacter } from '../utils/calculations';
import { DEFAULT_ICON } from '../data/icons';
// export { WOUND_DAMAGE_RANGES, getWoundLevel, calculateStacking } from '../data/wounds';
// export type { WoundLevel as DamageWoundLevel } from '../data/wounds';

// Helper function to get default rating based on campaign limit
function getDefaultRating(campaignLimit: number): RatingValue {
  if (campaignLimit > -1) return 0 as RatingValue;
  if (campaignLimit > -41) return -5 as RatingValue;
  if (campaignLimit > -81) return -10 as RatingValue;
  return -15 as RatingValue; // campaignLimit >= -81
}

const defaultAspects: CharacterAspectRatings = {
  Form: 0,
  Flesh: 0,
  Mind: 0,
  Spirit: 0,
};

const defaultFunctions: CharacterFunctionRatings = {
  Resist: 0,
  Finesse: 0,
  Perceive: 0,
  Force: 0,
};

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [nameState, setNameState] = useState('');
  const [campaignLimitState, setCampaignLimitState] = useState(-100);
  const [avatarIconState, setAvatarIconState] = useState<string>(DEFAULT_ICON.code);
  const [aspectsState, setAspectsState] = useState<CharacterAspectRatings>(defaultAspects);
  const [functionsState, setFunctionsState] = useState<CharacterFunctionRatings>(defaultFunctions);
  const [aspectExplanationsState, setAspectExplanationsState] = useState<Record<string, string>>({});
  const [functionExplanationsState, setFunctionExplanationsState] = useState<Record<string, string>>({});
  const [skillsState, setSkillsState] = useState<CharacterSkill[]>([]);
  const [powersState, setPowersState] = useState<CharacterPower[]>([]);
  const [artifactsState, setArtifactsState] = useState<Artifact[]>([]);
  const [alliesState, setAlliesState] = useState<Ally[]>([]);
  const [personalShadowsState, setPersonalShadowsState] = useState<PersonalShadow[]>([]);
  const [weapons, setWeapons] = useState<CharacterWeapon[]>([]);
  const [armorState, setArmorState] = useState<CharacterArmor[]>([]);
  const [customTagsState, setCustomTagsState] = useState<WeaponTagDefinition[]>([]);
  const [sizeState, setSizeState] = useState(0);
  const [paceMultiplierState, setPaceMultiplierState] = useState(1);

  // Track which aspects/functions have been explicitly modified by the user
  const modifiedAspectsRef = useRef(new Set<keyof CharacterAspectRatings>());
  const modifiedFunctionsRef = useRef(new Set<keyof CharacterFunctionRatings>());

  // Auto-update aspects/functions when campaign limit changes
  useEffect(() => {
    const newDefault = getDefaultRating(campaignLimitState);
    
    setAspectsState(prev => {
      const newAspects = { ...prev };
      let changed = false;
      for (const key of Object.keys(defaultAspects) as Array<keyof CharacterAspectRatings>) {
        if (!modifiedAspectsRef.current.has(key)) {
          if (newAspects[key] !== newDefault) {
            newAspects[key] = newDefault;
            changed = true;
          }
        }
      }
      return changed ? newAspects : prev;
    });
    
    setFunctionsState(prev => {
      const newFunctions = { ...prev };
      let changed = false;
      for (const key of Object.keys(defaultFunctions) as Array<keyof CharacterFunctionRatings>) {
        if (!modifiedFunctionsRef.current.has(key)) {
          if (newFunctions[key] !== newDefault) {
            newFunctions[key] = newDefault;
            changed = true;
          }
        }
      }
      return changed ? newFunctions : prev;
    });
  }, [campaignLimitState]);

  // Wrapper setters that support both direct values and callback functions
  const setName = useCallback((value: string | ((prev: string) => string)) => {
    setNameState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setCampaignLimit = useCallback((value: number | ((prev: number) => number)) => {
    setCampaignLimitState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setAvatarIcon = useCallback((value: string | ((prev: string) => string)) => {
    setAvatarIconState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setAspects = useCallback((value: CharacterAspectRatings | ((prev: CharacterAspectRatings) => CharacterAspectRatings)) => {
    setAspectsState(prev => {
      const newAspects = typeof value === 'function' ? value(prev) : value;
      // Track which fields were changed by the user
      for (const key of Object.keys(defaultAspects) as Array<keyof CharacterAspectRatings>) {
        if (prev[key] !== newAspects[key]) {
          modifiedAspectsRef.current.add(key);
        }
      }
      return newAspects;
    });
  }, []);

  const setFunctions = useCallback((value: CharacterFunctionRatings | ((prev: CharacterFunctionRatings) => CharacterFunctionRatings)) => {
    setFunctionsState(prev => {
      const newFunctions = typeof value === 'function' ? value(prev) : value;
      // Track which fields were changed by the user
      for (const key of Object.keys(defaultFunctions) as Array<keyof CharacterFunctionRatings>) {
        if (prev[key] !== newFunctions[key]) {
          modifiedFunctionsRef.current.add(key);
        }
      }
      return newFunctions;
    });
  }, []);

  const setSkills = useCallback((value: CharacterSkill[] | ((prev: CharacterSkill[]) => CharacterSkill[])) => {
    setSkillsState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setPowers = useCallback((value: CharacterPower[] | ((prev: CharacterPower[]) => CharacterPower[])) => {
    setPowersState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setArtifacts = useCallback((value: Artifact[] | ((prev: Artifact[]) => Artifact[])) => {
    setArtifactsState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setAllies = useCallback((value: Ally[] | ((prev: Ally[]) => Ally[])) => {
    setAlliesState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setPersonalShadows = useCallback((value: PersonalShadow[] | ((prev: PersonalShadow[]) => PersonalShadow[])) => {
    setPersonalShadowsState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setCustomTags = useCallback((value: WeaponTagDefinition[] | ((prev: WeaponTagDefinition[]) => WeaponTagDefinition[])) => {
    setCustomTagsState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const addWeapon = useCallback((weapon: Omit<CharacterWeapon, 'id'>) => {
    const id = crypto.randomUUID();
    setWeapons(prev => [...prev, { ...weapon, id }]);
  }, []);
  
  const updateWeapon = useCallback((id: string, updates: Partial<CharacterWeapon>) => {
    setWeapons(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);
  
  const removeWeapon = useCallback((id: string) => {
    setWeapons(prev => prev.filter(w => w.id !== id));
  }, []);

const addArmor = useCallback((armorData: Omit<CharacterArmor, 'id'>) => {
  const id = crypto.randomUUID();
  setArmorState(prev => [...prev, { ...armorData, id }]);
}, []);

const updateArmor = useCallback((id: string, updates: Partial<CharacterArmor>) => {
  setArmorState(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
}, []);

const removeArmor = useCallback((id: string) => {
  setArmorState(prev => prev.filter(a => a.id !== id));
}, []);
  
  const setSize = useCallback((value: number | ((prev: number) => number)) => {
    setSizeState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const setPaceMultiplier = useCallback((value: number | ((prev: number) => number)) => {
    setPaceMultiplierState(prev => typeof value === 'function' ? value(prev) : value);
  }, []);

  const computedCharacter = useMemo(() => {
    return computeCharacter(
      nameState,
      campaignLimitState,
      aspectsState,
      functionsState,
      skillsState,
      powersState,
      artifactsState,
      alliesState,
      personalShadowsState,
      weapons,
      armorState,
      sizeState,
    );
  }, [nameState, campaignLimitState, aspectsState, functionsState, skillsState, powersState, artifactsState, alliesState, personalShadowsState, weapons, armorState, sizeState]);

  const attributeValues = useMemo(() => {
    const values: Record<AttributeName, number> = {} as Record<AttributeName, number>;
    for (const attr of ATTRIBUTES) {
      values[attr.id] = functionsState[attr.func] + aspectsState[attr.aspect];
    }
    return values;
  }, [aspectsState, functionsState]);

  const attributeDiePools = useMemo(() => {
    const pools: Record<AttributeName, ReturnType<typeof getDiePoolEntry>> = {} as Record<AttributeName, ReturnType<typeof getDiePoolEntry>>;
    for (const attr of ATTRIBUTES) {
      pools[attr.id] = getDiePoolEntry(attributeValues[attr.id]);
    }
    return pools;
  }, [attributeValues]);

  // Calculate Immaterial Size from Charisma and Presence
  const immaterialSize = useMemo(() => {
    const charismaRank = attributeDiePools['Charisma']?.rank ?? 0;
    const presenceRank = attributeDiePools['Presence']?.rank ?? 0;
    return calculateImmaterialSize(charismaRank, presenceRank);
  }, [attributeDiePools]);

  // Calculate Pace from Reflexes and Material Size
  const pace = useMemo((): PaceValues => {
    const reflexesMax = attributeDiePools['Reflexes']?.pool.max ?? 0;
    const multiplier = paceMultiplierState;
    
    // Walking = (Reflexes die pool ÷ 2 + Material Size) × multiplier
    const walkingMph = Math.round((reflexesMax / 2 + sizeState) * multiplier);
    // Sprint = (Reflexes die pool + Material Size) × 2 × multiplier
    const sprintingMph = Math.round((reflexesMax + sizeState) * 2 * multiplier);
    
    return {
      walking: {
        mph: walkingMph,
        kph: Math.round(walkingMph * 1.60934),
        ms: Math.round(walkingMph * 0.44704 * 10) / 10,
      },
      sprinting: {
        mph: sprintingMph,
        kph: Math.round(sprintingMph * 1.60934),
        ms: Math.round(sprintingMph * 0.44704 * 10) / 10,
      },
      multiplier,
    };
  }, [attributeDiePools, sizeState, paceMultiplierState]);

  const setAspectExplanation = useCallback((aspectId: string, explanation: string) => {
    setAspectExplanationsState(prev => ({ ...prev, [aspectId]: explanation }));
  }, []);

  const setFunctionExplanation = useCallback((functionId: string, explanation: string) => {
    setFunctionExplanationsState(prev => ({ ...prev, [functionId]: explanation }));
  }, []);

  const loadCharacter = useCallback((data: Partial<CharacterState>) => {
    if (data.name !== undefined) setNameState(data.name);
    if (data.campaignLimit !== undefined) setCampaignLimitState(data.campaignLimit);
    if (data.avatarIcon !== undefined) setAvatarIconState(data.avatarIcon);
    if (data.aspects) {
      setAspectsState(data.aspects);
      // Mark all aspects as modified so we don't override saved values
      modifiedAspectsRef.current = new Set(Object.keys(data.aspects) as Array<keyof CharacterAspectRatings>);
    }
    if (data.functions) {
      setFunctionsState(data.functions);
      // Mark all functions as modified so we don't override saved values
      modifiedFunctionsRef.current = new Set(Object.keys(data.functions) as Array<keyof CharacterFunctionRatings>);
    }
    if (data.aspectExplanations) setAspectExplanationsState(data.aspectExplanations);
    if (data.functionExplanations) setFunctionExplanationsState(data.functionExplanations);
    if (data.skills) setSkillsState(data.skills);
    if (data.powers) setPowersState(data.powers);
    if (data.artifacts) setArtifactsState(data.artifacts);
    if (data.allies) setAlliesState(data.allies);
    if (data.personalShadows) setPersonalShadowsState(data.personalShadows);
    if (data.weapons) setWeapons(data.weapons);
    if (data.armor) setArmorState(data.armor);
    setCustomTagsState(data.customTags ?? []);
    if (data.size !== undefined) setSizeState(data.size);
    if (data.paceMultiplier !== undefined) setPaceMultiplierState(data.paceMultiplier);
  }, []);

  const saveCharacter = useCallback(() => {
    const data = {
      name: nameState,
      avatarIcon: avatarIconState,
      campaignLimit: campaignLimitState,
      aspects: aspectsState,
      functions: functionsState,
      aspectExplanations: aspectExplanationsState,
      functionExplanations: functionExplanationsState,
      skills: skillsState,
      powers: powersState,
      artifacts: artifactsState,
      allies: alliesState,
      personalShadows: personalShadowsState,
      weapons,
      armor: armorState,
      customTags: customTagsState,
      size: sizeState,
      paceMultiplier: paceMultiplierState,
    };
    return JSON.stringify(data, null, 2);
  }, [nameState, avatarIconState, campaignLimitState, aspectsState, functionsState, aspectExplanationsState, functionExplanationsState, skillsState, powersState, artifactsState, alliesState, personalShadowsState, weapons, armorState, customTagsState, sizeState, paceMultiplierState]);

  const hasCharacter = nameState.trim() !== '' || skillsState.length > 0 || powersState.length > 0;

  const value: CharacterContextValue = {
    name: nameState,
    campaignLimit: campaignLimitState,
    avatarIcon: avatarIconState,
    aspects: aspectsState,
    functions: functionsState,
    aspectExplanations: aspectExplanationsState,
    functionExplanations: functionExplanationsState,
    skills: skillsState,
    powers: powersState,
    artifacts: artifactsState,
    allies: alliesState,
    personalShadows: personalShadowsState,
    computedCharacter,
    attributeValues,
    attributeDiePools,
    immaterialSize,
    pace,
    weapons,
    armor: armorState,
    customTags: customTagsState,
    size: sizeState,
    paceMultiplier: paceMultiplierState,
    addWeapon,
    updateWeapon,
    removeWeapon,
    addArmor,
    updateArmor,
    removeArmor,
    setCustomTags,
    setSize,
    setPaceMultiplier,
    setName,
    setCampaignLimit,
    setAvatarIcon,
    setAspects,
    setFunctions,
    setAspectExplanation,
    setFunctionExplanation,
    setSkills,
    setPowers,
    setArtifacts,
    setAllies,
    setPersonalShadows,
    loadCharacter,
    saveCharacter,
    hasCharacter,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}