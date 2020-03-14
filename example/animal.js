/**
 * Describes an animal that can eat, sleep wake up and repeat..!
 *
 */
class Animal {
    name = 'Unknown';

    static parent = 'Organism';
    /**
     * Creates a new instance of Animal
     * @param {string} name The name of the animal.
     * @param {number} weight The weight of the animal..
     */
    constructor(name, weight) {
        this.name = name;
        this.weight = weight;
    }

    /**
     * Instructs the animal to eat.
     */
    eat() {
        return `${this.name} is eating!`;
    }

    /**
     * Instructs the animal to sleep.
     */
    sleep() {
        return `${this.name} is going to sleep!`;
    }

    /**
     * Instructs the animal to wakeup.
     */
    wakeUp() {
        return `${this.name} is waking up!`;
    }

}
