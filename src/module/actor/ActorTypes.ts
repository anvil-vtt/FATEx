import { FateItemData } from "../item/ItemTypes";
import { FateActor } from "./FateActor";

interface CharacterData {
    isTemplateActor: boolean;
}

interface CharacterActorData extends Actor.Data<CharacterData, FateItemData> {
    type: "character";
}

export type groupType = "manual" | "scene" | "encounter";

interface GroupData {
    groupType: groupType;
    availableTokens: {
        [id: string]: FateActor;
    };
}

interface GroupActorData extends Actor.Data<GroupData, FateItemData> {
    type: "group";
}

export type ActorDataFate = CharacterActorData | GroupActorData;
