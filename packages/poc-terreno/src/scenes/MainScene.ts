import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create(): void {
    this.add
      .text(8, 8, "PoC 4: Reforestación, terreno y presentación", { fontSize: "10px", color: "#9be564" })
      .setOrigin(0, 0);
  }
}