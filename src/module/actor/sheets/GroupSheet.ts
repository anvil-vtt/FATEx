import { InlineActorSheetFate } from "./InlineActorSheetFate";
import { getReferencesByGroupType } from "../../helper/ActorGroupHelper";
import { FateActorSheetOptions } from "./FateActorSheet";
import { ActorFate } from "../ActorFate";
import { ActorReferenceItemData, TokenReferenceItemData } from "../../item/ItemTypes";
import { FateItem } from "../../item/FateItem";
import { SortableEvent } from "sortablejs";
import Sortable from "sortablejs/modular/sortable.complete.esm.js";

/**
 * Represents a single actor group. Has a normal (inside groups panel) and a popped out state.
 */
export class GroupSheet extends ActorSheet<ActorSheet.Data<ActorFate>> {
    public inlineSheets: InlineActorSheetFate[];

    /**
     * Initialize inlineSheets as an empty array of sheets
     */
    constructor(object, options) {
        super(object, options);

        /**
         * Inline sheets that are rendered by this actor group instance
         */
        this.inlineSheets = [];
    }

    /**
     * Sets the default options for every actor group sheet
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fatex fatex__sheet sheet actor_group_overview"],
            resizable: true,
            template: "/systems/fatex/templates/actor/group.html",
            dragDrop: [{ dropSelector: null }],
            scrollY: [".window-content"],
        } as FateActorSheetOptions);
    }

    getData() {
        // Basic fields and flags
        const data: any = {
            owner: this.actor.owner,
            options: this.options,
            editable: this.isEditable,
            isTemplateActor: this.actor.isTemplateActor,
            isEmptyActor: !this.actor.items.size,
            isToken: this.token && !this.token.data.actorLink,
            config: CONFIG.FateX,
        };

        // Add actor, actor data and item
        data.actor = duplicate(this.actor.data);
        data.data = data.actor.data;
        data.items = this.actor.items.map((i) => i.data);
        data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

        // Add filtered item lists for easier access
        data.groupActors = data.items.filter((item) => ["tokenReference", "actorReference"].includes(item.type));

        // Create list of available tokens in the current scene
        const usedTokenReferences = this.actor.items.filter((i) => i.data.type === "tokenReference" && i.data.data.scene === game.scenes?.active.id);
        const usedTokenReferencesMap: string[] = usedTokenReferences.map((token: FateItem) => {
            return token.data.type === "tokenReference" ? token.data.data.id : "";
        });

        const actors = game.actors ? Object.values(game.actors.tokens) ?? [] : [];
        data.availableTokens = actors.filter((actor) => (actor?.token ? !usedTokenReferencesMap.includes(actor.token.id) : false));

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(`.fatex__actor_group__createToken`).on("click", (e) => this._onCreateTokenReference.call(this, e));

        // Custom sheet listeners for every ItemType
        for (const itemType in CONFIG.FateX.itemClasses) {
            CONFIG.FateX.itemClasses[itemType]?.activateActorSheetListeners(html, this);
        }

        // Custom sheet listeners for every SheetComponent
        for (const sheetComponent in CONFIG.FateX.sheetComponents.actor) {
            CONFIG.FateX.sheetComponents.actor[sheetComponent].activateListeners(html, this);
        }

        Sortable.create(html.find(".fatex__actor_group__inlinesheets")[0], {
            animation: 150,
            removeOnSpill: true,
            onEnd: (e: SortableEvent) => this.sortInlineSheets.call(this, e),
            onSpill: (e: SortableEvent) => this.spillInlineSheet.call(this, e),
        });
    }

    async spillInlineSheet(event: SortableEvent) {
        if (event.item.dataset.id) {
            await this.actor.deleteEmbeddedEntity("OwnedItem", event.item.dataset.id);
        }
    }

    async sortInlineSheets(event: SortableEvent) {
        const itemIDs: string[] = Array.from(event.to.children).map((e) => (e as HTMLElement).dataset.id ?? "");

        const updateData = itemIDs.map((id, index) => ({
            _id: id,
            sort: SORT_INTEGER_DENSITY + index,
        }));

        await this.actor.updateEmbeddedEntity("OwnedItem", updateData);
    }

    /**
     * Remove some of the default header buttons for group sheets
     */
    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();

