interface StressData {
    name: string;
}

export interface StressItemData extends Item.Data<StressData> {
    type: "stress";
}

///////////////////////////////

interface AspectData {
    name: string;
}

export interface AspectItemData extends Item.Data<AspectData> {
    type: "aspect";
}

///////////////////////////////

interface TokenReferenceData {
    id: string;
    scene: string;
}

export interface TokenReferenceItemData extends Item.Data<TokenReferenceData> {
    type: "tokenReference";
}

///////////////////////////////

interface CombatantReferenceData {
    id: string;
}

export interface CombatantReferenceItemData extends Item.Data<CombatantReferenceData> {
    type: "combatantReference";
}

///////////////////////////////

interface ActorReferenceData {
    id: string;
}

export interface ActorReferenceItemData extends Item.Data<ActorReferenceData> {
    type: "actorReference";
}

///////////////////////////////

interface ExtraData {
    description: string;
}

export interface ExtraItemData extends Item.Data<ExtraData> {
    type: "extra";
}

///////////////////////////////

export type ReferenceItemData = TokenReferenceItemData | ActorReferenceItemData | CombatantReferenceItemData;
export type FateItemData = StressItemData | AspectItemData | TokenReferenceItemData | ActorReferenceItemData | ExtraItemData;
