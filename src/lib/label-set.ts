export class LabelSet {
	private readonly _toAdd: Set<string> = new Set();
	private readonly _toRemove: Set<string> = new Set();

	static merge(sets: readonly LabelSet[]): LabelSet {
		const m = new LabelSet();

		for (const s of sets) {
			// Add in labels from the incoming LabelSet
			for (const a of s.toAdd()) {
				m.addLabel(a);
			}
			for (const r of s.toRemove()) {
				m.removeLabel(r);
			}
		}

		return m;
	}

	addLabel(l: string): void {
		this._toAdd.add(l);
	}

	removeLabel(l: string): void {
		this._toRemove.add(l);
	}

	toAdd(): ReadonlySet<string> {
		return this._toAdd;
	}

	toRemove(): ReadonlySet<string> {
		return this._toRemove;
	}

	/**
	 * Returns a set of labels that are in both the "Add" and "Remove" set. If
	 * this set is non-empty, there's probably a problem.
	 */
	toAddAndRemove(): ReadonlySet<string> {
		return new Set([...this._toAdd].filter(x => this._toRemove.has(x)));
	}

	toString(): string {
		return JSON.stringify({ toAdd: [...this.toAdd()], toRemove: [...this.toRemove()] });
	}
}
