import { CharacterSheet, CharacterSheetOptions } from "./CharacterSheet";

export class InlineActorSheetFate extends CharacterSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            group: undefined,
            tabs: [
                {
                    navSelector: ".fatex-js-tabs-navigation",
                    contentSelector: ".fatex-js-tab-content",
                    initial: "aspects",
                },
            ],
        } as unknown as CharacterSheetOptions);
    }

    getData(_options?: Application.RenderOptions) {
        const data = super.getData();

        if (this.options.referenceID) {
            data.referenceID = this.options.referenceID;
        }

        if (this.options.combatant) {
            data.defeated = this.options.combatant.defeated;
            data.hidden = this.options.combatant.hidden;
        }

        return data;
    }

    get id() {
        return this.options.id ? this.options.id : `inline-app-${this.appId}`;
    }

    get popOut() {
        return false;
    }

    get template() {
        return "systems/fatex/templates/inline-sheet/character.hbs";
    }

    /**
     * Circumvent BaseEntitySheet::render() as it wouldn't allow InlineActorSheets
     * to update for actors which the user has no view-permission for.
     */
    render(force = false, options = {}) {
        this.object.apps[this.appId] = this;

        this._render(force, options);

        return this;
    }

    _injectHTML(html, options) {
        const group = options?.group ?? this.options.group;

        $(`#${group.id} .fatex-js-actor-group-sheets`).append(html);
        this._element = html;
    }
}
