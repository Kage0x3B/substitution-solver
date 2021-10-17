import { terminal as t } from 'terminal-kit';
import { promisify } from 'util';
import {
    InputFieldOptions,
    SingleLineMenuOptions,
    SingleLineMenuResponse,
    YesOrNoOptions
} from 'terminal-kit/Terminal';

const inputField = promisify<InputFieldOptions, string | undefined>(t.inputField.bind(t));
const singleLineMenu = promisify<ReadonlyArray<string>, SingleLineMenuOptions, SingleLineMenuResponse>(t.singleLineMenu.bind(t));
const yesOrNo = promisify<YesOrNoOptions, boolean>(t.yesOrNo.bind(t));
const mostUsedLettersGerman = [
    'E', 'N', 'I', 'S', 'R', 'A', 'T', 'D', 'H', 'U'
];

export class SubstitutionSolver {
    private encryptedText: string;
    private substitutions: {
        [key: string]: string;
    } = {};

    public async start() {
        t.clear();

        t('^bWelcome to the ^gconsole substitution solver^b!\n');
        await this.readEncryptedText();

        while (true) {
            await this.showMainMenu();
        }
    }


    private getSubstitutedText(): string {
        let substitutedText = '';

        for (let i = 0; i < this.encryptedText.length; i++) {
            const letter = this.encryptedText[i];

            substitutedText += this.substitutions[letter] ? this.substitutions[letter] : letter;
        }

        return substitutedText;
    }

    private printSubstitutedText(): void {
        let substitutedText = '';

        for (let i = 0; i < this.encryptedText.length; i++) {
            const letter = this.encryptedText[i];

            substitutedText += this.substitutions[letter] ? `^g${this.substitutions[letter]}` : `^b${letter}`;
        }

        t(substitutedText);
    }

    private async showMainMenu(): Promise<void> {
        t.clear();
        t('^gCurrent encrypted text with substitutions:\n\n');

        this.printSubstitutedText();

        t('\n');

        const items = ['Edit substitutions', 'Show letter statistics', 'Exit'];
        const res = await singleLineMenu(items, {});

        switch (res.selectedIndex) {
            case 0:
                await this.editSubstitutions();
                break;
            case 1:
                await this.showLetterStatistics();
                break;
            case 2:
                this.exit();
                break;
        }
    }

    private async editSubstitutions() {
        whileStatement: while (true) {
            t.clear();
            t('^gEncrypted text:\n\n');

            t(`^g${this.encryptedText}\n\n`);

            t('^gEncrypted text with current substitutions:\n\n');

            this.printSubstitutedText();

            t('\n');


            const items = ['Edit substitution', 'Back'];
            const res = await singleLineMenu(items, {});

            switch (res.selectedIndex) {
                case 0:
                    const replacedLetter = await this.readText('\n\n^gLetter to replace: \n');
                    let replacementLetter = await this.readText('\n^gNew replacement letter: \n');

                    if (replacedLetter && replacementLetter) {
                        replacementLetter = replacementLetter.charAt(0).toLowerCase();

                        for (const key of Object.keys(this.substitutions)) {
                            if (this.substitutions[key] === replacementLetter) {
                                delete this.substitutions[key];
                            }
                        }

                        this.substitutions[replacedLetter.charAt(0).toUpperCase()] = replacementLetter.charAt(0).toLowerCase();
                    }

                    break;
                case 1:
                    break whileStatement;
            }
        }
    }

    private async showLetterStatistics() {
        t.clear();

        const letterOccurrences: Record<string, number> = {};

        for (let i = 0; i < this.encryptedText.length; i++) {
            if (!letterOccurrences[this.encryptedText[i]]) {
                letterOccurrences[this.encryptedText[i]] = 0;
            }

            letterOccurrences[this.encryptedText[i]]++;
        }

        t('Letters by occurence in text:\n\n');

        const letterKeys = Object.keys(letterOccurrences);
        letterKeys.sort((k1, k2) => letterOccurrences[k2] - letterOccurrences[k1]);

        for (let i = 0; i < letterKeys.length; i++) {
            const key = letterKeys[i];
            const occurrences = letterOccurrences[key];
            const percent = Math.floor((occurrences / this.encryptedText.length) * 100);
            const likelyReplacement = i < mostUsedLettersGerman.length ? mostUsedLettersGerman[i] : '';

            t(`^#^b^k ${occurrences}x ${key} (${String(percent).padStart(2, ' ')}% of text${likelyReplacement ? `, likely stands for '${likelyReplacement}'` : ''}) \n`);
        }

        t('\n\n');

        const items = ['Automatically assign to substitutions', 'Back'];
        const res = await singleLineMenu(items, { cancelable: true });

        if (res.selectedIndex === 0) {
            for (let i = 0; i < letterKeys.length && i < mostUsedLettersGerman.length; i++) {
                this.substitutions[letterKeys[i].toUpperCase()] = mostUsedLettersGerman[i].toLowerCase();
            }
        }
    }

    private async readEncryptedText(): Promise<void> {
        while (!this.encryptedText) {
            try {
                const encryptedText = await this.readText('^gTo begin, please paste the encrypted text:\n');

                if (!encryptedText) {
                    throw new Error('Empty text');
                }

                this.encryptedText = encryptedText.toUpperCase();
            } catch (err) {
                t('^rCouldn\'t read text, try again? (Y|n)\n');

                const result = await yesOrNo({ yes: ['y', 'ENTER'], no: ['n', 'ESCAPE'] });

                if (!result) {
                    t.clear();
                    t('Empty text input, exiting...');
                    this.exit();
                }
            }
        }
    }

    private exit(exitCode = 0): void {
        t.clear();
        t('^#^m^kThanks for using the substitution solver! Have a nice day :)');
        t.processExit(exitCode);
    }

    private async readText(prompt: string): Promise<string | undefined> {
        t(prompt);

        return await inputField({});
    }
}