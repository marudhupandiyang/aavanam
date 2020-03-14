/**
 * Creates a new cat
 */
class Cat {
  /**
   * Creates a new cat
   * @param {string} name Name of the cat.
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Instructs the cat to make a noise
   */
  speak() {
    console.log(`${this.name} makes a noise.`);
  }
}

/**
 * Creates a new Lion which belongs to cat family.
 * has all thee properties of the cat
 */
class Lion extends Cat {

  /**
   * Instructs the animal to make a noise of its own.
   */
  speak() {
    super.speak();
    console.log(`${this.name} roars.`);
  }
}
