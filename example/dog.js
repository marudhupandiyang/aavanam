/**
 * A dog that extends and animal.
 */
class Dog extends Animal {
  /**
   * Creates a new dog
   * @param {string} name Name of the dog
   */
  constructor(name) {
    super(name); // call the super class constructor and pass in the name parameter
  }

  /**
   * Make the dog bark.
   */
  speak() {
    console.log(`${this.name} barks.`);
  }
}
