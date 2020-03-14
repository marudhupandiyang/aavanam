/**
* A gorilla class that is an animal
*/
class Gorilla extends Animal {
    /**
     * Creates a new Gorilla.
     * @param {string} name Name of the gorilla.
     * @param {string} weight Weight of the gorilla.
     */
    constructor(name, weight) {
        super(name, weight);
    }

    /**
     * Instructs the gorilla to climb trees
     */
    climbTrees() {
        return `${this.name} is climbing trees!`;
    }

    /**
     * Instructs the gorilla to pound its chest
     */
    poundChest() {
        return `${this.name} is pounding its chest!`;
    }

    /**
     * Instructs the gorilla to eat and pound its chest
     */
    showVigour() {
        return `${super.eat()} ${this.poundChest()}`;
    }

    /**
     * Instructs the gorilla to perform its daily routine.
     */
    dailyRoutine() {
        return `${super.wakeUp()} ${this.poundChest()} ${super.eat()} ${super.sleep()}`;
    }

}