        return buttons.filter((b) => !["configure-token", "configure-sheet"].includes(b.class));
    }

    /**
     * Delete all inline sheets that were created by this instance before closing the window
     */
    async close(options = {}) {
        for (const inlineSheet of this.inlineSheets) {
            delete inlineSheet.actor.apps[inlineSheet.appId];
        }

        return super.close(options);
    }

    /**
     * Render InlineActorSheets after
     * @param force
     * @param options
     */
    async _render(force = false, options = {}) {
        await super._render(force, options);

        if (this.actor.data.type !== "group") {
            return;
        }

        const references = getReferencesByGroupType(this.actor.data.data.groupType, this.actor);

        for (const reference of references) {
            if (reference.type === "actorReference") {
                this.renderInlineActor(reference);
            } else if (reference.type === "tokenReference") {
                this.renderInlineToken(reference);
            }
        }
    }

    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    // Wo kommen die inlinesheets hin? Outer? Inner?  :>
    // Problem -> ScrollY nach dem Rendern ist putt
    // Alternativ -> ScrollY selbst nachbauen für Groups
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////
    ////////////////////////////////////////////////

    /*async _renderOuter(options: Application.RenderOptions): Promise<JQuery<JQuery.Node>> {
        const html = (await super._renderOuter(options)) as JQuery<JQuery.Node>;

        //Add inlinesheets wrapper to outer window
        html.append(`<div class="fatex__actor_group__inlinesheets"></div>`);

        //Add sortablejs to new inline sheets
        Sortable.create(html.find(".fatex__actor_group__inlinesheets")[0], {
            animation: 150,
            removeOnSpill: true,
            onEnd: (e: SortableEvent) => this.sortInlineSheets.call(this, e),
            onSpill: (e: SortableEvent) => this.spillInlineSheet.call(this, e),
        });

        return html;
    }*/

    /**
     * Creates and renders a new InlineActorSheet based on an actor reference.
     * An actor is referenced by his actor id
     */
    renderInlineActor(reference: ActorReferenceItemData) {
        const actor = game.actors?.find((actor) => actor.id === reference.data.id && (actor as ActorFate).isVisibleByPermission);

        if (!actor) {
            return;
        }

        const actorSheet = new InlineActorSheetFate(actor as ActorFate);
        actorSheet.render(true, { group: this, referenceID: reference._id });

        this.inlineSheets.push(actorSheet);
    }

    /**
     * Creates and renders a new InlineActorSheet based on a token reference.
     * A token is referenced by a combination of the scene where its placed and its token id
     */
    renderInlineToken(reference: TokenReferenceItemData) {
        const scene: any = game.scenes?.find((scene) => scene.id === reference.data.scene);
        const tokenData = scene?.data.tokens.find((token) => token._id === reference.data.id);

        if (!tokenData) {
            return;
        }

        const token = new Token(tokenData, scene);

        const tokenSheet = new InlineActorSheetFate(token.actor as ActorFate);
        tokenSheet.render(true, { token: token, group: this, referenceID: reference._id });

        this.inlineSheets.push(tokenSheet);
    }

    /**
     * Create a new ownedItem of type ActorReference based on a given actorID
     * @param actorID
     */
    _createActorReference(actorID: string) {
        // Check if character is already present
        if (this.actor.items.find((i) => i.data.type === "actorReference" && i.data.data.id === actorID)) {
            return;
        }

        // Only allow character-type actors to be referenced
        if (game.actors?.get(actorID)?.data.type !== "character") {
            return;
        }

        const itemData: Partial<ActorReferenceItemData> = {
            name: "ActorReference",
            type: "actorReference",
            data: {
                id: actorID,
            },
        };

        return this.actor.createOwnedItem(itemData);
    }

    /**
     * Create a new ownedItem of type tokenReference based on a given sceneID and tokenID
     */
    _createTokenReference(tokenID: string, sceneID: string): void {
        if (this.actor.items.find((i) => i.data.type === "tokenReference" && i.data.data.id === tokenID && i.data.data.scene === sceneID)) {
            return;
        }

        const itemData: Partial<TokenReferenceItemData> = {
            name: "TokenReference",
            type: "tokenReference",
            data: {
                id: tokenID,
                scene: sceneID,
            },
        };

        this.entity.createOwnedItem(itemData);
    }

    /*************************
     * EVENT HANDLER
     *************************/

    _onCreateTokenReference(e) {
        e.preventDefault();
        e.stopPropagation();

        const dataset = e.currentTarget.dataset;

        if (!game.actors) {
            return;
        }

        const tokens = game.actors.tokens;
        const tokenActor = Object.values(tokens).find((t) => t.token?.id === dataset.tokenId);

        if (!tokenActor) {
            return;
        }

        if (game.scenes) {
            this._createTokenReference(dataset.tokenId, game.scenes.active.id);
        }
    }

    /**
     * Override of the default drop handler.
     * Handles the ability to drop actors from the sidebar into an actor group
     */
    async _onDrop(event) {
        let data;

        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (err) {
            return false;
        }

        // Handle different data types
        switch (data.type) {
            case "Actor":
                return this._createActorReference(data.id);
            case "Item":
                return this._onDropItem(event, data);
            default:
                return false;
        }
    }
}